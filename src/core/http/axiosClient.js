import axios from 'axios';
import { SHARED_SECRET } from '../config.js';

export const http = axios.create({
  headers: { 'content-type': 'application/json' },
  timeout: 10000
});

export async function jsonGonder(url, body) {
  try {
    console.log(url,JSON.stringify( body))
    const res = await http.post(url, body, { headers: { 'x-auth': SHARED_SECRET || '' } });
    
    return res.data;
  } catch (err) {
    if (err.response) throw new Error(`POST ${url} failed (${err.response.status}): ${JSON.stringify(err.response.data)}`);
    if (err.request)  throw new Error(`POST ${url} no response: ${err.message}`);
    throw new Error(`POST ${url} error: ${err.message}`);
  }
}
