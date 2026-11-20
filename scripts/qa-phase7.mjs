import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const ARTIFACT_DIR = 'C:/Users/Khalifa Aliyu/.gemini/antigravity-cli/brain/e7ead06f-4d44-4a10-aba4-9475960487d3';
const WEB_DIR = path.resolve('apps/web');

function findBrowserExecutable() {
  const candidates = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('No headless Chromium/Edge executable found');
}

function waitForHttp(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => resolve(body));
        })
        .on('error', () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Timeout waiting for ${url}`));
          } else {
            setTimeout(check, 200);
          }
        });
    };
    check();
  });
}

function cdpCall(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const QA_ROUTES = [
  { name: 'P1 Welcome', path: '/p1-welcome?state=instant', width: 390 },
  { name: 'P18 Home Returning', path: '/home?state=returning', width: 390 },
  { name: 'P24 Result Card L1', path: '/p24-result?level=L1', width: 390 },
  { name: 'P26 Trend', path: '/p26-trend', width: 390 },
  { name: 'P27 Results', path: '/results', width: 390 },
  { name: 'P28 Share', path: '/share', width: 390 },
  { name: 'P30 Follow-up', path: '/p30-follow-up', width: 390 },
  { name: 'P31 Account', path: '/account', width: 390 },
  { name: 'P32 Clinician View', path: '/clinician-view', width: 1024 },
  { name: 'P33 Dashboard', path: '/dashboard', width: 1024 },
];

async function main() {
  const browserExe = findBrowserExecutable();
  const viteBin = path.join(WEB_DIR, 'node_modules/vite/bin/vite.js');
  const server = spawn(process.execPath, [viteBin, 'preview', '--port', '4180', '--host', '127.0.0.1'], {
    cwd: WEB_DIR,
    stdio: 'ignore',
  });

  const userDataDir = path.join(ARTIFACT_DIR, 'scratch', 'edge_profile_p7');
  fs.mkdirSync(userDataDir, { recursive: true });

  const browser = spawn(
    browserExe,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=9236',
      `--user-data-dir=${userDataDir}`,
      'http://127.0.0.1:4180/p1-welcome?state=instant',
    ],
    { stdio: 'ignore' }
  );

  try {
    await waitForHttp('http://127.0.0.1:4180');
    let pageTarget = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const listJson = await waitForHttp('http://127.0.0.1:9236/json/list');
      const targetsList = JSON.parse(listJson);
      pageTarget =
        targetsList.find((t) => t.type === 'page' && t.url.includes('127.0.0.1:4180')) ||
        targetsList.find((t) => t.type === 'page' && !t.url.startsWith('devtools://'));
      if (pageTarget) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    if (!pageTarget) throw new Error('No page target found in CDP');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res);
      ws.addEventListener('error', rej);
    });

    let msgId = 1;
    await cdpCall(ws, msgId++, 'Page.enable');

    let failures = 0;
    for (const r of QA_ROUTES) {
      await cdpCall(ws, msgId++, 'Emulation.setDeviceMetricsOverride', {
        width: r.width,
        height: 844,
        deviceScaleFactor: 1,
        mobile: r.width < 500,
      });
      await cdpCall(ws, msgId++, 'Page.navigate', { url: `http://127.0.0.1:4180${r.path}` });
      await new Promise((res) => setTimeout(res, 750));
      await cdpCall(ws, msgId++, 'Runtime.evaluate', {
        expression: 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))',
        awaitPromise: true,
      });
      const evalRes = await cdpCall(ws, msgId++, 'Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const h1s = document.querySelectorAll('h1').length;
          const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth;
          const buttonsWithoutLabel = Array.from(document.querySelectorAll('button')).filter(b => !b.innerText.trim() && !b.getAttribute('aria-label')).length;
          return { h1s, overflow, buttonsWithoutLabel, lang: document.documentElement.lang };
        })()`,
      });
      const v = evalRes.result.value;
      const ok = v.h1s === 1 && !v.overflow && v.buttonsWithoutLabel === 0 && v.lang === 'en';
      if (!ok) failures++;
      console.log(`[${ok ? 'PASS' : 'FAIL'}] ${r.name} (${r.width}px): h1=${v.h1s}, overflow=${v.overflow}, unlabeledBtns=${v.buttonsWithoutLabel}, lang=${v.lang}`);
    }

    ws.close();
    if (failures > 0) process.exit(1);
  } finally {
    browser.kill();
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
