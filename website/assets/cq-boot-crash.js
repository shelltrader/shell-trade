/* ChartQuest earliest-crash capture. Inline this at the top of every production page. */
(function(){
  var Q = (window.__cqTrackQueue = window.__cqTrackQueue || []), n = 0, sent = false;
  var PENDING = 'cq_bt_pending';
  function cap(m, w) {
    if (n++ > 2) return;
    Q.push({ name: 'crash', props: { kind: 'boot', message: String(m || '').slice(0, 500), where: w || '' }, t: Date.now() });
  }
  function readPending() {
    try { var value = JSON.parse(localStorage.getItem(PENDING) || '[]'); return Array.isArray(value) ? value : []; }
    catch (e) { return []; }
  }
  function writePending(rows) {
    try {
      if (rows.length) localStorage.setItem(PENDING, JSON.stringify(rows));
      else localStorage.removeItem(PENDING);
      return true;
    } catch (e) { return false; }
  }
  function persist(rows) {
    var queue = readPending(), seen = {};
    queue.forEach(function (row) { seen[row.event_id] = true; });
    rows.forEach(function (row) { if (!seen[row.event_id]) queue.push(row); });
    writePending(queue);
  }
  function acknowledged(response, count) {
    if (!response || !response.ok) return Promise.resolve(false);
    var type = response.headers && response.headers.get ? String(response.headers.get('Content-Type') || '') : '';
    if (type.toLowerCase().indexOf('application/json') === -1) return Promise.resolve(false);
    return response.json().then(function (receipt) {
      return !!receipt && receipt.ok === true && Number(receipt.written) === count;
    }).catch(function () { return false; });
  }
  function drain() {
    var rows = readPending().slice(0, 40);
    if (!rows.length) return;
    fetch('/api/beta-ingest', {
      method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'events', rows: rows })
    }).then(function (response) { return acknowledged(response, rows.length); }).then(function (ok) {
      if (!ok) return;
      var done = {}; rows.forEach(function (row) { done[row.event_id] = true; });
      writePending(readPending().filter(function (row) { return !done[row.event_id]; }));
      if (readPending().length) setTimeout(drain, 0);
    }).catch(function () {});
  }
  try {
    addEventListener('error', function (e) { cap(e && e.message, e && e.filename ? e.filename + ':' + e.lineno : ''); });
    addEventListener('unhandledrejection', function (e) { var r = e && e.reason; cap((r && (r.message || r)) || 'unhandledrejection', ''); });
  } catch (e) {}
  setTimeout(function () {
    try {
      if (sent || window.CQTrack || !Q.length) return;
      sent = true;
      var pid = 'anon'; try { pid = localStorage.getItem('cq_pid') || 'anon'; } catch (e) {}
      var stamp = Date.now();
      var rows = Q.slice(0, 3).map(function (q, i) {
        return { event_id: 'boot-' + stamp + '-' + i, player_id: pid, session_id: 'boot',
          name: 'crash', ts: new Date().toISOString(), props: q.props };
      });
      // Durable first. If the POST fails or its receipt is misleading, the exact rows stay for
      // CQTrack (or this tiny fallback on a later load) to retry.
      persist(rows);
      drain();
    } catch (e) {}
  }, 8000);
})();
