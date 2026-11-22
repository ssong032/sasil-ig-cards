// sasil.kr 승인 봇: 텔레그램 버튼 -> 인스타 캐러셀 게시 (매일 19:00 KST)
//
// 흐름
//   1. 매일 13:00 KST 클라우드 루틴이 다음 날 posts/D/{01..NN.jpg, manifest.json, qa.md}를 GitHub에 push.
//   2. Cron(5분마다)이 14:00 KST부터 내일 manifest를 발견하면 텔레그램으로 미리보기 + 버튼을 보낸다.
//   3. 사장님이 "승인"을 누르면 KV post:D 에 approved 로 기록.
//   4. D일 19:00 KST부터 cron이 승인된 게시물을 인스타에 올리고 링크를 텔레그램으로 알린다.
//
// 운세 봇(fortune-ig-bot)을 바탕으로 했지만 계정·저장소·KV·텔레그램 봇이 모두 따로다.
// Secrets: TELEGRAM_BOT_TOKEN, IG_ACCESS_TOKEN(짤모음 페이지 토큰, 만료 없음), WEBHOOK_SECRET
// KV binding: STATE

const REPO = "ssong032/sasil-ig-cards";
const RAW = `https://raw.githubusercontent.com/${REPO}/main`;
const CDN = `https://cdn.jsdelivr.net/gh/${REPO}@main`;
const IG = "https://graph.facebook.com/v23.0";
const IG_USER_ID = "17841462639186718"; // sasil.kr
const KST = 9 * 3600 * 1000;
const PUBLISH_HOUR = 19;
const NOTIFY_FROM_HOUR = 14; // 루틴이 13:00에 만들고 push 하므로 14시부터 내일 것을 찾는다
const REMIND_HOUR = 23;
const WD = ["일", "월", "화", "수", "목", "금", "토"];

