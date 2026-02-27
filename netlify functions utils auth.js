const jwt = require('jsonwebtoken');
const { User } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;

async function authenticate(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No token provided', status: 401 };
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return { error: 'User not found', status: 401 };
    }
    return { user };
  } catch (err) {
    return { error: 'Invalid token', status: 401 };
  }
}

module.exports = { authenticate };