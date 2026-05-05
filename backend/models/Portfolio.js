import mongoose from "mongoose";

const positionSchema = new mongoose.Schema({
  symbol: String,
  quantity: Number,
  avgPrice: Number,
});

const tradeSchema = new mongoose.Schema({
  id: String,
  type: { type: String, enum: ["BUY", "SELL"] },
  symbol: String,
  quantity: Number,
  price: Number,
  total: Number,
  realizedPnL: Number,
  timestamp: { type: Date, default: Date.now },
});

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cash: {
    type: Number,
    required: true,
    default: 100000, // ₹1L default
  },
  positions: {
    type: Map,
    of: positionSchema,
    default: {},
  },
  trades: [tradeSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
portfolioSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Portfolio", portfolioSchema);
