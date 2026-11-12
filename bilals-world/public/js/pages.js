/* Bilal's World — pages */
const R = BW.routes;
const page = (app, title, html) => { app.dataset.title = title; app.innerHTML = `<div class="wrap">${html}</div>`; };
const head = (t, sub = "", right = "") => `<div class="row wrapr sec" style="margin-bottom:18px"><div class="grow"><h2>${t}</h2>${sub ? `<p class="mut" style="margin:6px 0 0">${sub}</p>` : ""}</div>${right}</div>`;
const chipNav = (items, cur, base) => `<div class="chips scroll">${items.map(([k, l]) => `<a class="chip ${k === cur ? "on" : ""}" href="${base}${k}">${l}</a>`).join("")}</div>`;
const PERIODS = [["today", "Today"], ["week", "This Week"], ["month", "This Month"], ["year", "This Year"], ["all", "All Time"]];
const podium = (rows, score, unit) => rows.length ? `<div class="podium">${rows.slice(0, 3).map((r, i) => `<a class="pod glass p${i + 1} reveal" href="#/u/${e(r.username)}"><div class="medal">${["🥇", "🥈", "🥉"][i]}</div>${avatar(r, i ? 64 : 84)}
  <div style="margin-top:8px;font-weight:800;overflow:hidden;text-overflow:ellipsis">@${e(r.username)}</div><div class="score gt">${fmt(score(r))}</div><div class="mut sm">${unit}</div></a>`).join("")}</div>` : "";
const lbList = (rows, score, unit, from = 3) => rows.length > from ? `<div class="glass">${rows.slice(from).map((r, i) => `<a class="lbrow" href="#/u/${e(r.username)}"><span class="n">#${i + from + 1}</span>${avatar(r, 40)}<span class="grow"><b>@${e(r.username)}</b> ${roleBadge(r.role)}<br><span class="mut sm">${fmt(r.posts)} posts · ${fmt(r.followers)} followers</span></span><b>${fmt(score(r))}</b><span class="mut sm">${unit}</span></a>`).join("")}</div>` : "";

/* ================= HOME ================= */
R.home = async (app) => {
  const [lb, hs, meta] = await Promise.all([GET("/leaderboard?type=views&period=all"), GET("/hashtags"), GET("/meta")]); BW.meta = meta;
  app.dataset.title = "Home";
  app.innerHTML = `<div class="wrap"><section class="hero">
    <div><span class="kicker"><b></b> Fan-made community · ${fmt(meta.counts.users)} members</span>
      <h1><span class="gt">BILAL’S</span><br>WORLD</h1>
      <p class="lead">The ultimate community for Bilal Fadili edits, clips &amp; moments.</p>
      <div class="row wrapr"><a class="btn pri" href="#/explore" style="padding:14px 28px;font-size:17px">Explore</a>
        <button class="btn" style="padding:14px 28px;font-size:17px" data-act="${BW.me ? "create" : "auth"}" data-mode="register">${BW.me ? "+ Create a post" : "Join the Community"}</button></div>
      <div class="counters"><div><b class="gt">${fmt(meta.counts.posts)}</b><span>Posts</span></div><div><b class="gt">${fmt(meta.counts.views)}</b><span>TikTok views</span></div><div><b class="gt">${fmt(meta.counts.users)}</b><span>Creators</span></div></div></div>
    <div class="stage" id="stage"><div class="orb"></div><div class="ring"></div><div class="ring r2"></div><i class="cube c1"></i><i class="cube c2"></i><i class="cube c3"></i>
      <div class="portrait">${meta.hero ? `<img src="${e(meta.hero)}" alt="Bilal Fadili — community hero visual">` : `<span class="mono">B</span>`}</div>
      <div class="float glass f1">🎬 Edits</div><div class="float glass f2">🏆 Leaderboard</div><div class="float glass f3">🔴 Live Moments</div><div class="float glass f4">💬 Chat &amp; Voice</div></div></section>
    <section class="sec reveal"><div class="chips scroll">${Object.entries(TYPE).map(([k, v]) => `<a class="chip" href="#/t/${k}">${v[0]} ${v[2]}</a>`).join("")}<a class="chip on" href="#/watch">▶ Watch Shorts</a><a class="chip" href="#/moments">⭐ Bilal Moments</a><a class="chip" href="#/top">🔥 Top TikToks</a><a class="chip" href="#/hashtags"># Hashtags</a></div></section>
    <section class="sec"><div class="row"><h2>🔥 Trending now</h2><a class="btn sm" href="#/explore">See all</a></div><div id="trend" style="margin-top:18px"></div></section>
    <section class="sec"><div class="row"><h2>🏆 TikTok Leaderboard</h2><a class="btn sm" href="#/leaderboard">Full ranking</a></div>
      ${lb.rows.length ? podium(lb.rows, (r) => r.views, "TikTok views") : empty("🏁", "The race has not started. Post your TikTok and take the #1 spot!")}</section>
    <section class="sec reveal"><div class="row"><h2># Popular hashtags</h2><a class="btn sm" href="#/hashtags">Explore hashtags</a></div>
      <div class="chips" style="margin-top:16px">${(hs.popular.length ? hs.popular.slice(0, 14).map((t) => [t.tag, t.n]) : hs.main.map((t) => [t, 0])).map(([t, n]) => `<a class="chip" href="#/tag/${e(t)}">#${e(t)}${n ? ` <span class="mut">${fmt(n)}</span>` : ""}</a>`).join("")}</div></section>
    <section class="sec reveal"><div class="glass pad" style="padding:38px;text-align:center;background:linear-gradient(120deg,rgba(139,92,246,.28),rgba(34,211,238,.14))">
      <h2>Create → Post on TikTok → Climb the leaderboard</h2><p class="mut" style="max-width:640px;margin:12px auto 22px">Add your TikTok, keep your views up to date and compete with the best Bilal editors. Like, comment, follow, chat and call other creators.</p>
      <button class="btn hot" data-act="create" style="padding:14px 30px;font-size:17px">+ Upload your edit</button></div></section></div>`;
  const row = $("#trend"); row.innerHTML = skeletons(4);
  GET("/posts?sort=trending").then((r) => { row.innerHTML = r.posts.length ? `<div class="grid">${r.posts.slice(0, 8).map(BW.card).join("")}</div>` : empty("🎬", "No posts yet — publish the very first one!", `<div style="margin-top:14px"><button class="btn pri" data-act="create">+ Create</button></div>`); reveal(); }).catch(() => {});
  const st = $("#stage"), img = $(".portrait img"); // 3D tilt + scroll zoom
  st.parentElement.addEventListener("pointermove", (ev) => { const b = st.getBoundingClientRect(), x = (ev.clientX - b.left) / b.width - 0.5, y = (ev.clientY - b.top) / b.height - 0.5; st.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 12}deg)`; });
  st.parentElement.addEventListener("pointerleave", () => (st.style.transform = ""));
  const onS = () => { if (!document.body.contains(st)) return removeEventListener("scroll", onS); const k = Math.min(1, scrollY / 700); st.style.scale = 1 + k * 0.12; st.style.opacity = 1 - k * 0.5; if (img) img.style.setProperty("--z", 1.04 + k * 0.2); };
  addEventListener("scroll", onS, { passive: true });
};

