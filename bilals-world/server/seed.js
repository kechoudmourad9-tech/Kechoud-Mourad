// Optional demo content so the site does not look empty while you test it.
//   npm run seed            → adds demo accounts (demo_*) with posts, likes, comments and TikTok stats
//   npm run seed -- --clear → removes every demo account and its content
const zlib = require("node:zlib"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { get, all, run, now, hashPass } = require("./db");
const UP = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads"); fs.mkdirSync(UP, { recursive: true });

if (process.argv.includes("--clear")) {
  all("SELECT p.media FROM posts p JOIN users u ON u.id=p.user_id WHERE u.username LIKE 'demo\\_%' ESCAPE '\\'").forEach((p) => p.media && fs.unlink(path.join(UP, path.basename(p.media)), () => {}));
  const n = run("DELETE FROM users WHERE username LIKE 'demo\\_%' ESCAPE '\\'").changes; console.log(`Removed ${n} demo accounts.`); process.exit(0);
}
const crc = (b) => { let c, r = 0xffffffff; for (const x of b) { c = (r ^ x) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; r = c ^ (r >>> 8); } return (r ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
/** abstract gradient artwork (no real person is depicted) */
const png = (w, h, seed) => { const raw = Buffer.alloc((w * 4 + 1) * h), a = [139, 92, 246], b = [34, 211, 238], c = [244, 114, 182], s = (seed * 97) % 360;
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w; x++) { const u = x / w, v = y / h, k = 0.5 + 0.5 * Math.sin((u * 3 + v * 2) * 3.1 + s), m = 0.5 + 0.5 * Math.cos((u - v) * 5 + s * 0.7), d = Math.hypot(u - 0.5, v - 0.5), ring = Math.abs(d - 0.28) < 0.012 ? 70 : 0;
      const i = y * (w * 4 + 1) + 1 + x * 4; for (let j = 0; j < 3; j++) raw[i + j] = Math.min(255, (a[j] * k + b[j] * (1 - k)) * 0.75 + c[j] * m * 0.35 + ring) * (1 - d * 0.8); raw[i + 3] = 255; } }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]); };

const USERS = [["demo_EditorDZ", "Bilal editor since 2026 🇩🇿"], ["demo_BilalFan", "Clips every day."], ["demo_FadiliEdits", "Edits · memes · moments"], ["demo_NightClips", "Live moments hunter 🔴"], ["demo_PixelArt", "Fan art & posters 🎨"], ["demo_ShortKing", "Vertical only."]];
const POSTS = [["edit", "Cinematic Bilal edit — 4K"], ["clip", "The clutch nobody expected"], ["tiktok", "This reaction went viral"], ["live", "Funniest moment of the stream"], ["meme", "When the lobby goes silent"], ["fanart", "Neon poster fan art"], ["short", "10 seconds of pure chaos"],
  ["tiktok", "Bilal x phonk edit"], ["edit", "Best of the month"], ["clip", "He really said that live"], ["tiktok", "POV: you joined the stream late"], ["fanart", "Minimal portrait study"], ["meme", "Chat be like"], ["tiktok", "Legendary comeback edit"], ["live", "Chat went crazy"], ["edit", "Slow-mo montage"]];
const TAGS = ["BilalEdit", "BilalFadili", "BilalFadiliEdit", "Bilal", "BilalClips", "BilalMoments", "BilalLive", "BilalWorld"];
const ids = USERS.map(([u, bio], i) => get("SELECT id FROM users WHERE username=?", u)?.id ?? Number(run("INSERT INTO users(username,email,pass,bio,created_at,last_seen) VALUES(?,?,?,?,?,?)", u, `${u}@demo.invalid`, hashPass(crypto.randomBytes(18).toString("hex")), `${bio} (demo account)`, now() - (40 - i) * 86400, now()).lastInsertRowid));
const moments = all("SELECT id FROM moment_cats").map((m) => m.id); let made = 0;
POSTS.forEach(([type, title], i) => { if (get("SELECT 1 x FROM posts WHERE title=? AND user_id IN (SELECT id FROM users WHERE username LIKE 'demo\\_%' ESCAPE '\\')", title)) return;
  const uid = ids[i % ids.length], at = now() - Math.floor((i * 1.7 + 0.3) * 86400), name = `${crypto.randomBytes(12).toString("hex")}.png`, vert = type === "short" || type === "tiktok";
  fs.writeFileSync(path.join(UP, name), png(vert ? 360 : 640, vert ? 640 : 400, i + 3));
  const tk = type === "tiktok" ? `https://www.tiktok.com/@${USERS[i % ids.length][0]}/video/73${String(1e15 + i * 7919).slice(1)}` : "", views = tk ? [2400000, 1800000, 950000, 720000, 540000][Math.floor(i / 3) % 5] : 0;
  const pid = Number(run("INSERT INTO posts(user_id,type,title,description,media,media_kind,tiktok_url,moment_cat,views,tiktok_views,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)", uid, type, title, "Demo post — replace me with real community content.", `/uploads/${name}`, "image", tk,
    type === "live" || type === "clip" ? moments[i % moments.length] : 0, 40 + ((i * 53) % 900), views, at).lastInsertRowid);
  [TAGS[i % 8], TAGS[(i + 3) % 8], "BilalWorld"].forEach((t) => run("INSERT OR IGNORE INTO post_tags VALUES(?,?)", pid, t));
  if (views) run("INSERT INTO stat_updates(post_id,user_id,old_value,new_value,status,auto,created_at,reviewed_at) VALUES(?,?,?,?,?,?,?,?)", pid, uid, 0, views, "approved", 0, at, at + 3600 * (1 + (i % 5) * 30));
  ids.forEach((o, j) => { if (o !== uid && (i + j) % 3) run("INSERT OR IGNORE INTO likes VALUES(?,?,?)", o, pid, at + j * 900); });
  ["🔥🔥🔥", "Best one so far", "How did you make this?", "Legendary"].slice(0, 1 + (i % 4)).forEach((c, j) => run("INSERT INTO comments(post_id,user_id,body,created_at) VALUES(?,?,?,?)", pid, ids[(i + j + 1) % ids.length], c, at + 600 * (j + 1))); made++; });
ids.forEach((a, i) => ids.forEach((b, j) => { if (a !== b && (i * 2 + j) % 3 === 0) run("INSERT OR IGNORE INTO follows VALUES(?,?,?)", a, b, now() - j * 86400); }));
console.log(`Demo data ready: ${ids.length} demo accounts, ${made} new posts. Remove it with: npm run seed -- --clear`);
