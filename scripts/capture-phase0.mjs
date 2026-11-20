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

async function main() {
  const browserExe = findBrowserExecutable();
  const viteBin = path.join(WEB_DIR, 'node_modules/vite/bin/vite.js');
  const server = spawn(process.execPath, [viteBin, 'preview', '--port', '4173', '--host', '127.0.0.1'], {
    cwd: WEB_DIR,
    stdio: 'ignore',
  });

  const userDataDir = path.join(ARTIFACT_DIR, 'scratch', 'edge_profile');
  fs.mkdirSync(userDataDir, { recursive: true });

  const browser = spawn(
    browserExe,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=9229',
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    await waitForHttp('http://127.0.0.1:4173');
    const listJson = await waitForHttp('http://127.0.0.1:9229/json/list');
    const targetsList = JSON.parse(listJson);
    const pageTarget = targetsList.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No page target found in CDP');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res);
      ws.addEventListener('error', rej);
    });

    let msgId = 1;
    await cdpCall(ws, msgId++, 'Page.enable');

    const shots = [
      { url: 'http://127.0.0.1:4173/ui-kit', width: 390, height: 844, out: 'phase0_uikit_390x844.png' },
      { url: 'http://127.0.0.1:4173/ui-kit', width: 360, height: 740, out: 'phase0_uikit_360x740.png' },
      { url: 'http://127.0.0.1:4173/routes', width: 390, height: 844, out: 'phase0_routes_390x844.png' },
      { url: 'http://127.0.0.1:4173/routes', width: 360, height: 740, out: 'phase0_routes_360x740.png' },
    ];

    for (const s of shots) {
      await cdpCall(ws, msgId++, 'Emulation.setDeviceMetricsOverride', {
        width: s.width,
        height: s.height,
        deviceScaleFactor: 1,
        mobile: s.width < 500,
      });
      await cdpCall(ws, msgId++, 'Page.navigate', { url: s.url });
      await new Promise((r) => setTimeout(r, 600));
      const { data } = await cdpCall(ws, msgId++, 'Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      });
      const outPath = path.join(ARTIFACT_DIR, s.out);
      fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
      console.log(`Captured exact ${s.width}x${s.height}: ${outPath} (${fs.statSync(outPath).size} bytes)`);
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
