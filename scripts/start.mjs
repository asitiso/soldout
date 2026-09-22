import { createServer } from 'vite';
const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { host: '127.0.0.1', port: 5173, strictPort: true, open: true },
});
await server.listen();
server.printUrls();
console.log('\nSOLD OUT is running. Keep this window open while playing.');
