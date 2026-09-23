const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an item title'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Please provide an item description'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Electronics',
        'Books & Notebooks',
        'ID & Cards',
        'Clothing & Accessories',
        'Bags & Backpacks',
        'Keys',
        'Water Bottles',
        'Sports Equipment',
        'Other',
      ],
      default: 'Other',
    },
    type: {
      type: String,
      required: [true, 'Item type is required'],
      enum: ['LOST', 'FOUND'],
    },
    status: {
      type: String,
      enum: ['OPEN', 'PENDING_MATCH', 'MATCHED', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    location: {
      type: String,
      required: [true, 'Please specify the campus location'],
      trim: true,
    },
    dateOccurred: {
      type: Date,
      default: Date.now,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imageEmbedding: {
      type: [Number],
      default: [],
      select: false,
    },
    textEmbedding: {
      type: [Number],
      default: [],
      select: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    matchedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

itemSchema.index({ type: 1, status: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Item', itemSchema);
