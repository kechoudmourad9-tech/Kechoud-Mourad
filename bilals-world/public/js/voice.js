/* Bilal's World — group voice rooms (WebRTC audio mesh; signalling relayed by the server) */
const Voice = { room: null, stream: null, pcs: new Map(), peers: new Map(), muted: false, rooms: {},
  ice: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
  name(id) { return (BW.meta?.voiceRooms || []).find((r) => r[0] === id)?.[1] || id; },
  pc(uid, initiator) { let pc = this.pcs.get(uid); if (pc) return pc; pc = new RTCPeerConnection(this.ice); this.pcs.set(uid, pc);
    this.stream.getTracks().forEach((t) => pc.addTrack(t, this.stream));
    pc.onicecandidate = (ev) => ev.candidate && BW.sock.emit("voice:signal", { to: uid, data: { ice: ev.candidate } });
    pc.ontrack = (ev) => { let a = document.getElementById("va" + uid); if (!a) { a = document.createElement("audio"); a.id = "va" + uid; a.autoplay = true; document.body.append(a); } a.srcObject = ev.streams[0]; };
    pc.onconnectionstatechange = () => { if (["failed", "closed"].includes(pc.connectionState)) this.drop(uid); this.paint(); };
    if (initiator) pc.createOffer().then((o) => pc.setLocalDescription(o)).then(() => BW.sock.emit("voice:signal", { to: uid, data: { sdp: pc.localDescription } })).catch(() => {});
    return pc; },
  drop(uid) { this.pcs.get(uid)?.close(); this.pcs.delete(uid); this.peers.delete(uid); document.getElementById("va" + uid)?.remove(); },
  async join(room) { if (!needMe()) return; if (!BW.sock?.connected) return BW.toast("Realtime connection lost. Reload the page.", "err"); if (Call.id) return BW.toast("You are already in a call.", "err");
    if (this.room) this.leave(true);
    try { this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch { return BW.toast("Microphone access is needed to make a call.", "err"); }
    BW.sock.emit("voice:join", { room }, (r) => { if (r?.error) { this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; return BW.toast(r.error, "err"); }
      this.room = room; this.muted = false; r.peers.forEach((u) => { this.peers.set(u.id, u); this.pc(u.id, true); }); this.paint(); }); },   // the newcomer calls everyone already in the room
  async signal(from, data) { if (!this.room) return; const pc = this.pc(from, false);
    try { if (data.sdp) { await pc.setRemoteDescription(data.sdp); if (data.sdp.type === "offer") { await pc.setLocalDescription(await pc.createAnswer()); BW.sock.emit("voice:signal", { to: from, data: { sdp: pc.localDescription } }); } }
      else if (data.ice) await pc.addIceCandidate(data.ice); } catch (x) { console.warn("voice", x); } },
  leave(silent) { if (!this.room) return; BW.sock?.emit("voice:leave"); [...this.pcs.keys()].forEach((u) => this.drop(u)); this.stream?.getTracks().forEach((t) => t.stop()); this.stream = null; this.room = null; if (!silent) this.paint(); },
  mute() { this.muted = !this.muted; this.stream?.getAudioTracks().forEach((t) => (t.enabled = !this.muted)); this.paint(); },
  paint() { let bar = $("#voicebar"); if (!this.room) { bar?.remove(); } else { if (!bar) { bar = document.createElement("div"); bar.id = "voicebar"; bar.className = "glass"; document.body.append(bar); }
      bar.innerHTML = `<a href="#/voice" class="grow"><b>${e(this.name(this.room))}</b><br><span class="mut sm">${this.peers.size + 1} / 8</span></a><button class="btn sm ${this.muted ? "on" : ""}" data-act="vmute">${this.muted ? "🔇 Muted" : "🎙️ Mic on"}</button><button class="btn sm danger" data-act="vleave">Leave</button>`; }
    if (location.hash.startsWith("#/voice")) this.lobby(); },
  lobby() { const box = $("#vrooms"); if (!box) return;
    box.innerHTML = (BW.meta?.voiceRooms || []).map(([id, name]) => { const us = this.rooms[id] || [], mine = this.room === id;
      return `<div class="glass pad vroom ${mine ? "on" : ""}"><div class="row"><h3 class="grow">${e(name)}</h3><span class="mut sm">${us.length} / 8</span></div>
        <div class="row wrapr" style="margin:14px 0;min-height:52px">${us.length ? us.map((u) => `<a href="#/u/${e(u.username)}" class="center" style="width:64px">${avatar(u, 46)}<div class="sm" style="overflow:hidden;text-overflow:ellipsis">${e(u.username)}</div></a>`).join("") : `<span class="mut">Empty — be the first to join.</span>`}</div>
        ${mine ? `<div class="row wrapr"><span class="st approved">You are here</span><button class="btn sm ${this.muted ? "on" : ""}" data-act="vmute">${this.muted ? "🔇 Muted" : "🎙️ Mic on"}</button><button class="btn sm danger" data-act="vleave">Leave</button></div>` : `<button class="btn pri" data-act="vjoin" data-room="${e(id)}" ${us.length >= 8 ? "disabled" : ""}>Join</button>`}</div>`; }).join(""); } };
BW.acts.vjoin = (el) => Voice.join(el.dataset.room); BW.acts.vleave = () => Voice.leave(); BW.acts.vmute = () => Voice.mute();
BW.routes.voice = async (app) => { app.dataset.title = "Voice rooms";
  app.innerHTML = `<div class="wrap">${head("🎧 Voice rooms", "Talk with several members at the same time. Up to 8 people per room.")}${BW.me ? `<div class="grid" id="vrooms" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))"></div>` : empty("🎧", "Sign in to join voice rooms.", `<div style="margin-top:14px"><button class="btn pri" data-act="auth">Sign in</button></div>`)}</div>`;
  if (BW.me && BW.sock) BW.sock.emit("voice:list", (r) => { Voice.rooms = r || {}; Voice.lobby(); }); };
BW.voiceHook = (s) => { s.on("voice:rooms", (r) => { Voice.rooms = r; Voice.lobby(); });
  s.on("voice:joined", ({ user }) => { if (Voice.room) { Voice.peers.set(user.id, user); Voice.paint(); } });
  s.on("voice:left", ({ id }) => { Voice.drop(id); Voice.paint(); });
  s.on("voice:signal", ({ from, data }) => Voice.signal(from, data)); s.on("disconnect", () => Voice.leave()); };
