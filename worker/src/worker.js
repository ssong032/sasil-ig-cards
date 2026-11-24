// sasil.kr 승인 봇: 텔레그램 버튼 -> 인스타 캐러셀 게시 (매일 06:00 KST, 운세 계정과 동일)
//
// 흐름
//   1. 매일 13:00 KST 클라우드 루틴이 다음 날 posts/D/{01..NN.jpg, manifest.json, qa.md}를 GitHub에 push.
//   2. Cron(5분마다)이 15:00 KST부터 내일 manifest를 발견하면 텔레그램으로 미리보기 + 버튼을 보낸다.
//   3. 사장님이 "승인"을 누르면 KV post:D 에 approved 로 기록.
//   4. D일 06:00 KST부터 cron이 승인된 게시물을 인스타에 올리고 링크를 텔레그램으로 알린다.
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
const PUBLISH_HOUR = 6; // 운세 계정과 같은 시각
const NOTIFY_FROM_HOUR = 15; // 운세 계정과 같이 15시부터 내일 것을 찾는다 (루틴은 13:00에 push)
const REMIND_HOUR = 23;
// 2026-11-25 CEO 결정: 승인 없이 자동 게시. 단 사실 정보 계정이라 검수(qa.md)가 '게시 가능' + 80점 이상일 때만
// 자동 승인하고, 아니면 예전처럼 사장님 승인을 기다린다.
const AUTO_PUBLISH = true, AUTO_MIN_SCORE = 80;
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
  const fin = lines.filter((l) => /최종\s*판정\s*[:：]/.test(l)).pop();
  if (fin && /가능/.test(fin) && /보류/.test(fin)) return "unknown"; // 양식을 안 채운 채(가능|보류)면 판정 없음
  if (fin) {
    const fm = fin.replace(/^.*?최종\s*판정\s*[:：]/, "").replace(/가능\s*[\/|]\s*보류/g, " ")
      .match(/(보류|불가|수정\s*후|조건부|\bhold\b|reject)|((?<!불)가능|\bpass\b|\bok\b)/i);
    if (fm) return fm[1] ? "hold" : "ok";
  }
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
  const m = qa.match(/품질[^\n\d]*?(\d{1,3})\s*(?:\/\s*100|점(?!\s*만점))/);
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
const ICON = { approved: `✅ 승인 (${PUBLISH_HOUR}시 게시 예정)`, publishing: "⏳ 게시 중", processing: "⏳ 처리 중", published: "🎉 게시 완료", skipped: "⏭️ 건너뜀", error: "❌ 오류" };
function statusLine(p) {
  const ig = `📸 인스타: ${ICON[p.state] || "⬜ 승인 전"}${p.link ? " " + p.link : ""}${p.err ? `\n(${p.err})` : ""}`;
  if (!p.th_on) return ig;
  return `${ig}\n🧵 쓰레드: ${ICON[p.th] || "⬜ 승인 전"}${p.th_link ? " " + p.th_link : ""}${p.th_err ? `\n(${p.th_err})` : ""}`;
}
function keyboard(ymd, p) {
  const report = [{ text: "📊 보고서 보기", callback_data: `B:${ymd}` }];
  const rows = [];
  if (!p.state) {
    rows.push([{ text: `✅ ${PUBLISH_HOUR}시에 게시${p.th_on ? " (인스타+쓰레드)" : ""}`, callback_data: `A:${ymd}` }]);
    rows.push([{ text: "⏭️ 이번엔 건너뛰기", callback_data: `S:${ymd}` }]);
  } else if (p.state === "approved" || p.state === "skipped") {
    rows.push([{ text: "↩️ 취소", callback_data: `C:${ymd}` }]);
  }
  if (p.state === "error" || p.th === "error") rows.push([{ text: "🔁 오류 난 것 다시 시도", callback_data: `R:${ymd}` }]);
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
    const c = await igCall(`${IG}/${IG_USER_ID}/media`, { image_url: `${RAW}/posts/${ymd}/${f}`, is_carousel_item: "true", access_token: token });
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

// ---------- 쓰레드 (운세 봇과 같은 2단계 방식) ----------
// 토큰: THREADS_ACCESS_TOKEN secret(60일). 45일마다 자동 갱신해 KV th_token 에 저장.
const TH = "https://graph.threads.net/v1.0";
const TH_LIMIT = 500;
const TH_TIMEOUT_MIN = 40;
const TOKEN_REFRESH_DAYS = 45;
async function thToken(env) { return (await env.STATE.get("th_token")) || env.THREADS_ACCESS_TOKEN || ""; }
async function thUserId(env, token) {
  let id = await env.STATE.get("th_user_id");
  if (id) return id;
  const me = await igCall(`${TH}/me`, { fields: "id,username", access_token: token }, "GET");
  await env.STATE.put("th_user_id", me.id);
  await env.STATE.put("th_username", me.username || "");
  return me.id;
}
// 쓰레드는 글 500자, 주제 태그 1개만 연결되므로 해시태그 줄을 빼고 태그 하나만 붙인다.
function threadsText(caption) {
  const lines = caption.split("\n").filter((l) => !/^\s*(#\S+\s*)+$/.test(l)).map((l) => l.replace(/\s#\S+/g, ""));
  let text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const tail = "\n\n#신기한사실";
  if (text.length + tail.length > TH_LIMIT) text = text.slice(0, TH_LIMIT - tail.length - 1).trimEnd() + "…";
  return text + tail;
}
// 1단계: 사진 컨테이너만 만든다 (처리가 끝나기 전에 캐러셀로 묶으면 "Invalid parameter" 오류).
async function startThreads(env, ymd, m) {
  const token = await thToken(env);
  if (!token) throw new Error("쓰레드 토큰 없음");
  const uid = await thUserId(env, token);
  const kids = [];
  for (const f of m.files.slice(0, 20)) {
    try {
      const c = await igCall(`${TH}/${uid}/threads`, { media_type: "IMAGE", image_url: `${RAW}/posts/${ymd}/${f}`, is_carousel_item: "true", access_token: token });
      kids.push(c.id);
    } catch (e) { throw new Error(`쓰레드 사진 등록(${f}) 실패: ${e.message}`); }
  }
  return kids.join(",");
}
// 2단계: 사진이 모두 FINISHED 면 캐러셀을 만들어 게시하고 링크를 돌려준다. 아직 처리 중이면 null.
async function finishThreads(env, kids, caption) {
  const token = await thToken(env);
  const uid = await thUserId(env, token);
  for (const id of kids.split(",")) {
    const s = await igCall(`${TH}/${id}`, { fields: "status,error_message", access_token: token }, "GET");
    if (s.status === "ERROR" || s.status === "EXPIRED") throw new Error(`쓰레드 사진 처리 실패 (${s.error_message || s.status})`);
    if (s.status !== "FINISHED") return null;
  }
  const car = await igCall(`${TH}/${uid}/threads`, { media_type: "CAROUSEL", children: kids, text: threadsText(caption), access_token: token });
  for (let i = 0; i < 10; i++) {
    const s = await igCall(`${TH}/${car.id}`, { fields: "status,error_message", access_token: token }, "GET");
    if (s.status === "FINISHED") break;
    if (s.status === "ERROR" || s.status === "EXPIRED") throw new Error(`쓰레드 캐러셀 처리 실패 (${s.error_message || s.status})`);
    await sleep(3000);
  }
  const pub = await igCall(`${TH}/${uid}/threads_publish`, { creation_id: car.id, access_token: token });
  // 게시는 이미 됐으므로 링크 조회만 실패해도 오류로 두지 않는다 (재시도하면 중복 게시됨)
  try { return (await igCall(`${TH}/${pub.id}`, { fields: "permalink", access_token: token }, "GET")).permalink || "(링크 확인 실패 · 게시는 완료)"; }
  catch (e) { return "(링크 확인 실패 · 게시는 완료)"; }
}
async function maybeRefreshThreads(env) {
  const tok = await thToken(env);
  if (!tok) return;
  const ts = Number((await env.STATE.get("th_token_ts")) || 0);
  if (!ts) { await env.STATE.put("th_token_ts", String(Date.now())); return; }
  if (Date.now() - ts < TOKEN_REFRESH_DAYS * 86400e3) return;
  try {
    const j = await igCall("https://graph.threads.net/refresh_access_token", { grant_type: "th_refresh_token", access_token: tok }, "GET");
    await env.STATE.put("th_token", j.access_token);
    await env.STATE.put("th_token_ts", String(Date.now()));
    await say(env, "🔑 sasil 쓰레드 토큰을 자동 갱신했어요 (다음 60일 유효).");
  } catch (e) {
    await env.STATE.put("th_token_ts", String(Date.now() - (TOKEN_REFRESH_DAYS - 1) * 86400e3)); // 내일 다시
    await say(env, `⚠️ sasil 쓰레드 토큰 자동 갱신 실패: ${e.message}\n만료되면 쓰레드 게시만 멈춰요(인스타는 계속).`);
  }
}

// ---------- cron ----------
async function maybeNotify(env, now, opt = {}) {
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
  const media = m.files.slice(0, 10).map((f) => ({ type: "photo", media: `${RAW}/posts/${target}/${f}` }));
  const mg = await tg(env, "sendMediaGroup", { chat_id: chat, media });
  if (!mg.ok) return;
  p.th_on = !!(await thToken(env));
  if (AUTO_PUBLISH && !opt.force && !p.state) {
    const qa = (await rawText(`posts/${target}/qa.md`)) || "";
    const v = qa.trim() ? qaVerdict(qa) : "unknown", sc = qa.trim() ? qaScore(qa) : null;
    if (v === "ok" && sc !== null && +sc >= AUTO_MIN_SCORE) { p.state = "approved"; if (p.th_on) p.th = "approved"; p.auto = true; }
    else p.auto_held = true;
  }
  p.head = `📅 ${label(target)} sasil.kr 게시물 준비 완료\n🗂 주제: ${m.topic || "-"}\n\n✍️ 캡션 앞부분\n${(m.caption || "").split("\n").slice(0, 3).join("\n")}\n\n${await qaLine(target)}\n\n${p.auto ? `🤖 검수 통과로 자동 승인됨: ${label(target)} ${PUBLISH_HOUR}시에${p.th_on ? " 인스타와 쓰레드에" : ""} 자동 게시돼요. 막으려면 아래 '취소'를 눌러 주세요.` : `⚠️ 검수 점수가 ${AUTO_MIN_SCORE}점 미만이거나 '게시 가능' 판정이 없어서 자동 게시를 멈췄어요. 확인 후 승인하면 ${label(target)} ${PUBLISH_HOUR}시에 게시돼요.`}`;
  const sent = await tg(env, "sendMessage", { chat_id: chat, text: `${p.head}\n\n${statusLine(p)}`, reply_markup: keyboard(target, p), disable_web_page_preview: true });
  if (!sent.ok) return; // 승인 메시지가 안 갔으면 다음 tick에 다시 (사진 중복은 감수)
  p.msg_id = sent.result.message_id;
  await putPost(env, target, p);
}

// 한 tick 에 한 가지 일만 한다 (Workers 서브요청 50개 한도): 인스타 게시 → 쓰레드 사진 등록 → 쓰레드 게시.
async function maybePublish(env, now) {
  if (now.hour < PUBLISH_HOUR) return;
  const ymd = now.ymd;
  const p = await getPost(env, ymd);
  if (p.state === "approved") {
    p.state = "publishing"; await putPost(env, ymd, p);
    try {
      const m = await manifest(ymd);
      if (!m) throw new Error("manifest 없음");
      p.link = await publishCarousel(env, ymd, m);
      p.state = "published"; delete p.err;
      await putPost(env, ymd, p);
      await say(env, `🎉 ${label(ymd)} sasil.kr 인스타 게시 완료!\n${p.link}`);
    } catch (e) {
      p.state = "error"; p.err = e.message; await putPost(env, ymd, p);
      await say(env, `❌ ${label(ymd)} 인스타 게시 실패: ${e.message}\n승인 메시지의 '다시 시도'를 누르면 5분 안에 다시 올려요.`, { reply_to_message_id: p.msg_id });
    }
    return refreshControl(env, ymd, p);
  }
  const fail = async (e) => {
    p.th = "error"; p.th_err = e.message; delete p.th_kids; await putPost(env, ymd, p);
    await say(env, `❌ ${label(ymd)} 쓰레드 게시 실패: ${e.message}\n승인 메시지의 '다시 시도'를 누르면 다시 올려요.`, { reply_to_message_id: p.msg_id });
    await refreshControl(env, ymd, p);
  };
  if (p.th === "approved") {
    try {
      const m = await manifest(ymd);
      if (!m) throw new Error("manifest 없음");
      p.th_kids = await startThreads(env, ymd, m);
      p.th = "processing"; p.th_t = Date.now(); delete p.th_err;
      await putPost(env, ymd, p); await refreshControl(env, ymd, p);
    } catch (e) { await fail(e); }
    return;
  }
  if (p.th === "processing") {
    try {
      const m = await manifest(ymd);
      if (!m) return; // 잠시 못 받으면 다음 tick 에
      const link = await finishThreads(env, p.th_kids, m.caption);
      if (link) {
        p.th = "published"; p.th_link = link; delete p.th_kids; await putPost(env, ymd, p);
        await say(env, `🧵 ${label(ymd)} sasil.kr 쓰레드 게시 완료!\n${link}`);
        await refreshControl(env, ymd, p);
      } else if (Date.now() - (p.th_t || 0) > TH_TIMEOUT_MIN * 60e3) {
        await fail(new Error(`${TH_TIMEOUT_MIN}분 넘게 쓰레드 사진 처리가 끝나지 않음`));
      }
    } catch (e) { await fail(e); }
  }
}

async function tick(env) {
  const now = kstNow();
  await maybeRefreshThreads(env);
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
  if (op === "A" && !p.state) {
    p.state = "approved"; if (p.th_on) p.th = "approved";
    note = ymd === now.ymd && now.hour >= PUBLISH_HOUR ? "승인! 5분 안에 게시돼요" : `승인! ${PUBLISH_HOUR}시에 게시돼요`;
  }
  else if (op === "S" && !p.state) { p.state = "skipped"; if (p.th_on) p.th = "skipped"; note = "이번 회차는 건너뛸게요"; }
  else if (op === "C" && ["approved", "skipped"].includes(p.state)) { delete p.state; if (["approved", "skipped"].includes(p.th)) delete p.th; note = "취소했어요"; if (p.auto) { p.head = p.head.replace(/🤖[^\n]*/, "↩️ 자동 게시를 취소했어요. 승인 버튼을 누르면 다시 게시 예정이 돼요."); delete p.auto; } }
  else if (op === "R" && (p.state === "error" || p.th === "error")) {
    if (p.state === "error") { p.state = "approved"; delete p.err; }
    if (p.th === "error") { p.th = "approved"; delete p.th_err; }
    note = "5분 안에 다시 시도할게요";
  }
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
      let threads = { ok: false, error: "no THREADS_ACCESS_TOKEN" };
      const tht = await thToken(env);
      if (tht) {
        try {
          await env.STATE.delete("th_user_id");
          const id = await thUserId(env, tht);
          if (!(await env.STATE.get("th_token_ts"))) await env.STATE.put("th_token_ts", String(Date.now()));
          threads = { ok: true, user_id: id, username: await env.STATE.get("th_username") };
        } catch (e) { threads = { ok: false, error: e.message }; }
      }
      return Response.json({ webhook: hook, instagram: ig, threads, owner_chat_set: !!(await owner(env)) });
    }
    if (url.pathname === "/notify" && authed) {
      const d = url.searchParams.get("d");
      if (!isYmd(d)) return new Response("bad d", { status: 400 });
      if (url.searchParams.get("force") === "1") {
        // 카드가 바뀌었을 때 새 미리보기로 다시 보낸다. 예전 메시지의 버튼은 끄고, 승인 상태는 초기화한다.
        const old = await getPost(env, d);
        if (old.msg_id) await tg(env, "editMessageReplyMarkup", { chat_id: await owner(env), message_id: old.msg_id, reply_markup: { inline_keyboard: [] } });
        await env.STATE.delete(`post:${d}`);
      }
      await maybeNotify(env, { ymd: addDays(d, -1), hour: NOTIFY_FROM_HOUR }, { force: url.searchParams.get("force") === "1" });
      return new Response((await getPost(env, d)).msg_id ? "notified" : "no manifest / no owner");
    }
    if (url.pathname === "/tick" && authed) { await tick(env); return new Response("tick done"); }
    return new Response("sasil-ig bot");
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(tick(env)); },
};
