# Bilal's World

**Where the Bilal community comes alive.** A fan-made community platform (TikTok × Discord × Instagram × Twitch) for edits, clips, TikToks, live moments, memes and fan art about Bilal Fadili.

> Fan-made. Not affiliated with, managed or endorsed by Bilal Fadili.

## Run it

```bash
cd bilals-world
npm install
ADMIN_PASSWORD='choose-a-strong-password' npm start     # http://localhost:3000
```

Requires Node.js ≥ 22.5 (uses the built-in `node:sqlite`). No build step.

On first start the server creates the **ADMIN** account (username `ADMIN`). If `ADMIN_PASSWORD` is not set, a random password is generated, printed once in the console and written to `data/ADMIN_CREDENTIALS.txt`. The admin role can never be obtained through the website or the API.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `ADMIN_PASSWORD`, `ADMIN_EMAIL` | random / placeholder | first-run admin account |
| `DATA_DIR` | `./data` | SQLite database |
| `UPLOAD_DIR` | `./uploads` | uploaded images and videos |
| `NODE_ENV=production` | – | `Secure` cookies (serve over HTTPS) |
| `TRUST_PROXY=1` | – | when behind a reverse proxy (correct client IPs for rate limits) |

For production: put it behind HTTPS (required for the microphone / voice calls), back up `data/` and `uploads/`, and add a TURN server in `public/js/chat.js` (`iceServers`) so calls also work behind strict NATs.

## What is inside

- **Frontend** (`public/`): single-page app in plain JavaScript, strict CSP (no inline scripts), dark glassmorphism UI, 3D hero with parallax, particles, scroll reveals, skeleton loaders, infinite scroll, mobile bottom navigation.
- **Backend** (`server/`): Express API, SQLite persistence, Socket.IO realtime.
- **Accounts**: register / login / logout, profile (username, avatar, bio), followers / following, block.
- **Posts**: Edit, Clip, TikTok, Live Moment, Meme, Fan Art, Short — upload video/image, title, description, hashtags, Bilal Moments category, TikTok URL, original link. Likes (one per user), saves, shares, reports, views.
- **Comments**: replies, likes, delete, report, sort by popular / newest.
- **Discovery**: Explore (tabs, filters, periods), For You (personalised), Following, hashtags (popular / trending / recent, follow a hashtag), global search, Bilal Moments, Top TikToks.
- **TikTok statistics with anti-fraud**: every views change is logged (old value, new value, date, user, status). Small increases are auto-approved; large jumps are `Pending Verification` until a moderator approves or rejects. Only approved views count.
- **Leaderboards**: Most Views, Most Popular, Rising Editors, Most Active, Best TikTok, Community — by Today / Week / Month / Year / All Time, with gold / silver / bronze podium. Rank shown on profiles.
- **Roles**: USER, MODERATOR, ADMIN — enforced on the server for every endpoint. Only the ADMIN creates or removes moderators; moderators cannot touch the admin, other moderators, critical settings or email addresses.
- **Moderation**: automatic filter (bad words with sanction levels: warning, blocked, temporary mute, temporary ban, permanent ban; spam detection), reports queue (dismiss, delete, hide, warn, mute, ban), moderation logs, security logs.
- **Admin dashboard**: overview, users, moderators, reports, content, comments, banned users, bad words, TikTok statistics, leaderboards, analytics charts, logs, settings (hero image, anti-fraud threshold, moment categories, hashtags).
- **Realtime**: notifications bell, private messages (text, emoji, GIF link, images, shared posts, typing, online status, delete, block, report), **1-to-1 voice calls** over WebRTC (accept / decline / mute / timer). Calls are modelled as rooms so group calls can be added later.
- **Security**: scrypt-hashed passwords, httpOnly SameSite session cookie, CSRF header check, rate limiting, input validation, output escaping, upload type + magic-byte + size validation, CSP and hardening headers.

## Notes

- **Images of Bilal Fadili**: none are bundled. The hero shows a neutral 3D emblem; the admin can upload an authorised image in *Admin → Settings → Hero visual*. Only use photos you have the right to use, and never present edited or generated images as official photographs.
- **TikTok views**: TikTok offers no public API that returns the view count of an arbitrary video without the creator authorising an approved app, so views are entered by the creator and verified by moderators. The server only calls TikTok's public oEmbed endpoint to fetch a thumbnail. `submitViews()` in `server/index.js` is the single place to plug an official API later.
