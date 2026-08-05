#!/usr/bin/env node
'use strict';
/*
 * ChartQuest — THE syntax check. One implementation, two callers.
 *   node scripts/check_syntax.js [file ...]      (default: chart-quest.html)
 *
 * Used by `scripts/cq.sh check` and by `scripts/verify.js` gate #3a. It exists because those two
 * had drifted into being different checks, and the weaker one was trusted:
 *
 *   `cq.sh check` used to grab the FIRST <script> and parse only that. Survivable while the game
 *   block happened to be first — then build 339 inserted window.CQOPS into <head>, ABOVE it. From
 *   that moment `check` parsed a different block and printed "✓ syntax OK" on a file whose
 *   28,000-line MAIN block did not parse at all (one unescaped apostrophe inside a BUILD_TAG
 *   closed the literal and killed the whole block). The game booted to nothing — no window.CQ, no
 *   CQREACH, not even BUILD_TAG. Only verify.js #3a caught it, because that parsed every block.
 *
 * A green check on a broken build is worse than no check, so there is now exactly one place where
 * "does this parse?" is answered, and both callers ask it.
 *
 * TOOLING ONLY — reads files, writes nothing but throwaway temporaries.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

/* Must stay identical to what both callers used before: only inline <script>…</script> blocks
   (never `<script src=…>`, which does not match), and skip trivial stubs. */
const BLOCK_RE = /<script>([\s\S]*?)<\/script>/g;
const MIN_BLOCK_CHARS = 20;

/* Parse one chunk of JS the way node itself would, without executing it.
   node --check reports against the TEMPORARY file it was handed, e.g.
       /var/folders/…/_cq_syntax_123_0.js:89
        v10: the tracker itself changed
            ^^^
       SyntaxError: Unexpected identifier 'v10'
   which is worse than useless to the reader. Pull out the line WITHIN the unit and the error
   sentence so the caller can translate them into a real position in a real file. */
function parseUnit(code, tag) {
  const tmp = path.join(os.tmpdir(), '_cq_syntax_' + process.pid + '_' + tag + '.js');
  try {
    fs.writeFileSync(tmp, code);
    cp.execSync('node --check "' + tmp + '"', { stdio: ['ignore', 'ignore', 'pipe'] });
    return { ok: true };
  } catch (e) {
    const raw = String((e && e.stderr) || e || '').trim();
    const lines = raw.split('\n');
    const lineInUnit = ((lines[0] || '').match(/:(\d+)\s*$/) || [])[1];
    const errLine = lines.find(l => /^[A-Za-z]*Error\b/.test(l.trim()));
    return {
      ok: false,
      raw,
      lineInUnit: lineInUnit ? parseInt(lineInUnit, 10) : null,
      message: (errLine || lines[0] || 'syntax error').trim(),
    };
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

/**
 * checkFile(file) → { ok, file, total, inline, index?, line?, message? }
 *   inline  true when the file was split into <script> blocks, false when checked whole
 *   index   1-based block number that failed
 *   line    line IN THE FILE where the failing block starts — "block #3" of ten is not where
 *           you want to start looking
 */
function checkFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  /* Decide by EXTENSION, never by sniffing the content for "<script>". Sniffing looked tidier and
     was wrong the first time it ran: this very file mentions <script> in its own comments and in
     BLOCK_RE, so it classified itself as HTML and reported a syntax error in "inline block #1".
     A checker that can be fooled by a comment is not a checker. */
  const inline = /\.x?html?$/i.test(file);
  /* A standalone .js (sw.js, a gate script) has no blocks — check it whole. Nothing wires this
     path into a gate yet; it is here so the next person does not write a third implementation. */
  const units = inline
    ? [...src.matchAll(BLOCK_RE)]
        .filter(m => m[1].trim().length > MIN_BLOCK_CHARS)
        .map(m => ({ code: m[1], line: src.slice(0, m.index).split('\n').length }))
    : [{ code: src, line: 1 }];

  for (let i = 0; i < units.length; i++) {
    const r = parseUnit(units[i].code, i);
    if (!r.ok) {
      /* Translate node's position inside the temporary unit into a real line in the real file.
         For a whole-file check the unit starts at line 1, so this is the identity. */
      const at = r.lineInUnit ? units[i].line + r.lineInUnit - 1 : null;
      return {
        ok: false, file, total: units.length, inline,
        index: i + 1, blockLine: units[i].line, line: at,
        message: r.message, raw: r.raw,
      };
    }
  }
  return { ok: true, file, total: units.length, inline };
}

/** One-line summary for a gate; `detail` style, no glyph. */
function summary(res) {
  if (res.ok) {
    return res.inline ? `${res.total} inline <script> blocks parse clean` : `${res.file} parses clean`;
  }
  const at = res.line ? `${res.file}:${res.line}` : res.file;
  return res.inline
    ? `${res.message} — ${at} (inline <script> block #${res.index} of ${res.total}, block starts at line ${res.blockLine})`
    : `${res.message} — ${at}`;
}

/* CLI: human output + a non-zero exit so `ship` and any caller stop. */
if (require.main === module) {
  const files = process.argv.slice(2);
  const targets = files.length ? files : ['chart-quest.html'];
  let bad = 0;
  for (const f of targets) {
    let res;
    try {
      res = checkFile(f);
    } catch (e) {
      console.error('✗ could not read ' + f + ': ' + String(e && e.message || e));
      bad = 1;
      continue;
    }
    if (res.ok) {
      console.log('✓ syntax OK — ' + summary(res));
    } else {
      console.error('✗ SYNTAX ERROR — ' + summary(res));
      console.error(String(res.raw || '').split('\n').slice(0, 5).join('\n'));
      bad = 1;
    }
  }
  process.exit(bad);
}

module.exports = { checkFile, summary, BLOCK_RE, MIN_BLOCK_CHARS };
