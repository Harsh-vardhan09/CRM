import 'dotenv/config';
import { whatsappWorker } from './workers/whatsappWorker.js';
import { inboundEmailWorker } from './workers/inboundEmailWorker.js';
import { outboundEmailWorker } from './workers/outboundEmailWorker.js';

console.log('Worker service started. Listening to queues...');

// Just to keep the process running, the worker itself manages its lifecycle.
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await whatsappWorker.close();
  await inboundEmailWorker.close();
  await outboundEmailWorker.close();
  process.exit(0);
});
