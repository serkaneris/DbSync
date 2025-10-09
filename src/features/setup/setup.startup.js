import { veritabaniCTEtkinlestir, tabloCTEtkinlestir, syncStateTablosunuBaslat,ensureCleanQueue,ensureApplyLog } from './setup.service.js';

export async function uygulamaAcilisHazirliklari() {
  await veritabaniCTEtkinlestir();
  await tabloCTEtkinlestir();
  await syncStateTablosunuBaslat();
  await ensureCleanQueue();
  await ensureApplyLog();
}
