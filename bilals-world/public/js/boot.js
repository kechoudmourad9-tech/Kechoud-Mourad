/* Bilal's World — boot */
BW.boot = async (reload) => {
  const [me, meta] = await Promise.all([GET("/auth/me").catch(() => ({ user: null })), BW.meta && !reload ? BW.meta : GET("/meta").catch(() => null)]);
  BW.me = me.user; BW.meta = meta || BW.meta; if (BW.me) BW.connect();
};
BW.boot().then(() => { if (!location.hash) history.replaceState(null, "", "#/home"); BW.render(); });
