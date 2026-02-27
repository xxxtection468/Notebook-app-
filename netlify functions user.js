const { connectDB } = require('./utils/db');
const { authenticate } = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    await connectDB();
    const auth = await authenticate(event);
    if (auth.error) {
      return { statusCode: auth.status, body: JSON.stringify({ error: auth.error }) };
    }
    const user = auth.user;
    return {
      statusCode: 200,
      body: JSON.stringify({ phone: user.phone, balance: user.balance, name: user.name })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};