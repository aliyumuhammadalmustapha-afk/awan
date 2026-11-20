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
  { id: 'p31_account_root', path: '/account' },
  { id: 'p31_sub1_profile', path: '/account?sub=profile' },
  { id: 'p31_sub2_privacy', path: '/account?sub=privacy' },
  { id: 'p31_sub2_privacy_sheet', path: '/account?sub=privacy-sheet' },
  { id: 'p31_sub3_notifications', path: '/account?sub=notifications' },
  { id: 'p31_sub4_security', path: '/account?sub=security' },
  { id: 'p31_sub5_sharing', path: '/account?sub=sharing' },
  { id: 'p31_sub6_data', path: '/account?sub=data' },
  { id: 'p31_sub6_data_sheet', path: '/account?sub=data-sheet' },
  { id: 'p31_sub7_about', path: '/account?sub=about' },
  { id: 'p31_sub8_signin', path: '/account?sub=signin' },
  { id: 'p34_sys_offline', path: '/p34-system-states?state=offline' },
  { id: 'p34_sys_update', path: '/p34-system-states?state=update' },
  { id: 'p34_sys_corrupted', path: '/p34-system-states?state=corrupted' },
  { id: 'p34_sys_error', path: '/p34-system-states?state=error' },
];

async function main() {
  const browserExe = findBrowserExecutable();
  const viteBin = path.join(WEB_DIR, 'node_modules/vite/bin/vite.js');
  const server = spawn(process.execPath, [viteBin, 'preview', '--port', '4176', '--host', '127.0.0.1'], {
    cwd: WEB_DIR,
    stdio: 'ignore',
  });

  const userDataDir = path.join(ARTIFACT_DIR, 'scratch', 'edge_profile_p3');
  fs.mkdirSync(userDataDir, { recursive: true });

  const browser = spawn(
    browserExe,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=9232',
      `--user-data-dir=${userDataDir}`,
      'http://127.0.0.1:4176/account',
    ],
    { stdio: 'ignore' }
  );

  try {
    await waitForHttp('http://127.0.0.1:4176');
    let pageTarget = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const listJson = await waitForHttp('http://127.0.0.1:9232/json/list');
      const targetsList = JSON.parse(listJson);
      pageTarget =
        targetsList.find((t) => t.type === 'page' && t.url.includes('127.0.0.1:4176')) ||
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
        const url = `http://127.0.0.1:4176${p.path}`;
        await cdpCall(ws, msgId++, 'Page.navigate', { url });
        await new Promise((r) => setTimeout(r, 600));
        await cdpCall(ws, msgId++, 'Runtime.evaluate', {
          expression: 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))',
          awaitPromise: true,
        });
        const { data } = await cdpCall(ws, msgId++, 'Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: false,
        });
        const outName = `phase3_${p.id}_${size.w}x${size.h}.png`;
        const outPath = path.join(ARTIFACT_DIR, outName);
        fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
      }
      console.log(`Captured all ${PAGES.length} Phase 3 screens at ${size.w}x${size.h}`);
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
