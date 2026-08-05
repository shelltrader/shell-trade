#!/usr/bin/env python3
"""Assert the three test-player exclusion lists agree.

    python3 scripts/check_test_prefixes.py          # prints a table, exits non-zero on drift

WHY THIS EXISTS
---------------
The list of "this id is the team testing, not a beta tester" prefixes is implemented three
times, in three languages, because the same rule has to run in a Python report, a browser
engine and a Postgres function:

    scripts/founder_report.py               EXCLUDE_PREFIXES
    beta-qa/beta-model.js                   TEST_PREFIXES
    automation/migrations/0011_*.sql        cfg.test_prefixes   (lowercased LIKE patterns)

They drifted within a day of being written, twice, and both times it changed a headline
number rather than breaking anything visibly:

  * founder_report.py was missing VERIFY- and GATE-. GATE-B-003 carries a 9/10 survey, so
    the weekly report showed an average rating of 8.0 (n=2) against a true 7.0 (n=1).
  * beta-model.js matched case-SENSITIVELY while the SQL lowercased first, so `Gate-B-003`
    was excluded from the live dashboard and counted in snapshot mode — two different
    averages for identical data, depending only on whether the founder was signed in.

A silent disagreement between these three is indistinguishable from a real change in the
beta numbers, which is the worst failure mode this project has. Hence a gate, not a comment.

This checks the LISTS, not the matching semantics — all three are specified case-insensitive
(docs/beta-qa/BETA_MODEL_CONTRACT.md §0); the per-file comments explain why.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def read(rel):
    p = ROOT / rel
    if not p.exists():
        sys.exit('missing file: ' + rel)
    return p.read_text(encoding='utf-8')


def from_python():
    m = re.search(r'EXCLUDE_PREFIXES\s*=\s*\((.*?)\)', read('scripts/founder_report.py'), re.S)
    if not m:
        sys.exit('could not find EXCLUDE_PREFIXES in scripts/founder_report.py')
    return re.findall(r"'([^']+)'", m.group(1))


def from_js():
    m = re.search(r'var TEST_PREFIXES\s*=\s*\[(.*?)\]', read('beta-qa/beta-model.js'), re.S)
    if not m:
        sys.exit('could not find TEST_PREFIXES in beta-qa/beta-model.js')
    return re.findall(r"'([^']+)'", m.group(1))


def from_sql():
    """The SQL stores LIKE patterns ('gate-%'), so strip the trailing % to compare like-for-like.

    The array is repeated once per function (each CTE carries its own cfg), so every
    occurrence is collected and they must all agree with each other too — a fix applied to
    beta_model but forgotten in beta_players is the same class of bug this script exists for.
    """
    sql = read('automation/migrations/0011_beta_analytics_rpcs.sql')
    blocks = re.findall(r"array\[\s*('cert-test%'.*?)\]::text\[\]", sql, re.S)
    if not blocks:
        sys.exit('could not find any cfg.test_prefixes array in migration 0011')
    lists = []
    for b in blocks:
        lists.append([x[:-1] if x.endswith('%') else x for x in re.findall(r"'([^']+)'", b)])
    for i, l in enumerate(lists[1:], start=2):
        if l != lists[0]:
            print('DRIFT INSIDE THE MIGRATION: cfg.test_prefixes copy #%d differs from copy #1' % i)
            print('  #1: ' + ', '.join(lists[0]))
            print('  #%d: %s' % (i, ', '.join(l)))
            sys.exit(1)
    return lists[0]


def main():
    srcs = {
        'founder_report.py': from_python(),
        'beta-model.js': from_js(),
        'migration 0011': from_sql(),
    }
    # Compared case-insensitively as SETS: all three match case-insensitively by design, and
    # the SQL necessarily stores its copy lowercased.
    norm = {k: sorted(x.lower() for x in v) for k, v in srcs.items()}

    width = max(len(k) for k in srcs)
    for name, items in srcs.items():
        print('  %-*s  %2d  %s' % (width, name, len(items), ', '.join(items)))

    ref_name, ref = next(iter(norm.items()))
    bad = [n for n, v in norm.items() if v != ref]
    if bad:
        print('\nFAIL — test-player prefix lists disagree.')
        for n in bad:
            missing = sorted(set(ref) - set(norm[n]))
            extra = sorted(set(norm[n]) - set(ref))
            print('  %s vs %s:' % (n, ref_name))
            if missing:
                print('      missing: ' + ', '.join(missing))
            if extra:
                print('      extra:   ' + ', '.join(extra))
        print('\nCanonical list: docs/beta-qa/BETA_MODEL_CONTRACT.md §0. Fix all three.')
        return 1

    print('\nPASS — all %d sources agree on %d prefixes.' % (len(srcs), len(ref)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
