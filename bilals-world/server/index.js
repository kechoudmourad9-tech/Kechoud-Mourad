// Bilal's World — API + realtime server (Express, SQLite, Socket.IO). All permissions are enforced here.
const express = require("express");
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const multer = require("multer");
const { Server } = require("socket.io");
const { get, all, run, now, setting, setSetting, hashPass, checkPass, DATA } = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e5 });
const UP = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
fs.mkdirSync(UP, { recursive: true });
const PROD = process.env.NODE_ENV === "production";
app.set("trust proxy", process.env.TRUST_PROXY ? 1 : 0);
app.disable("x-powered-by");

const TYPES = ["edit", "clip", "tiktok", "live", "meme", "fanart", "short"];
const REASONS = ["Harassment", "Spam", "Inappropriate Content", "Hate Speech", "Copyright", "Other"];
const LEVELS = ["warning", "block", "mute", "tempban", "ban"];
const isMod = (u) => u && (u.role === "MODERATOR" || u.role === "ADMIN");
const pub = (u) => u && ({ id: u.id, username: u.username, avatar: u.avatar, bio: u.bio, role: u.role, created_at: u.created_at });
const int = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const str = (v, max) => String(v ?? "").replace(/\u0000/g, "").trim().slice(0, max);
const url = (v, hosts) => { try { const u = new URL(str(v, 500)); if (!/^https?:$/.test(u.protocol)) return ""; if (hosts && !hosts.some((h) => u.hostname === h || u.hostname.endsWith("." + h))) return ""; return u.toString(); } catch { return ""; } };
const err = (res, code, msg) => res.status(code).json({ error: msg });

/* ---------- security headers, body parsing, rate limiting, CSRF ---------- */
app.use((req, res, next) => {
  res.set({ "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "same-origin", "Permissions-Policy": "microphone=(self), camera=()",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data: https:; media-src 'self' blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' ws: wss:; frame-src https://www.tiktok.com; object-src 'none'; base-uri 'self'; form-action 'self'" });
  next();
});
app.use(express.json({ limit: "64kb" }));
const buckets = new Map();
const limit = (name, max, windowSec) => (req, res, next) => {
  const k = `${name}:${req.ip}`, t = Date.now(), b = buckets.get(k) || { n: 0, t };
  if (t - b.t > windowSec * 1000) { b.n = 0; b.t = t; }
  b.n++; buckets.set(k, b);
  if (b.n > max) { if (name === "auth") sec("rate_limit", req, name); return err(res, 429, "Too many requests. Slow down."); }
  next();
};
setInterval(() => { const t = Date.now(); for (const [k, b] of buckets) if (t - b.t > 900000) buckets.delete(k); }, 60000).unref();
app.use("/api", limit("api", 600, 60));
app.use("/api", (req, res, next) => (req.method === "GET" || req.get("x-bw") === "1" ? next() : err(res, 403, "Bad request origin.")));
const sec = (type, req, user = "", details = "") => run("INSERT INTO sec_logs(type,ip,user,details,created_at) VALUES(?,?,?,?,?)", type, req.ip || "", String(user), String(details).slice(0, 300), now());
const log = (actor, action, target, details = "") => run("INSERT INTO mod_logs(actor,action,target,details,created_at) VALUES(?,?,?,?,?)", actor, action, String(target), String(details).slice(0, 500), now());

/* ---------- sessions ---------- */
const cookieOf = (h) => Object.fromEntries(String(h || "").split(";").map((c) => c.trim().split("=")).filter((p) => p.length === 2));
const userFromToken = (tok) => tok && get("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?", tok, now());
app.use("/api", (req, res, next) => {
  const u = userFromToken(cookieOf(req.headers.cookie).bw_s);
  if (u) {
    if (u.status === "banned" && u.ban_until && u.ban_until < now()) { run("UPDATE users SET status='active', ban_until=0 WHERE id=?", u.id); u.status = "active"; }
    req.user = u;
    if (now() - u.last_seen > 60) run("UPDATE users SET last_seen=? WHERE id=?", now(), u.id);
  }
  next();
});
const auth = (req, res, next) => {
  if (!req.user) return err(res, 401, "Please sign in.");
  if (req.user.status !== "active") return err(res, 403, req.user.status === "banned" ? "Your account is banned." : "Your account is suspended.");
  next();
};
const mod = (req, res, next) => auth(req, res, () => (isMod(req.user) ? next() : (sec("forbidden", req, req.user.username, req.path), err(res, 403, "Moderators only."))));
const admin = (req, res, next) => auth(req, res, () => (req.user.role === "ADMIN" ? next() : (sec("forbidden", req, req.user.username, req.path), err(res, 403, "Admin only."))));
const canWrite = (req, res, next) => auth(req, res, () => (req.user.mute_until > now() ? err(res, 403, `You are muted until ${new Date(req.user.mute_until * 1000).toLocaleString("en-GB")}.`) : next()));
const startSession = (res, uid) => {
  const tok = crypto.randomBytes(32).toString("base64url");
  run("INSERT INTO sessions VALUES(?,?,?,?)", tok, uid, now(), now() + 30 * 86400);
  res.cookie("bw_s", tok, { httpOnly: true, sameSite: "lax", secure: PROD, maxAge: 30 * 86400000, path: "/" });
};

/* ---------- notifications ---------- */
const notify = (uid, type, text, link = "") => {
  const r = run("INSERT INTO notifications(user_id,type,text,link,created_at) VALUES(?,?,?,?,?)", uid, type, text, link, now());
  io.to(`u:${uid}`).emit("notif", { id: Number(r.lastInsertRowid), type, text, link, read: 0, created_at: now() });
};

/* ---------- automatic moderation ---------- */
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[@4]/g, "a").replace(/[3€]/g, "e").replace(/[1!|]/g, "i").replace(/0/g, "o").replace(/[5$]/g, "s").replace(/(.)\1{2,}/g, "$1$1");
let wordCache = null;
const words = () => (wordCache ??= all("SELECT * FROM bad_words WHERE active=1").map((w) => ({ ...w, re: new RegExp(`(^|[^a-z0-9])${norm(w.word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "[^a-z0-9]+")}($|[^a-z0-9])`) })));
const recent = new Map();
/** returns an error message when the text must be blocked (and applies the configured sanction) */
const moderate = (user, ...texts) => {
  const text = norm(texts.join(" \n "));
  const hit = words().find((w) => w.re.test(text));
  if (hit) {
    const rank = LEVELS.indexOf(hit.level);
    if (rank >= 0) { run("UPDATE users SET warnings=warnings+1 WHERE id=?", user.id); }
    if (hit.level === "mute") run("UPDATE users SET mute_until=? WHERE id=?", now() + 3600, user.id);
    if (hit.level === "tempban") run("UPDATE users SET status='banned', ban_until=? WHERE id=? AND role='USER'", now() + 86400, user.id);
    if (hit.level === "ban") run("UPDATE users SET status='banned', ban_until=0 WHERE id=? AND role='USER'", user.id);
    log(0, `automod:${hit.level}`, `@${user.username}`, `${hit.category}: "${hit.word}"`);
    if (hit.level !== "block") notify(user.id, "warning", { warning: "You received a warning for inappropriate language.", mute: "You were muted for 1 hour for inappropriate language.", tempban: "You were banned for 24 hours for inappropriate language.", ban: "Your account was banned for inappropriate language." }[hit.level] || "Moderation warning.");
    return "Your message contains inappropriate language.";
  }
  const k = user.id, t = Date.now(), r = (recent.get(k) || []).filter((x) => t - x.t < 60000);
  if (r.filter((x) => x.s === text).length >= 2 || r.filter((x) => t - x.t < 20000).length >= 8) { log(0, "automod:spam", `@${user.username}`, text.slice(0, 80)); return "Slow down — this looks like spam."; }
  r.push({ t, s: text }); recent.set(k, r);
  return null;
};

/* ---------- uploads (type + magic-byte validation, size limits, random names) ---------- */
const MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/webm": "webm" };
const upload = multer({ storage: multer.diskStorage({ destination: UP, filename: (req, f, cb) => cb(null, `${crypto.randomBytes(12).toString("hex")}.${MIME[f.mimetype] || "bin"}`) }),
  limits: { fileSize: 80 * 1024 * 1024, files: 2 }, fileFilter: (req, f, cb) => cb(null, !!MIME[f.mimetype]) });
const magicOk = (file) => { const b = Buffer.alloc(12), fd = fs.openSync(file.path, "r"); fs.readSync(fd, b, 0, 12, 0); fs.closeSync(fd); const h = b.toString("hex");
  return { jpg: h.startsWith("ffd8ff"), png: h.startsWith("89504e47"), gif: h.startsWith("47494638"), webp: b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP",
    mp4: b.toString("latin1", 4, 8) === "ftyp", webm: h.startsWith("1a45dfa3") }[MIME[file.mimetype]] === true; };
