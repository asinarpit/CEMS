const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentId: {
      type: String,
      required: true
    },
    ticketId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      default: 'online'
    },
    paymentDetails: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Virtual field for computed properties
PaymentSchema.virtual('isPaid').get(function() {
  return this.status === 'success';
});

module.exports = mongoose.model('Payment', PaymentSchema); 