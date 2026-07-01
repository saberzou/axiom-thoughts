#!/usr/bin/env node
// Pre-build guard: every thought .md/.en.md must have valid YAML frontmatter
// with at least the schema-required fields. This exists because the daily
// writer has intermittently shipped files with NO frontmatter (6/23, 6/29,
// 7/1 2026), which fails the Astro content schema deep in the build with an
// opaque error. This fails fast with a clear, actionable message instead.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/content/thoughts');

// Fields the content schema requires as strings (see src/content/config.ts).
const REQUIRED = ['title', 'date'];

const problems = [];

for (const file of readdirSync(dir)) {
  if (!file.endsWith('.md')) continue;
  const raw = readFileSync(join(dir, file), 'utf8');

  // Frontmatter must be the very first thing in the file.
  if (!raw.startsWith('---')) {
    problems.push(`${file}: missing YAML frontmatter (file starts with "${raw.slice(0, 30).replace(/\n/g, '\\n')}...")`);
    continue;
  }

  const end = raw.indexOf('\n---', 3);
  if (end === -1) {
    problems.push(`${file}: frontmatter block is not closed with "---"`);
    continue;
  }

  const block = raw.slice(3, end);
  for (const key of REQUIRED) {
    // naive but sufficient: a top-level "key:" line inside the block
    const re = new RegExp(`^${key}:\\s*\\S`, 'm');
    if (!re.test(block)) {
      problems.push(`${file}: frontmatter missing required field "${key}"`);
    }
  }
  // lang, when present, must be zh or en
  const langMatch = block.match(/^lang:\s*["']?(\w+)/m);
  if (langMatch && !['zh', 'en'].includes(langMatch[1])) {
    problems.push(`${file}: lang must be "zh" or "en", got "${langMatch[1]}"`);
  }
}

if (problems.length) {
  console.error('\n\u2717 Frontmatter check failed:\n');
  for (const p of problems) console.error('  - ' + p);
  console.error(`\n${problems.length} file(s) need fixing before build.\n`);
  process.exit(1);
}

console.log('\u2713 Frontmatter check passed for all thought files.');
