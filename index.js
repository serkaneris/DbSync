import { initializeApp } from './src/app.js';
await initializeApp().catch(e => {
  console.error('[fatal]', e);
  process.exit(1);
});
