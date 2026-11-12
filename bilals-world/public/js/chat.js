/* Bilal's World — realtime: notifications, private messages, presence, typing, 1-to-1 voice calls (WebRTC) */
const EMOJI = "😀 😂 🤣 😍 😎 🥶 😭 😡 🤯 🫡 🔥 💀 ❤️ 👑 🏆 🎬 🎮 👀 💯 🙏 👏 🤝 🇩🇿 ✨".split(" ");
const chatUser = () => $(".chat")?.dataset.user || "";
const bubble = (m, posts = {}) => { const me = m.from === BW.me.id, p = m.postId && posts[m.postId];
  return `<div class="msg ${me ? "me" : ""} ${m.deleted ? "gone" : ""}" data-mid="${m.id}">${m.deleted ? "Message deleted" : `${m.image ? `<img src="${e(m.image)}" alt="image" loading="lazy">` : ""}${m.gif ? `<img src="${e(m.gif)}" alt="GIF" loading="lazy" referrerpolicy="no-referrer">` : ""}
    ${p ? `<a class="row glass" href="#/post/${p.id}" style="padding:8px;margin-bottom:4px"><span class="thumb" style="width:74px;border-radius:10px;flex:none">${p.thumb || p.media_kind === "image" ? `<img src="${e(p.thumb || p.media)}" alt="" referrerpolicy="no-referrer">` : `<span class="ph" style="font-size:22px">🎬</span>`}</span><b class="sm">${e(p.title)}</b></a>` : ""}${e(m.body)}`}
    <div class="sm" style="opacity:.65;margin-top:2px">${new Date(m.createdAt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
    ${me && !m.deleted ? `<button class="btn sm danger del" data-act="mdel" data-id="${m.id}" aria-label="Delete message">✕</button>` : !me && !m.deleted ? `<button class="lnk" data-act="report" data-type="message" data-id="${m.id}">report</button>` : ""}</div>`; };
const scrollEnd = () => { const b = $(".msgs"); if (b) b.scrollTop = b.scrollHeight; };

