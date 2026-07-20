import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// The game lives in public/index.html and is served at `/` in production
// (static hosts serve index.html for the root). `astro dev` does NOT map `/`
// to a public file, so it 404s locally — this dev-only middleware rewrites
// `/` to `/index.html` so `npm run dev` shows the game at the root too.
const serveGameAtRoot = {
  name: 'serve-game-at-root',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/') req.url = '/index.html';
      next();
    });
  },
};

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  site: 'https://umain-arena.vercel.app',
  vite: {
    plugins: [serveGameAtRoot],
  },
});
