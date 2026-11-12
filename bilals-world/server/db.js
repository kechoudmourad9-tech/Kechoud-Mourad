// SQLite schema + small query helpers (node:sqlite, no native dependency).
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DATA = process.env.DATA_DIR || path.join(__dirname, "..", "data");
fs.mkdirSync(DATA, { recursive: true });
const db = new DatabaseSync(path.join(DATA, "bilals-world.db"));
db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT UNIQUE COLLATE NOCASE NOT NULL, email TEXT UNIQUE COLLATE NOCASE, pass TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER', bio TEXT DEFAULT '', avatar TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'active', ban_until INTEGER DEFAULT 0,
  mute_until INTEGER DEFAULT 0, warnings INTEGER DEFAULT 0, best_rank INTEGER DEFAULT 0, last_seen INTEGER DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at INTEGER, expires_at INTEGER);
CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, title TEXT NOT NULL,
  description TEXT DEFAULT '', media TEXT DEFAULT '', media_kind TEXT DEFAULT '', thumb TEXT DEFAULT '', tiktok_url TEXT DEFAULT '', original_url TEXT DEFAULT '',
  moment_cat INTEGER DEFAULT 0, views INTEGER DEFAULT 0, tiktok_views INTEGER DEFAULT 0, shares INTEGER DEFAULT 0, hidden INTEGER DEFAULT 0, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS posts_user ON posts(user_id); CREATE INDEX IF NOT EXISTS posts_type ON posts(type, created_at);
