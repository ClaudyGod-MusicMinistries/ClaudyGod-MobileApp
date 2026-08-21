import net from 'node:net';
import type { Readable } from 'node:stream';
import { env } from '../config/env';

export interface MalwareScanResult {
  clean: boolean;
  signature: string | null;
  engineResponse: string;
}

export async function scanStream(stream: Readable): Promise<MalwareScanResult> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: env.CLAMAV_HOST, port: env.CLAMAV_PORT });
    let response = '';
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      stream.destroy();
      socket.destroy();
      if (error) reject(error);
    };

    socket.setTimeout(env.CLAMAV_TIMEOUT_MS, () => finish(new Error('Malware scanner timed out')));
    socket.on('error', (error) => finish(new Error(`Malware scanner unavailable: ${error.message}`)));
    socket.on('data', (chunk) => { response += chunk.toString('utf8'); });
    socket.on('end', () => {
      if (settled) return;
      const normalized = response.replace(/\0/g, '').trim();
      if (normalized.endsWith('OK')) {
        settled = true;
        resolve({ clean: true, signature: null, engineResponse: normalized });
        return;
      }
      const match = normalized.match(/: (.+) FOUND$/);
      if (match) {
        settled = true;
        resolve({ clean: false, signature: match[1] ?? 'unknown', engineResponse: normalized });
        return;
      }
      finish(new Error(`Malware scanner returned an invalid response: ${normalized || 'empty response'}`));
    });
    socket.on('connect', async () => {
      try {
        socket.write('zINSTREAM\0');
        for await (const value of stream) {
          const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
          const length = Buffer.allocUnsafe(4);
          length.writeUInt32BE(chunk.length);
          if (!socket.write(Buffer.concat([length, chunk]))) {
            await new Promise<void>((drainResolve) => socket.once('drain', drainResolve));
          }
        }
        socket.end(Buffer.alloc(4));
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    });
  });
}
