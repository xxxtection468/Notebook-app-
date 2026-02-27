const { connectDB, Note, Transaction } = require('./utils/db');
const { authenticate } = require('./utils/auth');

const REWARD_PER_NOTE = parseFloat(process.env.REWARD_PER_NOTE) || 450000;

exports.handler = async (event) => {
  try {
    await connectDB();
    const auth = await authenticate(event);
    if (auth.error) {
      return { statusCode: auth.status, body: JSON.stringify({ error: auth.error }) };
    }
    const user = auth.user;

    switch (event.httpMethod) {
      case 'GET':
        const notes = await Note.find({ userId: user._id }).sort('-createdAt');
        return {
          statusCode: 200,
          body: JSON.stringify(notes)
        };

      case 'POST':
        const { title, content } = JSON.parse(event.body);
        const note = new Note({ userId: user._id, title, content });
        await note.save();

        // Add reward
        user.balance += REWARD_PER_NOTE;
        await user.save();

        // Record transaction
        const transaction = new Transaction({
          userId: user._id,
          amount: REWARD_PER_NOTE,
          type: 'reward',
          status: 'pending'
        });
        await transaction.save();

        return {
          statusCode: 200,
          body: JSON.stringify({ note, newBalance: user.balance })
        };

      default:
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};