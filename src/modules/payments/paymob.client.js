const https = require('https');
const crypto = require('crypto');
const config = require('../../config/env');
const { AppError } = require('../../middlewares/error.middleware');

const PAYMOB_HOST = 'accept.paymob.com';
const REQUEST_TIMEOUT = 15000;

function paymobRequest(method, path, data, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const options = {
      hostname: PAYMOB_HOST,
      path,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders
      },
      timeout: REQUEST_TIMEOUT
    };
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const errMsg = parsed.message || parsed.detail || `Paymob API error`;
            const err = new AppError(`${errMsg} (${res.statusCode})`, 502);
            err.paymobCode = res.statusCode;
            err.paymobResponse = parsed;
            reject(err);
          }
        } catch (e) {
          if (e.isOperational) reject(e);
          else reject(new AppError(`Invalid Paymob response: ${responseData.substring(0, 200)}`, 502));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new AppError('Paymob request timed out', 504));
    });
    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        reject(new AppError('Paymob service unreachable', 502));
      } else if (err.code === 'ECONNRESET') {
        reject(new AppError('Paymob connection reset', 502));
      } else {
        reject(new AppError(`Paymob connection error: ${err.message}`, 502));
      }
    });
    if (body) req.write(body);
    req.end();
  });
}

async function authenticatePaymob() {
  if (!config.paymob.apiKey) {
    throw new AppError('PAYMOB_API_KEY not configured', 500);
  }
  const { token } = await paymobRequest('POST', '/api/auth/tokens', {
    api_key: config.paymob.apiKey
  });
  if (!token) {
    throw new AppError('Paymob authentication returned empty token', 502);
  }
  return token;
}

async function createPaymobOrder(authToken, amountCents, merchantOrderId) {
  const body = {
    auth_token: authToken,
    delivery_needed: 'false',
    amount_cents: amountCents.toString(),
    currency: 'EGP',
    items: []
  };
  if (merchantOrderId) {
    body.merchant_order_id = merchantOrderId.toString();
  }
  return paymobRequest('POST', '/api/ecommerce/orders', body);
}

async function generatePaymentKey(authToken, orderId, amountCents, billingData) {
  if (!config.paymob.integrationId) {
    throw new AppError('PAYMOB_INTEGRATION_ID not configured', 500);
  }
  return paymobRequest('POST', '/api/acceptance/payment_keys', {
    auth_token: authToken,
    amount_cents: amountCents.toString(),
    expiration: 3600,
    order_id: orderId.toString(),
    billing_data: {
      first_name: billingData.firstName || 'N/A',
      last_name: billingData.lastName || 'N/A',
      email: billingData.email || 'guest@example.com',
      phone_number: billingData.phone || '0000000000',
      apartment: billingData.apartment || 'N/A',
      floor: billingData.floor || 'N/A',
      street: billingData.street || 'N/A',
      building: billingData.building || 'N/A',
      city: billingData.city || 'N/A',
      country: billingData.country || 'EG',
      state: billingData.state || 'N/A',
      postal_code: billingData.postalCode || '00000'
    },
    currency: 'EGP',
    integration_id: parseInt(config.paymob.integrationId, 10)
  });
}

async function verifyTransaction(authToken, transactionId) {
  return paymobRequest(
    'GET',
    `/api/acceptance/transactions/${transactionId}`,
    null,
    { Authorization: `Bearer ${authToken}` }
  );
}

function validateWebhookHMAC(payload, secret) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const requiredFields = ['amount_cents', 'id', 'order', 'success', 'pending'];
  for (const field of requiredFields) {
    if (!(field in payload)) {
      return false;
    }
  }

  let concatenated = '';
  concatenated += payload.amount_cents ?? '';
  concatenated += payload.created_at ?? '';
  concatenated += payload.currency ?? '';
  concatenated += payload.error_occured ?? '';
  concatenated += payload.has_parent_transaction ?? '';
  concatenated += payload.id ?? '';
  concatenated += payload.integration_id ?? '';
  concatenated += payload.is_3d_secure ?? '';
  concatenated += payload.is_auth ?? '';
  concatenated += payload.is_capture ?? '';
  concatenated += payload.is_refunded ?? '';
  concatenated += payload.is_standalone_payment ?? '';
  concatenated += payload.is_voided ?? '';
  concatenated += payload.order ? payload.order.id?.toString() ?? '' : '';
  concatenated += payload.owner ?? '';
  concatenated += payload.pending ?? '';
  concatenated += payload.source_data ? payload.source_data.pan ?? '' : '';
  concatenated += payload.source_data ? payload.source_data.sub_type ?? '' : '';
  concatenated += payload.source_data ? payload.source_data.type ?? '' : '';
  concatenated += payload.success ?? '';

  const expected = crypto
    .createHmac('sha512', secret)
    .update(concatenated)
    .digest('hex');

  return crypto.timingSafeEqual
    ? crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(payload.hmac || ''))
    : expected === payload.hmac;
}

module.exports = {
  authenticatePaymob,
  createPaymobOrder,
  generatePaymentKey,
  verifyTransaction,
  validateWebhookHMAC
};