// ---------- 시간 (모든 날짜는 KST 기준) ----------
function kstNow() { const d = new Date(Date.now() + KST); return { ymd: d.toISOString().slice(0, 10), hour: d.getUTCHours() }; }
function addDays(ymd, n) { const d = new Date(ymd + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function label(ymd) { const d = new Date(ymd + "T00:00:00Z"); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${WD[d.getUTCDay()]})`; }
const isYmd = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "") && !isNaN(new Date(v + "T00:00:00Z"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 텔레그램 ----------
async function tg(env, method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
  });
  const j = await r.json();
  if (!j.ok) console.log("telegram error", method, JSON.stringify(j));
  return j;
}
async function owner(env) { return await env.STATE.get("owner_chat"); }
async function say(env, text, extra = {}) {
  const chat = await owner(env);
  if (chat) return tg(env, "sendMessage", { chat_id: chat, text, disable_web_page_preview: true, ...extra });
}

// ---------- 상태 ----------
async function getPost(env, ymd) { return JSON.parse((await env.STATE.get(`post:${ymd}`)) || "{}"); }
async function putPost(env, ymd, p) { await env.STATE.put(`post:${ymd}`, JSON.stringify(p), { expirationTtl: 60 * 60 * 24 * 30 }); }
async function rawText(path) {
  const r = await fetch(`${RAW}/${path}?t=${Date.now()}`, { cf: { cacheTtl: 0 } });
  return r.ok ? r.text() : null;
}
async function manifest(ymd) {
  const t = await rawText(`posts/${ymd}/manifest.json`);
  try { return t ? JSON.parse(t) : null; } catch (e) { return null; }
}

// ---------- 검수표 (posts/D/qa.md) ----------
// 최종 판정: "ok" | "hold" | "unknown". 못 읽으면 절대 "ok" 로 보지 않는다.
function qaVerdict(qa) {
  const lines = qa.replace(/\r/g, "").split("\n");
  const idx = lines.findIndex((l) => /게시\s*가능\s*여부|최종\s*판정/.test(l));
  if (idx < 0) return "unknown";
  const clean = (l) => l.replace(/\(?\s*가능\s*\/\s*보류\s*\)?/g, " ").replace(/게시\s*가능\s*여부/g, " ").replace(/최종\s*판정/g, " ");
  for (const l of lines.slice(idx, idx + 3)) {
    const m = clean(l).match(/(보류|불가|수정\s*후|조건부|\bhold\b|reject)|((?<!불)가능|\bpass\b|\bok\b)/i);
    if (m) return m[1] ? "hold" : "ok";
  }
  return "unknown";
}
function qaScore(qa) {
  const src = qa.split("\n").find((l) => /품질/.test(l) && /\d/.test(l)) || qa;
  const m = src.match(/(\d{1,3})\s*\/\s*100/) || src.match(/(\d{1,3})\s*점(?!\s*만점)/);
  return m && +m[1] <= 100 ? m[1] : null;
}
async function qaLine(ymd) {
  const qa = (await rawText(`posts/${ymd}/qa.md`)) || "";
  if (!qa.trim()) return "🔍 검수표 없음 (보고서 버튼으로 확인)";
  const v = qaVerdict(qa), sc = qaScore(qa);
  return `🔍 검수: ${sc ? `품질 ${sc}점` : "점수 확인 필요"} · ${{ ok: "게시 가능", hold: "⚠️ 검수 보류", unknown: "판정 확인 필요" }[v]}`;
}
function chunks(text, size = 3500) {
  const out = [];
  let rest = text;
  while (rest.length > size) {
    let cut = rest.lastIndexOf("\n", size);
    if (cut < size / 2) { cut = size; const c = rest.charCodeAt(cut - 1); if (c >= 0xd800 && c <= 0xdbff) cut -= 1; }
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut).replace(/^\n/, "");
  }
  if (rest) out.push(rest);
  return out;
}
async function sendReport(env, ymd) {
  if (!isYmd(ymd)) return say(env, "예: /report 2026-11-24");
  const parts = [["📊 조사 메모", await rawText(`posts/${ymd}/brief.md`)], ["🔍 검수표", await rawText(`posts/${ymd}/qa.md`)]];
  if (!parts.some(([, t]) => t && t.trim())) return say(env, `${label(ymd)} 보고서가 아직 없어요.`);
  for (const [title, text] of parts) {
    if (!text || !text.trim()) { await say(env, `${title} · ${label(ymd)}\n(없음)`); continue; }
    const cs = chunks(text.replace(/\r/g, ""));
    for (let n = 0; n < cs.length; n++) await say(env, `${n ? `(${n + 1}/${cs.length}) ` : `${title} · ${label(ymd)}\n\n`}${cs[n]}`);
  }
}

// ---------- 승인 메시지 ----------
function statusLine(p) {
  const s = p.state || "";
  const icon = { approved: `✅ 승인 (${PUBLISH_HOUR}시 게시 예정)`, publishing: "⏳ 게시 중", published: "🎉 게시 완료", skipped: "⏭️ 건너뜀", error: "❌ 오류" }[s] || "⬜ 승인 전";
  return `📸 캐러셀: ${icon}${p.link ? " " + p.link : ""}${p.err ? `\n(${p.err})` : ""}`;
}
function keyboard(ymd, p) {
  const report = [{ text: "📊 보고서 보기", callback_data: `B:${ymd}` }];
  const rows = [];
  if (!p.state) {
    rows.push([{ text: `✅ ${PUBLISH_HOUR}시에 게시`, callback_data: `A:${ymd}` }]);
    rows.push([{ text: "⏭️ 이번엔 건너뛰기", callback_data: `S:${ymd}` }]);
  } else if (p.state === "approved" || p.state === "skipped") {
    rows.push([{ text: "↩️ 취소", callback_data: `C:${ymd}` }]);
  } else if (p.state === "error") {
    rows.push([{ text: "🔁 다시 시도", callback_data: `R:${ymd}` }]);
  }
  rows.push(report);
  return { inline_keyboard: rows };
}
async function refreshControl(env, ymd, p) {
  if (!p.msg_id) return;
  await tg(env, "editMessageText", {
    chat_id: await owner(env), message_id: p.msg_id, disable_web_page_preview: true,
    text: `${p.head}\n\n${statusLine(p)}`, reply_markup: keyboard(ymd, p),
  });
}

// ---------- 인스타 ----------
async function igCall(url, params, method = "POST") {
  const body = new URLSearchParams(params);
  const r = method === "POST" ? await fetch(url, { method, body }) : await fetch(`${url}?${body}`);
  const j = await r.json();
  if (j.error) {
    const e = j.error, extra = [e.error_user_title, e.error_user_msg].filter(Boolean).join(": ");
    throw new Error(`${e.message || "IG error"} (${e.code || r.status}${e.error_subcode ? "/" + e.error_subcode : ""})${extra ? " - " + extra : ""}`);
  }
  return j;
}
async function publishCarousel(env, ymd, m) {
  const token = env.IG_ACCESS_TOKEN;
  const kids = [];
  for (const f of m.files.slice(0, 10)) {
    const c = await igCall(`${IG}/${IG_USER_ID}/media`, { image_url: `${CDN}/posts/${ymd}/${f}`, is_carousel_item: "true", access_token: token });
    kids.push(c.id);
  }
  const car = await igCall(`${IG}/${IG_USER_ID}/media`, { media_type: "CAROUSEL", children: kids.join(","), caption: m.caption, access_token: token });
  for (let i = 0; i < 8; i++) {
    const s = await igCall(`${IG}/${car.id}`, { fields: "status_code", access_token: token }, "GET");
    if (s.status_code === "FINISHED") break;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") throw new Error(`container ${s.status_code}`);
    await sleep(4000);
  }
  const pub = await igCall(`${IG}/${IG_USER_ID}/media_publish`, { creation_id: car.id, access_token: token });
  try { return (await igCall(`${IG}/${pub.id}`, { fields: "permalink", access_token: token }, "GET")).permalink; }
  catch (e) { return "(링크 확인 실패 · 게시는 완료)"; } // 이미 게시됨: 재시도하면 중복 게시되므로 오류로 두지 않는다
}

// ---------- cron ----------
async function maybeNotify(env, now) {
  const target = now.hour >= NOTIFY_FROM_HOUR ? addDays(now.ymd, 1) : now.hour < PUBLISH_HOUR ? now.ymd : null;
  if (!target) return;
  const p = await getPost(env, target);
  if (p.msg_id) {
    if (now.hour === REMIND_HOUR && !p.reminded && !p.state) {
      p.reminded = true; await putPost(env, target, p);
      await say(env, `⏰ ${label(target)} 게시물이 아직 승인 전이에요.`, { reply_to_message_id: p.msg_id });
    }
    return;
  }
  const m = await manifest(target);
  if (!m || !m.files || !m.files.length) return;
  const chat = await owner(env);
  if (!chat) return;
  // 미리보기 사진을 먼저 보낸다. 실패하면 상태를 저장하지 않고 다음 tick에 처음부터 다시 시도한다.
  const media = m.files.slice(0, 10).map((f) => ({ type: "photo", media: `${CDN}/posts/${target}/${f}` }));
  const mg = await tg(env, "sendMediaGroup", { chat_id: chat, media });
  if (!mg.ok) return;
  p.head = `📅 ${label(target)} sasil.kr 게시물 준비 완료\n🗂 주제: ${m.topic || "-"}\n\n✍️ 캡션 앞부분\n${(m.caption || "").split("\n").slice(0, 3).join("\n")}\n\n${await qaLine(target)}\n\n승인하면 ${label(target)} ${PUBLISH_HOUR}시에 자동 게시돼요.`;
  const sent = await tg(env, "sendMessage", { chat_id: chat, text: `${p.head}\n\n${statusLine(p)}`, reply_markup: keyboard(target, p), disable_web_page_preview: true });
  if (!sent.ok) return; // 승인 메시지가 안 갔으면 다음 tick에 다시 (사진 중복은 감수)
  p.msg_id = sent.result.message_id;
  await putPost(env, target, p);
}

async function maybePublish(env, now) {
  if (now.hour < PUBLISH_HOUR) return;
  const ymd = now.ymd;
  const p = await getPost(env, ymd);
  if (p.state !== "approved") return;
  p.state = "publishing"; await putPost(env, ymd, p);
  try {
    const m = await manifest(ymd);
    if (!m) throw new Error("manifest 없음");
    p.link = await publishCarousel(env, ymd, m);
    p.state = "published"; delete p.err;
    await putPost(env, ymd, p);
    await say(env, `🎉 ${label(ymd)} sasil.kr 게시 완료!\n${p.link}`);
  } catch (e) {
    p.state = "error"; p.err = e.message; await putPost(env, ymd, p);
    await say(env, `❌ ${label(ymd)} 게시 실패: ${e.message}\n승인 메시지의 '다시 시도'를 누르면 5분 안에 다시 올려요.`, { reply_to_message_id: p.msg_id });
  }
  await refreshControl(env, ymd, p);
}

async function tick(env) {
  const now = kstNow();
  await maybeNotify(env, now);
  await maybePublish(env, now);
}

// ---------- 웹훅 ----------
async function onUpdate(env, u) {
  const chatOwner = await owner(env);
  if (u.message) {
    const chat = String(u.message.chat.id), text = (u.message.text || "").trim();
    if (text.startsWith("/start")) {
      if (!chatOwner) { await env.STATE.put("owner_chat", chat); return tg(env, "sendMessage", { chat_id: chat, text: "✅ 연결 완료! 매일 오후 다음 날 sasil.kr 게시물이 준비되면 여기로 승인 요청을 보낼게요." }); }
      if (chatOwner !== chat) return; // 모르는 사람은 무시
      return tg(env, "sendMessage", { chat_id: chat, text: "이미 연결돼 있어요. /status 상태, /report 보고서" });
    }
    if (chatOwner !== chat) return;
    if (/^\/report(\s|$)/.test(text)) {
      const arg = text.split(/\s+/)[1], now = kstNow();
      return sendReport(env, isYmd(arg) ? arg : now.hour >= NOTIFY_FROM_HOUR ? addDays(now.ymd, 1) : now.ymd);
    }
    if (text.startsWith("/status")) {
      const now = kstNow(), lines = [];
      for (const d of [now.ymd, addDays(now.ymd, 1)]) lines.push(`${label(d)}\n${statusLine(await getPost(env, d))}`);
      return say(env, `📊 sasil.kr 상태\n\n${lines.join("\n\n")}`);
    }
    return;
  }
  const q = u.callback_query;
  if (!q || String(q.message.chat.id) !== chatOwner) return;
  const [op, ymd] = q.data.split(":");
  if (op === "B") { await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: "보고서를 보내 드릴게요" }); return sendReport(env, ymd); }
  const p = await getPost(env, ymd), now = kstNow();
  let note = "";
  if (op === "A" && !p.state) { p.state = "approved"; note = ymd === now.ymd && now.hour >= PUBLISH_HOUR ? "승인! 5분 안에 게시돼요" : `승인! ${PUBLISH_HOUR}시에 게시돼요`; }
  else if (op === "S" && !p.state) { p.state = "skipped"; note = "이번 회차는 건너뛸게요"; }
  else if (op === "C" && ["approved", "skipped"].includes(p.state)) { delete p.state; note = "취소했어요"; }
  else if (op === "R" && p.state === "error") { p.state = "approved"; delete p.err; note = "5분 안에 다시 시도할게요"; }
  else note = "이미 처리된 상태예요";
  await putPost(env, ymd, p);
  await tg(env, "answerCallbackQuery", { callback_query_id: q.id, text: note });
  await refreshControl(env, ymd, p);
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const authed = url.searchParams.get("k") === env.WEBHOOK_SECRET;
    if (url.pathname === "/tg" && req.method === "POST") {
      if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.WEBHOOK_SECRET) return new Response("forbidden", { status: 403 });
      ctx.waitUntil(onUpdate(env, await req.json()).catch((e) => console.log("update error", e.stack)));
      return new Response("ok");
    }
    if (url.pathname === "/setup" && authed) {
      const hook = await tg(env, "setWebhook", { url: `${url.origin}/tg`, secret_token: env.WEBHOOK_SECRET, allowed_updates: ["message", "callback_query"] });
      let ig;
      try {
        const me = await igCall(`${IG}/${IG_USER_ID}`, { fields: "username", access_token: env.IG_ACCESS_TOKEN }, "GET");
        const lim = await igCall(`${IG}/${IG_USER_ID}/content_publishing_limit`, { fields: "quota_usage,config", access_token: env.IG_ACCESS_TOKEN }, "GET");
        ig = { ok: true, username: me.username, publishing_limit: lim.data };
      } catch (e) { ig = { ok: false, error: e.message }; }
      return Response.json({ webhook: hook, instagram: ig, owner_chat_set: !!(await owner(env)) });
    }
    if (url.pathname === "/notify" && authed) {
      const d = url.searchParams.get("d");
      if (!isYmd(d)) return new Response("bad d", { status: 400 });
      await maybeNotify(env, { ymd: addDays(d, -1), hour: NOTIFY_FROM_HOUR });
      return new Response((await getPost(env, d)).msg_id ? "notified" : "no manifest / no owner");
    }
    if (url.pathname === "/tick" && authed) { await tick(env); return new Response("tick done"); }
    return new Response("sasil-ig bot");
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(tick(env)); },
};
