// A tiny static server that behaves like GitHub Pages for this repo:
// files live under /angular-tasklist/, and unknown paths get 404.html with status 404.
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const port = Number(process.argv[2] ?? 4300);
const root = join(import.meta.dirname, '..', 'dist', 'angular-tasklist', 'browser');
const base = '/angular-tasklist/';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  if (!path.startsWith(base)) {
    res.writeHead(404).end('Not found');
    return;
  }
  let file = normalize(join(root, path.slice(base.length)));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  if (path.endsWith('/')) file = join(file, 'index.html');
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': types['.html'] });
    res.end(await readFile(join(root, '404.html')));
  }
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}${base}`));
