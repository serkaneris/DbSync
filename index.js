import { uygulamayiBaslat } from './src/app.js';
await uygulamayiBaslat().catch(e => {
  console.error('[fatal]', e);
  process.exit(1);
});
