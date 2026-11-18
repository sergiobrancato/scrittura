/* Renders build/icon.svg to PNG and ICO using Electron's own Chromium renderer. */
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

app.disableHardwareAcceleration();

function buildIco(png) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  header.writeUInt8(0, 6); // width 256
  header.writeUInt8(0, 7); // height 256
  header.writeUInt8(0, 8); // palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // color planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

app.whenReady().then(async () => {
  const buildDir = path.join(__dirname, '..', 'build');
  const svg = fs.readFileSync(path.join(buildDir, 'icon.svg'), 'utf8');

  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: { offscreen: true },
  });

  const html = `<!doctype html><html><head><style>
    html,body{margin:0;padding:0;background:transparent;overflow:hidden;width:512px;height:512px}
    svg{display:block;width:512px;height:512px}
  </style></head><body>${svg}</body></html>`;

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await new Promise((resolve) => setTimeout(resolve, 700));

  const image = await win.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 });
  const png512 = image.resize({ width: 512, height: 512, quality: 'best' }).toPNG();
  fs.writeFileSync(path.join(buildDir, 'icon.png'), png512);

  const png256 = image.resize({ width: 256, height: 256, quality: 'best' }).toPNG();
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), buildIco(png256));

  console.log(`Icon generated: ${png512.length} bytes`);
  app.quit();
});
