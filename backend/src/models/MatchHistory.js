const mongoose = require('mongoose');

const matchHistorySchema = new mongoose.Schema(
  {
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    textSimilarity: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    imageSimilarity: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    hybridScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    status: {
      type: String,
      enum: ['SUGGESTED', 'CONFIRMED_BY_USER', 'REJECTED', 'VERIFIED_BY_ADMIN'],
      default: 'SUGGESTED',
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

matchHistorySchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });
matchHistorySchema.index({ hybridScore: -1 });

module.exports = mongoose.model('MatchHistory', matchHistorySchema);
