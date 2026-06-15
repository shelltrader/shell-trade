#!/usr/bin/env node
/**
 * Shell Trade — Production Build Script
 * ======================================
 * Obfuscates shell-trade.html for production deployment.
 *
 * REQUIREMENTS (run once):
 *   npm install javascript-obfuscator
 *
 * USAGE:
 *   node build.js
 *
 * OUTPUT:
 *   shell-trade.min.html  — obfuscated production build
 *   index.html            — same file mirrored (Netlify root)
 *
 * The script extracts the inline <script> block, obfuscates the
 * JavaScript with maximum settings, then writes it back into the HTML.
 * The Supabase SDK CDN tag is left untouched (it has SRI integrity).
 */

'use strict';

const fs              = require('fs');
const path            = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC  = path.join(__dirname, 'shell-trade.html');
const OUT  = path.join(__dirname, 'shell-trade.min.html');
const MIRROR = path.join(__dirname, 'index.html');

// ---------------------------------------------------------------------------
// Maximum obfuscation config
// ---------------------------------------------------------------------------
const OBFUSCATOR_OPTIONS = {
  compact:                          true,
  controlFlowFlattening:            true,
  controlFlowFlatteningThreshold:   1,
  deadCodeInjection:                true,
  deadCodeInjectionThreshold:       0.4,
  debugProtection:                  true,
  debugProtection:                  true,
  debugProtectionInterval:          4000,
  disableConsoleOutput:             true,
  identifierNamesGenerator:         'hexadecimal',
  log:                              false,
  numbersToExpressions:             true,
  renameGlobals:                    false,   // keep globals (canvas IDs etc.) intact
  rotateStringArray:                true,
  selfDefending:                    true,
  shuffleStringArray:               true,
  simplify:                         true,
  splitStrings:                     true,
  splitStringsChunkLength:          10,
  stringArray:                      true,
  stringArrayCallsTransform:        true,
  stringArrayCallsTransformThreshold: 0.75,
  stringArrayEncoding:              ['base64'],
  stringArrayIndexesType:           ['hexadecimal-number'],
  stringArrayRotate:                true,
  stringArrayShuffle:               true,
  stringArrayThreshold:             1,
  transformObjectKeys:              true,
  unicodeEscapeSequence:            false,   // false keeps file size manageable
};

// ---------------------------------------------------------------------------
// Extract, obfuscate, and re-inject the inline script
// ---------------------------------------------------------------------------
function build() {
  console.log('[build] Reading', SRC);
  let html = fs.readFileSync(SRC, 'utf8');

  // Find the main game <script> block.
  // We skip the Supabase CDN <script src=...> tag — that stays as-is.
  // The game code starts right after the CDN tag, inside <script> 'use strict'
  const SCRIPT_OPEN  = /<script>\s*\n'use strict';/;
  const SCRIPT_CLOSE = /<\/script>\s*$/;

  const openMatch = SCRIPT_OPEN.exec(html);
  if (!openMatch) {
    console.error('[build] ERROR: Could not find opening <script> marker.');
    process.exit(1);
  }

  const scriptStart = openMatch.index;
  // Find the matching </script> (last one in the file is the game script)
  const closeIdx = html.lastIndexOf('</script>');
  if (closeIdx === -1 || closeIdx < scriptStart) {
    console.error('[build] ERROR: Could not find closing </script>.');
    process.exit(1);
  }

  const beforeScript = html.slice(0, scriptStart);
  const rawScript    = html.slice(scriptStart + '<script>'.length, closeIdx);
  const afterScript  = html.slice(closeIdx);

  console.log('[build] Extracted script block:', rawScript.length, 'chars');
  console.log('[build] Obfuscating (this may take 10–30 seconds)…');

  const result = JavaScriptObfuscator.obfuscate(rawScript, OBFUSCATOR_OPTIONS);
  const obfuscated = result.getObfuscatedCode();

  console.log('[build] Obfuscated size:', obfuscated.length, 'chars',
    '(' + Math.round(obfuscated.length / rawScript.length * 100) + '% of original)');

  const outHtml = beforeScript + '<script>' + obfuscated + afterScript;

  fs.writeFileSync(OUT, outHtml, 'utf8');
  fs.writeFileSync(MIRROR, outHtml, 'utf8');

  console.log('[build] ✓ Written:', OUT);
  console.log('[build] ✓ Mirrored:', MIRROR);
  console.log('[build] Done.');
}

build();
