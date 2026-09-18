/*
 * Cursive pixel loader.
 *
 * From Feb to Sep 2026 the dashboard handed customers a branded loader:
 *   (function(c,u,r,s,i,v,e){...})(window,document,'script','https://cdn.meetcursive.com/pixel.js','cursive');
 *   cursive('init', '<pixel_id>');
 * That snippet is on live customer sites. This file makes it work: it reads the
 * queued init call and loads the workspace's real identity script, which
 * /api/pixel/script/<pixel_id> resolves (302 to the provisioned install_url).
 */
(function (w, d) {
  var api = w.cursive;
  if (!api || api.__loaded) return;
  var queue = api.q || [];
  var origin = 'https://leads.meetcursive.com';
  try {
    if (d.currentScript && d.currentScript.src) origin = new URL(d.currentScript.src).origin;
  } catch (e) { /* keep default origin */ }

  var loaded = {};
  function load(id) {
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || loaded[id]) return;
    loaded[id] = true;
    var s = d.createElement('script');
    s.async = true;
    s.src = origin + '/api/pixel/script/' + encodeURIComponent(id);
    var first = d.getElementsByTagName('script')[0];
    if (first && first.parentNode) first.parentNode.insertBefore(s, first);
    else (d.head || d.documentElement).appendChild(s);
  }

  function handle(args) {
    if (args && args[0] === 'init') load(args[1]);
  }

  for (var i = 0; i < queue.length; i++) handle(queue[i]);
  var next = function () { handle(arguments); };
  next.q = queue;
  next.__loaded = true;
  w.cursive = next;
})(window, document);
