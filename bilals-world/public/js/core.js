/* Bilal's World — core: helpers, API, state, router, shared components, modals. No inline handlers (strict CSP). */
const BW = { me: null, meta: null, routes: {}, acts: {}, forms: {}, sock: null, online: new Set() };
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const e = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n) => { n = Number(n) || 0; return n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B" : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(n); };
const ago = (t) => { const s = Math.max(1, Math.floor(Date.now() / 1000 - t)); const u = [[31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"]]; for (const [k, l] of u) if (s >= k) return Math.floor(s / k) + l + " ago"; return "just now"; };
const day = (t) => new Date(t * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const TYPE = { edit: ["🎬", "Edit", "Edits"], clip: ["🎥", "Clip", "Clips"], tiktok: ["📱", "TikTok", "TikToks"], live: ["🔴", "Live Moment", "Live Moments"], meme: ["😂", "Meme", "Memes"], fanart: ["🎨", "Fan Art", "Fan Art"], short: ["🎞️", "Short", "Shorts"] };

BW.api = async (method, path, body) => {
  const opt = { method, headers: { "x-bw": "1" }, credentials: "same-origin" };
  if (body instanceof FormData) opt.body = body; else if (body !== undefined) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
  let r; try { r = await fetch("/api" + path, opt); } catch { throw new Error("Network error. Check your connection."); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { if (r.status === 401) BW.acts.auth(); throw new Error(j.error || "Something went wrong."); }
  return j;
};
const GET = (p) => BW.api("GET", p), POST = (p, b) => BW.api("POST", p, b ?? {}), DEL = (p) => BW.api("DELETE", p);
BW.toast = (msg, kind = "") => { const t = document.createElement("div"); t.className = "toast " + kind; t.textContent = msg; $("#toasts").append(t); setTimeout(() => t.remove(), 3800); };
const guard = (fn) => async (...a) => { try { return await fn(...a); } catch (x) { BW.toast(x.message, "err"); } };
const needMe = () => { if (!BW.me) { BW.acts.auth(); return false; } return true; };

/* ---------- small components ---------- */
const avatar = (u, s = 40) => u?.avatar ? `<img class="avatar" src="${e(u.avatar)}" width="${s}" height="${s}" alt="" loading="lazy" style="width:${s}px;height:${s}px">`
  : `<span class="avatar" style="width:${s}px;height:${s}px;font-size:${Math.round(s * 0.42)}px">${e((u?.username || "?")[0])}</span>`;
const roleBadge = (r) => (r && r !== "USER" ? `<span class="role ${e(r)}">${r === "ADMIN" ? "ADMIN" : "MOD"}</span>` : "");
const userLink = (u) => `<a href="#/u/${e(u.username)}" class="row" style="gap:6px"><b>@${e(u.username)}</b>${roleBadge(u.role)}</a>`;
const tags = (list) => list.map((t) => `<a class="tag" href="#/tag/${e(t)}">#${e(t)}</a>`).join(" ");
const ttId = (u) => (String(u).match(/\/video\/(\d{6,24})/) || [])[1];
const media = (p) => {
  const src = p.thumb || (p.mediaKind === "image" ? p.media : "");
  if (src) return `<img src="${e(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  if (p.mediaKind === "video") return `<video src="${e(p.media)}#t=0.5" preload="metadata" muted playsinline></video>`;
  return `<span class="ph">${TYPE[p.type]?.[0] || "🎬"}</span>`;
};
BW.card = (p) => `<article class="card glass reveal" data-post="${p.id}">
  <a class="thumb" href="#/post/${p.id}">${media(p)}<span class="pill">${TYPE[p.type]?.[0] || ""} ${TYPE[p.type]?.[1] || ""}</span>
    ${p.tiktokViews ? `<span class="pill r">👁️ ${fmt(p.tiktokViews)} views</span>` : p.statStatus === "pending" ? `<span class="pill r">⚠️ Pending</span>` : ""}
    ${p.mediaKind === "video" || p.tiktokUrl ? `<span class="play">▶</span>` : ""}</a>
  <div class="body"><h3><a href="#/post/${p.id}">${e(p.title)}</a></h3>
    <div class="row" style="margin:9px 0 6px;gap:8px">${avatar(p.user, 26)}<span class="sm">Posted by ${userLink(p.user)}</span></div>
    <div class="meta"><span>${ago(p.createdAt)}</span><span>👀 ${fmt(p.views)}</span></div>
    <div class="sm" style="margin-top:6px;min-height:20px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${tags(p.tags.slice(0, 4))}</div></div>
  <div class="acts">
    <button class="act ${p.liked ? "on" : ""}" data-act="like" data-id="${p.id}" aria-label="Like">❤️ <span>${fmt(p.likes)}</span></button>
    <a class="act center" href="#/post/${p.id}" aria-label="Comments">💬 ${fmt(p.comments)}</a>
    <button class="act s ${p.saved ? "on" : ""}" data-act="save" data-id="${p.id}" aria-label="Save">🔖</button>
    <button class="act" data-act="share" data-id="${p.id}" data-title="${e(p.title)}" aria-label="Share">↗</button>
    <button class="act" data-act="report" data-type="post" data-id="${p.id}" aria-label="Report">🚨</button></div></article>`;
const skeletons = (n = 8) => `<div class="grid">${'<div class="skel"></div>'.repeat(n)}</div>`;
const empty = (icon, text, cta = "") => `<div class="empty glass"><b>${icon}</b>${e(text)}${cta}</div>`;
const reveal = () => { const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: 0.08 }); $$(".reveal:not(.in)").forEach((n) => io.observe(n)); };

/* infinite-scroll feed */
BW.feed = (box, params) => {
  let page = 0, busy = false, done = false; const tok = (box._tok = Symbol());
  box.innerHTML = `<div class="grid"></div><div class="more">${skeletons(4)}</div>`;
  const grid = $(".grid", box), more = $(".more", box);
  const load = async () => {
    if (busy || done || box._tok !== tok) return; busy = true;
    try { const q = new URLSearchParams({ ...params, page }); const r = await GET("/posts?" + q);
      if (box._tok !== tok) return;
      grid.insertAdjacentHTML("beforeend", r.posts.map(BW.card).join("")); page++; done = !r.more;
      if (done) more.innerHTML = grid.children.length ? "" : empty("🌌", params.feed === "following" ? "Follow creators to fill this feed." : "Nothing here yet — be the first to post!", `<div style="margin-top:14px"><button class="btn pri" data-act="create">+ Create</button></div>`);
      reveal();
    } catch (x) { more.innerHTML = empty("⚠️", x.message); done = true; } busy = false;
  };
  new IntersectionObserver((es) => es[0].isIntersecting && load(), { rootMargin: "600px" }).observe(more); load();
};

/* ---------- navigation chrome ---------- */
const NAV = [["explore", "Explore"], ["foryou", "For You"], ["t/edit", "Edits"], ["t/clip", "Clips"], ["t/tiktok", "TikToks"], ["watch", "Shorts"], ["moments", "Moments"], ["community", "Community"], ["leaderboard", "Leaderboard"], ["voice", "Voice"], ["messages", "Messages"]];
BW.chrome = () => {
  const m = BW.me, cur = location.hash.slice(2).split("?")[0] || "home";
  $("#nav").innerHTML = `<div class="wrap"><a class="logo" href="#/home"><i>B</i><span>BILAL’S WORLD</span></a>
    <nav class="links">${NAV.map(([h, l]) => `<a href="#/${h}" class="${cur === h || (h !== "home" && cur.startsWith(h)) ? "on" : ""}">${l}</a>`).join("")}</nav>
    <form class="search" data-form="search" role="search"><input class="in" name="q" placeholder="Search" aria-label="Search" autocomplete="off"></form>
    <button class="btn hot" data-act="create">+ Create</button>
    ${m ? `<div style="position:relative"><button class="btn icon" data-act="bell" aria-label="Notifications">🔔${m.unread ? `<span class="badge">${m.unread > 99 ? "99+" : m.unread}</span>` : ""}</button><div id="bell"></div></div>
      <div style="position:relative"><button class="btn icon" data-act="menu" aria-label="Profile" style="padding:0;overflow:hidden">${avatar(m, 40)}</button><div id="menu"></div></div>`
    : `<button class="btn" data-act="auth">Sign in</button>`}</div>`;
  $("#tabbar").innerHTML = [["home", "🏠", "Home"], ["explore", "🧭", "Explore"], ["create", "+", ""], ["leaderboard", "🏆", "Ranks"], [m ? "messages" : "auth", m ? "💬" : "👤", m ? "Chat" : "Sign in"]]
    .map(([h, i, l]) => h === "create" ? `<a href="#" class="mk" data-act="create" aria-label="Create"><b>+</b></a>` : h === "auth" ? `<a href="#" data-act="auth"><b>${i}</b>${l}</a>`
      : `<a href="#/${h}" class="${cur.startsWith(h) ? "on" : ""}"><b>${i}</b>${l}${h === "messages" && m?.unreadMsg ? `<span class="badge" style="top:6px;right:18%">${m.unreadMsg}</span>` : ""}</a>`).join("");
  $("#foot").innerHTML = `<div class="wrap"><div><div class="logo"><i>B</i>BILAL’S WORLD</div><p class="mut">Where the Bilal community comes alive.</p>
    <p class="sm mut">Fan-made community platform dedicated to Bilal Fadili. Not affiliated with, managed or endorsed by Bilal Fadili.</p>
    <p>${tags(["BilalEdit", "BilalFadili", "BilalWorld"])}</p></div>
    <div><a href="#/home">Home</a><a href="#/explore">Explore</a><a href="#/community">Community</a><a href="#/leaderboard">Leaderboard</a><a href="#/hashtags">Hashtags</a><a href="#/top">Top TikToks</a></div>
    <div><a href="#" data-act="lang">🌐 ${BW_LANG === "fr" ? "English" : "Français"}</a><a href="#/rules">Rules</a><a href="#/about">About</a><a href="#/privacy">Privacy</a><a href="#/terms">Terms</a><a href="#/contact">Contact</a></div></div>`;
};
BW.acts.menu = () => { const b = $("#menu"); if (b.innerHTML) return (b.innerHTML = ""); const m = BW.me; $("#bell").innerHTML = "";
  b.innerHTML = `<div class="drop glass"><a href="#/u/${e(m.username)}">👤 <span>My profile</span></a><a href="#/notifications">🔔 <span>Notifications</span></a><a href="#/saved">🔖 <span>Saved</span></a><a href="#/liked">❤️ <span>Liked</span></a><a href="#/foryou/following">👥 <span>Following feed</span></a>
    <a href="#/messages">💬 <span>Messages</span></a><a href="#/voice">🎧 <span>Voice rooms</span></a><a href="#/settings">⚙️ <span>Settings</span></a>${m.role !== "USER" ? `<a href="#/admin">🛡️ <span>${m.role === "ADMIN" ? "Admin dashboard" : "Moderation"}</span></a>` : ""}
    <button class="item" data-act="logout">🚪 <span>Log out</span></button></div>`; };
BW.acts.bell = guard(async () => { const b = $("#bell"); if (b.innerHTML) return (b.innerHTML = ""); $("#menu").innerHTML = ""; b.innerHTML = `<div class="drop glass"><div class="pad mut">Loading…</div></div>`;
  const r = await GET("/notifications"); const ic = { like: "❤️", comment: "💬", reply: "↩️", follow: "👥", message: "✉️", call: "📞", warning: "⚠️", removed: "🗑️", stats: "📊", rank: "🏆", role: "🛡️" };
  b.innerHTML = `<div class="drop glass"><div class="row between" style="padding:8px 12px"><b>Notifications</b><a class="tag sm" href="#/notifications" style="padding:0">See all</a></div>${r.items.length ? r.items.map((n) => `<a href="${e(n.link || "#/home")}" class="${n.read ? "" : "unread"}"><span>${ic[n.type] || "🔔"}</span><span><span>${e(n.text)}</span><br><span class="mut sm">${ago(n.created_at)}</span></span></a>`).join("") : `<div class="pad mut center">No notifications yet.</div>`}</div>`;
  if (BW.me.unread) { BW.me.unread = 0; POST("/notifications/read"); $("[data-act=bell] .badge")?.remove(); } });
document.addEventListener("click", (ev) => { if (!ev.target.closest("#menu,#bell,[data-act=menu],[data-act=bell]")) { const m = $("#menu"), b = $("#bell"); if (m) m.innerHTML = ""; if (b) b.innerHTML = ""; } });

/* ---------- router ---------- */
BW.go = (h) => { if (location.hash === h) BW.render(); else location.hash = h; };
BW.render = async () => {
  const [path, qs] = (location.hash.slice(2) || "home").split("?"), parts = path.split("/").map(decodeURIComponent), q = Object.fromEntries(new URLSearchParams(qs || ""));
  const fn = BW.routes[parts[0]] || BW.routes.notfound, app = $("#app"); BW.chrome(); BW.closeModal(); window.scrollTo(0, 0);
  app._r = (app._r || 0) + 1; const mine = app._r; app.innerHTML = `<div class="wrap sec">${skeletons(8)}</div>`;
  try { await fn(app, parts.slice(1), q, () => app._r === mine); } catch (x) { if (app._r === mine) app.innerHTML = `<div class="wrap sec">${empty("⚠️", x.message)}</div>`; }
  reveal(); document.title = (app.dataset.title ? app.dataset.title + " · " : "") + "Bilal's World"; delete app.dataset.title;
};
window.addEventListener("hashchange", BW.render);
document.addEventListener("click", (ev) => { const el = ev.target.closest("[data-act]"); if (!el) return; const f = BW.acts[el.dataset.act]; if (f) { ev.preventDefault(); f(el, ev); } });
document.addEventListener("submit", (ev) => { const f = ev.target.closest("form[data-form]"); if (!f) return; ev.preventDefault(); const h = BW.forms[f.dataset.form]; if (h) guard(h)(f, ev); });
BW.forms.search = (f) => { const q = f.q.value.trim(); if (q) BW.go("#/search?q=" + encodeURIComponent(q)); };

/* ---------- modal ---------- */
BW.modal = (html, wide) => { const m = $("#modal"); m.innerHTML = `<div class="mbox glass ${wide ? "wide" : ""}" role="dialog" aria-modal="true"><button class="btn sm ghost" data-act="close" style="float:right" aria-label="Close">✕</button>${html}</div>`; m.hidden = false; $("input,textarea,select,button.pri", m)?.focus(); };
BW.closeModal = () => { const m = $("#modal"); m.hidden = true; m.innerHTML = ""; };
BW.acts.close = BW.closeModal;
$("#modal").addEventListener("mousedown", (ev) => { if (ev.target.id === "modal") BW.closeModal(); });
document.addEventListener("keydown", (ev) => ev.key === "Escape" && BW.closeModal());

/* ---------- auth ---------- */
BW.acts.auth = (el) => { const reg = el?.dataset?.mode === "register";
  BW.modal(`<h2 class="gt">${reg ? "Join the community" : "Welcome back"}</h2><p class="mut">${reg ? "Create your Bilal’s World account." : "Sign in to like, post and chat."}</p>
  <form data-form="${reg ? "register" : "login"}"><label class="f">Username${reg ? "" : " or email"}</label><input class="in" name="username" required maxlength="120" autocomplete="username">
  ${reg ? `<label class="f">Email</label><input class="in" type="email" name="email" required autocomplete="email">` : ""}
  <label class="f">Password</label><input class="in" type="password" name="password" required minlength="${reg ? 8 : 1}" autocomplete="${reg ? "new-password" : "current-password"}">
  ${reg ? "" : `<p class="sm" style="margin:8px 0 0"><a href="#" class="tag" data-act="forgot">Forgot password?</a></p>`}
  ${reg ? `<p class="sm mut">By joining you accept the <a class="tag" href="#/rules">Community Rules</a> and <a class="tag" href="#/terms">Terms</a>.</p>` : ""}
  <button class="btn pri" style="width:100%;margin-top:18px">${reg ? "Create account" : "Sign in"}</button></form>
  <p class="center sm mut" style="margin:14px 0 0">${reg ? "Already a member?" : "New here?"} <a href="#" class="tag" data-act="auth" data-mode="${reg ? "login" : "register"}">${reg ? "Sign in" : "Create an account"}</a></p>`); };
const afterAuth = async () => { await BW.boot(true); BW.closeModal(); BW.render(); };
BW.forms.login = async (f) => { await POST("/auth/login", { username: f.username.value, password: f.password.value }); await afterAuth(); BW.toast("Welcome back!", "ok"); };
BW.forms.register = async (f) => { await POST("/auth/register", { username: f.username.value, email: f.email.value, password: f.password.value }); await afterAuth(); BW.toast("Welcome to Bilal’s World! 🎉", "ok"); };
BW.acts.lang = () => { localStorage.setItem("bw_lang", BW_LANG === "fr" ? "en" : "fr"); location.reload(); };
BW.acts.forgot = () => BW.modal(`<h2>Reset your password</h2><p class="mut">Enter the email of your account. If it exists, you will receive a link valid for one hour.</p>
  <form data-form="forgot"><label class="f">Email</label><input class="in" type="email" name="email" required autocomplete="email"><button class="btn pri" style="width:100%;margin-top:16px">Send reset link</button></form>`);
BW.forms.forgot = async (f) => { const r = await POST("/auth/forgot", { email: f.email.value }); BW.closeModal();
  BW.modal(r.mail ? `<h2>📧 Check your inbox</h2><p class="mut">If an account uses this email, a reset link was sent. It is valid for one hour.</p>` : `<h2>Ask the administrator</h2><p class="mut">Email is not configured on this server yet. Message <b>@ADMIN</b> (or any moderator who can reach them): the administrator can generate a one-time reset link for your account.</p>`); };
BW.forms.reset = async (f) => { await POST("/auth/reset", { token: f.dataset.token, password: f.password.value }); BW.toast("Password updated. You can sign in now.", "ok"); BW.go("#/home"); setTimeout(() => BW.acts.auth(), 300); };
BW.acts.logout = guard(async () => { await POST("/auth/logout"); BW.sock?.disconnect(); BW.sock = null; BW.me = null; BW.go("#/home"); });

/* ---------- post actions ---------- */
BW.acts.like = guard(async (el) => { if (!needMe()) return; const r = await POST(`/posts/${el.dataset.id}/like`); el.classList.toggle("on", r.on); const s = $("span", el); if (s) s.textContent = fmt(r.count); });
BW.acts.save = guard(async (el) => { if (!needMe()) return; const r = await POST(`/posts/${el.dataset.id}/save`); el.classList.toggle("on", r.on); BW.toast(r.on ? "Saved to your collection." : "Removed from Saved."); });
BW.acts.share = guard(async (el) => { const link = `${location.origin}/#/post/${el.dataset.id}`; POST(`/posts/${el.dataset.id}/share`).catch(() => {});
  if (navigator.share) { try { await navigator.share({ title: el.dataset.title || "Bilal's World", url: link }); return; } catch { /* fall through to the dialog */ } }
  BW.modal(`<h2>Share</h2><label class="f">Link</label><div class="row"><input class="in" readonly value="${e(link)}" id="shareLink"><button class="btn pri" data-act="copy">Copy</button></div>
    ${BW.me ? `<form data-form="sharedm" data-id="${e(el.dataset.id)}"><label class="f">Send in a private message</label><div class="row"><input class="in" name="to" placeholder="@username" required maxlength="21"><button class="btn">Send</button></div></form>` : ""}`); });
BW.acts.copy = async () => { const i = $("#shareLink"); try { await navigator.clipboard.writeText(i.value); } catch { i.select(); document.execCommand("copy"); } BW.toast("Link copied!", "ok"); };
BW.forms.sharedm = async (f) => { const fd = new FormData(); fd.append("postId", f.dataset.id); await BW.api("POST", `/messages/${encodeURIComponent(f.to.value.replace(/^@/, "").trim())}`, fd); BW.closeModal(); BW.toast("Sent!", "ok"); };
BW.acts.report = (el) => { if (!needMe()) return;
  BW.modal(`<h2>🚨 Report</h2><p class="mut">Tell the moderators what is wrong. Abusive reports break the rules.</p><form data-form="report" data-type="${e(el.dataset.type)}" data-id="${e(el.dataset.id)}">
    <label class="f">Reason</label><select class="in" name="reason">${(BW.meta?.reasons || []).map((r) => `<option>${e(r)}</option>`).join("")}</select>
    <label class="f">Details (optional)</label><textarea class="in" name="details" maxlength="400"></textarea><button class="btn danger" style="width:100%;margin-top:16px">Send report</button></form>`); };
BW.forms.report = async (f) => { await POST("/reports", { targetType: f.dataset.type, targetId: +f.dataset.id, reason: f.reason.value, details: f.details.value }); BW.closeModal(); BW.toast("Report sent to the moderators. Thank you.", "ok"); };

/* ---------- create a post ---------- */
BW.acts.create = (el) => { if (!needMe()) return; const moment = el?.dataset?.moment || "";
  BW.modal(`<h2 class="gt">Create a Post</h2><form data-form="create">
    <label class="f">What are you sharing?</label><div class="typegrid">${Object.entries(TYPE).map(([k, v], i) => `<button type="button" data-act="ptype" data-type="${k}" class="${(el?.dataset?.type || "edit") === k ? "on" : ""}"><b>${v[0]}</b>${v[1]}</button>`).join("")}</div>
    <input type="hidden" name="type" value="${e(el?.dataset?.type || "edit")}">
    <label class="f">Title</label><input class="in" name="title" required minlength="3" maxlength="100" placeholder="Give it a strong title">
    <label class="f">Video or image <span class="mut">(MP4/WebM ≤ 80 MB · JPG/PNG/WebP/GIF ≤ 10 MB)</span></label><input class="in" type="file" name="media" accept="video/mp4,video/webm,image/jpeg,image/png,image/webp,image/gif">
    <label class="f">Thumbnail <span class="mut">(optional image)</span></label><input class="in" type="file" name="thumb" accept="image/jpeg,image/png,image/webp">
    <label class="f">Description</label><textarea class="in" name="description" maxlength="2000" placeholder="Tell the story behind it"></textarea>
    <label class="f">Hashtags</label><input class="in" name="hashtags" value="#BilalEdit #BilalFadili" maxlength="300">
    <div class="chips" style="margin-top:8px">${["BilalEdit", "BilalFadili", "BilalFadiliEdit", "Bilal", "BilalClips", "BilalMoments", "BilalLive", "BilalWorld"].map((t) => `<button type="button" class="chip sm" data-act="addtag" data-tag="${t}">#${t}</button>`).join("")}</div>
    <label class="f">Bilal Moments category <span class="mut">(optional)</span></label><select class="in" name="momentCat"><option value="0">— none —</option>${(BW.meta?.moments || []).map((m) => `<option value="${m.id}" ${String(m.id) === moment ? "selected" : ""}>${e(m.emoji)} ${e(m.name)}</option>`).join("")}</select>
    <label class="f">TikTok URL</label><input class="in" name="tiktokUrl" type="url" placeholder="https://www.tiktok.com/@you/video/…" maxlength="500">
    <label class="f">TikTok views <span class="mut">(big numbers are verified by moderators)</span></label><input class="in" name="tiktokViews" type="number" min="0" max="5000000000" placeholder="125000">
    <label class="f">Link to the original content <span class="mut">(optional)</span></label><input class="in" name="originalUrl" type="url" maxlength="500" placeholder="https://…">
    <p class="sm mut">Only post content you have the right to share. Respect copyright and the <a class="tag" href="#/rules">Community Rules</a>.</p>
    <button class="btn hot" style="width:100%;margin-top:10px">Publish</button></form>`, true); };
BW.acts.ptype = (el) => { $$(".typegrid button").forEach((b) => b.classList.toggle("on", b === el)); el.closest("form").type.value = el.dataset.type; };
BW.acts.addtag = (el) => { const i = el.closest("form").hashtags; if (!new RegExp(`#${el.dataset.tag}(\\s|$)`, "i").test(i.value)) i.value = (i.value + " #" + el.dataset.tag).trim(); };
BW.forms.create = async (f) => { const b = $("button.hot", f); b.disabled = true; b.textContent = "Publishing…";
  try { const fd = new FormData(f), v = f.media.files[0];
    if (v && v.type.startsWith("video/") && !f.thumb.files.length) { const th = await BW.videoThumb(v).catch(() => null); if (th) fd.set("thumb", th, "thumb.jpg"); else fd.delete("thumb"); }
    const r = await BW.api("POST", "/posts", fd); BW.closeModal();
    BW.toast(r.stat?.status === "pending" ? "Published! Your TikTok views are pending verification ⚠️" : "Published! 🚀", "ok"); BW.go("#/post/" + r.id); }
  finally { b.disabled = false; b.textContent = "Publish"; } };

/* grab a frame of the selected video in the browser → used as the post thumbnail (lighter feeds, no server transcoding) */
BW.videoThumb = (file) => new Promise((res, rej) => { const v = document.createElement("video"), u = URL.createObjectURL(file); v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = u;
  const fail = () => { URL.revokeObjectURL(u); rej(new Error("thumb")); }; setTimeout(fail, 8000); v.onerror = fail;
  v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 3); };
  v.onseeked = () => { const k = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement("canvas"); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height); c.toBlob((b) => { URL.revokeObjectURL(u); b ? res(b) : rej(new Error("thumb")); }, "image/jpeg", 0.82); }; });
/* preview videos on hover */
document.addEventListener("pointerenter", (ev) => { const v = ev.target.closest?.(".card")?.querySelector(".thumb video"); if (v) v.play().catch(() => {}); }, true);
document.addEventListener("pointerleave", (ev) => { const v = ev.target.closest?.(".card")?.querySelector(".thumb video"); if (v) { v.pause(); v.currentTime = 0.5; } }, true);

/* ---------- background particles ---------- */
(() => { const c = $("#fx"), x = c.getContext("2d"); let W, H, P = [];
  const size = () => { W = c.width = innerWidth; H = c.height = innerHeight; P = Array.from({ length: Math.min(70, Math.floor(W / 22)) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + 0.4, vx: (Math.random() - 0.5) * 0.25, vy: -Math.random() * 0.35 - 0.05, h: [265, 190, 325][Math.floor(Math.random() * 3)] })); };
  size(); addEventListener("resize", size);
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  (function tick() { x.clearRect(0, 0, W, H); for (const p of P) { p.x += p.vx; p.y += p.vy; if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; } x.beginPath(); x.fillStyle = `hsla(${p.h},90%,70%,.75)`; x.shadowBlur = 12; x.shadowColor = `hsl(${p.h},90%,65%)`; x.arc(p.x, p.y, p.r, 0, 7); x.fill(); } requestAnimationFrame(tick); })();
})();
