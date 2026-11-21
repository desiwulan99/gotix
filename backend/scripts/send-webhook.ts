import crypto from 'crypto';
import http from 'http';

/**
 * Script untuk mensimulasikan pengiriman Webhook pembayaran dari Payment Gateway ke GOTIX API.
 * Menghitung HMAC SHA-256 signature pada header 'x-gotix-signature'.
 *
 * Penggunaan:
 *   npx ts-node scripts/send-webhook.ts <orderId> [port]
 */
async function sendWebhookSimulation() {
  const orderId = process.argv[2];
  const port = process.argv[3] || process.env.PORT || '5000';
  const secret = process.env.WEBHOOK_SECRET || 'gotix_webhook_hmac_secret_key_2026';

  if (!orderId) {
    console.error('Penggunaan: npx ts-node scripts/send-webhook.ts <orderId> [port]');
    process.exit(1);
  }

  const payload = {
    eventId: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    type: 'payment.succeeded',
    orderId,
    amount: 250000,
    paymentStatus: 'SUCCESS',
    paymentMethod: 'SIMULATED_GATEWAY_WEBHOOK',
  };

  const bodyString = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');

  console.log(`=========================================`);
  console.log(`  GOTIX WEBHOOK SIMULATOR (HMAC SHA-256) `);
  console.log(`=========================================`);
  console.log(`Target URL   : http://localhost:${port}/api/webhooks/payment`);
  console.log(`Order ID     : ${orderId}`);
  console.log(`Event ID     : ${payload.eventId}`);
  console.log(`Signature    : ${signature}`);
  console.log(`=========================================`);

  const req = http.request(
    {
      hostname: 'localhost',
      port: parseInt(port, 10),
      path: '/api/webhooks/payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyString),
        'x-gotix-signature': signature,
      },
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`HTTP Status : ${res.statusCode}`);
        console.log(`Response    : ${data}`);
        console.log(`=========================================`);
      });
    }
  );

  req.on('error', (err) => {
    console.error(`Gagal mengirim webhook: ${err.message}`);
  });

  req.write(bodyString);
  req.end();
}

sendWebhookSimulation();
