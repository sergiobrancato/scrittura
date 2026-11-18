/* Renders build/icon.svg to PNG and ICO using Electron's own Chromium renderer. */
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

app.disableHardwareAcceleration();

function buildIco(pngs) {
  const headerSize = 6 + pngs.length * 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4); // image count

  let offset = headerSize;
  pngs.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size >= 256 ? 0 : size, entry); // width (0 = 256)
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1); // height (0 = 256)
    header.writeUInt8(0, entry + 2); // palette
    header.writeUInt8(0, entry + 3); // reserved
    header.writeUInt16LE(1, entry + 4); // color planes
    header.writeUInt16LE(32, entry + 6); // bits per pixel
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });

  return Buffer.concat([header, ...pngs.map(({ png }) => png)]);
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

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const icoImages = sizes.map((size) => ({
    size,
    png: image.resize({ width: size, height: size, quality: 'best' }).toPNG(),
  }));
  const ico = buildIco(icoImages);
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);

  console.log(
    `Icon generated: ${png512.length} bytes, ICO ${ico.length} bytes (${sizes.join(', ')} px)`,
  );
  app.quit();
});
