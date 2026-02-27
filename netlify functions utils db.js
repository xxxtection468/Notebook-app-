const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Define schemas
const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: String,
  pin: { type: String, required: true },
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const NoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  content: String,
  rewardPaid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  type: { type: String, enum: ['reward', 'withdrawal'] },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  airtelReference: String,
  createdAt: { type: Date, default: Date.now }
});

// Prevent model overwrite
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

module.exports = { connectDB, User, Note, Transaction };