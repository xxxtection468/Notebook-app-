const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB, User } = require('./utils/db');

const JWT_SECRET = process.env.JWT_SECRET;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    await connectDB();
    const { phone, pin, name } = JSON.parse(event.body);

    if (!phone || !pin) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Phone and PIN required' }) };
    }

    let user = await User.findOne({ phone });
    if (!user) {
      // Register
      const hashedPin = await bcrypt.hash(pin, 8);
      user = new User({ phone, name, pin: hashedPin });
      await user.save();
    } else {
      // Login
      const isMatch = await bcrypt.compare(pin, user.pin);
      if (!isMatch) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid PIN' }) };
      }
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        user: { phone: user.phone, balance: user.balance, name: user.name }
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};