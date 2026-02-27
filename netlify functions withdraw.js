const { connectDB, Transaction } = require('./utils/db');
const { authenticate } = require('./utils/auth');
const { disburse } = require('./utils/airtel'); // we'll create this next

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    await connectDB();
    const auth = await authenticate(event);
    if (auth.error) {
      return { statusCode: auth.status, body: JSON.stringify({ error: auth.error }) };
    }
    const user = auth.user;

    const { amount } = JSON.parse(event.body);
    if (amount <= 0 || amount > user.balance) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount or insufficient balance' }) };
    }

    const transaction = new Transaction({
      userId: user._id,
      amount,
      type: 'withdrawal',
      status: 'pending'
    });
    await transaction.save();

    try {
      const airtelResponse = await disburse(user.phone, amount, transaction._id.toString());
      transaction.status = 'completed';
      transaction.airtelReference = airtelResponse.transactionId || airtelResponse.reference;
      await transaction.save();

      user.balance -= amount;
      await user.save();

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, newBalance: user.balance, reference: transaction.airtelReference })
      };
    } catch (err) {
      transaction.status = 'failed';
      await transaction.save();
      return { statusCode: 500, body: JSON.stringify({ error: 'Airtel payment failed: ' + err.message }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};