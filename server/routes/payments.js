const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Event = require('../models/Event');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const { sendTicket } = require('../services/ticketService');

// Mock PhonePe API
const generateTransactionId = () => {
  return `PPI${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

// @route   POST /api/payments/initiate
// @desc    Initiate payment
// @access  Private
router.post('/initiate', protect, async (req, res) => {
  const { eventId } = req.body;

  try {
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (!event.isPaid) {
      return res.status(400).json({ message: 'This is a free event' });
    }
    
    // Check if already registered
    if (event.registeredUsers.some(userId => userId.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }
    
    // Create mock payment request
    const paymentData = {
      merchantId: 'CEMS123',
      merchantTransactionId: uuidv4(),
      amount: event.price * 100, // Convert to paise
      redirectUrl: `${req.protocol}://${req.get('host')}/api/payments/callback`,
      callbackUrl: `${req.protocol}://${req.get('host')}/api/payments/callback`,
      paymentInstrument: {
        type: 'PAY_PAGE'
      },
      eventId: event._id,
      userId: req.user.id
    };
    
    // Store payment data in session or database
    // This is a simplified version. In a real app, you'd use a session or Redis
    
    res.json({
      success: true,
      message: 'Payment initiated',
      data: {
        paymentId: paymentData.merchantTransactionId,
        amount: event.price,
        redirectUrl: `/payment/process/${paymentData.merchantTransactionId}`
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/payments/process/:paymentId
// @desc    Process payment (simulated)
// @access  Private
router.post('/process/:paymentId', protect, async (req, res) => {
  const { paymentId } = req.params;
  const { eventId, status } = req.body;

  try {
    // In a real app, we would call PhonePe API here
    // This is a mock implementation
    
    const event = await Event.findById(eventId);
    const user = await User.findById(req.user.id);
    
    if (!event || !user) {
      return res.status(404).json({ message: 'Event or user not found' });
    }
    
    // If payment status is success
    if (status === 'success') {
      // Create a new payment record
      const payment = new Payment({
        user: req.user.id,
        event: eventId,
        amount: event.price,
        transactionId: generateTransactionId(),
        status: 'completed'
      });
      
      await payment.save();
      
      // Register the user for the event
      event.registeredUsers.push(req.user.id);
      await event.save();
      
      // Add event to user's registered events
      user.registeredEvents.push(event._id);
      await user.save();
      
      return res.json({
        success: true,
        message: 'Payment successful',
        data: {
          payment: payment
        }
      });
    } else {
      // Create a failed payment record
      const payment = new Payment({
        user: req.user.id,
        event: eventId,
        amount: event.price,
        transactionId: generateTransactionId(),
        status: 'failed'
      });
      
      await payment.save();
      
      return res.status(400).json({
        success: false,
        message: 'Payment failed',
        data: {
          payment: payment
        }
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/payments/history
// @desc    Get payment history for a user
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('event', 'title startDate')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   GET /api/payments/transactions
 * @desc    Get all transactions (admin only)
 * @access  Private/Admin
 */
router.get('/transactions', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    const transactions = await Payment.find()
      .sort({ date: -1 })
      .populate({
        path: 'event',
        select: 'title'
      })
      .populate({
        path: 'user',
        select: 'name email'
      });

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   GET /api/payments/transactions/my-events
 * @desc    Get transactions for events created by the user (organizer)
 * @access  Private/Organizer
 */
router.get('/transactions/my-events', protect, async (req, res) => {
  try {
    // Check if user is an organizer
    if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    // Get events created by the user
    const events = await Event.find({ organizer: req.user.id }).select('_id');
    const eventIds = events.map(event => event._id);

    // Get payments for these events
    const transactions = await Payment.find({ event: { $in: eventIds } })
      .sort({ date: -1 })
      .populate({
        path: 'event',
        select: 'title'
      })
      .populate({
        path: 'user',
        select: 'name email'
      });

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   GET /api/payments/transactions/:id
 * @desc    Get a single transaction
 * @access  Private/Admin/Organizer
 */
router.get('/transactions/:id', protect, async (req, res) => {
  try {
    const transaction = await Payment.findById(req.params.id)
      .populate({
        path: 'event',
        select: 'title organizer'
      })
      .populate({
        path: 'user',
        select: 'name email'
      });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user is admin or the organizer of the event
    if (
      req.user.role !== 'admin' && 
      transaction.event.organizer.toString() !== req.user.id &&
      transaction.user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 