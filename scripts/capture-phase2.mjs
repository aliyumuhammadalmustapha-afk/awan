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

const PAGES = [
  // Updated Phase 1 screens (country dropdown & 4-digit PIN)
  { id: 'p6_phone_dropdown', path: '/p6-phone' },
  { id: 'p9_pin_4digit', path: '/p9-pin' },
  { id: 'p17_lock_4digit', path: '/p17-lock' },
  // Phase 2 screens (P18 - P25 and all key states/levels)
  { id: 'p18_home_empty', path: '/home?state=empty' },
  { id: 'p18_home_returning', path: '/home?state=returning' },
  { id: 'p19_checkin_start', path: '/p19-checkin-start' },
  { id: 'p20_question_cards', path: '/p20-questions' },
  { id: 'p20_question_stepper', path: '/p20-questions?state=stepper' },
  { id: 'p21_results_choose', path: '/p21-add-results' },
  { id: 'p21_results_type', path: '/p21-add-results?mode=type' },
  { id: 'p21_results_attach_unusual', path: '/p21-add-results?mode=unusual' },
  { id: 'p22_own_words', path: '/p22-own-words' },
  { id: 'p23_review', path: '/p23-review' },
  { id: 'p24_result_L0', path: '/p24-result?level=L0' },
  { id: 'p24_result_L1', path: '/p24-result?level=L1' },
  { id: 'p24_result_L2', path: '/p24-result?level=L2' },
  { id: 'p24_result_L3', path: '/p24-result?level=L3' },
  { id: 'p24_result_U', path: '/p24-result?level=U' },
  { id: 'p25_next_step', path: '/p25-next-step' },
];

async function main() {
  const browserExe = findBrowserExecutable();
  const viteBin = path.join(WEB_DIR, 'node_modules/vite/bin/vite.js');
  const server = spawn(process.execPath, [viteBin, 'preview', '--port', '4175', '--host', '127.0.0.1'], {
    cwd: WEB_DIR,
    stdio: 'ignore',
  });

  const userDataDir = path.join(ARTIFACT_DIR, 'scratch', 'edge_profile_p2');
  fs.mkdirSync(userDataDir, { recursive: true });

  const browser = spawn(
    browserExe,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=9231',
      `--user-data-dir=${userDataDir}`,
      'http://127.0.0.1:4175/home?state=empty',
    ],
    { stdio: 'ignore' }
  );

  try {
    await waitForHttp('http://127.0.0.1:4175');
    let pageTarget = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const listJson = await waitForHttp('http://127.0.0.1:9231/json/list');
      const targetsList = JSON.parse(listJson);
      pageTarget =
        targetsList.find((t) => t.type === 'page' && t.url.includes('127.0.0.1:4175')) ||
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

    for (const size of [
      { w: 390, h: 844 },
      { w: 360, h: 740 },
    ]) {
      await cdpCall(ws, msgId++, 'Emulation.setDeviceMetricsOverride', {
        width: size.w,
        height: size.h,
        deviceScaleFactor: 1,
        mobile: true,
      });

      for (const p of PAGES) {
        const url = `http://127.0.0.1:4175${p.path}`;
        await cdpCall(ws, msgId++, 'Page.navigate', { url });
        await new Promise((r) => setTimeout(r, 550));
        const { data } = await cdpCall(ws, msgId++, 'Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false,
        });
        const outName = `phase2_${p.id}_${size.w}x${size.h}.png`;
        const outPath = path.join(ARTIFACT_DIR, outName);
        fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
      }
      console.log(`Captured all ${PAGES.length} Phase 2 screens at ${size.w}x${size.h}`);
    }

    ws.close();
  } finally {
    browser.kill();
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
