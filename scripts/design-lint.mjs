import fs from 'node:fs';
import path from 'node:path';

const WEB_SRC = path.resolve('apps/web/src');
const VIEWER_SRC = path.resolve('apps/viewer/src');

const FORBIDDEN_HEX_REGEX = /#[0-9A-Fa-f]{3,8}\b/g;
const FORBIDDEN_COLOR_CLASSES = /\b(bg|text|border)-(red|pink|rose|orange|green|blue|purple|gray)-\d+\b/g;
const FORBIDDEN_WORDS = /\b(fertility score|you're fine|you are fine|streak|gamified points|badge)\b/i;

const errors = [];

function walkDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walkDir(full));
    } else if (/\.(tsx|ts|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = [...walkDir(WEB_SRC), ...walkDir(VIEWER_SRC)];

// Verify single token file, single copy file, single UI kit
if (!fs.existsSync(path.join(WEB_SRC, 'styles/tokens.css'))) {
  errors.push('Missing single token file apps/web/src/styles/tokens.css');
}
if (!fs.existsSync(path.join(WEB_SRC, 'i18n/en.json'))) {
  errors.push('Missing single copy file apps/web/src/i18n/en.json');
}
if (!fs.existsSync(path.join(WEB_SRC, 'ui/index.tsx'))) {
  errors.push('Missing single UI kit apps/web/src/ui/index.tsx');
}

for (const file of allFiles) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  // tokens.css is the single token definition file allowed to hold hex literals
  if (rel.endsWith('styles/tokens.css')) continue;

  const content = fs.readFileSync(file, 'utf8');

  const hexMatches = content.match(FORBIDDEN_HEX_REGEX);
  if (hexMatches) {
    errors.push(`${rel}: Found hardcoded hex value(s): ${hexMatches.join(', ')}`);
  }

  const rawColorMatches = content.match(FORBIDDEN_COLOR_CLASSES);
  if (rawColorMatches) {
    errors.push(`${rel}: Found non-token colour class(es): ${rawColorMatches.join(', ')}`);
  }

  const forbiddenWordMatch = content.match(FORBIDDEN_WORDS);
  if (forbiddenWordMatch) {
    errors.push(`${rel}: Found forbidden copy term: "${forbiddenWordMatch[0]}"`);
  }
}

if (errors.length > 0) {
  console.error('AWAN DESIGN LINT FAILED:');
  for (const err of errors) {
    console.error(`  [x] ${err}`);
  }
  process.exit(1);
} else {
  console.log(`AWAN DESIGN LINT PASSED: Checked ${allFiles.length} source files.`);
  console.log('  [ok] Single token file: apps/web/src/styles/tokens.css');
  console.log('  [ok] Single copy file:  apps/web/src/i18n/en.json');
  console.log('  [ok] Single UI kit:     apps/web/src/ui/index.tsx');
  console.log('  [ok] Zero hardcoded hex values or raw non-token colour classes in components/screens.');
  console.log('  [ok] Zero forbidden red/pink/score/streak patterns.');
}
