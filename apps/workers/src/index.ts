import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../env/root.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../env/worker.env') });

const { whatsappWorker } = await import('./workers/whatsappWorker.js');
const { inboundEmailWorker } = await import('./workers/inboundEmailWorker.js');
const { outboundEmailWorker } = await import('./workers/outboundEmailWorker.js');

console.log('Worker service started. Listening to queues...');

// Just to keep the process running, the worker itself manages its lifecycle.
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await whatsappWorker.close();
  await inboundEmailWorker.close();
  await outboundEmailWorker.close();
  process.exit(0);
});
