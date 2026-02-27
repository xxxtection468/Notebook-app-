const axios = require('axios');

const AIRTEL_API_KEY = process.env.AIRTEL_API_KEY;
const AIRTEL_SECRET = process.env.AIRTEL_SECRET;
const BASE_URL = process.env.AIRTEL_ENVIRONMENT === 'production'
  ? 'https://openapi.airtel.africa'
  : 'https://openapi.sandbox.airtel.africa';

async function getAccessToken() {
  const auth = Buffer.from(`${AIRTEL_API_KEY}:${AIRTEL_SECRET}`).toString('base64');
  const response = await axios.post(`${BASE_URL}/auth/oauth2/token`, {
    grant_type: 'client_credentials'
  }, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.access_token;
}

async function disburse(phoneNumber, amount, transactionId) {
  const token = await getAccessToken();
  const payload = {
    amount: amount.toString(),
    currency: 'KES',
    target: {
      type: 'msisdn',
      value: phoneNumber
    },
    reference: transactionId,
    description: 'Reward from Note App'
  };
  const response = await axios.post(`${BASE_URL}/merchant/v1/payments/`, payload, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Country': 'KE',
      'X-Currency': 'KES',
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

module.exports = { disburse };