CREATE TABLE IF NOT EXISTS post_tags(post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, tag TEXT NOT NULL COLLATE NOCASE, PRIMARY KEY(post_id, tag));
CREATE INDEX IF NOT EXISTS tags_tag ON post_tags(tag);
CREATE TABLE IF NOT EXISTS likes(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, created_at INTEGER, PRIMARY KEY(user_id, post_id));
CREATE TABLE IF NOT EXISTS saves(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, created_at INTEGER, PRIMARY KEY(user_id, post_id));
CREATE TABLE IF NOT EXISTS comments(id INTEGER PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER DEFAULT 0, body TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS comments_post ON comments(post_id);
CREATE TABLE IF NOT EXISTS comment_likes(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE, PRIMARY KEY(user_id, comment_id));
CREATE TABLE IF NOT EXISTS follows(follower INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, followee INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at INTEGER, PRIMARY KEY(follower, followee));
CREATE TABLE IF NOT EXISTS tag_follows(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, tag TEXT NOT NULL COLLATE NOCASE, PRIMARY KEY(user_id, tag));
CREATE TABLE IF NOT EXISTS stat_updates(id INTEGER PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_value INTEGER NOT NULL, new_value INTEGER NOT NULL, status TEXT NOT NULL, auto INTEGER DEFAULT 0, reviewed_by INTEGER DEFAULT 0, created_at INTEGER NOT NULL, reviewed_at INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT, text TEXT, link TEXT DEFAULT '', read INTEGER DEFAULT 0, created_at INTEGER);
CREATE INDEX IF NOT EXISTS notif_user ON notifications(user_id, id);
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT DEFAULT '', image TEXT DEFAULT '', gif TEXT DEFAULT '', post_id INTEGER DEFAULT 0, read INTEGER DEFAULT 0, deleted INTEGER DEFAULT 0, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS msg_pair ON messages(from_id, to_id, id);
CREATE TABLE IF NOT EXISTS blocks(blocker INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, blocked INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(blocker, blocked));
CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY, reporter INTEGER NOT NULL, target_type TEXT NOT NULL, target_id INTEGER NOT NULL, reason TEXT NOT NULL, details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open', resolution TEXT DEFAULT '', handled_by INTEGER DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS bad_words(id INTEGER PRIMARY KEY, word TEXT UNIQUE COLLATE NOCASE NOT NULL, category TEXT DEFAULT 'insult', level TEXT NOT NULL DEFAULT 'block', active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS mod_logs(id INTEGER PRIMARY KEY, actor INTEGER, action TEXT, target TEXT, details TEXT DEFAULT '', created_at INTEGER);
CREATE TABLE IF NOT EXISTS sec_logs(id INTEGER PRIMARY KEY, type TEXT, ip TEXT, user TEXT DEFAULT '', details TEXT DEFAULT '', created_at INTEGER);
CREATE TABLE IF NOT EXISTS moment_cats(id INTEGER PRIMARY KEY, name TEXT NOT NULL, emoji TEXT DEFAULT '', pos INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS banned_tags(tag TEXT PRIMARY KEY COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
`);

const now = () => Math.floor(Date.now() / 1000);
const get = (sql, ...p) => db.prepare(sql).get(...p);
const all = (sql, ...p) => db.prepare(sql).all(...p);
const run = (sql, ...p) => db.prepare(sql).run(...p);
const setting = (k, d = "") => get("SELECT value FROM settings WHERE key=?", k)?.value ?? d;
const setSetting = (k, v) => run("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", k, String(v));

const hashPass = (pw) => { const salt = crypto.randomBytes(16).toString("hex"); return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`; };
const checkPass = (pw, stored) => { const [salt, h] = String(stored).split(":"); if (!salt || !h) return false; const a = Buffer.from(h, "hex"), b = crypto.scryptSync(pw, salt, 64); return a.length === b.length && crypto.timingSafeEqual(a, b); };

/* ---------- first-run seed ---------- */
if (!get("SELECT 1 x FROM moment_cats LIMIT 1")) {
  [["Funniest Moments", "😂"], ["Best Reactions", "🔥"], ["Gaming Moments", "🎮"], ["Funniest Fails", "💀"], ["Legendary Moments", "🏆"], ["Live Moments", "🎤"]]
    .forEach(([n, e], i) => run("INSERT INTO moment_cats(name,emoji,pos) VALUES(?,?,?)", n, e, i));
}
if (!get("SELECT 1 x FROM bad_words LIMIT 1")) {
  const seed = { insult: ["idiot", "stupid", "connard", "connasse", "abruti", "débile", "imbécile", "crétin", "salope", "pute", "enculé", "fdp", "ntm", "bitch", "asshole", "fuck", "shit", "merde", "bâtard", "batard", "moron", "loser"],
    harassment: ["kys", "kill yourself", "va mourir", "suicide toi", "nobody likes you", "personne t'aime"], threat: ["je vais te tuer", "i will kill you", "je vais te retrouver", "i know where you live"],
    sexual: ["porn", "porno", "nudes", "xxx", "sex tape"], hate: ["sale arabe", "sale noir", "sale juif", "sale blanc", "nazi", "white power"] };
  const lvl = { insult: "block", harassment: "mute", threat: "tempban", sexual: "block", hate: "tempban" };
  for (const [cat, words] of Object.entries(seed)) for (const w of words) run("INSERT OR IGNORE INTO bad_words(word,category,level) VALUES(?,?,?)", w, cat, lvl[cat]);
}
if (!get("SELECT 1 x FROM users WHERE role='ADMIN'")) {
  // The ADMIN account can only be created here, on the server — never through the API.
  const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
  run("INSERT INTO users(username,email,pass,role,bio,created_at) VALUES('ADMIN',?,?, 'ADMIN','Platform administrator',?)", process.env.ADMIN_EMAIL || "admin@bilalsworld.local", hashPass(pw), now());
  fs.writeFileSync(path.join(DATA, "ADMIN_CREDENTIALS.txt"), `username: ADMIN\npassword: ${pw}\n(change it after first login; delete this file)\n`, { mode: 0o600 });
  console.log(`\n[bilals-world] ADMIN account created — username: ADMIN  password: ${process.env.ADMIN_PASSWORD ? "(from ADMIN_PASSWORD)" : pw}\n`);
}

module.exports = { db, get, all, run, now, setting, setSetting, hashPass, checkPass, DATA };