BW.routes.messages = async (app, [name = ""]) => {
  if (!BW.me) { app.innerHTML = `<div class="wrap sec">${empty("💬", "Sign in to chat with the community.", `<div style="margin-top:14px"><button class="btn pri" data-act="auth">Sign in</button></div>`)}</div>`; return; }
  app.dataset.title = "Messages";
  const [{ conversations }, th] = await Promise.all([GET("/messages"), name ? GET("/messages/" + encodeURIComponent(name)) : null]);
  if (th) { BW.me.unreadMsg = Math.max(0, (BW.me.unreadMsg || 0) - (conversations.find((c) => c.user.username === th.user.username)?.unread || 0)); }
  app.innerHTML = `<div class="wrap" style="padding-top:20px"><div class="chat glass ${th ? "open" : ""}" data-user="${e(th?.user.username || "")}" data-uid="${th?.user.id || ""}">
    <aside class="convs"><form data-form="newchat" style="padding:12px"><input class="in" name="to" placeholder="🔍 Find a user to message…" maxlength="21" autocomplete="off"></form>
      ${conversations.length ? conversations.map((c) => `<a class="conv ${c.user.username === th?.user.username ? "on" : ""}" href="#/messages/${e(c.user.username)}">${avatar(c.user, 44)}<span class="grow"><span class="row" style="gap:6px"><b>@${e(c.user.username)}</b><span class="dot ${c.online ? "on" : ""}" data-dot="${c.user.id}"></span>${c.unread && c.user.username !== th?.user.username ? `<span class="badge" style="position:static">${c.unread}</span>` : ""}</span>
        <span class="mut sm" style="display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${c.last.deleted ? "Message deleted" : e(c.last.body || (c.last.image ? "📷 Image" : c.last.gif ? "GIF" : "🎬 Shared a post"))}</span></span></a>`).join("") : `<p class="pad mut center">No conversations yet.<br>Search a username above to start one.</p>`}</aside>
    <section class="thread">${th ? `<div class="row" style="padding:12px 16px;border-bottom:1px solid var(--line)"><a class="btn sm ghost" href="#/messages" aria-label="Back">←</a>${avatar(th.user, 40)}
        <a class="grow" href="#/u/${e(th.user.username)}"><b>@${e(th.user.username)}</b><br><span class="mut sm"><span class="dot ${th.online ? "on" : ""}" data-dot="${th.user.id}"></span> <span data-on="${th.user.id}">${th.online ? "online" : "offline"}</span></span></a>
        <button class="btn icon" data-act="callUser" data-id="${th.user.id}" data-user="${e(th.user.username)}" aria-label="Voice call">📞</button>
        <button class="btn sm ghost" data-act="block" data-user="${e(th.user.username)}">${th.blocked ? "Unblock" : "Block"}</button><button class="btn sm ghost" data-act="report" data-type="user" data-id="${th.user.id}">🚨</button></div>
      <div class="msgs">${th.messages.length ? th.messages.map((m) => bubble(m, th.posts)).join("") : `<p class="mut center" style="margin:auto">Say hi to @${e(th.user.username)} 👋</p>`}</div><div class="typing" id="typing"></div>
      <form class="composer" data-form="send"><div class="emojis glass" id="emojis" hidden>${EMOJI.map((x) => `<button type="button" data-act="emoji">${x}</button>`).join("")}</div>
        <button type="button" class="btn icon" data-act="emojis" aria-label="Emoji">😀</button><button type="button" class="btn icon" data-act="gif" aria-label="GIF">GIF</button>
        <label class="btn icon" aria-label="Image" style="cursor:pointer">📷<input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif" hidden></label>
        <textarea class="in grow" name="body" maxlength="1500" placeholder="Message…" rows="1" style="min-height:42px;max-height:120px"></textarea><button class="btn pri">Send</button></form>`
      : `<div class="empty" style="margin:auto"><b>💬</b>Select a conversation or search a user.</div>`}</section></div></div>`;
  scrollEnd(); BW.chrome();
  const f = $("form[data-form=send]"); if (!f) return; let last = 0;
  f.body.addEventListener("input", () => { if (Date.now() - last > 1500) { last = Date.now(); BW.sock?.emit("typing", { to: +$(".chat").dataset.uid }); } });
  f.body.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); f.requestSubmit(); } });
  f.image.addEventListener("change", () => f.image.files.length && f.requestSubmit());
};
BW.forms.newchat = (f) => { const u = f.to.value.replace(/^@/, "").trim(); if (u) BW.go("#/messages/" + encodeURIComponent(u)); };
BW.forms.send = async (f) => { const fd = new FormData(); if (f.body.value.trim()) fd.append("body", f.body.value.trim()); if (f.image.files.length) fd.append("image", f.image.files[0]); if (f.dataset.gif) fd.append("gif", f.dataset.gif);
  if (![...fd.keys()].length) return; const body = f.body.value; f.body.value = ""; f.image.value = ""; delete f.dataset.gif;
  try { await BW.api("POST", "/messages/" + encodeURIComponent(chatUser()), fd); } catch (x) { f.body.value = body; throw x; } };
BW.acts.emojis = () => { const b = $("#emojis"); b.hidden = !b.hidden; };
BW.acts.emoji = (el) => { const t = $("form[data-form=send]").body; t.value += el.textContent; t.focus(); };
BW.acts.gif = () => { BW.modal(`<h2>Send a GIF</h2><p class="mut">Paste the link of a GIF (https://… ending in .gif, or from Giphy / Tenor).</p><form data-form="gif"><input class="in" name="url" type="url" required placeholder="https://media.giphy.com/…/giphy.gif"><button class="btn pri" style="width:100%;margin-top:14px">Send GIF</button></form>`); };
BW.forms.gif = async (f) => { const u = f.url.value.trim(); if (!/^https:\/\/.+/i.test(u)) throw new Error("Enter a valid https link."); const fd = new FormData(); fd.append("gif", u); BW.closeModal(); await BW.api("POST", "/messages/" + encodeURIComponent(chatUser()), fd); };
BW.acts.mdel = guard(async (el) => { await DEL("/messages/item/" + el.dataset.id); });

/* ---------- socket ---------- */
BW.connect = () => {
  if (BW.sock || !BW.me || typeof io === "undefined") return;
  const s = (BW.sock = io({ transports: ["websocket", "polling"] }));
  s.on("notif", (n) => { BW.me.unread = (BW.me.unread || 0) + 1; BW.chrome(); if (n.type !== "call") BW.toast("🔔 " + n.text); });
  s.on("dm", ({ message: m, from, post, echo }) => { const other = m.from === BW.me.id ? echo : from.username;
    if (location.hash.startsWith("#/messages") && chatUser() === other) { const box = $(".msgs"); $("p.mut", box)?.remove(); box.insertAdjacentHTML("beforeend", bubble(m, post ? { [post.id]: post } : {})); scrollEnd(); $("#typing").textContent = "";
      if (m.from !== BW.me.id) GET("/messages/" + encodeURIComponent(other)).catch(() => {}); }
    else if (m.from !== BW.me.id) { BW.me.unreadMsg = (BW.me.unreadMsg || 0) + 1; BW.chrome(); BW.toast(`💬 @${from.username}: ${m.body ? m.body.slice(0, 60) : "sent you a message"}`); if (location.hash === "#/messages") BW.render(); } });
  s.on("dm:deleted", ({ id }) => { const n = $(`[data-mid="${id}"]`); if (n) { n.classList.add("gone"); n.innerHTML = "Message deleted"; } });
  let tt; s.on("typing", ({ from }) => { const c = $(".chat"); if (c && +c.dataset.uid === from) { $("#typing").textContent = `@${c.dataset.user} is typing…`; clearTimeout(tt); tt = setTimeout(() => { const t = $("#typing"); if (t) t.textContent = ""; }, 2500); } });
  s.on("presence", ({ id, online }) => { $$(`[data-dot="${id}"]`).forEach((d) => d.classList.toggle("on", online)); $$(`[data-on="${id}"]`).forEach((d) => (d.textContent = online ? "online" : "offline")); });
  s.on("session:end", () => { BW.toast("Your session ended.", "err"); BW.me = null; BW.sock = null; BW.go("#/home"); });
  s.on("modqueue", () => { if (location.hash.startsWith("#/admin")) BW.toast("🛡️ New item in the moderation queue."); });
  s.on("call:incoming", ({ callId, from }) => Call.incoming(callId, from));
  s.on("call:accepted", ({ callId }) => Call.accepted(callId));
  s.on("call:signal", ({ callId, data }) => Call.signal(callId, data));
  s.on("call:ended", ({ callId, reason }) => Call.close(callId, reason));
};

/* ---------- voice calls: WebRTC audio, signalling relayed by the server (room-based, ready for group calls) ---------- */
const Call = { id: null, pc: null, stream: null, peer: null, timer: null, muted: false, started: 0, pending: [],
  ui(html) { const c = $("#call"); c.innerHTML = `<div class="callbox glass">${html}</div>`; c.hidden = false; },
  ringing(title, sub, buttons) { this.ui(`<p class="mut">${title}</p>${avatar(this.peer, 110)}<h2 style="margin:16px 0 4px">@${e(this.peer.username)}</h2><p class="mut" id="callst">${sub}</p><div class="row" style="justify-content:center;margin-top:22px">${buttons}</div>`); },
  async start(el) { if (!needMe()) return; if (this.id) return BW.toast("You are already in a call.", "err"); if (!BW.sock?.connected) return BW.toast("Realtime connection lost. Reload the page.", "err");
    try { this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch { return BW.toast("Microphone access is needed to make a call.", "err"); }
    this.peer = { id: +el.dataset.id, username: el.dataset.user }; this.caller = true;
    BW.sock.emit("call:invite", { to: this.peer.id }, (r) => { if (r?.error) { this.cleanup(); return BW.toast(r.error, "err"); } this.id = r.callId;
      this.ringing("📞 Calling…", "Ringing…", `<button class="btn danger" data-act="callEnd">End Call</button>`); }); },
  incoming(callId, from) { if (this.id) return BW.sock.emit("call:decline", { callId }); this.id = callId; this.peer = from; this.caller = false;
    this.ringing("Incoming Call", "wants to talk with you", `<button class="btn ok" data-act="callAccept">📞 Accept</button><button class="btn danger" data-act="callDecline">Decline</button>`); },
  async accept() { try { this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch { BW.toast("Microphone access is needed to answer.", "err"); return this.decline(); }
    this.makePc(); BW.sock.emit("call:accept", { callId: this.id }); this.live(); },
  decline() { BW.sock.emit("call:decline", { callId: this.id }); this.cleanup(); },
  makePc() { const pc = (this.pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }));
    this.stream.getTracks().forEach((t) => pc.addTrack(t, this.stream));
    pc.onicecandidate = (ev) => ev.candidate && BW.sock.emit("call:signal", { callId: this.id, data: { ice: ev.candidate } });
    pc.ontrack = (ev) => { $("#remoteAudio").srcObject = ev.streams[0]; };
    pc.onconnectionstatechange = () => { const s = $("#callst"); if (s && pc.connectionState === "connected") s.textContent = "Connected"; if (["failed", "closed"].includes(pc.connectionState)) this.end(); }; },
  async accepted(callId) { if (callId !== this.id) return; this.makePc(); const offer = await this.pc.createOffer(); await this.pc.setLocalDescription(offer); BW.sock.emit("call:signal", { callId, data: { sdp: this.pc.localDescription } }); this.live(); },
  async signal(callId, data) { if (callId !== this.id) return; if (!this.pc) { this.pending.push(data); return; }
    try { if (data.sdp) { await this.pc.setRemoteDescription(data.sdp); if (data.sdp.type === "offer") { const a = await this.pc.createAnswer(); await this.pc.setLocalDescription(a); BW.sock.emit("call:signal", { callId, data: { sdp: this.pc.localDescription } }); } }
      else if (data.ice) await this.pc.addIceCandidate(data.ice); } catch (x) { console.warn("signal", x); } },
  live() { this.started = Date.now(); this.muted = false; this.pending.splice(0).forEach((d) => this.signal(this.id, d));
    this.ui(`<p class="mut">🔊 Voice Call</p>${avatar(this.peer, 110)}<h2 style="margin:16px 0 4px">@${e(this.peer.username)}</h2><p class="mut" id="callst">Connecting…</p><div style="font-size:30px;font-weight:900" id="calltime">00:00</div>
      <div class="row" style="justify-content:center;margin-top:22px"><button class="btn" data-act="callMute" id="callmute">🎙️ Microphone on</button><button class="btn danger" data-act="callEnd">End Call</button></div>`);
    this.timer = setInterval(() => { const s = Math.floor((Date.now() - this.started) / 1000), t = $("#calltime"); if (t) t.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }, 500); },
  mute() { this.muted = !this.muted; this.stream?.getAudioTracks().forEach((t) => (t.enabled = !this.muted)); const b = $("#callmute"); b.textContent = this.muted ? "🔇 Muted — tap to unmute" : "🎙️ Microphone on"; b.classList.toggle("on", this.muted); },
  end() { if (this.id) BW.sock?.emit("call:end", { callId: this.id }); this.cleanup(); },
  close(callId, reason) { if (callId !== this.id) return; this.cleanup(); BW.toast("📞 " + (reason || "Call ended")); },
  cleanup() { clearInterval(this.timer); this.pc?.close(); this.stream?.getTracks().forEach((t) => t.stop()); $("#remoteAudio").srcObject = null; Object.assign(this, { id: null, pc: null, stream: null, peer: null, timer: null, pending: [] }); const c = $("#call"); c.hidden = true; c.innerHTML = ""; } };
BW.acts.callUser = (el) => Call.start(el); BW.acts.callAccept = () => Call.accept(); BW.acts.callDecline = () => Call.decline(); BW.acts.callEnd = () => Call.end(); BW.acts.callMute = () => Call.mute();
