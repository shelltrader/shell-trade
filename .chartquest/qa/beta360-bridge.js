(function () {
  'use strict';

  function reject(reason) {
    try { window.QABeta360Rejected = String(reason); } catch (_) {}
  }
  const host = String(location.hostname || '').toLowerCase();
  if (!(host === '127.0.0.1' || host === 'localhost' || host === '::1')) return reject('not loopback');
  if (location.protocol !== 'http:') return reject('not loopback HTTP');
  if (window._CQ_DEV !== true) return reject('development guard is off');
  if (!window.QA || typeof window.QA.boot !== 'function') return reject('canonical QA bridge unavailable');
  if (window.parent === window) return reject('harness parent required');
  try {
    if (window.parent.location.origin !== location.origin) return reject('cross-origin parent');
  } catch (_) {
    return reject('parent origin unreadable');
  }
  if (!/[?&]qa=1(?:&|$)/.test(location.search) || /[?&]fresh=1(?:&|$)/.test(location.search)) {
    return reject('unsafe QA URL');
  }

  const runtimeErrors = Array.isArray(window.__BETA360_EARLY_ERRORS__)
    ? window.__BETA360_EARLY_ERRORS__ : [];
  const consoleErrors = Array.isArray(window.__BETA360_CONSOLE_ERRORS__)
    ? window.__BETA360_CONSOLE_ERRORS__ : [];
  window.addEventListener('error', function (event) {
    runtimeErrors.push(String(event.message || event.error || 'error'));
  });
  window.addEventListener('unhandledrejection', function (event) {
    runtimeErrors.push(String(event.reason || 'unhandled rejection'));
  });

  let lastRecord = null;
  let fixtureResolvedRecord = null;
  let caseErrorBaseline = 0;
  let fixtureSequence = 0;
  const fixtureIndexes = [];

  function nextFrame(count) {
    count = count == null ? 1 : count;
    return new Promise(function (resolve) {
      function tick() {
        if (--count <= 0) resolve();
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }
  function visible(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && +style.opacity !== 0 &&
      rect.width > 0 && rect.height > 0;
  }
  function rect(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
  }
  function zone(name) {
    try {
      const value = window.CQSAFE && window.CQSAFE.dump()[name];
      return value ? { x: value.x, y: value.y, w: value.w, h: value.h,
        sticky: !!value.sticky, pri: value.pri, f: value.f } : null;
    } catch (_) { return null; }
  }
  function intersects(a, b, pad) {
    if (!a || !b) return true;
    pad = pad || 0;
    return (a.x - pad) < (b.x + b.w) && (a.x + a.w + pad) > b.x &&
      (a.y - pad) < (b.y + b.h) && (a.y + a.h + pad) > b.y;
  }
  function finiteLevels(value) {
    return value && [value.entryH, value.slH, value.tpH].every(Number.isFinite);
  }
  function observedErrors() {
    return runtimeErrors.map(function (value) { return 'runtime: ' + value; })
      .concat(consoleErrors.map(function (value) { return 'console.error: ' + value; }));
  }
  function caseResult(id, expected, actual, pass, geometry, gaps) {
    const errors = observedErrors();
    return {
      id: id,
      expected: expected,
      actual: actual,
      pass: !!pass && errors.length === 0,
      geometry: geometry || null,
      gaps: gaps || [],
      errors: errors,
      newErrors: errors.slice(caseErrorBaseline),
      at: new Date().toISOString(),
    };
  }
  function dispatchPointer(el) {
    if (!el) return false;
    el.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
    return true;
  }
  function removeFixtures(list) {
    if (!list || !list.splice) return;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i] && list[i].__beta360Fixture) list.splice(i, 1);
    }
  }
  function cleanup() {
    try { closeReviewChart(); } catch (_) {}
    try { hideTradeIncoming(); } catch (_) {}
    try { if (panelEl && panelEl.classList.contains('open')) closePanel(); } catch (_) {}
    try { pending = null; } catch (_) {}
    try { trade = null; } catch (_) {}
    try { setupZone = null; setupFlow = null; firstTradeGuide = null; } catch (_) {}
    try { session.inModal = false; } catch (_) {}
    try { paused = false; } catch (_) {}
    try { lessonQ.length = 0; lessonOpen = false; pendingCelebration = null; } catch (_) {}
    try { quickRead.active = false; flowRead.active = false; } catch (_) {}
    try { journalOpen = false; walletOpen = false; dailyOpen = false; htfZoomState = null; bannerT = 0; } catch (_) {}
    try { const lesson = document.getElementById('lesson'); if (lesson) lesson.classList.remove('show'); } catch (_) {}
    try { const betaEnd = document.getElementById('cqBetaEnd'); if (betaEnd) betaEnd.remove(); } catch (_) {}
    try {
      session.level = 1;
      if (window.CQBeta && typeof window.CQBeta.reset === 'function') window.CQBeta.reset();
    } catch (_) {}
    try { if (closeBtnEl) closeBtnEl.style.display = 'none'; } catch (_) {}
    try { const hold = document.getElementById('holdPlanBtn'); if (hold) hold.style.display = 'none'; } catch (_) {}
    try {
      tradeFx.splice(0); floaters.splice(0); boxFx.splice(0); rings.splice(0);
      coins.splice(0); portals.splice(0);
      walletDisplay = -1; flashT = 0; shakeT = 0; winPunchT = 0;
      tradeOpenT = 0; scareHeart = 0; portalWarp = null;
    } catch (_) {}
    try {
      turtle.tucked = false; turtle.spinning = false; turtle.halt = false;
      if (![turtle.x, turtle.y, turtle.vx, turtle.vy].every(Number.isFinite)) spawnTurtle();
    } catch (_) {}
    try { removeFixtures(boxes); removeFixtures(wisdomPages); } catch (_) {}
    try {
      for (const idx of fixtureIndexes.splice(0)) {
        const at = wisdomFound.indexOf(idx);
        if (at >= 0) wisdomFound.splice(at, 1);
      }
    } catch (_) {}
  }

  async function resetWorld() {
    cleanup();
    window.QA.boot();
    await nextFrame(2);
    cleanup();
  }

  function pickCandle() {
    if (!candles || !candles.length) {
      initCandles();
      prePopulateHTF(MARKET_DATA);
    }
    return Math.max(0, Math.min(candles.length - 1, candles.length - 2));
  }
  function stagePanel(level) {
    cleanup();
    introFlow.active = false;
    firstTradeGuide = null;
    session.level = level == null ? 4 : level;
    session.tradeLog = session.tradeLog || [];
    player.shells = Math.max(player.shells || 0, 2000);
    paused = false;
    const index = pickCandle();
    const candle = candles[index];
    lastSetupIdx = index;
    setupZone = { from: candle.id, to: candle.id, dir: 'long', type: 'momentum', quality: 'B' };
    setupBannerMaxCandleId = maxSeenCandleId;
    uiTapGuard = 0;
    openPanel();
    const longButton = document.getElementById('btnLong');
    if (longButton) longButton.click();
    const amount = document.getElementById('riskAmt');
    if (amount) amount.value = '50';
    try { refreshPanel(); } catch (_) {}
    return { index: index, panel: document.getElementById('tradePanel') };
  }
  async function commitFixtureTrade(level, freeze) {
    const staged = stagePanel(level);
    const confirm = document.getElementById('btnConfirm');
    if (confirm) confirm.click();
    if (freeze) paused = true;
    if (!freeze) await nextFrame(3);
    return staged;
  }
  function latestRecord() {
    const rows = session && session.tradeLog;
    return rows && rows.length ? rows[rows.length - 1] : null;
  }
  function resolveFixture(action) {
    const savedAutoReplay = autoOpenTradeReplay;
    const savedFirstWin = firstWinCelebrated;
    fixtureResolvedRecord = null;
    autoOpenTradeReplay = function (record) { fixtureResolvedRecord = record; };
    firstWinCelebrated = true;
    try { return action(); }
    finally {
      autoOpenTradeReplay = savedAutoReplay;
      firstWinCelebrated = savedFirstWin;
    }
  }
  function fixtureCandles(count) {
    const rows = [];
    let close = 300;
    for (let i = 0; i < count; i++) {
      const open = close;
      close += i % 3 === 0 ? 18 : i % 3 === 1 ? -7 : 12;
      rows.push({ open: open, h: close, wick: 3, wick2: 2,
        color: close >= open ? 'green' : 'red', vwap: 300 + i, ob: i === 4, bos: i === 8 });
    }
    return rows;
  }
  function fixtureRecord(result, delta) {
    const rows = fixtureCandles(16);
    return {
      dir: 'long', result: result, delta: delta,
      entryH: rows[7].h, slH: rows[7].h - 60, tpH: rows[7].h + 120,
      entryPrice: 100, candleSnap: rows.slice(), snapEntryIdx: 7,
      replay: { candles: rows.slice(), entryIdx: 7 }, rr: 2,
      setupType: 'momentum', quality: 'B', grade: 'B', feedback: 'QA fixture',
    };
  }

  async function F1() {
    window.QA.boot();
    await nextFrame(3);
    const canvas = document.getElementById('game');
    const auth = document.getElementById('authOverlay');
    const faction = document.getElementById('factionOverlay');
    const build = window.CQOPS && window.CQOPS.build;
    const actual = {
      dev: window._CQ_DEV === true,
      qa: !!window.QA,
      build: build && build.number,
      sourceHash: (document.querySelector('meta[name="beta360-canonical-sha256"]') || {}).content || null,
      networkPolicy: (document.querySelector('meta[name="beta360-network-policy"]') || {}).content || null,
      canvasCss: canvas ? [canvas.clientWidth, canvas.clientHeight] : null,
      canvasBacking: canvas ? [canvas.width, canvas.height] : null,
      dpr: devicePixelRatio || 1,
      authHidden: !visible(auth),
      factionHidden: !visible(faction),
      errors: observedErrors(),
    };
    const dimensions = canvas && Math.abs(canvas.width - canvas.clientWidth * actual.dpr) <= 1 &&
      Math.abs(canvas.height - canvas.clientHeight * actual.dpr) <= 1;
    return caseResult('F1', 'dev QA build 362, valid canvas, no walls/errors', actual,
      actual.dev && actual.qa && actual.build === 362 && dimensions &&
      actual.authHidden && actual.factionHidden && actual.errors.length === 0);
  }

  async function F2() {
    await commitFixtureTrade();
    const close = document.getElementById('closeTradeBtn');
    const panel = document.getElementById('tradePanel');
    const bounds = finiteLevels(trade) && trade.slH >= CFG.levelMin + 8 &&
      trade.tpH <= CFG.levelMax - 8 && trade.slH < trade.entryH && trade.entryH < trade.tpH;
    const actual = {
      trade: trade ? { dir: trade.dir, entryH: trade.entryH, slH: trade.slH, tpH: trade.tpH } : null,
      pending: !!pending,
      panelOpen: !!(panel && panel.classList.contains('open')),
      active: tradeInProgress(),
      closeVisible: visible(close),
      closeRect: rect(close),
    };
    return caseResult('F2', 'genuine commit opens a bounded long trade and visible close control',
      actual, !!trade && bounds && !actual.pending && !actual.panelOpen && actual.active && actual.closeVisible);
  }

  async function F3() {
    async function closeAt(rMultiple) {
      await commitFixtureTrade();
      const risk = Math.max(1, Math.abs(trade.entryH - trade.slH));
      const direction = trade.dir === 'long' ? 1 : -1;
      trade.lastPrice = trade.entryH + direction * risk * rMultiple;
      const button = document.getElementById('closeTradeBtn');
      const buttonWasVisible = visible(button);
      const buttonRect = rect(button);
      const pressed = buttonWasVisible && resolveFixture(function () { return dispatchPointer(button); });
      await nextFrame(2);
      const record = fixtureResolvedRecord || latestRecord();
      const summary = record ? tradeChartSVGFull(record, {}) : '';
      const replay = record && record.replay ? tradeReplaySVG(record, record.replay.candles.length) : '';
      const outcome = record ? tradeOutcomeDisplay(record.result, record.delta) : null;
      const journalRow = journal && journal.length ? journal[0] : null;
      return {
        record: record,
        pressed: pressed,
        buttonWasVisible: buttonWasVisible,
        buttonRect: buttonRect,
        result: record && record.result,
        delta: record && record.delta,
        journalDelta: journalRow && journalRow.delta,
        replayCount: record && record.replay && record.replay.candles.length,
        tone: outcome && outcome.toneName,
        sign: outcome && outcome.sign,
        value: outcome && outcome.value,
        closedEarly: /CLOSED EARLY/.test(summary) && /CLOSED EARLY/.test(replay),
        manualCopy: /closed it yourself|closed it early|closed at break even/i.test(summary),
        falseStopClaim: /hit your Stop Loss|STOPPED OUT|STOP HIT/.test(summary),
        inventedSignedZero: /CLOSED EARLY[^<]{0,40}[+−]0(?:\D|$)/.test(summary) ||
          /CLOSED EARLY[^<]{0,40}[+−]0(?:\D|$)/.test(replay),
      };
    }

    const positive = await closeAt(0.75);
    const negative = await closeAt(-0.40);
    const flat = await closeAt(0);
    lastRecord = positive.record;
    delete positive.record;
    delete negative.record;
    delete flat.record;
    const positivePass = positive.pressed && positive.buttonWasVisible &&
      positive.result === 'manual' && positive.delta > 0.5 && positive.replayCount > 0 &&
      positive.tone === 'win' && positive.sign === '+' && positive.closedEarly &&
      positive.manualCopy && !positive.falseStopClaim;
    const negativePass = negative.pressed && negative.buttonWasVisible &&
      negative.result === 'manual' && negative.delta < -0.5 && negative.replayCount > 0 &&
      negative.tone === 'loss' && negative.sign === '−' && negative.closedEarly &&
      negative.manualCopy && !negative.falseStopClaim;
    const flatPass = flat.pressed && flat.buttonWasVisible && flat.result === 'manual' &&
      Math.abs(flat.delta) <= 0.5 && flat.journalDelta === 0 && flat.replayCount > 0 &&
      flat.tone === 'flat' && flat.sign === '' && flat.value === 0 && flat.closedEarly &&
      flat.manualCopy && !flat.falseStopClaim && !flat.inventedSignedZero;
    const actual = { positive: positive, negative: negative, flat: flat };
    return caseResult('F3',
      'visible close control records truthful positive, negative, and break-even manual outcomes',
      actual, positivePass && negativePass && flatPass,
      { positiveButton: positive.buttonRect, negativeButton: negative.buttonRect, flatButton: flat.buttonRect });
  }

  async function F4() {
    await commitFixtureTrade();
    trade._l1Outcome = 'loss';
    trade._drivePhase = 'stopout';
    trade._nCand = MIN_TRADE_CANDLES;
    trade._phaseT = 1;
    market.level = trade.dir === 'long' ? trade.slH + TMB * 1.5 : trade.slH - TMB * 1.5;
    const before = { dir: trade.dir, slH: trade.slH, tpH: trade.tpH };
    let deciding = null, touched = false, ended = false;
    for (let i = 0; i < 8 && trade; i++) {
      const open = market.level;
      const candle = tradeDrivenCandle();
      candle.open = open;
      trade.lastPrice = candle.h;
      trade.path.push(candle);
      const bar = { open: candle.open, h: candle.h, wick: candle.wick, wick2: candle.wick2 };
      touched = CQ.priceTouched(bar, before.slH, before.dir, 'sl');
      ended = resolveFixture(function () { return tradeTouchCheck(candle); });
      if (touched) deciding = candle;
    }
    await nextFrame(2);
    const record = fixtureResolvedRecord || latestRecord();
    lastRecord = record;
    const summary = record ? tradeChartSVGFull(record, {}) : '';
    const actual = {
      touched: touched, ended: ended, deciding: deciding,
      result: record && record.result, delta: record && record.delta,
      replayCount: record && record.replay && record.replay.candles.length,
      stopCopy: /hit your Stop Loss/.test(summary),
      manualCopy: /closed it yourself|CLOSED EARLY/i.test(summary),
    };
    return caseResult('F4', 'authored loss candle ends only through tradeTouchCheck at the stop',
      actual, touched && ended && !!deciding && actual.result === 'loss' &&
      actual.delta < 0 && actual.replayCount > 0 && actual.stopCopy && !actual.manualCopy);
  }

  async function F5() {
    cleanup();
    const record = lastRecord || fixtureRecord('manual', 12);
    lastRecord = record;
    const introSnapshot = Object.assign({}, introFlow);
    const lieBefore = new Set(portals.filter(function (portal) { return portal && portal.label === 'THE LIE'; }));
    const practiceBefore = document.getElementById('cqPractice');
    let reviewToken = 0;
    try {
      lessonQ.length = 0; lessonOpen = false; pendingCelebration = null;
      introFlow.active = true; introFlow.phase = 'run'; introFlow.firstTradeDone = true;
      introFlow.awaitingTrade = false; introFlow.exploreBreather = false; introFlow.exploreConcept = null;
      introFlow.learnStarted = true; introFlow._proveRepPending = false; introFlow.bossPortalUp = false;
      const chart = document.getElementById('chartFull');
      const invokedAt = performance.now();
      reviewToken = autoOpenTradeReplay(record) || 0;
      waitThenIntroBoss(reviewToken); // exact real resolve ordering: replay poller first, intro wait second
      const openDeadline = invokedAt + 4000;
      while (!chart.classList.contains('open') && performance.now() < openDeadline) await delay(50);
      const openedAt = chart.classList.contains('open') ? performance.now() : null;
      const openedReplay = openedAt !== null && reviewMode === 'replay' && !!replayTimer;
      const replayBudget = Math.max(6000, record.replay.candles.length * 300 + 2500);
      const detailsDeadline = performance.now() + replayBudget;
      while (openedReplay && reviewMode !== 'details' && performance.now() < detailsDeadline) await delay(100);
      await delay(2500); // longer than the old blind 2.2s timer: prove must still be held by the open token
      const lieDuring = portals.some(function (portal) {
        return portal && portal.label === 'THE LIE' && !lieBefore.has(portal);
      });
      const practiceDuring = visible(document.getElementById('cqPractice'));
      const phaseDuringReview = introFlow.phase;
      const finalModeBeforeClose = reviewMode;
      const timerStoppedBeforeClose = replayTimer === null;
      const detailsVisible = /WHAT HAPPENED/.test(document.getElementById('cfChart').textContent || '');
      const exactReviewOwner = reviewEntry === record && _postTradeReviewOpen === reviewToken;
      const heldDuringReview = phaseDuringReview === 'run' && !introFlow._proveRepPending &&
        !lieDuring && !practiceDuring && postTradeReviewInProgress(reviewToken);
      const closeButton = document.querySelector('#chartFull .uxX');
      const closeRect = rect(closeButton);
      const hit = closeButton && closeRect
        ? document.elementFromPoint(closeRect.x + closeRect.w / 2, closeRect.y + closeRect.h / 2) : null;
      const closedByX = hit === closeButton && dispatchPointer(closeButton);
      const advanceDeadline = performance.now() + 3500;
      while (introFlow.phase === 'run' && performance.now() < advanceDeadline) await delay(50);
      const newLieAfter = portals.some(function (portal) {
        return portal && portal.label === 'THE LIE' && !lieBefore.has(portal);
      });
      const practiceAfter = visible(document.getElementById('cqPractice'));
      const advancedAfterClose = introFlow.phase === 'prove' &&
        (!!introFlow._proveRepPending || newLieAfter || practiceAfter);
      const actual = {
        invokedGenuineAutoReplay: true, exactIntroWaitInvoked: true, reviewToken: reviewToken,
        openedReplay: openedReplay, openedAfterMs: openedAt === null ? null : Math.round(openedAt - invokedAt),
        honoredPunchGate: openedAt !== null && openedAt - invokedAt >= 1100,
        finalModeBeforeClose: finalModeBeforeClose, timerStoppedBeforeClose: timerStoppedBeforeClose,
        detailsVisible: detailsVisible, exactReviewOwner: exactReviewOwner,
        heldDuringReview: heldDuringReview,
        phaseDuringReview: phaseDuringReview, lieDuringReview: lieDuring,
        practiceDuringReview: practiceDuring, closeHit: hit === closeButton,
        closeHitTag: hit && hit.tagName, closeHitId: hit && hit.id,
        closeHitClass: hit && hit.className, closeHitText: hit && hit.textContent && hit.textContent.trim(),
        closeHitZ: hit ? getComputedStyle(hit).zIndex : null,
        closeHitPointerEvents: hit ? getComputedStyle(hit).pointerEvents : null,
        closeButtonZ: closeButton ? getComputedStyle(closeButton).zIndex : null,
        closeButtonPointerEvents: closeButton ? getComputedStyle(closeButton).pointerEvents : null,
        closedByX: closedByX,
        chartOpenAfterX: chart.classList.contains('open'),
        tokenActiveAfterX: postTradeReviewInProgress(reviewToken),
        advancedAfterClose: advancedAfterClose, phaseAfterClose: introFlow.phase,
        downstreamArmedAfterClose: !!introFlow._proveRepPending || newLieAfter || practiceAfter,
        replayCount: record.replay.candles.length,
      };
      return caseResult('F5',
        'exact trade-3 order reaches real replay/details, holds THE LIE, then advances only after real X',
        actual, reviewToken > 0 && actual.openedReplay && actual.honoredPunchGate &&
          actual.finalModeBeforeClose === 'details' && actual.timerStoppedBeforeClose &&
          actual.detailsVisible && actual.exactReviewOwner && actual.heldDuringReview && !actual.lieDuringReview &&
          !actual.practiceDuringReview && actual.closeHit && actual.closedByX &&
          !actual.chartOpenAfterX && !actual.tokenActiveAfterX && actual.advancedAfterClose &&
          actual.downstreamArmedAfterClose,
        { close: closeRect });
    } finally {
      introFlow.active = false;
      cancelPostTradeReview(reviewToken);
      await delay(250); // let any pending waitThenIntroBoss poll observe the explicit abort
      for (let i = portals.length - 1; i >= 0; i--) {
        if (portals[i] && portals[i].label === 'THE LIE' && !lieBefore.has(portals[i])) portals.splice(i, 1);
      }
      const practice = document.getElementById('cqPractice');
      if (practice && practice !== practiceBefore) practice.remove();
      cleanup();
      Object.keys(introFlow).forEach(function (key) { if (!(key in introSnapshot)) delete introFlow[key]; });
      Object.assign(introFlow, introSnapshot);
    }
  }

  async function F6() {
    cleanup();
    const record = fixtureRecord('manual', 12);
    openReviewChart(record, false);
    startReplay();
    await nextFrame(2);
    const chart = document.getElementById('chartFull');
    const button = document.querySelector('#chartFull .uxX');
    const r = button.getBoundingClientRect();
    const buttonRectBefore = rect(button);
    const chartOpenBefore = chart.classList.contains('open');
    const buttonVisibleBefore = visible(button);
    const legend = document.getElementById('cfLegend');
    const hit = buttonVisibleBefore
      ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
    const pressed = hit === button && dispatchPointer(button);
    await nextFrame(2);
    const actual = {
      chartOpenBefore: chartOpenBefore, buttonVisibleBefore: buttonVisibleBefore, pressed: pressed,
      hitTag: hit && hit.tagName, hitId: hit && hit.id, hitClass: hit && hit.className,
      buttonZ: getComputedStyle(button).zIndex,
      legendZ: legend ? getComputedStyle(legend).zIndex : null,
      legendPointerEvents: legend ? getComputedStyle(legend).pointerEvents : null,
      buttonPointerEvents: getComputedStyle(button).pointerEvents,
      chartOpen: chart.classList.contains('open'),
      legendOn: legend.classList.contains('on'),
      timer: replayTimer !== null, review: !!reviewEntry, autoDetails: !!_replayAutoDetails,
      safeLegend: zone('cfLegend'), buttonRectBefore: buttonRectBefore,
    };
    return caseResult('F6', 'X wins hit test and central teardown clears every lifecycle owner',
      actual, actual.chartOpenBefore && actual.buttonVisibleBefore && actual.pressed &&
      hit === button && !actual.chartOpen && !actual.legendOn &&
      !actual.timer && !actual.review && !actual.autoDetails && !actual.safeLegend,
      { x: buttonRectBefore });
  }

  async function F7() {
    await commitFixtureTrade();
    const id = ++fixtureSequence;
    const absentIndexes = [];
    for (let i = WISDOM.length - 1; i >= 0 && absentIndexes.length < 2; i--) {
      if (!wisdomFound.includes(i) && !fixtureIndexes.includes(i)) absentIndexes.push(i);
    }
    if (absentIndexes.length < 2) {
      return caseResult('F7', 'two unused valid wisdom indices exist for isolated fixtures',
        { unusedIndexes: absentIndexes, foundCount: wisdomFound.length }, false, null,
        ['Disposable QA origin unexpectedly has fewer than two unused wisdom indices.']);
    }
    const tx = turtle.x + turtle.w / 2, ty = turtle.y + turtle.h / 2;
    const box = { x: tx, y: ty, w: 34, premium: false, broken: false, breakT: 0,
      bob: 0, glow: 0, rot: 0, orb: 0, excite: 0, __beta360Fixture: id };
    const clue = { idx: absentIndexes[0], kind: 'hidden', state: 'clue', x: tx, y: ty, tipY: ty, clear: 100,
      cid: -1, bobT: 0, revealT: 0, collected: false, flyT: 0, __beta360Fixture: id };
    const live = { idx: absentIndexes[1], kind: 'easy', state: 'live', x: tx, y: ty, tipY: ty, clear: 100,
      cid: -1, bobT: 0, revealT: 0, collected: false, flyT: 0, __beta360Fixture: id };
    fixtureIndexes.push(clue.idx, live.idx);
    boxes.push(box); wisdomPages.push(clue, live);
    const shellsBefore = player.shells, collectedBefore = session.collected;
    turtle.tucked = true;
    updateBoxes(0.016, tx, ty);
    updateWisdomPages(0.016, tx, ty);
    const during = {
      box: box.broken, clue: clue.state, live: live.collected,
      boxPresent: boxes.includes(box), pagesPresent: wisdomPages.includes(clue) && wisdomPages.includes(live),
      shellDelta: player.shells - shellsBefore, collectedDelta: session.collected - collectedBefore,
    };
    trade.lastPrice = trade.entryH;
    const closeButton = document.getElementById('closeTradeBtn');
    const closeWasVisible = visible(closeButton);
    const closed = closeWasVisible && resolveFixture(function () { return dispatchPointer(closeButton); });
    turtle.tucked = true;
    updateBoxes(0.016, tx, ty);
    updateWisdomPages(0.016, tx, ty);
    const afterFirst = {
      box: box.broken, clue: clue.state, live: live.collected,
      shellDelta: player.shells - shellsBefore,
      collectedDelta: session.collected - collectedBefore,
      foundClue: wisdomFound.filter(function (x) { return x === clue.idx; }).length,
      foundLive: wisdomFound.filter(function (x) { return x === live.idx; }).length,
    };
    turtle.tucked = true;
    updateBoxes(0.016, tx, ty);
    updateWisdomPages(0.016, tx, ty);
    const afterSecond = {
      box: box.broken, clue: clue.state, clueCollected: clue.collected, live: live.collected,
      shellDelta: player.shells - shellsBefore,
      collectedDelta: session.collected - collectedBefore,
      foundClue: wisdomFound.filter(function (x) { return x === clue.idx; }).length,
      foundLive: wisdomFound.filter(function (x) { return x === live.idx; }).length,
    };
    updateBoxes(0.016, tx, ty);
    updateWisdomPages(0.016, tx, ty);
    const afterRepeat = {
      shellDelta: player.shells - shellsBefore,
      collectedDelta: session.collected - collectedBefore,
      foundClue: wisdomFound.filter(function (x) { return x === clue.idx; }).length,
      foundLive: wisdomFound.filter(function (x) { return x === live.idx; }).length,
      boxPresent: boxes.includes(box),
      pagesPresent: wisdomPages.includes(clue) && wisdomPages.includes(live),
    };
    const pass = !during.box && during.clue === 'clue' && !during.live &&
      during.boxPresent && during.pagesPresent && during.shellDelta === 0 &&
      during.collectedDelta === 0 && closeWasVisible && closed &&
      afterFirst.box && afterFirst.clue === 'revealed' && !afterFirst.foundClue &&
      afterFirst.live && afterFirst.foundLive === 1 && afterFirst.shellDelta === 1 &&
      afterFirst.collectedDelta === 1 && afterSecond.clueCollected &&
      afterSecond.foundClue === 1 && afterSecond.foundLive === 1 &&
      afterSecond.shellDelta === 1 && afterSecond.collectedDelta === 1 &&
      afterRepeat.foundClue === 1 && afterRepeat.foundLive === 1 &&
      afterRepeat.shellDelta === 1 && afterRepeat.collectedDelta === 1;
    return caseResult('F7',
      'same box/pages defer during trade, then reward/reveal/collect exactly once after close',
      { fixtureIndexes: { clue: clue.idx, live: live.idx },
        closeWasVisible: closeWasVisible, closed: closed, during: during,
        afterFirst: afterFirst, afterSecond: afterSecond, afterRepeat: afterRepeat }, pass);
  }

  async function C1() {
    cleanup();
    const oldLevel = session.level;
    const oldOpts = {};
    LEGEND_ITEMS.forEach(function (item) { oldOpts[item.key] = reviewOpts[item.key]; reviewOpts[item.key] = true; });
    try {
      session.level = 10;
      const record = fixtureRecord('manual', 0);
      openReviewChart(record, false);
      showReviewDetails();
      await nextFrame(3);
      const legend = document.getElementById('cfLegend');
      const buttons = legend ? Array.from(legend.querySelectorAll('button')) : [];
      const legendButtons = buttons.length;
      const toggleKeys = buttons.filter(function (button) {
        return button.getAttribute('data-act') === 'toggle';
      }).map(function (button) { return button.getAttribute('data-key'); });
      const allToggles = LEGEND_ITEMS.every(function (item) { return toggleKeys.includes(item.key); });
      const expectedButtons = LEGEND_ITEMS.length + 1; // four toggles plus REPLAY
      const legendRows = new Set(buttons.map(function (button) {
        return Math.round(button.getBoundingClientRect().top);
      })).size;
      const texts = Array.from(document.querySelectorAll('#cfChart svg text'));
      const frame = Array.from(document.querySelectorAll('#cfChart svg rect')).find(function (el) {
        return el.getAttribute('x') === '10' && el.getAttribute('width') === '370' && el.getAttribute('rx') === '4';
      });
      const headline = texts.find(function (el) { return /LONG|SHORT/.test(el.textContent || ''); });
      const badge = texts.find(function (el) { return /CLOSED EARLY|WIN|LOSS/.test(el.textContent || ''); });
      const lr = rect(legend), hr = rect(headline), br = rect(badge), fr = rect(frame), safe = zone('cfLegend');
      const registryMatch = !!(lr && safe && Math.abs(lr.x - safe.x) <= 1 &&
        Math.abs(lr.y - safe.y) <= 1 && Math.abs(lr.w - safe.w) <= 1 && Math.abs(lr.h - safe.h) <= 1);
      const positiveChart = !!(frame && Number(frame.getAttribute('height')) > 0 && fr && fr.h > 20);
      const pass = visible(legend) && legendButtons === expectedButtons && allToggles && legendRows === 1 &&
        registryMatch && positiveChart && hr && br &&
        hr.y >= lr.bottom - 1 && br.y >= lr.bottom - 1 && visible(document.getElementById('cfChart'));
      return caseResult('C1', 'Level-10 maximum legend clears summary headline/result', {
        level: session.level, legendButtons: legendButtons, expectedButtons: expectedButtons,
        toggleKeys: toggleKeys, allToggles: allToggles, legendRows: legendRows, positiveChart: positiveChart,
        legendVisible: visible(legend), registryMatch: registryMatch,
        headlineBelow: hr && hr.y >= lr.bottom - 1, badgeBelow: br && br.y >= lr.bottom - 1,
      }, pass, { legend: lr, registry: safe, headline: hr, badge: br, chart: fr });
    } finally {
      session.level = oldLevel;
      LEGEND_ITEMS.forEach(function (item) { reviewOpts[item.key] = oldOpts[item.key]; });
    }
  }

  async function C2() {
    await resetWorld();
    // Closed-beta acceptance is Level 1. Prepare the deterministic ticket at that tier so the
    // beta guard cannot race a temporary higher level and the beginner-safe chip is the real one
    // under test. The longer Level-5+ RISK/TARGET chip remains a documented post-beta case.
    await commitFixtureTrade(1, true);
    const prepared = {
      trade: !!trade, pending: !!pending, level: session.level, paused: !!paused,
      panelOpen: !!(document.getElementById('tradePanel') && document.getElementById('tradePanel').classList.contains('open')),
    };
    render(); render();
    await nextFrame(2);
    const banner = zone('tradeBanner'), price = zone('marketPrice'), wallet = zone('wallet');
    const inBounds = banner && banner.x >= 0 && banner.y >= 0 &&
      banner.x + banner.w <= W && banner.y + banner.h <= H;
    const pass = !!(banner && price && wallet && inBounds &&
      !intersects(banner, price, 4) && !intersects(banner, wallet, 4));
    return caseResult('C2', 'Level-1 trade chip stays in bounds and clears hard price/wallet zones by 4px', {
      prepared: prepared, zonesPresent: !!(banner && price && wallet), inBounds: !!inBounds,
      clearsPrice: !intersects(banner, price, 4), clearsWallet: !intersects(banner, wallet, 4),
    }, pass, { banner: banner, price: price, wallet: wallet, stage: { w: W, h: H } });
  }

  async function C3() {
    await resetWorld();
    const oldIntro = introFlow.active, oldPhase = introFlow.phase, oldCoach = coach.active;
    introFlow.active = true; introFlow.phase = 'run'; coach.active = true;
    render();
    drawIntroRunOverlay(0);
    await nextFrame(1);
    const way = zone('thisWay'), axis = zone('priceAxis');
    const pass = !!(way && axis && !intersects(way, axis, 4) &&
      way.x >= 0 && way.x + way.w <= W);
    introFlow.active = oldIntro; introFlow.phase = oldPhase; coach.active = oldCoach;
    return caseResult('C3', 'THIS WAY clears price-axis gutter by 4px', {
      zonesPresent: !!(way && axis), clear: !intersects(way, axis, 4),
    }, pass, { thisWay: way, priceAxis: axis, stage: { w: W, h: H } });
  }

  async function C4() {
    await resetWorld();
    showTradeIncoming();
    const notice = document.getElementById('tradeIncoming');
    const firstNotice = visible(notice);
    const first = stagePanel();
    const noticeAfterTicket = visible(notice);
    const ticketAfterNotice = first.panel.classList.contains('open');
    cleanup();
    const second = stagePanel();
    showTradeIncoming();
    const noticeOverTicket = visible(notice);
    const retryWhileTicket = !!window._tiRetry;
    const confirm = document.getElementById('btnConfirm');
    if (confirm) confirm.click();
    await delay(650);
    const noticeAfterCommit = visible(notice);
    const retryAfterCommit = !!window._tiRetry;
    const actual = {
      noticeFirstVisible: firstNotice,
      ticketAfterNotice: ticketAfterNotice,
      noticeAfterTicket: noticeAfterTicket,
      ticketFirstVisible: second.panel.classList.contains('open') || !!trade,
      noticeOverTicket: noticeOverTicket,
      retryWhileTicket: retryWhileTicket,
      noticeAfterCommit: noticeAfterCommit,
      retryAfterCommit: retryAfterCommit,
    };
    return caseResult('C4', 'both event orders remain mutually exclusive through commit/retry window',
      actual, firstNotice && ticketAfterNotice && !noticeAfterTicket &&
      !noticeOverTicket && !retryWhileTicket && !noticeAfterCommit && !retryAfterCommit);
  }

  const CASES = Object.freeze({ F1: F1, F2: F2, F3: F3, F4: F4, F5: F5, F6: F6, F7: F7,
    C1: C1, C2: C2, C3: C3, C4: C4 });
  async function run(id) {
    const fn = CASES[id];
    if (!fn) return caseResult(id, 'known case', { error: 'unknown case' }, false);
    caseErrorBaseline = observedErrors().length;
    try { return await fn(); }
    catch (error) {
      return caseResult(id, 'case completes without exception',
        { error: String(error && error.stack || error) }, false);
    }
  }
  function info() {
    return {
      version: 1,
      cases: Object.keys(CASES),
      build: window.CQOPS && window.CQOPS.build,
      sourceHash: (document.querySelector('meta[name="beta360-canonical-sha256"]') || {}).content || null,
      networkPolicy: (document.querySelector('meta[name="beta360-network-policy"]') || {}).content || null,
      errors: runtimeErrors.slice(),
    };
  }
  window.QABeta360 = Object.freeze({ version: 1, info: info, run: run, cleanup: cleanup });
})();