/* ================= EXPLORE / TYPES / FEEDS ================= */
const TABS = [["trending", "🔥 Trending"], ["edit", "🎬 Edits"], ["clip", "🎥 Clips"], ["tiktok", "📱 TikToks"], ["meme", "😂 Memes"], ["fanart", "🎨 Fan Art"], ["live", "🔴 Live Moments"], ["short", "🎞️ Shorts"], ["liked", "⭐ Most Liked"], ["viewed", "👀 Most Viewed"], ["latest", "🆕 Latest"]];
R.explore = (app, [tab = "trending"], q) => {
  const params = TYPE[tab] ? { type: tab, sort: q.sort || "trending" } : { sort: tab };
  if (q.q) params.q = q.q; if (q.period && q.period !== "all") params.period = q.period;
  const qs = (o) => { const s = new URLSearchParams({ ...q, ...o }); [...s].forEach(([k, v]) => !v && s.delete(k)); return s.toString() ? "?" + s : ""; };
  page(app, "Explore", `${head("Explore", "Discover what the community is creating.", `<button class="btn hot" data-act="create">+ Upload</button>`)}
    ${chipNav(TABS, tab, "#/explore/")}
    <form class="row wrapr" data-form="exfilter" data-tab="${e(tab)}" style="margin:16px 0 22px"><input class="in grow" name="q" value="${e(q.q || "")}" placeholder="Filter by title or description…" style="min-width:200px">
      ${TYPE[tab] ? `<select class="in" name="sort" style="width:auto">${[["trending", "Trending"], ["latest", "Latest"], ["liked", "Most liked"], ["viewed", "Most viewed"]].map(([k, l]) => `<option value="${k}" ${params.sort === k ? "selected" : ""}>${l}</option>`).join("")}</select>` : ""}
      <select class="in" name="period" style="width:auto">${PERIODS.map(([k, l]) => `<option value="${k}" ${(q.period || "all") === k ? "selected" : ""}>${l}</option>`).join("")}</select><button class="btn">Apply</button></form><div id="feed"></div>`);
  BW.feed($("#feed"), params);
};
BW.forms.exfilter = (f) => { const s = new URLSearchParams(); if (f.q.value.trim()) s.set("q", f.q.value.trim()); if (f.sort && f.sort.value !== "trending") s.set("sort", f.sort.value); if (f.period.value !== "all") s.set("period", f.period.value); BW.go(`#/explore/${f.dataset.tab}${s.toString() ? "?" + s : ""}`); };
R.t = (app, [type = "edit"]) => { const T = TYPE[type] || TYPE.edit, desc = { edit: "Video edits of Bilal made by the community.", clip: "Clips from his live streams.", tiktok: "TikToks about Bilal created by members.", live: "Funny, impressive or memorable stream moments.", meme: "Community memes.", fanart: "Drawings and artistic creations.", short: "Short vertical videos." }[type];
  page(app, T[2], `${head(`${T[0]} ${T[2]}`, desc, `<button class="btn hot" data-act="create" data-type="${e(type)}">+ Post ${e(T[1])}</button>`)}${chipNav([["trending", "🔥 Trending"], ["latest", "🆕 Latest"], ["liked", "⭐ Most liked"], ["viewed", "👀 Most viewed"]], "", `#/explore/${type}?sort=`)}<div id="feed" style="margin-top:20px"></div>`);
  BW.feed($("#feed"), { type, sort: "trending" }); };
R.foryou = (app, [tab = "foryou"]) => { if (!BW.me) return page(app, "For You", `${head("For You")}${empty("✨", "Sign in to get a feed built around what you like and who you follow.", `<div style="margin-top:14px"><button class="btn pri" data-act="auth">Sign in</button></div>`)}`);
  page(app, tab === "following" ? "Following" : "For You", `${head(tab === "following" ? "👥 Following" : "✨ For You", tab === "following" ? "The latest posts from creators you follow." : "Based on your likes, follows, hashtags and what is popular.")}
    ${chipNav([["foryou", "✨ For You"], ["following", "👥 Following"]], tab, "#/foryou/")}<div id="feed" style="margin-top:20px"></div>`);
  BW.feed($("#feed"), tab === "following" ? { feed: "following", sort: "latest" } : { feed: "foryou" }); };
R.saved = (app) => { if (!BW.me) return BW.acts.auth(); page(app, "Saved", `${head("🔖 Saved", "Everything you bookmarked.")}<div id="feed"></div>`); BW.feed($("#feed"), { feed: "saved", sort: "latest" }); };
R.liked = (app) => { if (!BW.me) return BW.acts.auth(); page(app, "Liked", `${head("❤️ Liked", "Posts you liked.")}<div id="feed"></div>`); BW.feed($("#feed"), { feed: "liked", sort: "latest" }); };

/* ================= MOMENTS ================= */
R.moments = (app, [id = ""]) => { const cats = BW.meta?.moments || [], cur = cats.find((c) => String(c.id) === id);
  page(app, "Bilal Moments", `${head("⭐ Bilal Moments", "The funniest, wildest and most legendary moments — added by the community.", `<button class="btn hot" data-act="create" data-type="live" data-moment="${e(id)}">+ Add a moment</button>`)}
    <div class="chips scroll"><a class="chip ${!id ? "on" : ""}" href="#/moments">All moments</a>${cats.map((c) => `<a class="chip ${String(c.id) === id ? "on" : ""}" href="#/moments/${c.id}">${e(c.emoji)} ${e(c.name)}</a>`).join("")}</div>
    <div id="feed" style="margin-top:20px"></div>`);
  BW.feed($("#feed"), cur ? { moment: cur.id, sort: "trending" } : { moments: 1, sort: "trending" }); };

/* ================= HASHTAGS ================= */
R.hashtags = async (app) => { const h = await GET("/hashtags"); const list = (rows) => rows.length ? `<div class="chips">${rows.map((t) => `<a class="chip" href="#/tag/${e(t.tag)}">#${e(t.tag)} <span class="mut">${fmt(t.n)} post${t.n > 1 ? "s" : ""}</span></a>`).join("")}</div>` : `<p class="mut">No hashtags yet.</p>`;
  page(app, "Explore Hashtags", `${head("# Explore Hashtags", "Follow hashtags to shape your For You feed.")}
    <div class="glass pad reveal"><h3>⭐ Official community hashtags</h3><div class="chips" style="margin-top:12px">${h.main.map((t) => `<a class="chip on" href="#/tag/${t}">#${t}</a>`).join("")}</div></div>
    <div class="glass pad reveal" style="margin-top:18px"><h3>🔥 Trending this week</h3><div style="margin-top:12px">${list(h.trending)}</div></div>
    <div class="glass pad reveal" style="margin-top:18px"><h3>🏅 Most popular</h3><div style="margin-top:12px">${list(h.popular)}</div></div>
    <div class="glass pad reveal" style="margin-top:18px"><h3>🆕 Recently used</h3><div style="margin-top:12px">${list(h.recent)}</div></div>
    ${h.followed.length ? `<div class="glass pad reveal" style="margin-top:18px"><h3>✅ You follow</h3><div class="chips" style="margin-top:12px">${h.followed.map((t) => `<a class="chip" href="#/tag/${e(t)}">#${e(t)}</a>`).join("")}</div></div>` : ""}`); };
R.tag = async (app, [tag = ""]) => { const h = BW.me ? await GET("/hashtags") : { followed: [] }, on = h.followed.some((t) => t.toLowerCase() === tag.toLowerCase());
  page(app, "#" + tag, `${head(`<span class="gt">#${e(tag)}</span>`, "Posts using this hashtag.", `<button class="btn ${on ? "on" : ""}" data-act="tagfollow" data-tag="${e(tag)}">${on ? "✓ Following" : "+ Follow hashtag"}</button>`)}<div id="feed"></div>`); BW.feed($("#feed"), { tag, sort: "trending" }); };
BW.acts.tagfollow = guard(async (el) => { if (!needMe()) return; const r = await POST(`/hashtags/${encodeURIComponent(el.dataset.tag)}/follow`); el.classList.toggle("on", r.on); el.textContent = r.on ? "✓ Following" : "+ Follow hashtag"; });

/* ================= LEADERBOARDS ================= */
const LB = { views: ["👑 Most Views", "TikTok views", (r) => r.views], popular: ["🔥 Most Popular", "likes", (r) => r.likes], rising: ["📈 Rising Editors", "growth pts", (r) => Math.round(r.score)], active: ["🎬 Most Active", "posts", (r) => r.posts], best: ["🏆 Best TikTok", "views", (r) => r.score], community: ["🌍 Community", "points", (r) => Math.round(r.score)] };
R.leaderboard = async (app, [type = "views"], q) => { const per = q.period || "all", L = LB[type] || LB.views, { rows } = await GET(`/leaderboard?type=${encodeURIComponent(type)}&period=${encodeURIComponent(per)}`);
  page(app, "Leaderboard", `${head("🏆 TikTok Leaderboard", "Friendly competition between Bilal editors. Views are verified by moderators.")}
    ${chipNav(Object.entries(LB).map(([k, v]) => [k, v[0]]), type, "#/leaderboard/")}<div class="chips scroll" style="margin-top:10px">${PERIODS.map(([k, l]) => `<a class="chip ${k === per ? "on" : ""}" href="#/leaderboard/${e(type)}?period=${k}">${l}</a>`).join("")}</div>
    ${!rows.length ? `<div style="margin-top:24px">${empty("🏁", "No ranking for this period yet.")}</div>` : type === "best" ? `<div class="glass" style="margin-top:24px">${rows.map((p, i) => `<a class="lbrow" href="#/post/${p.id}"><span class="n">${["🥇", "🥈", "🥉"][i] || "#" + (i + 1)}</span>
        <span class="thumb" style="width:92px;border-radius:12px;flex:none">${p.thumb ? `<img src="${e(p.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="ph" style="font-size:26px">📱</span>`}</span>
        <span class="grow"><b>${e(p.title)}</b><br><span class="mut sm">@${e(p.username)} · ${day(p.created_at)} · ❤️ ${fmt(p.likes)}</span></span><b class="gt" style="font-size:19px">👁️ ${fmt(p.score)}</b></a>`).join("")}</div>`
      : podium(rows, L[2], L[1]) + lbList(rows, L[2], L[1])}`); };
R.community = async (app) => { const [{ rows }, meta] = await Promise.all([GET("/leaderboard?type=community&period=all"), GET("/meta")]);
  page(app, "Community", `${head("🌍 Community Leaderboard", "Overall ranking: views, likes, posts, followers and TikTok performance.", `<a class="btn" href="#/rules">📜 Community Rules</a>`)}
    <div class="stats reveal"><div class="glass stat"><b class="gt">${fmt(meta.counts.users)}</b><span>Members</span></div><div class="glass stat"><b class="gt">${fmt(meta.counts.posts)}</b><span>Posts</span></div><div class="glass stat"><b class="gt">${fmt(meta.counts.views)}</b><span>TikTok views</span></div></div>
    ${rows.length ? podium(rows, (r) => Math.round(r.score), "points") + lbList(rows, (r) => Math.round(r.score), "pts") : `<div style="margin-top:24px">${empty("👥", "Be the first creator on the board!")}</div>`}`); };
R.top = (app, _, q) => { const per = q.period || "all";
  page(app, "Top TikToks", `${head("🔥 Top TikToks", "The most viewed TikToks about Bilal.", `<button class="btn hot" data-act="create" data-type="tiktok">+ Add your TikTok</button>`)}
    <div class="chips scroll">${[["today", "Today"], ["week", "This Week"], ["month", "This Month"], ["all", "All Time"]].map(([k, l]) => `<a class="chip ${k === per ? "on" : ""}" href="#/top?period=${k}">${l}</a>`).join("")}</div><div id="feed" style="margin-top:20px"></div>`);
  BW.feed($("#feed"), { sort: "tiktok", ...(per !== "all" ? { period: per } : {}) }); };

/* ================= SEARCH ================= */
R.search = async (app, _, q) => { const s = (q.q || "").trim(), r = s.length >= 2 ? await GET("/search?q=" + encodeURIComponent(s)) : { users: [], posts: [], hashtags: [] };
  const by = (t) => r.posts.filter((p) => p.type === t);
  page(app, "Search", `${head(`Results for “${e(s)}”`)}<form data-form="search" class="row" style="margin-bottom:24px"><input class="in grow" name="q" value="${e(s)}" placeholder="Search users, posts, hashtags…"><button class="btn pri">Search</button></form>
    ${!r.users.length && !r.posts.length && !r.hashtags.length ? empty("🔎", s.length < 2 ? "Type at least 2 characters." : "No results. Try another word.") : ""}
    ${r.users.length ? `<h3 style="margin:22px 0 12px">Users</h3><div class="chips">${r.users.map((u) => `<a class="chip row" href="#/u/${e(u.username)}">${avatar(u, 26)} @${e(u.username)} ${roleBadge(u.role)}</a>`).join("")}</div>` : ""}
    ${r.hashtags.length ? `<h3 style="margin:26px 0 12px">Hashtags</h3><div class="chips">${r.hashtags.map((t) => `<a class="chip" href="#/tag/${e(t.tag)}">#${e(t.tag)} <span class="mut">${fmt(t.n)}</span></a>`).join("")}</div>` : ""}
    ${r.posts.length ? `<h3 style="margin:26px 0 12px">Posts</h3><div class="grid">${r.posts.map(BW.card).join("")}</div>` : ""}
    ${["clip", "edit", "tiktok", "meme", "fanart"].filter((t) => by(t).length && by(t).length < r.posts.length).map((t) => `<h3 style="margin:26px 0 12px">${TYPE[t][0]} ${TYPE[t][2]}</h3><div class="grid">${by(t).map(BW.card).join("")}</div>`).join("")}`); };

/* ================= POST PAGE ================= */
R.post = async (app, [id]) => { const { post: p, history } = await GET("/posts/" + encodeURIComponent(id)); const mine = BW.me?.id === p.user.id, modr = BW.me && BW.me.role !== "USER", tid = ttId(p.tiktokUrl);
  const player = p.mediaKind === "video" ? `<video src="${e(p.media)}" controls playsinline preload="metadata" ${p.thumb ? `poster="${e(p.thumb)}"` : ""}></video>` : p.mediaKind === "image" ? `<img src="${e(p.media)}" alt="${e(p.title)}">`
    : tid ? `<iframe src="https://www.tiktok.com/embed/v2/${tid}" allow="encrypted-media; fullscreen" loading="lazy" title="TikTok video"></iframe>` : `<div class="pad center"><div style="font-size:70px">${TYPE[p.type]?.[0]}</div><p class="mut">This post links to external content.</p></div>`;
  page(app, p.title, `<div class="postgrid sec"><div><div class="player">${player}</div>
      <div class="glass pad" style="margin-top:16px">${p.hidden ? `<p class="st rejected" style="display:inline-block">Hidden by moderation</p>` : ""}<div class="row wrapr"><span class="chip on">${TYPE[p.type]?.[0]} ${TYPE[p.type]?.[1]}</span><span class="mut sm">${day(p.createdAt)} · 👀 ${fmt(p.views)} views on Bilal’s World</span></div>
        <h2 style="margin:12px 0">${e(p.title)}</h2>
        <div class="row wrapr">${avatar(p.user, 44)}<div class="grow"><span class="sm mut">Posted by</span> ${userLink(p.user)}</div>
          ${!mine && BW.me ? `<a class="btn sm" href="#/messages/${e(p.user.username)}">💬 Message</a>` : ""}</div>
        ${p.description ? `<p style="white-space:pre-wrap;word-break:break-word">${e(p.description)}</p>` : ""}<p>${tags(p.tags)}</p>
        <div class="row wrapr">${p.tiktokUrl ? `<a class="btn sm" href="${e(p.tiktokUrl)}" target="_blank" rel="noopener noreferrer nofollow">📱 Open on TikTok</a>` : ""}${p.originalUrl ? `<a class="btn sm" href="${e(p.originalUrl)}" target="_blank" rel="noopener noreferrer nofollow">🔗 Original content</a>` : ""}</div>
        <div class="row wrapr" style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px">
          <button class="btn ${p.liked ? "on" : ""}" data-act="like" data-id="${p.id}">❤️ <span>${fmt(p.likes)}</span> Likes</button><button class="btn ${p.saved ? "on" : ""}" data-act="save" data-id="${p.id}">🔖 Save</button>
          <button class="btn" data-act="share" data-id="${p.id}" data-title="${e(p.title)}">↗ Share</button><button class="btn" data-act="report" data-type="post" data-id="${p.id}">🚨 Report</button>
          ${mine ? `<button class="btn" data-act="editpost" data-id="${p.id}">✏️ Edit</button>` : ""}${mine || modr ? `<button class="btn danger" data-act="delpost" data-id="${p.id}">🗑 Delete</button>` : ""}${modr ? `<button class="btn" data-act="hidepost" data-id="${p.id}">${p.hidden ? "👁 Unhide" : "🙈 Hide"}</button>` : ""}</div></div>
      ${p.tiktokUrl ? `<div class="glass pad" style="margin-top:16px"><div class="row wrapr"><h3 class="grow">📊 TikTok statistics</h3><b class="gt" style="font-size:24px">👁️ ${fmt(p.tiktokViews)} views</b></div>
        ${p.statStatus === "pending" ? `<p><span class="st pending">⚠️ Pending Verification</span> <span class="mut sm">A moderator will review the latest update.</span></p>` : ""}
        ${mine ? `<form class="row wrapr" data-form="views" data-id="${p.id}" style="margin-top:12px"><input class="in grow" type="number" name="views" min="0" max="5000000000" placeholder="Current TikTok views" required style="min-width:160px"><button class="btn pri">Update views</button></form>
          <p class="sm mut">Every change is logged. Small increases are approved automatically; large jumps wait for verification. Falsifying statistics leads to a ban.</p>` : ""}
        ${history.length ? `<div class="tw"><table><tr><th>Previous</th><th>New</th><th>Updated</th><th>Status</th></tr>${history.map((s) => `<tr><td>${fmt(s.old_value)}</td><td>${fmt(s.new_value)}</td><td>${day(s.created_at)}</td><td><span class="st ${e(s.status)}">${s.status === "pending" ? "Pending Verification" : e(s.status)}</span></td></tr>`).join("")}</table></div>` : ""}</div>` : ""}</div>
    <div class="glass pad"><div class="row"><h3 class="grow">💬 Comments <span class="mut">${fmt(p.comments)}</span></h3><select class="in" id="csort" style="width:auto"><option value="top">Popular</option><option value="new">Newest</option></select></div>
      ${BW.me ? `<form data-form="comment" data-id="${p.id}" style="margin:14px 0"><div id="replyto" class="sm mut"></div><div class="row" style="align-items:flex-end"><textarea class="in grow" name="body" maxlength="600" placeholder="Add a comment…" required style="min-height:46px"></textarea><button class="btn pri">Send</button></div><input type="hidden" name="parentId"></form>`
        : `<p class="mut"><a class="tag" href="#" data-act="auth">Sign in</a> to comment.</p>`}<div id="cmts"><p class="mut">Loading…</p></div></div></div>`);
  BW.loadComments(p.id); $("#csort").addEventListener("change", () => BW.loadComments(p.id)); };
BW.loadComments = guard(async (pid) => { const box = $("#cmts"); if (!box) return; const { comments } = await GET(`/posts/${pid}/comments?sort=${$("#csort")?.value || "top"}`);
  const one = (c, reply) => `<div class="cmt ${reply ? "reply" : ""}">${avatar(c.user, reply ? 28 : 36)}<div class="grow"><div class="row wrapr" style="gap:8px">${userLink(c.user)}<span class="mut sm">${ago(c.createdAt)}</span></div><div class="b">${e(c.body)}</div>
    <div><button class="lnk ${c.liked ? "on" : ""}" data-act="clike" data-id="${c.id}">❤️ <span>${fmt(c.likes)}</span></button><button class="lnk" data-act="creply" data-id="${c.id}" data-user="${e(c.user.username)}">Reply</button>
    ${BW.me && (BW.me.id === c.user.id || BW.me.role !== "USER") ? `<button class="lnk" data-act="cdel" data-id="${c.id}" data-post="${pid}">Delete</button>` : ""}<button class="lnk" data-act="report" data-type="comment" data-id="${c.id}">Report</button></div></div></div>`;
  const tops = comments.filter((c) => !c.parentId);
  box.innerHTML = tops.length ? tops.map((c) => one(c) + comments.filter((r) => r.parentId === c.id).sort((a, b) => a.createdAt - b.createdAt).map((r) => one(r, true)).join("")).join("") : `<p class="mut center" style="padding:20px">No comments yet. Start the conversation!</p>`; });
BW.forms.comment = async (f) => { await POST(`/posts/${f.dataset.id}/comments`, { body: f.body.value, parentId: +f.parentId.value || 0 }); f.reset(); f.parentId.value = ""; $("#replyto").textContent = ""; BW.loadComments(f.dataset.id); };
BW.acts.creply = (el) => { if (!needMe()) return; const f = $("form[data-form=comment]"); f.parentId.value = el.dataset.id; $("#replyto").innerHTML = `Replying to <b>@${e(el.dataset.user)}</b> <button type="button" class="lnk" data-act="creplyx">cancel</button>`; f.body.focus(); };
BW.acts.creplyx = () => { const f = $("form[data-form=comment]"); f.parentId.value = ""; $("#replyto").textContent = ""; };
BW.acts.clike = guard(async (el) => { if (!needMe()) return; const r = await POST(`/comments/${el.dataset.id}/like`); el.classList.toggle("on", r.on); $("span", el).textContent = fmt(r.count); });
BW.acts.cdel = guard(async (el) => { if (!confirm("Delete this comment?")) return; await DEL(`/comments/${el.dataset.id}`); BW.loadComments(el.dataset.post); });
BW.acts.editpost = guard(async (el) => { const { post: p } = await GET("/posts/" + el.dataset.id);
  BW.modal(`<h2>✏️ Edit post</h2><form data-form="editpost" data-id="${p.id}"><label class="f">Title</label><input class="in" name="title" required minlength="3" maxlength="100" value="${e(p.title)}">
    <label class="f">Description</label><textarea class="in" name="description" maxlength="2000">${e(p.description)}</textarea><label class="f">Hashtags</label><input class="in" name="hashtags" maxlength="300" value="${e(p.tags.map((x) => "#" + x).join(" "))}">
    <label class="f">Bilal Moments category</label><select class="in" name="momentCat"><option value="0">— none —</option>${(BW.meta?.moments || []).map((m) => `<option value="${m.id}" ${m.id === p.momentCat ? "selected" : ""}>${e(m.emoji)} ${e(m.name)}</option>`).join("")}</select>
    <button class="btn pri" style="width:100%;margin-top:16px">Save changes</button></form>`); });
BW.forms.editpost = async (f) => { await BW.api("PATCH", "/posts/" + f.dataset.id, { title: f.title.value, description: f.description.value, hashtags: f.hashtags.value, momentCat: +f.momentCat.value }); BW.toast("Post updated ✅", "ok"); BW.render(); };
BW.acts.delpost = guard(async (el) => { if (!confirm("Delete this post permanently?")) return; await DEL(`/posts/${el.dataset.id}`); BW.toast("Post deleted."); BW.go("#/explore"); });
BW.acts.hidepost = guard(async (el) => { const r = await POST(`/mod/posts/${el.dataset.id}/hide`); BW.toast(r.hidden ? "Post hidden." : "Post visible again."); BW.render(); });
BW.forms.views = async (f) => { const r = await POST(`/posts/${f.dataset.id}/views`, { views: +f.views.value }); BW.toast(r.status === "approved" ? "Views updated ✅" : r.status === "pending" ? "Update sent — pending verification ⚠️" : "No change.", "ok"); BW.render(); };

/* ================= PROFILE ================= */
R.u = async (app, [name = "", tab = "posts"]) => { const d = await GET("/users/" + encodeURIComponent(name)), u = d.user, s = d.stats, mine = BW.me?.id === u.id;
  page(app, "@" + u.username, `<div class="glass sec" style="overflow:hidden"><div class="cover"></div><div class="phead"><div class="row wrapr" style="align-items:flex-end">${avatar(u, 108)}
      <div class="grow" style="padding-bottom:6px"><div class="row wrapr"><h2>@${e(u.username)}</h2>${roleBadge(u.role)}<span class="dot ${d.online ? "on" : ""}" title="${d.online ? "Online" : "Offline"}"></span>${d.rank ? `<span class="chip on">🏆 #${d.rank} Bilal Editor</span>` : ""}</div>
        <p style="margin:6px 0 0;white-space:pre-wrap;word-break:break-word">${e(u.bio) || `<span class="mut">No bio yet.</span>`}</p><span class="mut sm">Member since ${day(u.created_at)}</span></div>
      <div class="row wrapr">${mine ? `<a class="btn" href="#/settings">✏️ Edit profile</a>` : `<button class="btn ${d.following ? "on" : "pri"}" data-act="follow" data-user="${e(u.username)}">${d.following ? "Following" : "Follow"}</button>
        <a class="btn" href="#/messages/${e(u.username)}">💬 Message</a><button class="btn" data-act="callUser" data-id="${u.id}" data-user="${e(u.username)}">📞 Call</button>
        <button class="btn sm ghost" data-act="block" data-user="${e(u.username)}">${d.blocked ? "Unblock" : "Block"}</button><button class="btn sm ghost" data-act="report" data-type="user" data-id="${u.id}">🚨</button>`}</div></div>
    <div class="row wrapr" style="margin-top:18px;gap:22px"><a href="#/u/${e(u.username)}/followers"><b id="folc">${fmt(s.followers)}</b> <span class="mut">Followers</span></a><a href="#/u/${e(u.username)}/following"><b>${fmt(s.following)}</b> <span class="mut">Following</span></a>
      <span><b>${fmt(s.posts)}</b> <span class="mut">Posts</span></span><span><b>${fmt(s.likes)}</b> <span class="mut">Likes</span></span><span><b>${fmt(s.tiktokViews)}</b> <span class="mut">TikTok Views</span></span></div></div></div>
    <h3 style="margin-bottom:12px">Creator Stats</h3><div class="stats reveal"><div class="glass stat"><b>🎬 ${fmt(s.posts)}</b><span>Posts</span></div><div class="glass stat"><b>👁️ ${fmt(s.tiktokViews)}</b><span>TikTok Views</span></div>
      <div class="glass stat"><b>❤️ ${fmt(s.likes)}</b><span>Likes</span></div><div class="glass stat"><b>👥 ${fmt(s.followers)}</b><span>Followers</span></div>
      ${s.best ? `<a class="glass stat" href="#/post/${s.best.id}"><b>👁️ ${fmt(s.best.tiktok_views)}</b><span>Best TikTok</span></a>` : ""}${d.rank ? `<a class="glass stat" href="#/leaderboard"><b>🏆 #${d.rank}</b><span>Bilal Editor</span></a>` : ""}</div>
    <div class="chips scroll" style="margin:26px 0 18px">${[["posts", "🎬 Posts"], ["tiktoks", "📱 TikToks"], ...(mine ? [["liked", "❤️ Liked"], ["saved", "🔖 Saved"]] : []), ["followers", "👥 Followers"], ["following", "➡️ Following"]].map(([k, l]) => `<a class="chip ${k === tab ? "on" : ""}" href="#/u/${e(u.username)}/${k}">${l}</a>`).join("")}</div><div id="feed"></div>`);
  const box = $("#feed");
  if (tab === "followers" || tab === "following") { const r = await GET(`/users/${encodeURIComponent(name)}/${tab}`); box.innerHTML = r.users.length ? `<div class="glass">${r.users.map((x) => `<a class="lbrow" href="#/u/${e(x.username)}">${avatar(x, 42)}<span class="grow"><b>@${e(x.username)}</b> ${roleBadge(x.role)}<br><span class="mut sm">${e(x.bio).slice(0, 80)}</span></span></a>`).join("")}</div>` : empty("👥", "Nobody here yet."); }
  else BW.feed(box, tab === "liked" ? { feed: "liked", sort: "latest" } : tab === "saved" ? { feed: "saved", sort: "latest" } : { user: u.username, sort: "latest", ...(tab === "tiktoks" ? { type: "tiktok" } : {}) }); };
BW.acts.follow = guard(async (el) => { if (!needMe()) return; const r = await POST(`/users/${encodeURIComponent(el.dataset.user)}/follow`); el.classList.toggle("on", r.following); el.classList.toggle("pri", !r.following); el.textContent = r.following ? "Following" : "Follow"; const c = $("#folc"); if (c) c.textContent = fmt(r.followers); });
BW.acts.block = guard(async (el) => { if (!needMe()) return; const r = await POST(`/users/${encodeURIComponent(el.dataset.user)}/block`); BW.toast(r.blocked ? "User blocked." : "User unblocked."); BW.render(); });

/* ================= SETTINGS ================= */
R.settings = (app) => { if (!BW.me) return BW.acts.auth(); const m = BW.me;
  page(app, "Settings", `${head("⚙️ Settings")}<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))"><form class="glass pad" data-form="profile"><h3>Profile</h3><div class="row" style="margin-top:14px">${avatar(m, 72)}<div class="grow"><label class="f" style="margin-top:0">Avatar</label><input class="in" type="file" name="avatar" accept="image/jpeg,image/png,image/webp,image/gif"></div></div>
      <label class="f">Username</label><input class="in" name="username" value="${e(m.username)}" maxlength="20" ${m.role === "ADMIN" ? "disabled" : ""}><label class="f">Bio</label><textarea class="in" name="bio" maxlength="200" placeholder="Bilal editor since 2026 🇩🇿">${e(m.bio)}</textarea>
      <button class="btn pri" style="margin-top:16px">Save profile</button></form>
    <form class="glass pad" data-form="password"><h3>Password</h3><label class="f">Current password</label><input class="in" type="password" name="password" required autocomplete="current-password"><label class="f">New password</label><input class="in" type="password" name="newPassword" required minlength="8" autocomplete="new-password">
      <button class="btn" style="margin-top:16px">Change password</button><p class="sm mut">Email: ${e(m.email)} · Warnings: ${m.warnings}</p></form>
    <div class="glass pad"><h3>🚫 Blocked users</h3><div id="blocks" style="margin-top:12px"><p class="mut">Loading…</p></div></div>
    ${m.role === "ADMIN" ? "" : `<form class="glass pad" data-form="delaccount"><h3>Delete my account</h3><p class="sm mut">Removes your profile, posts, comments, likes and messages permanently.</p><label class="f">Confirm with your password</label><input class="in" type="password" name="password" required autocomplete="current-password"><button class="btn danger" style="margin-top:16px">Delete my account</button></form>`}</div>`);
  GET("/me/blocks").then((r) => { const b = $("#blocks"); if (b) b.innerHTML = r.users.length ? r.users.map((u) => `<div class="row" style="margin-bottom:8px">${avatar(u, 32)}<b class="grow">@${e(u.username)}</b><button class="btn sm" data-act="block" data-user="${e(u.username)}">Unblock</button></div>`).join("") : `<p class="mut">You have not blocked anyone.</p>`; }).catch(() => {}); };
BW.forms.delaccount = async (f) => { if (!confirm("Delete your account and all your posts, comments and messages? This cannot be undone.")) return; await POST("/me/delete", { password: f.password.value }); BW.sock?.disconnect(); BW.sock = null; BW.me = null; BW.toast("Account deleted."); BW.go("#/home"); };
BW.forms.profile = async (f) => { const fd = new FormData(f); if (!f.avatar.files.length) fd.delete("avatar"); await BW.api("POST", "/me/profile", fd); await BW.boot(true); BW.toast("Profile updated ✅", "ok"); BW.render(); };
BW.forms.password = async (f) => { await POST("/auth/password", { password: f.password.value, newPassword: f.newPassword.value }); f.reset(); BW.toast("Password changed ✅", "ok"); };

/* ================= NOTIFICATIONS ================= */
R.notifications = async (app) => { if (!BW.me) return BW.acts.auth(); const r = await GET("/notifications"), ic = { like: "❤️", comment: "💬", reply: "↩️", follow: "👥", message: "✉️", call: "📞", warning: "⚠️", removed: "🗑️", stats: "📊", rank: "🏆", role: "🛡️" };
  page(app, "Notifications", `${head("🔔 Notifications")}${r.items.length ? `<div class="glass">${r.items.map((n) => `<a class="lbrow ${n.read ? "" : "unread"}" href="${e(n.link || "#/home")}"><span style="font-size:22px">${ic[n.type] || "🔔"}</span><span class="grow">${e(n.text)}<br><span class="mut sm">${ago(n.created_at)}</span></span></a>`).join("")}</div>` : empty("🔔", "No notifications yet.")}`);
  if (BW.me.unread) { BW.me.unread = 0; POST("/notifications/read").catch(() => {}); BW.chrome(); } };

/* ================= WATCH — immersive vertical feed (TikTok-style) ================= */
R.watch = async (app, [start = ""]) => { app.dataset.title = "Watch"; let page = 0, more = true, busy = false;
  app.innerHTML = `<div class="watch" id="watch"></div>`; const box = $("#watch");
  const slide = (p) => `<section class="slide" data-id="${p.id}">${p.mediaKind === "video" ? `<video src="${e(p.media)}" ${p.thumb ? `poster="${e(p.thumb)}"` : ""} loop playsinline preload="none"></video>` : `<img src="${e(p.media)}" alt="${e(p.title)}" loading="lazy">`}
    <div class="shade"></div><div class="info"><div class="row" style="gap:8px">${avatar(p.user, 38)}${userLink(p.user)}<span class="chip sm">${TYPE[p.type]?.[0]} ${TYPE[p.type]?.[1]}</span></div>
      <h3 style="margin:8px 0 4px"><a href="#/post/${p.id}">${e(p.title)}</a></h3><div class="sm">${tags(p.tags.slice(0, 4))}</div></div>
    <div class="side2"><button class="act ${p.liked ? "on" : ""}" data-act="like" data-id="${p.id}" aria-label="Like">❤️<span>${fmt(p.likes)}</span></button><a class="act" href="#/post/${p.id}" aria-label="Comments">💬<span>${fmt(p.comments)}</span></a>
      <button class="act s ${p.saved ? "on" : ""}" data-act="save" data-id="${p.id}" aria-label="Save">🔖</button><button class="act" data-act="share" data-id="${p.id}" data-title="${e(p.title)}" aria-label="Share">↗</button>
      <button class="act" data-act="wmute" aria-label="Sound">🔇</button><button class="act" data-act="report" data-type="post" data-id="${p.id}" aria-label="Report">🚨</button></div></section>`;
  const io = new IntersectionObserver((es) => es.forEach((x) => { const v = $("video", x.target); if (x.isIntersecting && x.intersectionRatio > 0.6) { if (v) { v.muted = BW.wmuted !== false; v.play().catch(() => {}); } if (x.target === box.lastElementChild) load(); } else if (v) v.pause(); }), { threshold: [0, 0.6, 1] });
  const load = async () => { if (busy || !more) return; busy = true; try { const r = await GET(`/posts?media=any&sort=trending&page=${page++}`); more = r.more; if (!document.body.contains(box)) return;
      r.posts.forEach((p) => { box.insertAdjacentHTML("beforeend", slide(p)); io.observe(box.lastElementChild); });
      if (!box.children.length) box.innerHTML = `<div class="wrap sec">${empty("🎞️", "No videos or images yet — upload the first one!", `<div style="margin-top:14px"><button class="btn pri" data-act="create" data-type="short">+ Upload a Short</button></div>`)}</div>`;
      if (start) { $(`[data-id="${CSS.escape(start)}"]`, box)?.scrollIntoView(); start = ""; } } finally { busy = false; } };
  await load(); box.addEventListener("click", (ev) => { const v = ev.target.closest(".slide")?.querySelector("video"); if (v && ev.target === v) (v.paused ? v.play() : v.pause()); }); };
BW.acts.wmute = (el) => { BW.wmuted = BW.wmuted === false; $$(".watch video").forEach((v) => (v.muted = BW.wmuted)); $$("[data-act=wmute]").forEach((b) => (b.textContent = BW.wmuted ? "🔇" : "🔊")); };

/* ================= STATIC PAGES ================= */
const prose = (app, title, html) => page(app, title, `<div class="glass pad sec prose" style="padding:34px;margin-inline:auto">${html}</div>`);
R.rules = (app) => prose(app, "Community Rules", `<h1 class="gt">Community Rules</h1><p>Bilal’s World only works if everyone feels welcome. By using the platform you agree to these rules.</p><ol>${["Respect the other members.", "No insults or harassment.", "No spam.", "No illegal content.", "No sexually explicit content.", "No hate or discrimination.", "Respect copyright — only post what you are allowed to share.", "Do not falsify statistics. Every views update is logged and verified.", "Do not abuse the report system.", "Respect moderation decisions."].map((r) => `<li><b>${r}</b></li>`).join("")}</ol>
  <h2>Sanctions</h2><p>Depending on severity: warning, blocked message, temporary mute, temporary ban or permanent ban. Automatic moderation blocks inappropriate language before it is posted.</p>`);
R.about = (app) => prose(app, "About", `<h1 class="gt">About Bilal’s World</h1><p><b>Bilal’s World is a fan-made community platform created for fans of Bilal Fadili.</b></p><p>It lets fans share their edits, clips, TikToks, live moments, memes and fan art, discover what other members create, follow creators, chat, call each other and climb friendly leaderboards.</p>
  <p>The content is created by the community. Moderators keep the platform safe, and the administrator runs it.</p><h2>Not an official website</h2><p>Bilal’s World is <b>not</b> managed, endorsed or approved by Bilal Fadili. Names and images belong to their respective owners. Rights holders can ask for the removal of any content through the <a class="tag" href="#/contact">Contact</a> page.</p>`);
R.privacy = (app) => prose(app, "Privacy", `<h1 class="gt">Privacy</h1><p>We store only what the platform needs: your username, email, hashed password, profile, posts, comments, messages, follows, likes and moderation history.</p><ul><li>Passwords are hashed and never stored in clear text.</li><li>Private messages are visible to the two participants; a reported message can be reviewed by moderators.</li><li>Voice calls are peer-to-peer (WebRTC) and are not recorded by the server.</li><li>Moderators never see your email address.</li><li>You can ask for the deletion of your account and data through the Contact page.</li></ul>`);
R.terms = (app) => prose(app, "Terms", `<h1 class="gt">Terms of Use</h1><p>You must follow the <a class="tag" href="#/rules">Community Rules</a>. You keep the rights to what you post and grant the platform permission to display it. Do not upload content you do not have the right to share. Accounts that break the rules can be muted, suspended or banned. The platform is provided as is, by fans, for fans.</p>`);
R.contact = (app) => prose(app, "Contact", `<h1 class="gt">Contact</h1><p>For moderation issues use the 🚨 Report button on any post, comment, message or profile — it reaches the moderators directly.</p><p>For copyright removal requests, account deletion or anything else, message the administrator: <a class="tag" href="#/u/ADMIN">@ADMIN</a>.</p>`);
R.notfound = (app) => page(app, "Not found", `<div class="sec">${empty("🛰️", "This page drifted out of Bilal’s World.", `<div style="margin-top:14px"><a class="btn pri" href="#/home">Back home</a></div>`)}</div>`);
