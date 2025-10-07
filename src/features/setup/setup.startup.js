import { veritabaniCTEtkinlestir, tabloCTEtkinlestir, syncStateTablosunuBaslat } from './setup.service.js';

export async function uygulamaAcilisHazirliklari() {
  await veritabaniCTEtkinlestir();
  await tabloCTEtkinlestir();
  await syncStateTablosunuBaslat();
}