const takeFile = (file, kind, maxMb) => { if (!file) return ""; const isImg = file.mimetype.startsWith("image/");
  if ((kind === "image" && !isImg) || !magicOk(file) || file.size > maxMb * 1024 * 1024) { fs.unlink(file.path, () => {}); return null; } return `/uploads/${file.filename}`; };
app.use("/uploads", express.static(UP, { maxAge: "30d", setHeaders: (res) => res.set({ "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; media-src 'self'", "X-Content-Type-Options": "nosniff" }) }));

/* ================= AUTH ================= */
app.post("/api/auth/register", limit("auth", 12, 600), (req, res) => {
  const username = str(req.body.username, 20), email = str(req.body.email, 120).toLowerCase(), password = String(req.body.password || "");
  if (!/^[A-Za-z0-9_.]{3,20}$/.test(username)) return err(res, 400, "Username: 3–20 letters, numbers, _ or .");
  if (/^(admin|moderator|mod|bilal|bilalfadili|official|support|system)$/i.test(username)) return err(res, 400, "This username is reserved.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err(res, 400, "Enter a valid email.");
  if (password.length < 8 || password.length > 200) return err(res, 400, "Password must be at least 8 characters.");
  if (words().some((w) => w.re.test(norm(username)))) return err(res, 400, "Your message contains inappropriate language.");
  if (get("SELECT 1 x FROM users WHERE username=? OR email=?", username, email)) return err(res, 409, "Username or email already in use.");
  const r = run("INSERT INTO users(username,email,pass,created_at,last_seen) VALUES(?,?,?,?,?)", username, email, hashPass(password), now(), now());
  startSession(res, Number(r.lastInsertRowid));
  res.json({ ok: true });
});
app.post("/api/auth/login", limit("auth", 12, 600), (req, res) => {
  const id = str(req.body.username, 120), u = get("SELECT * FROM users WHERE username=? OR email=?", id, id.toLowerCase());
  if (!u || !checkPass(String(req.body.password || ""), u.pass)) { sec("login_failed", req, id); return err(res, 401, "Wrong username or password."); }
  if (u.status === "banned" && (!u.ban_until || u.ban_until > now())) return err(res, 403, u.ban_until ? `Banned until ${new Date(u.ban_until * 1000).toLocaleString("en-GB")}.` : "This account is permanently banned.");
  if (u.status === "suspended") return err(res, 403, "This account is suspended.");
  startSession(res, u.id); sec("login", req, u.username);
  res.json({ ok: true });
});
app.post("/api/auth/logout", (req, res) => { const t = cookieOf(req.headers.cookie).bw_s; if (t) run("DELETE FROM sessions WHERE token=?", t); res.clearCookie("bw_s", { path: "/" }); res.json({ ok: true }); });
app.get("/api/auth/me", (req, res) => {
  const u = req.user; if (!u) return res.json({ user: null });
  res.json({ user: { ...pub(u), email: u.email, status: u.status, mute_until: u.mute_until, warnings: u.warnings, unread: get("SELECT COUNT(*) n FROM notifications WHERE user_id=? AND read=0", u.id).n,
    unreadMsg: get("SELECT COUNT(*) n FROM messages WHERE to_id=? AND read=0 AND deleted=0", u.id).n } });
});
app.post("/api/auth/password", auth, limit("auth", 12, 600), (req, res) => {
  const np = String(req.body.newPassword || "");
  if (!checkPass(String(req.body.password || ""), req.user.pass)) return err(res, 400, "Current password is wrong.");
  if (np.length < 8) return err(res, 400, "Password must be at least 8 characters.");
  run("UPDATE users SET pass=? WHERE id=?", hashPass(np), req.user.id); run("DELETE FROM sessions WHERE user_id=? AND token!=?", req.user.id, cookieOf(req.headers.cookie).bw_s);
  res.json({ ok: true });
});

/* ================= USERS / PROFILES / FOLLOW ================= */
const userStats = (id) => ({
  posts: get("SELECT COUNT(*) n FROM posts WHERE user_id=? AND hidden=0", id).n, likes: get("SELECT COUNT(*) n FROM likes l JOIN posts p ON p.id=l.post_id WHERE p.user_id=?", id).n,
  tiktokViews: get("SELECT COALESCE(SUM(tiktok_views),0) n FROM posts WHERE user_id=? AND hidden=0", id).n, followers: get("SELECT COUNT(*) n FROM follows WHERE followee=?", id).n,
  following: get("SELECT COUNT(*) n FROM follows WHERE follower=?", id).n, best: get("SELECT id,title,tiktok_views FROM posts WHERE user_id=? AND hidden=0 AND tiktok_views>0 ORDER BY tiktok_views DESC LIMIT 1", id) || null,
});
const rankOf = (id) => { const v = get("SELECT COALESCE(SUM(tiktok_views),0) n FROM posts WHERE user_id=? AND hidden=0", id).n; if (!v) return 0;
  return get("SELECT COUNT(*) n FROM (SELECT user_id, SUM(tiktok_views) s FROM posts p JOIN users u ON u.id=p.user_id WHERE p.hidden=0 AND u.status='active' GROUP BY user_id HAVING s>?)", v).n + 1; };
app.get("/api/users/:name", (req, res) => {
  const u = get("SELECT * FROM users WHERE username=?", req.params.name); if (!u || (u.status !== "active" && !isMod(req.user))) return err(res, 404, "User not found.");
  const me = req.user?.id || 0;
  res.json({ user: { ...pub(u), status: isMod(req.user) ? u.status : undefined }, stats: userStats(u.id), rank: rankOf(u.id), online: online.has(u.id),
    following: !!get("SELECT 1 x FROM follows WHERE follower=? AND followee=?", me, u.id), blocked: !!get("SELECT 1 x FROM blocks WHERE blocker=? AND blocked=?", me, u.id) });
});
app.get("/api/users/:name/:list(followers|following)", (req, res) => {
  const u = get("SELECT id FROM users WHERE username=?", req.params.name); if (!u) return err(res, 404, "User not found.");
  const q = req.params.list === "followers" ? "SELECT u.* FROM follows f JOIN users u ON u.id=f.follower WHERE f.followee=? AND u.status='active' ORDER BY f.created_at DESC LIMIT 200"
    : "SELECT u.* FROM follows f JOIN users u ON u.id=f.followee WHERE f.follower=? AND u.status='active' ORDER BY f.created_at DESC LIMIT 200";
  res.json({ users: all(q, u.id).map(pub) });
});
app.post("/api/users/:name/follow", auth, limit("write", 90, 60), (req, res) => {
  const u = get("SELECT * FROM users WHERE username=?", req.params.name); if (!u || u.id === req.user.id) return err(res, 400, "Cannot follow this user.");
  const ex = get("SELECT 1 x FROM follows WHERE follower=? AND followee=?", req.user.id, u.id);
  if (ex) run("DELETE FROM follows WHERE follower=? AND followee=?", req.user.id, u.id);
  else { run("INSERT INTO follows VALUES(?,?,?)", req.user.id, u.id, now()); notify(u.id, "follow", `@${req.user.username} started following you.`, `#/u/${req.user.username}`); }
  res.json({ following: !ex, followers: get("SELECT COUNT(*) n FROM follows WHERE followee=?", u.id).n });
});
app.post("/api/users/:name/block", auth, (req, res) => {
  const u = get("SELECT * FROM users WHERE username=?", req.params.name); if (!u || u.id === req.user.id) return err(res, 400, "Cannot block this user.");
  const ex = get("SELECT 1 x FROM blocks WHERE blocker=? AND blocked=?", req.user.id, u.id);
  if (ex) run("DELETE FROM blocks WHERE blocker=? AND blocked=?", req.user.id, u.id); else { run("INSERT INTO blocks VALUES(?,?)", req.user.id, u.id); run("DELETE FROM follows WHERE (follower=? AND followee=?) OR (follower=? AND followee=?)", req.user.id, u.id, u.id, req.user.id); }
  res.json({ blocked: !ex });
});
app.post("/api/me/profile", canWrite, limit("write", 90, 60), upload.single("avatar"), (req, res) => {
  const username = str(req.body.username, 20) || req.user.username, bio = str(req.body.bio, 200);
  if (req.user.role !== "ADMIN" && username.toLowerCase() !== req.user.username.toLowerCase()) {
    if (!/^[A-Za-z0-9_.]{3,20}$/.test(username) || /^(admin|moderator|mod|bilal|bilalfadili|official|support|system)$/i.test(username)) return err(res, 400, "Invalid or reserved username.");
    if (get("SELECT 1 x FROM users WHERE username=? AND id!=?", username, req.user.id)) return err(res, 409, "Username already in use.");
  }
  const bad = moderate(req.user, username, bio); if (bad) return err(res, 400, bad);
  const av = takeFile(req.file, "image", 5); if (av === null) return err(res, 400, "Avatar must be a JPG, PNG, WebP or GIF image under 5 MB.");
  run("UPDATE users SET username=?, bio=?, avatar=? WHERE id=?", req.user.role === "ADMIN" ? req.user.username : username, bio, av || req.user.avatar, req.user.id);
  res.json({ ok: true, username: req.user.role === "ADMIN" ? req.user.username : username });
});

/* ================= POSTS ================= */
const POSTSEL = `SELECT p.*, u.username, u.avatar, u.role urole,
  (SELECT COUNT(*) FROM likes l WHERE l.post_id=p.id) lk, (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id) cm,
  (SELECT GROUP_CONCAT(tag,' ') FROM post_tags t WHERE t.post_id=p.id) tags,
  EXISTS(SELECT 1 FROM likes WHERE user_id=? AND post_id=p.id) liked, EXISTS(SELECT 1 FROM saves WHERE user_id=? AND post_id=p.id) saved,
  (SELECT status FROM stat_updates s WHERE s.post_id=p.id ORDER BY s.id DESC LIMIT 1) stat_status
  FROM posts p JOIN users u ON u.id=p.user_id`;
const TREND = "((SELECT COUNT(*) FROM likes l WHERE l.post_id=p.id)*3.0 + (SELECT COUNT(*) FROM comments c WHERE c.post_id=p.id)*2.0 + p.views*0.1 + p.tiktok_views*0.0005 + 1) / ((strftime('%s','now') - p.created_at)/3600.0 + 6)";
const shape = (p) => ({ id: p.id, type: p.type, title: p.title, description: p.description, media: p.media, mediaKind: p.media_kind, thumb: p.thumb, tiktokUrl: p.tiktok_url, originalUrl: p.original_url,
  momentCat: p.moment_cat, views: p.views, tiktokViews: p.tiktok_views, statStatus: p.stat_status || "", shares: p.shares, hidden: p.hidden, createdAt: p.created_at, likes: p.lk, comments: p.cm,
  tags: p.tags ? p.tags.split(" ") : [], liked: !!p.liked, saved: !!p.saved, user: { id: p.user_id, username: p.username, avatar: p.avatar, role: p.urole } });
const periodStart = (p) => ({ today: Math.floor(new Date().setUTCHours(0, 0, 0, 0) / 1000), week: now() - 7 * 86400, month: now() - 30 * 86400, year: now() - 365 * 86400 }[p] || 0);
const parseTags = (s) => [...new Set(String(s || "").split(/[\s,]+/).map((t) => t.replace(/^#/, "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 30)).filter((t) => t.length >= 2))].slice(0, 12);

app.get("/api/posts", (req, res) => {
  const me = req.user?.id || 0, q = req.query, page = Math.max(0, int(q.page)), size = 12, w = ["p.hidden=0", "u.status='active'"], a = [me, me];
  if (TYPES.includes(q.type)) { w.push("p.type=?"); a.push(q.type); }
  if (q.tag) { w.push("EXISTS(SELECT 1 FROM post_tags t WHERE t.post_id=p.id AND t.tag=?)"); a.push(str(q.tag, 30).replace(/^#/, "")); }
  if (q.user) { w.push("u.username=?"); a.push(str(q.user, 20)); }
  if (int(q.moment)) { w.push("p.moment_cat=?"); a.push(int(q.moment)); }
  if (q.moments === "1") w.push("p.moment_cat>0");
  if (q.q) { w.push("(p.title LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')"); const s = `%${str(q.q, 60).replace(/[\\%_]/g, "\\$&")}%`; a.push(s, s); }
  if (periodStart(q.period)) { w.push("p.created_at>=?"); a.push(periodStart(q.period)); }
  if (q.feed === "following") { if (!me) return res.json({ posts: [], more: false }); w.push("p.user_id IN (SELECT followee FROM follows WHERE follower=?)"); a.push(me); }
  if (q.feed === "saved") { if (!me) return res.json({ posts: [], more: false }); w.push("EXISTS(SELECT 1 FROM saves s WHERE s.user_id=? AND s.post_id=p.id)"); a.push(me); }
  if (q.feed === "liked") { if (!me) return res.json({ posts: [], more: false }); w.push("EXISTS(SELECT 1 FROM likes s WHERE s.user_id=? AND s.post_id=p.id)"); a.push(me); }
  if (me) { w.push("p.user_id NOT IN (SELECT blocked FROM blocks WHERE blocker=?)"); a.push(me); }
  if (q.sort === "tiktok") w.push("p.tiktok_views>0");
  if (q.feed === "foryou" && me) {
    // personalised: trending candidates re-scored with follows, followed hashtags and hashtags of liked posts
    const rows = all(`${POSTSEL} WHERE ${w.join(" AND ")} ORDER BY ${TREND} DESC LIMIT 240`, ...a);
    const fol = new Set(all("SELECT followee f FROM follows WHERE follower=?", me).map((r) => r.f));
    const tags = new Map(); all("SELECT tag FROM tag_follows WHERE user_id=?", me).forEach((r) => tags.set(r.tag.toLowerCase(), 3));
    all("SELECT t.tag, COUNT(*) n FROM likes l JOIN post_tags t ON t.post_id=l.post_id WHERE l.user_id=? GROUP BY t.tag", me).forEach((r) => tags.set(r.tag.toLowerCase(), (tags.get(r.tag.toLowerCase()) || 0) + Math.min(3, r.n)));
    const types = new Map(all("SELECT p.type t, COUNT(*) n FROM likes l JOIN posts p ON p.id=l.post_id WHERE l.user_id=? GROUP BY p.type", me).map((r) => [r.t, r.n]));
    const scored = rows.map((p, i) => { let s = 1 / (i + 4); if (fol.has(p.user_id)) s *= 2.2; (p.tags || "").split(" ").forEach((t) => { s *= 1 + (tags.get(t.toLowerCase()) || 0) * 0.25; }); s *= 1 + Math.min(5, types.get(p.type) || 0) * 0.08; if (p.liked) s *= 0.5; return [s, p]; })
      .sort((x, y) => y[0] - x[0]).map((x) => x[1]);
    return res.json({ posts: scored.slice(page * size, page * size + size).map(shape), more: scored.length > (page + 1) * size });
  }
  const order = { latest: "p.created_at DESC", liked: "lk DESC, p.created_at DESC", viewed: "p.views DESC, p.created_at DESC", tiktok: "p.tiktok_views DESC, p.created_at DESC" }[q.sort] || `${TREND} DESC`;
  const rows = all(`${POSTSEL} WHERE ${w.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`, ...a, size + 1, page * size);
  res.json({ posts: rows.slice(0, size).map(shape), more: rows.length > size });
});
const seen = new Map();
app.get("/api/posts/:id", (req, res) => {
  const me = req.user?.id || 0, p = get(`${POSTSEL} WHERE p.id=?`, me, me, int(req.params.id));
  if (!p || (p.hidden && !isMod(req.user) && p.user_id !== me)) return err(res, 404, "Post not found.");
  const k = `${req.ip}:${p.id}`; if (!seen.has(k) || Date.now() - seen.get(k) > 3600000) { seen.set(k, Date.now()); run("UPDATE posts SET views=views+1 WHERE id=?", p.id); p.views++; }
  res.json({ post: shape(p), history: p.user_id === me || isMod(req.user) ? all("SELECT old_value,new_value,status,created_at FROM stat_updates WHERE post_id=? ORDER BY id DESC LIMIT 10", p.id) : [] });
});

/* TikTok views go through an audit trail; large jumps wait for a moderator (anti-fraud). */
const autoMax = () => int(setting("auto_max", "50000"), 50000);
const submitViews = (post, user, value) => {
  const old = post.tiktok_views, nv = Math.max(0, Math.min(int(value), 5_000_000_000));
  if (nv === old) return { status: "unchanged" };
  if (get("SELECT 1 x FROM stat_updates WHERE post_id=? AND status='pending'", post.id)) return { error: "An update is already pending verification for this post." };
  if (get("SELECT COUNT(*) n FROM stat_updates WHERE post_id=? AND created_at>?", post.id, now() - 86400).n >= 4) return { error: "Too many updates today for this post. Try again tomorrow." };
  const ok = nv < old || (nv <= autoMax() && nv - old <= 5000 + old * 0.5);
  run("INSERT INTO stat_updates(post_id,user_id,old_value,new_value,status,auto,created_at,reviewed_at) VALUES(?,?,?,?,?,?,?,?)", post.id, user.id, old, nv, ok ? "approved" : "pending", ok ? 1 : 0, now(), ok ? now() : 0);
  if (ok) { run("UPDATE posts SET tiktok_views=? WHERE id=?", nv, post.id); rankCheck(user.id); }
  else io.to("mods").emit("modqueue");
  return { status: ok ? "approved" : "pending" };
};
const rankCheck = (uid) => { const r = rankOf(uid), u = get("SELECT best_rank FROM users WHERE id=?", uid); if (!r || !u) return;
  if (!u.best_rank || r < u.best_rank) { run("UPDATE users SET best_rank=? WHERE id=?", r, uid); if (r <= 10) notify(uid, "rank", `You reached #${r} on the leaderboard!`, "#/leaderboard"); } };
const tiktokThumb = async (u) => { // official public oEmbed endpoint (thumbnail only — it exposes no statistics)
  try { const c = new AbortController(), t = setTimeout(() => c.abort(), 4000); const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}`, { signal: c.signal }); clearTimeout(t);
    if (!r.ok) return ""; const j = await r.json(); return url(j.thumbnail_url) || ""; } catch { return ""; } };

app.post("/api/posts", canWrite, limit("post", 12, 600), upload.fields([{ name: "media", maxCount: 1 }, { name: "thumb", maxCount: 1 }]), async (req, res) => {
  const b = req.body, type = str(b.type, 10), title = str(b.title, 100), description = str(b.description, 2000), f = req.files?.media?.[0], th = req.files?.thumb?.[0];
  const drop = () => [f, th].forEach((x) => x && fs.unlink(x.path, () => {}));
  if (!TYPES.includes(type)) { drop(); return err(res, 400, "Choose a post type."); }
  if (title.length < 3) { drop(); return err(res, 400, "Add a title (3 characters minimum)."); }
  const tags = parseTags(b.hashtags).filter((t) => !get("SELECT 1 x FROM banned_tags WHERE tag=?", t));
  const bad = moderate(req.user, title, description, tags.join(" ")); if (bad) { drop(); return err(res, 400, bad); }
  const tiktok = b.tiktokUrl ? url(b.tiktokUrl, ["tiktok.com"]) : "", original = b.originalUrl ? url(b.originalUrl) : "";
  if (b.tiktokUrl && !tiktok) { drop(); return err(res, 400, "Enter a valid tiktok.com link."); }
  if (b.originalUrl && !original) { drop(); return err(res, 400, "Enter a valid link to the original content."); }
  if (type === "tiktok" && !tiktok) { drop(); return err(res, 400, "A TikTok post needs its TikTok URL."); }
  if (tiktok && get("SELECT 1 x FROM posts WHERE tiktok_url=?", tiktok)) { drop(); return err(res, 409, "This TikTok was already posted."); }
  const isVid = f && f.mimetype.startsWith("video/"), media = takeFile(f, "any", isVid ? 80 : 10), thumb = takeFile(th, "image", 5);
  if (media === null || thumb === null) { drop(); return err(res, 400, "Unsupported or oversized file (images ≤ 10 MB, MP4/WebM videos ≤ 80 MB)."); }
  if (!media && !tiktok && !original) return err(res, 400, "Add a video, an image or a link.");
  const mc = get("SELECT id FROM moment_cats WHERE id=?", int(b.momentCat))?.id || 0;
  const r = run("INSERT INTO posts(user_id,type,title,description,media,media_kind,thumb,tiktok_url,original_url,moment_cat,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)", req.user.id, type, title, description, media,
    media ? (isVid ? "video" : "image") : "", thumb || (tiktok ? await tiktokThumb(tiktok) : ""), tiktok, original, mc, now());
  const id = Number(r.lastInsertRowid); tags.forEach((t) => run("INSERT OR IGNORE INTO post_tags VALUES(?,?)", id, t));
  let stat = null; if (tiktok && int(b.tiktokViews) > 0) stat = submitViews({ id, tiktok_views: 0 }, req.user, b.tiktokViews);
  res.json({ id, stat });
});
app.post("/api/posts/:id/views", canWrite, limit("write", 90, 60), (req, res) => {
  const p = get("SELECT * FROM posts WHERE id=?", int(req.params.id)); if (!p || p.user_id !== req.user.id) return err(res, 403, "Only the creator can update these statistics.");
  if (!p.tiktok_url) return err(res, 400, "This post has no TikTok link.");
  const r = submitViews(p, req.user, req.body.views); if (r.error) return err(res, 400, r.error); res.json(r);
});
app.delete("/api/posts/:id", auth, (req, res) => {
  const p = get("SELECT * FROM posts WHERE id=?", int(req.params.id)); if (!p) return err(res, 404, "Post not found.");
  if (p.user_id !== req.user.id && !isMod(req.user)) return err(res, 403, "Not allowed.");
  run("DELETE FROM posts WHERE id=?", p.id); [p.media, p.thumb].forEach((m) => m.startsWith("/uploads/") && fs.unlink(path.join(UP, path.basename(m)), () => {}));
  if (p.user_id !== req.user.id) { log(req.user.id, "delete_post", `post#${p.id}`, p.title); notify(p.user_id, "removed", `Your post “${p.title}” was removed by moderation.`); }
  res.json({ ok: true });
});
const toggle = (table) => (req, res) => {
  const p = get("SELECT * FROM posts WHERE id=? AND hidden=0", int(req.params.id)); if (!p) return err(res, 404, "Post not found.");
  const ex = get(`SELECT 1 x FROM ${table} WHERE user_id=? AND post_id=?`, req.user.id, p.id);
  if (ex) run(`DELETE FROM ${table} WHERE user_id=? AND post_id=?`, req.user.id, p.id);
  else { run(`INSERT INTO ${table} VALUES(?,?,?)`, req.user.id, p.id, now()); if (table === "likes" && p.user_id !== req.user.id) notify(p.user_id, "like", `@${req.user.username} liked your ${p.type}.`, `#/post/${p.id}`); }
  res.json({ on: !ex, count: get(`SELECT COUNT(*) n FROM ${table} WHERE post_id=?`, p.id).n });
};
app.post("/api/posts/:id/like", auth, limit("write", 90, 60), toggle("likes"));
app.post("/api/posts/:id/save", auth, limit("write", 90, 60), toggle("saves"));
app.post("/api/posts/:id/share", limit("write", 90, 60), (req, res) => { run("UPDATE posts SET shares=shares+1 WHERE id=?", int(req.params.id)); res.json({ ok: true }); });

/* ================= COMMENTS ================= */
app.get("/api/posts/:id/comments", (req, res) => {
  const me = req.user?.id || 0;
  const rows = all(`SELECT c.*, u.username, u.avatar, u.role urole, (SELECT COUNT(*) FROM comment_likes l WHERE l.comment_id=c.id) lk, EXISTS(SELECT 1 FROM comment_likes WHERE user_id=? AND comment_id=c.id) liked
    FROM comments c JOIN users u ON u.id=c.user_id WHERE c.post_id=? ORDER BY ${req.query.sort === "new" ? "c.created_at DESC" : "lk DESC, c.created_at DESC"} LIMIT 300`, me, int(req.params.id));
  res.json({ comments: rows.map((c) => ({ id: c.id, parentId: c.parent_id, body: c.body, createdAt: c.created_at, likes: c.lk, liked: !!c.liked, user: { id: c.user_id, username: c.username, avatar: c.avatar, role: c.urole } })) });
});
app.post("/api/posts/:id/comments", canWrite, limit("write", 90, 60), (req, res) => {
  const p = get("SELECT * FROM posts WHERE id=? AND hidden=0", int(req.params.id)); if (!p) return err(res, 404, "Post not found.");
  const body = str(req.body.body, 600); if (!body) return err(res, 400, "Write something first.");
  const bad = moderate(req.user, body); if (bad) return err(res, 400, bad);
  const parent = get("SELECT * FROM comments WHERE id=? AND post_id=?", int(req.body.parentId), p.id);
  const r = run("INSERT INTO comments(post_id,user_id,parent_id,body,created_at) VALUES(?,?,?,?,?)", p.id, req.user.id, parent ? parent.parent_id || parent.id : 0, body, now());
  if (parent && parent.user_id !== req.user.id) notify(parent.user_id, "reply", `@${req.user.username} replied to your comment.`, `#/post/${p.id}`);
  else if (!parent && p.user_id !== req.user.id) notify(p.user_id, "comment", `@${req.user.username} commented on your ${p.type}.`, `#/post/${p.id}`);
  res.json({ id: Number(r.lastInsertRowid) });
});
app.post("/api/comments/:id/like", auth, limit("write", 90, 60), (req, res) => {
  const c = get("SELECT * FROM comments WHERE id=?", int(req.params.id)); if (!c) return err(res, 404, "Comment not found.");
  const ex = get("SELECT 1 x FROM comment_likes WHERE user_id=? AND comment_id=?", req.user.id, c.id);
  if (ex) run("DELETE FROM comment_likes WHERE user_id=? AND comment_id=?", req.user.id, c.id); else run("INSERT INTO comment_likes VALUES(?,?)", req.user.id, c.id);
  res.json({ on: !ex, count: get("SELECT COUNT(*) n FROM comment_likes WHERE comment_id=?", c.id).n });
});
app.delete("/api/comments/:id", auth, (req, res) => {
  const c = get("SELECT * FROM comments WHERE id=?", int(req.params.id)); if (!c) return err(res, 404, "Comment not found.");
  if (c.user_id !== req.user.id && !isMod(req.user)) return err(res, 403, "Not allowed.");
  run("DELETE FROM comments WHERE id=? OR parent_id=?", c.id, c.id);
  if (c.user_id !== req.user.id) { log(req.user.id, "delete_comment", `comment#${c.id}`, c.body.slice(0, 120)); notify(c.user_id, "removed", "One of your comments was removed by moderation."); }
  res.json({ ok: true });
});

/* ================= HASHTAGS / SEARCH / MOMENTS ================= */
app.get("/api/hashtags", (req, res) => {
  const base = "FROM post_tags t JOIN posts p ON p.id=t.post_id WHERE p.hidden=0 AND t.tag NOT IN (SELECT tag FROM banned_tags)";
  res.json({ popular: all(`SELECT t.tag, COUNT(*) n ${base} GROUP BY t.tag ORDER BY n DESC LIMIT 40`),
    trending: all(`SELECT t.tag, COUNT(*) n ${base} AND p.created_at>? GROUP BY t.tag ORDER BY n DESC LIMIT 12`, now() - 7 * 86400),
    recent: all(`SELECT t.tag, MAX(p.created_at) at, COUNT(*) n ${base} GROUP BY t.tag ORDER BY at DESC LIMIT 12`),
    followed: req.user ? all("SELECT tag FROM tag_follows WHERE user_id=?", req.user.id).map((r) => r.tag) : [],
    main: ["BilalEdit", "BilalFadili", "BilalFadiliEdit", "Bilal", "BilalClips", "BilalMoments", "BilalLive", "BilalWorld"] });
});
app.post("/api/hashtags/:tag/follow", auth, (req, res) => {
  const tag = parseTags(req.params.tag)[0]; if (!tag) return err(res, 400, "Invalid hashtag.");
  const ex = get("SELECT 1 x FROM tag_follows WHERE user_id=? AND tag=?", req.user.id, tag);
  if (ex) run("DELETE FROM tag_follows WHERE user_id=? AND tag=?", req.user.id, tag); else run("INSERT INTO tag_follows VALUES(?,?)", req.user.id, tag);
  res.json({ on: !ex });
});
app.get("/api/search", limit("search", 60, 60), (req, res) => {
  const s = str(req.query.q, 60).replace(/^[#@]/, ""); if (s.length < 2) return res.json({ users: [], posts: [], hashtags: [] });
  const like = `%${s.replace(/[\\%_]/g, "\\$&")}%`, me = req.user?.id || 0;
  res.json({ users: all("SELECT * FROM users WHERE status='active' AND username LIKE ? ESCAPE '\\' ORDER BY (username=?) DESC, last_seen DESC LIMIT 12", like, s).map(pub),
    posts: all(`${POSTSEL} WHERE p.hidden=0 AND u.status='active' AND (p.title LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\' OR EXISTS(SELECT 1 FROM post_tags t WHERE t.post_id=p.id AND t.tag LIKE ? ESCAPE '\\')) ORDER BY ${TREND} DESC LIMIT 24`, me, me, like, like, like).map(shape),
    hashtags: all("SELECT t.tag, COUNT(*) n FROM post_tags t JOIN posts p ON p.id=t.post_id WHERE p.hidden=0 AND t.tag LIKE ? ESCAPE '\\' GROUP BY t.tag ORDER BY n DESC LIMIT 12", like) });
});
app.get("/api/meta", (req, res) => res.json({ types: TYPES, reasons: REASONS, moments: all("SELECT * FROM moment_cats ORDER BY pos, id"), hero: setting("hero_image"), autoMax: autoMax(),
  counts: { users: get("SELECT COUNT(*) n FROM users WHERE status='active'").n, posts: get("SELECT COUNT(*) n FROM posts WHERE hidden=0").n, views: get("SELECT COALESCE(SUM(tiktok_views),0) n FROM posts WHERE hidden=0").n } }));

/* ================= LEADERBOARDS ================= */
const leaderboard = (type, period) => {
  const st = periodStart(period), U = "u.id, u.username, u.avatar, u.role";
  const views = st ? `(SELECT COALESCE(SUM(s.new_value-s.old_value),0) FROM stat_updates s JOIN posts p ON p.id=s.post_id WHERE p.user_id=u.id AND p.hidden=0 AND s.status='approved' AND s.reviewed_at>=${st})`
    : "(SELECT COALESCE(SUM(tiktok_views),0) FROM posts p WHERE p.user_id=u.id AND p.hidden=0)";
  const likes = `(SELECT COUNT(*) FROM likes l JOIN posts p ON p.id=l.post_id WHERE p.user_id=u.id AND p.hidden=0 AND l.created_at>=${st})`;
  const posts = `(SELECT COUNT(*) FROM posts p WHERE p.user_id=u.id AND p.hidden=0 AND p.created_at>=${st})`;
  const fol = `(SELECT COUNT(*) FROM follows f WHERE f.followee=u.id AND f.created_at>=${st})`;
  if (type === "best") return all(`SELECT p.id, p.title, p.thumb, p.media, p.media_kind, p.tiktok_url, p.created_at, u.username, u.avatar,
    ${st ? `(SELECT COALESCE(SUM(s.new_value-s.old_value),0) FROM stat_updates s WHERE s.post_id=p.id AND s.status='approved' AND s.reviewed_at>=${st})` : "p.tiktok_views"} score,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id=p.id) likes FROM posts p JOIN users u ON u.id=p.user_id WHERE p.hidden=0 AND u.status='active' AND p.tiktok_url!='' AND score>0 ORDER BY score DESC LIMIT 50`);
  const rs = type === "rising" ? (st || now() - 7 * 86400) : 0;
  const expr = { views, popular: likes, active: posts, community: `(${views}/1000.0 + ${likes}*2 + ${posts}*5 + ${fol}*3)`,
    rising: `((SELECT COALESCE(SUM(s.new_value-s.old_value),0) FROM stat_updates s JOIN posts p ON p.id=s.post_id WHERE p.user_id=u.id AND s.status='approved' AND s.reviewed_at>=${rs})/1000.0
      + (SELECT COUNT(*) FROM likes l JOIN posts p ON p.id=l.post_id WHERE p.user_id=u.id AND l.created_at>=${rs})*2 + (SELECT COUNT(*) FROM follows f WHERE f.followee=u.id AND f.created_at>=${rs})*3)` }[type] || views;
  return all(`SELECT ${U}, ${expr} score, ${views} views, ${likes} likes, ${posts} posts, (SELECT COUNT(*) FROM follows f WHERE f.followee=u.id) followers FROM users u WHERE u.status='active' AND score>0 ORDER BY score DESC, u.id LIMIT 50`);
};
app.get("/api/leaderboard", (req, res) => res.json({ rows: leaderboard(str(req.query.type, 12) || "views", str(req.query.period, 8)) }));

/* ================= NOTIFICATIONS ================= */
app.get("/api/notifications", auth, (req, res) => res.json({ items: all("SELECT id,type,text,link,read,created_at FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 60", req.user.id) }));
app.post("/api/notifications/read", auth, (req, res) => { run("UPDATE notifications SET read=1 WHERE user_id=?", req.user.id); res.json({ ok: true }); });

/* ================= REPORTS ================= */
app.post("/api/reports", auth, limit("report", 15, 600), (req, res) => {
  const type = str(req.body.targetType, 10), id = int(req.body.targetId), reason = str(req.body.reason, 40);
  if (!["post", "comment", "user", "message"].includes(type) || !REASONS.includes(reason)) return err(res, 400, "Invalid report.");
  const table = { post: "posts", comment: "comments", user: "users", message: "messages" }[type];
  const t = get(`SELECT * FROM ${table} WHERE id=?`, id); if (!t) return err(res, 404, "Content not found.");
  if (type === "message" && t.to_id !== req.user.id) return err(res, 403, "Not allowed.");
  if (get("SELECT 1 x FROM reports WHERE reporter=? AND target_type=? AND target_id=? AND status='open'", req.user.id, type, id)) return res.json({ ok: true });
  run("INSERT INTO reports(reporter,target_type,target_id,reason,details,created_at) VALUES(?,?,?,?,?,?)", req.user.id, type, id, reason, str(req.body.details, 400), now());
  io.to("mods").emit("modqueue"); res.json({ ok: true });
});

/* ================= PRIVATE MESSAGES ================= */
const blockedBetween = (a, b) => !!get("SELECT 1 x FROM blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)", a, b, b, a);
const msgShape = (m) => ({ id: m.id, from: m.from_id, to: m.to_id, body: m.deleted ? "" : m.body, image: m.deleted ? "" : m.image, gif: m.deleted ? "" : m.gif, postId: m.deleted ? 0 : m.post_id, deleted: !!m.deleted, read: !!m.read, createdAt: m.created_at });
app.get("/api/messages", auth, (req, res) => {
  const me = req.user.id;
  const rows = all(`SELECT m.*, u.username, u.avatar, u.id uid, (SELECT COUNT(*) FROM messages x WHERE x.from_id=u.id AND x.to_id=? AND x.read=0 AND x.deleted=0) unread
    FROM messages m JOIN users u ON u.id = CASE WHEN m.from_id=? THEN m.to_id ELSE m.from_id END
    WHERE m.id IN (SELECT MAX(id) FROM messages WHERE from_id=? OR to_id=? GROUP BY CASE WHEN from_id=? THEN to_id ELSE from_id END) ORDER BY m.id DESC LIMIT 100`, me, me, me, me, me);
  res.json({ conversations: rows.map((r) => ({ user: { id: r.uid, username: r.username, avatar: r.avatar }, last: msgShape(r), unread: r.unread, online: online.has(r.uid) })) });
});
app.get("/api/messages/:name", auth, (req, res) => {
  const u = get("SELECT * FROM users WHERE username=?", req.params.name); if (!u) return err(res, 404, "User not found.");
  run("UPDATE messages SET read=1 WHERE from_id=? AND to_id=?", u.id, req.user.id);
  const rows = all("SELECT * FROM messages WHERE (from_id=? AND to_id=?) OR (from_id=? AND to_id=?) ORDER BY id DESC LIMIT 200", req.user.id, u.id, u.id, req.user.id).reverse();
  const pids = [...new Set(rows.map((m) => m.post_id).filter(Boolean))], posts = {};
  pids.forEach((id) => { const p = get("SELECT id,title,thumb,media,media_kind,type FROM posts WHERE id=? AND hidden=0", id); if (p) posts[id] = p; });
  res.json({ user: pub(u), online: online.has(u.id), blocked: !!get("SELECT 1 x FROM blocks WHERE blocker=? AND blocked=?", req.user.id, u.id), messages: rows.map(msgShape), posts });
});
app.post("/api/messages/:name", canWrite, limit("msg", 120, 60), upload.single("image"), (req, res) => {
  const u = get("SELECT * FROM users WHERE username=? AND status='active'", req.params.name);
  const drop = () => req.file && fs.unlink(req.file.path, () => {});
  if (!u || u.id === req.user.id) { drop(); return err(res, 400, "Cannot message this user."); }
  if (blockedBetween(req.user.id, u.id)) { drop(); return err(res, 403, "You cannot message this user."); }
  const body = str(req.body.body, 1500), gif = req.body.gif ? url(req.body.gif) : "", postId = get("SELECT id FROM posts WHERE id=? AND hidden=0", int(req.body.postId))?.id || 0;
  const image = takeFile(req.file, "image", 8); if (image === null) return err(res, 400, "Images only (JPG, PNG, WebP, GIF ≤ 8 MB).");
  if (!body && !gif && !image && !postId) return err(res, 400, "Empty message.");
  if (body) { const bad = moderate(req.user, body); if (bad) { drop(); return err(res, 400, bad); } }
  const r = run("INSERT INTO messages(from_id,to_id,body,image,gif,post_id,created_at) VALUES(?,?,?,?,?,?,?)", req.user.id, u.id, body, image, gif, postId, now());
  const m = msgShape(get("SELECT * FROM messages WHERE id=?", Number(r.lastInsertRowid)));
  const post = postId ? get("SELECT id,title,thumb,media,media_kind,type FROM posts WHERE id=?", postId) : null;
  io.to(`u:${u.id}`).emit("dm", { message: m, from: pub(req.user), post }); io.to(`u:${req.user.id}`).emit("dm", { message: m, from: pub(req.user), post, echo: u.username });
  res.json({ message: m, post });
});
app.delete("/api/messages/item/:id", auth, (req, res) => {
  const m = get("SELECT * FROM messages WHERE id=?", int(req.params.id)); if (!m || m.from_id !== req.user.id) return err(res, 403, "Not allowed.");
  run("UPDATE messages SET deleted=1 WHERE id=?", m.id); if (m.image) fs.unlink(path.join(UP, path.basename(m.image)), () => {});
  [m.from_id, m.to_id].forEach((id) => io.to(`u:${id}`).emit("dm:deleted", { id: m.id })); res.json({ ok: true });
});

/* ================= MODERATION (moderators + admin) ================= */
const targetUser = (req, res) => { const u = get("SELECT * FROM users WHERE id=?", int(req.params.id));
  if (!u) { err(res, 404, "User not found."); return null; }
  if (u.role === "ADMIN" || (u.role === "MODERATOR" && req.user.role !== "ADMIN") || u.id === req.user.id) { err(res, 403, "You cannot moderate this account."); return null; } return u; };
const kick = (uid) => { run("DELETE FROM sessions WHERE user_id=?", uid); io.to(`u:${uid}`).emit("session:end"); io.in(`u:${uid}`).disconnectSockets(true); };
app.get("/api/mod/queue", mod, (req, res) => {
  const reports = all("SELECT r.*, u.username reporter_name FROM reports r JOIN users u ON u.id=r.reporter WHERE r.status='open' ORDER BY r.id DESC LIMIT 100").map((r) => {
    let target = null;
    if (r.target_type === "post") { const p = get("SELECT p.id,p.title,p.type,p.user_id,u.username FROM posts p JOIN users u ON u.id=p.user_id WHERE p.id=?", r.target_id); if (p) target = { label: `${p.type}: ${p.title}`, link: `#/post/${p.id}`, userId: p.user_id, username: p.username }; }
    if (r.target_type === "comment") { const c = get("SELECT c.id,c.body,c.post_id,c.user_id,u.username FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?", r.target_id); if (c) target = { label: c.body.slice(0, 160), link: `#/post/${c.post_id}`, userId: c.user_id, username: c.username }; }
    if (r.target_type === "user") { const u = get("SELECT id,username FROM users WHERE id=?", r.target_id); if (u) target = { label: `@${u.username}`, link: `#/u/${u.username}`, userId: u.id, username: u.username }; }
    if (r.target_type === "message") { const m = get("SELECT m.id,m.body,m.from_id,u.username FROM messages m JOIN users u ON u.id=m.from_id WHERE m.id=?", r.target_id); if (m) target = { label: m.body.slice(0, 160) || "(media)", link: "", userId: m.from_id, username: m.username }; }
    return { id: r.id, type: r.target_type, targetId: r.target_id, reason: r.reason, details: r.details, reporter: r.reporter_name, createdAt: r.created_at, target };
  });
  const stats = all(`SELECT s.*, p.title, p.tiktok_url, u.username FROM stat_updates s JOIN posts p ON p.id=s.post_id JOIN users u ON u.id=s.user_id WHERE s.status='pending' ORDER BY s.id LIMIT 100`);
  res.json({ reports, stats });
});
app.post("/api/mod/reports/:id", mod, (req, res) => {
  const r = get("SELECT * FROM reports WHERE id=? AND status='open'", int(req.params.id)); if (!r) return err(res, 404, "Report not found.");
  const action = str(req.body.action, 12); let uid = 0, done = action;
  const table = { post: "posts", comment: "comments", message: "messages" }[r.target_type];
  const t = table ? get(`SELECT * FROM ${table} WHERE id=?`, r.target_id) : null; uid = r.target_type === "user" ? r.target_id : t?.user_id ?? t?.from_id ?? 0;
  const tu = uid ? get("SELECT * FROM users WHERE id=?", uid) : null;
  const protectedUser = tu && (tu.role === "ADMIN" || (tu.role === "MODERATOR" && req.user.role !== "ADMIN"));
  if (action === "delete") { if (r.target_type === "post" && t) run("DELETE FROM posts WHERE id=?", t.id); else if (r.target_type === "comment" && t) run("DELETE FROM comments WHERE id=? OR parent_id=?", t.id, t.id); else if (r.target_type === "message" && t) run("UPDATE messages SET deleted=1 WHERE id=?", t.id);
    else return err(res, 400, "Nothing to delete."); if (tu) notify(tu.id, "removed", "Your content was removed after a report."); }
  else if (action === "hide" && r.target_type === "post" && t) run("UPDATE posts SET hidden=1 WHERE id=?", t.id);
  else if (["warn", "mute", "ban"].includes(action)) { if (!tu || protectedUser) return err(res, 403, "You cannot moderate this account.");
    if (action === "warn") { run("UPDATE users SET warnings=warnings+1 WHERE id=?", tu.id); notify(tu.id, "warning", `Moderation warning: ${r.reason}.`); }
    if (action === "mute") { const h = Math.min(int(req.body.hours, 24), 720); run("UPDATE users SET mute_until=? WHERE id=?", now() + h * 3600, tu.id); notify(tu.id, "warning", `You were muted for ${h}h: ${r.reason}.`); }
    if (action === "ban") { const d = Math.min(int(req.body.days, 7), 365), perm = req.body.permanent && req.user.role === "ADMIN"; run("UPDATE users SET status='banned', ban_until=? WHERE id=?", perm ? 0 : now() + d * 86400, tu.id); kick(tu.id); done = perm ? "ban_permanent" : `ban_${d}d`; } }
  else if (action !== "dismiss") return err(res, 400, "Unknown action.");
  run("UPDATE reports SET status='resolved', resolution=?, handled_by=? WHERE id=?", done, req.user.id, r.id);
  if (action !== "dismiss") run("UPDATE reports SET status='resolved', resolution=?, handled_by=? WHERE target_type=? AND target_id=? AND status='open'", done, req.user.id, r.target_type, r.target_id);
  log(req.user.id, `report:${done}`, `${r.target_type}#${r.target_id}`, `${r.reason}${tu ? ` → @${tu.username}` : ""}`); res.json({ ok: true });
});
app.post("/api/mod/stats/:id", mod, (req, res) => {
  const s = get("SELECT * FROM stat_updates WHERE id=? AND status='pending'", int(req.params.id)); if (!s) return err(res, 404, "Update not found.");
  if (s.user_id === req.user.id) return err(res, 403, "You cannot verify your own statistics.");
  const ok = req.body.action === "approve"; run("UPDATE stat_updates SET status=?, reviewed_by=?, reviewed_at=? WHERE id=?", ok ? "approved" : "rejected", req.user.id, now(), s.id);
  if (ok) { run("UPDATE posts SET tiktok_views=? WHERE id=?", s.new_value, s.post_id); rankCheck(s.user_id); }
  notify(s.user_id, "stats", ok ? "Your TikTok statistics were approved." : "Your TikTok statistics were rejected.", `#/post/${s.post_id}`);
  log(req.user.id, ok ? "stats:approve" : "stats:reject", `post#${s.post_id}`, `${s.old_value} → ${s.new_value}`); res.json({ ok: true });
});
app.post("/api/mod/posts/:id/hide", mod, (req, res) => { const p = get("SELECT * FROM posts WHERE id=?", int(req.params.id)); if (!p) return err(res, 404, "Post not found.");
  run("UPDATE posts SET hidden=? WHERE id=?", p.hidden ? 0 : 1, p.id); log(req.user.id, p.hidden ? "unhide_post" : "hide_post", `post#${p.id}`, p.title); if (!p.hidden) notify(p.user_id, "removed", `Your post “${p.title}” was hidden by moderation.`); res.json({ hidden: !p.hidden }); });
app.get("/api/mod/users", mod, (req, res) => {
  const s = `%${str(req.query.q, 40).replace(/[\\%_]/g, "\\$&")}%`, f = str(req.query.filter, 12);
  const w = f === "banned" ? "AND status!='active'" : f === "mods" ? "AND role!='USER'" : "";
  const rows = all(`SELECT * FROM users WHERE username LIKE ? ESCAPE '\\' ${w} ORDER BY id DESC LIMIT 100`, s);
  res.json({ users: rows.map((u) => ({ ...pub(u), status: u.status, banUntil: u.ban_until, muteUntil: u.mute_until, warnings: u.warnings, lastSeen: u.last_seen, email: req.user.role === "ADMIN" ? u.email : undefined, posts: get("SELECT COUNT(*) n FROM posts WHERE user_id=?", u.id).n })) });
});
app.post("/api/mod/users/:id/:action(warn|mute|unmute|tempban)", mod, (req, res) => {
  const u = targetUser(req, res); if (!u) return; const a = req.params.action, why = str(req.body.reason, 200);
  if (a === "warn") { run("UPDATE users SET warnings=warnings+1 WHERE id=?", u.id); notify(u.id, "warning", `Moderation warning${why ? `: ${why}` : "."}`); }
  if (a === "mute") { const h = Math.max(1, Math.min(int(req.body.hours, 24), 720)); run("UPDATE users SET mute_until=? WHERE id=?", now() + h * 3600, u.id); notify(u.id, "warning", `You were muted for ${h}h${why ? `: ${why}` : "."}`); }
  if (a === "unmute") run("UPDATE users SET mute_until=0 WHERE id=?", u.id);
  if (a === "tempban") { const d = Math.max(1, Math.min(int(req.body.days, 3), 30)); run("UPDATE users SET status='banned', ban_until=? WHERE id=?", now() + d * 86400, u.id); kick(u.id); }
  log(req.user.id, a, `@${u.username}`, why); res.json({ ok: true });
});
app.get("/api/mod/logs", mod, (req, res) => res.json({ logs: all("SELECT l.*, COALESCE(u.username,'AutoMod') actor_name FROM mod_logs l LEFT JOIN users u ON u.id=l.actor ORDER BY l.id DESC LIMIT 200") }));

/* ================= ADMIN ONLY ================= */
app.post("/api/admin/users/:id/:action(ban|suspend|reactivate|delete|promote|demote)", admin, (req, res) => {
  const u = targetUser(req, res); if (!u) return; const a = req.params.action;
  if (a === "ban") { run("UPDATE users SET status='banned', ban_until=0 WHERE id=?", u.id); kick(u.id); }
  if (a === "suspend") { run("UPDATE users SET status='suspended' WHERE id=?", u.id); kick(u.id); }
  if (a === "reactivate") run("UPDATE users SET status='active', ban_until=0, mute_until=0 WHERE id=?", u.id);
  if (a === "promote") { run("UPDATE users SET role='MODERATOR' WHERE id=? AND role='USER'", u.id); notify(u.id, "role", "You are now a moderator of Bilal's World."); io.in(`u:${u.id}`).socketsJoin("mods"); }
  if (a === "demote") { run("UPDATE users SET role='USER' WHERE id=? AND role='MODERATOR'", u.id); io.in(`u:${u.id}`).socketsLeave("mods"); }
  if (a === "delete") { kick(u.id); run("DELETE FROM reports WHERE reporter=? OR (target_type='user' AND target_id=?)", u.id, u.id); run("DELETE FROM users WHERE id=?", u.id); }
  log(req.user.id, `admin:${a}`, `@${u.username}`, str(req.body.reason, 200)); res.json({ ok: true });
});
app.get("/api/admin/overview", admin, (req, res) => {
  const n = (sql, ...p) => get(sql, ...p).n, days = [];
  for (let i = 13; i >= 0; i--) { const a = Math.floor(new Date().setUTCHours(0, 0, 0, 0) / 1000) - i * 86400, b = a + 86400;
    days.push({ day: new Date(a * 1000).toISOString().slice(5, 10), users: n("SELECT COUNT(*) n FROM users WHERE created_at>=? AND created_at<?", a, b), posts: n("SELECT COUNT(*) n FROM posts WHERE created_at>=? AND created_at<?", a, b),
      likes: n("SELECT COUNT(*) n FROM likes WHERE created_at>=? AND created_at<?", a, b) }); }
  res.json({ totals: { users: n("SELECT COUNT(*) n FROM users"), posts: n("SELECT COUNT(*) n FROM posts"), videos: n("SELECT COUNT(*) n FROM posts WHERE media_kind='video' OR tiktok_url!=''"), comments: n("SELECT COUNT(*) n FROM comments"),
    likes: n("SELECT COUNT(*) n FROM likes"), tiktokViews: n("SELECT COALESCE(SUM(tiktok_views),0) n FROM posts"), active: n("SELECT COUNT(*) n FROM users WHERE last_seen>?", now() - 86400), online: online.size,
    reports: n("SELECT COUNT(*) n FROM reports WHERE status='open'"), banned: n("SELECT COUNT(*) n FROM users WHERE status!='active'"), pendingStats: n("SELECT COUNT(*) n FROM stat_updates WHERE status='pending'"), moderators: n("SELECT COUNT(*) n FROM users WHERE role='MODERATOR'") },
    days, byType: all("SELECT type, COUNT(*) n FROM posts GROUP BY type"), security: all("SELECT * FROM sec_logs ORDER BY id DESC LIMIT 60") });
});
app.get("/api/admin/words", admin, (req, res) => res.json({ words: all("SELECT * FROM bad_words ORDER BY category, word"), levels: LEVELS }));
app.post("/api/admin/words", admin, (req, res) => {
  const word = str(req.body.word, 60).toLowerCase(), level = LEVELS.includes(req.body.level) ? req.body.level : "block", cat = str(req.body.category, 20) || "custom"; if (word.length < 2) return err(res, 400, "Word too short.");
  if (int(req.body.id)) run("UPDATE bad_words SET word=?, level=?, category=?, active=? WHERE id=?", word, level, cat, req.body.active ? 1 : 0, int(req.body.id));
  else run("INSERT OR IGNORE INTO bad_words(word,category,level) VALUES(?,?,?)", word, cat, level);
  wordCache = null; log(req.user.id, "words:save", word, level); res.json({ ok: true });
});
app.delete("/api/admin/words/:id", admin, (req, res) => { run("DELETE FROM bad_words WHERE id=?", int(req.params.id)); wordCache = null; log(req.user.id, "words:delete", req.params.id); res.json({ ok: true }); });
app.get("/api/admin/tags", admin, (req, res) => res.json({ banned: all("SELECT tag FROM banned_tags ORDER BY tag").map((r) => r.tag), tags: all("SELECT tag, COUNT(*) n FROM post_tags GROUP BY tag ORDER BY n DESC LIMIT 200") }));
app.post("/api/admin/tags/:tag/:action(ban|unban|remove)", admin, (req, res) => {
  const tag = parseTags(req.params.tag)[0]; if (!tag) return err(res, 400, "Invalid hashtag.");
  if (req.params.action === "ban") { run("INSERT OR IGNORE INTO banned_tags VALUES(?)", tag); run("DELETE FROM post_tags WHERE tag=?", tag); }
  if (req.params.action === "unban") run("DELETE FROM banned_tags WHERE tag=?", tag);
  if (req.params.action === "remove") run("DELETE FROM post_tags WHERE tag=?", tag);
  log(req.user.id, `tag:${req.params.action}`, `#${tag}`); res.json({ ok: true });
});
app.post("/api/admin/moments", admin, (req, res) => {
  const name = str(req.body.name, 40), emoji = str(req.body.emoji, 8); if (name.length < 2) return err(res, 400, "Name too short.");
  if (int(req.body.id)) run("UPDATE moment_cats SET name=?, emoji=? WHERE id=?", name, emoji, int(req.body.id)); else run("INSERT INTO moment_cats(name,emoji,pos) VALUES(?,?,?)", name, emoji, 99);
  log(req.user.id, "category:save", name); res.json({ ok: true });
});
app.delete("/api/admin/moments/:id", admin, (req, res) => { run("UPDATE posts SET moment_cat=0 WHERE moment_cat=?", int(req.params.id)); run("DELETE FROM moment_cats WHERE id=?", int(req.params.id)); log(req.user.id, "category:delete", req.params.id); res.json({ ok: true }); });
app.post("/api/admin/settings", admin, upload.single("hero"), (req, res) => {
  if (req.body.autoMax !== undefined) setSetting("auto_max", Math.max(0, Math.min(int(req.body.autoMax, 50000), 100000000)));
  if (req.file) { const h = takeFile(req.file, "image", 10); if (h === null) return err(res, 400, "Hero image must be a JPG, PNG or WebP under 10 MB."); setSetting("hero_image", h); }
  if (req.body.clearHero === "1") setSetting("hero_image", "");
  log(req.user.id, "settings:update", "site"); res.json({ ok: true, hero: setting("hero_image"), autoMax: autoMax() });
});
app.get("/api/admin/stats-history", mod, (req, res) => res.json({ rows: all("SELECT s.*, p.title, u.username, COALESCE(r.username,'auto') reviewer FROM stat_updates s JOIN posts p ON p.id=s.post_id JOIN users u ON u.id=s.user_id LEFT JOIN users r ON r.id=s.reviewed_by ORDER BY s.id DESC LIMIT 150") }));

/* ================= REALTIME: presence, typing, WebRTC signalling ================= */
const online = new Map();           // userId -> socket count
const calls = new Map();            // callId -> { members:Set<userId>, startedBy } (a room: ready for group calls later)
io.use((socket, next) => { const u = userFromToken(cookieOf(socket.handshake.headers.cookie).bw_s); if (!u || u.status !== "active") return next(new Error("unauthorized")); socket.user = u; next(); });
io.on("connection", (socket) => {
  const me = socket.user;
  socket.join(`u:${me.id}`); if (isMod(me)) socket.join("mods");
  online.set(me.id, (online.get(me.id) || 0) + 1); if (online.get(me.id) === 1) io.emit("presence", { id: me.id, online: true });
  const peerOk = (id) => Number.isInteger(id) && id !== me.id && !blockedBetween(me.id, id);
  const rate = { n: 0, t: Date.now() };
  socket.use((packet, next) => { const t = Date.now(); if (t - rate.t > 10000) { rate.n = 0; rate.t = t; } return ++rate.n > 400 ? next(new Error("rate")) : next(); });
  socket.on("typing", ({ to }) => { if (peerOk(to)) io.to(`u:${to}`).emit("typing", { from: me.id }); });
  socket.on("call:invite", ({ to }, cb) => {
    if (!peerOk(to) || !online.has(to)) return cb?.({ error: "This user is offline." });
    if ([...calls.values()].some((c) => c.members.has(to) || c.members.has(me.id))) return cb?.({ error: "Already in a call." });
    const id = crypto.randomBytes(8).toString("hex"); calls.set(id, { members: new Set([me.id]), invited: to, startedBy: me.id, at: Date.now() });
    io.to(`u:${to}`).emit("call:incoming", { callId: id, from: pub(me) }); notify(to, "call", `@${me.username} is calling you.`, `#/messages/${me.username}`); cb?.({ callId: id });
    setTimeout(() => { const c = calls.get(id); if (c && c.members.size < 2) { calls.delete(id); io.to(`u:${me.id}`).to(`u:${to}`).emit("call:ended", { callId: id, reason: "No answer" }); } }, 35000);
  });
  socket.on("call:accept", ({ callId }) => { const c = calls.get(callId); if (!c || c.invited !== me.id) return; c.members.add(me.id); socket.callId = callId; io.to(`u:${c.startedBy}`).emit("call:accepted", { callId, by: pub(me) }); });
  socket.on("call:decline", ({ callId }) => { const c = calls.get(callId); if (!c || c.invited !== me.id) return; calls.delete(callId); io.to(`u:${c.startedBy}`).emit("call:ended", { callId, reason: "Declined" }); });
  socket.on("call:signal", ({ callId, data }) => { const c = calls.get(callId); if (!c || !c.members.has(me.id)) return; [...c.members].filter((id) => id !== me.id).forEach((id) => io.to(`u:${id}`).emit("call:signal", { callId, from: me.id, data })); });
  const endCall = (callId, reason) => { const c = calls.get(callId); if (!c || (!c.members.has(me.id) && c.invited !== me.id)) return; calls.delete(callId); [...c.members, c.invited].forEach((id) => io.to(`u:${id}`).emit("call:ended", { callId, reason })); };
  socket.on("call:end", ({ callId }) => endCall(callId, "Call ended"));
  socket.on("disconnect", () => {
    const n = (online.get(me.id) || 1) - 1; if (n <= 0) { online.delete(me.id); io.emit("presence", { id: me.id, online: false }); for (const [id, c] of calls) if (c.members.has(me.id)) endCall(id, "Disconnected"); } else online.set(me.id, n);
  });
});

/* ---------- static frontend ---------- */
app.use(express.static(path.join(__dirname, "..", "public"), { maxAge: PROD ? "1h" : 0 }));
app.use((e, req, res, next) => { if (e instanceof multer.MulterError) return err(res, 400, e.code === "LIMIT_FILE_SIZE" ? "File too large." : "Upload error."); console.error(e); err(res, 500, "Server error."); });
setInterval(() => { run("DELETE FROM sessions WHERE expires_at<?", now()); const t = Date.now(); for (const [k, v] of seen) if (t - v > 3600000) seen.delete(k); }, 600000).unref();

const PORT = int(process.env.PORT, 3000);
server.listen(PORT, () => console.log(`Bilal's World running on http://localhost:${PORT}  (data: ${DATA})`));
