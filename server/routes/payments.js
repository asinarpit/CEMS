const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Event = require('../models/Event');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const { sendEventTicket } = require('../utils/ticketService');

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

// @route   POST /api/payments/process
// @desc    Process a payment for an event
// @access  Private
router.post('/process', protect, async (req, res) => {
  try {
    const { eventId, paymentDetails } = req.body;
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }
    
    // Check if the event is paid
    if (!event.isPaid) {
      return res.status(400).json({ 
        success: false, 
        message: 'This event is free and does not require payment' 
      });
    }
    
    // Check if user is already registered
    const user = await User.findById(req.user.id);
    if (user.registeredEvents.includes(eventId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already registered for this event' 
      });
    }
    
    // Check if event has capacity
    if (event.capacity && event.registeredUsers.length >= event.capacity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event has reached maximum capacity' 
      });
    }
    
    // Generate unique payment ID and ticket ID
    const paymentId = `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;
    const ticketId = `TIX-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Create a new payment record
    const payment = new Payment({
      user: req.user.id,
      event: eventId,
      amount: event.price,
      paymentId,
      ticketId,
      status: 'success', // In a real app, this would be determined by payment gateway
      paymentMethod: paymentDetails?.method || 'online',
      paymentDetails: paymentDetails || {}
    });
    
    await payment.save();
    
    // Register user for the event
    await Event.findByIdAndUpdate(
      eventId,
      { $addToSet: { registeredUsers: req.user.id } },
      { new: true }
    );
    
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { registeredEvents: eventId } },
      { new: true }
    );
    
    // Send ticket via email
    try {
      await sendEventTicket(user.email, event, user, ticketId);
    } catch (emailError) {
      console.error('Failed to send ticket email:', emailError);
      // Don't fail the registration process if email fails
    }
    
    res.json({
      success: true,
      data: {
        paymentId,
        ticketId,
        amount: event.price,
        status: 'success',
        message: 'Payment processed successfully'
      }
    });
  } catch (err) {
    console.error('Payment processing error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
});

// @route   POST /api/payments/simulate
// @desc    Simulate a payment result (success/failure)
// @access  Private
router.post('/simulate', protect, async (req, res) => {
  try {
    const { eventId, status } = req.body;
    
    if (!['success', 'failed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be success or failed' 
      });
    }
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }
    
    // Generate IDs
    const paymentId = `SIM-${uuidv4().substring(0, 8).toUpperCase()}`;
    const ticketId = status === 'success' ? `TIX-${uuidv4().substring(0, 8).toUpperCase()}` : null;
    
    // Create a payment record
    const payment = new Payment({
      user: req.user.id,
      event: eventId,
      amount: event.price || 0,
      paymentId,
      ticketId: ticketId || paymentId,
      status,
      paymentMethod: 'simulation',
      paymentDetails: { simulatedAt: new Date() }
    });
    
    await payment.save();
    
    // If payment is successful, register user for the event
    if (status === 'success') {
      await Event.findByIdAndUpdate(
        eventId,
        { $addToSet: { registeredUsers: req.user.id } },
        { new: true }
      );
      
      await User.findByIdAndUpdate(
        req.user.id,
        { $addToSet: { registeredEvents: eventId } },
        { new: true }
      );
      
      // Send ticket via email
      try {
        const user = await User.findById(req.user.id);
        await sendEventTicket(user.email, event, user, ticketId);
      } catch (emailError) {
        console.error('Failed to send ticket email:', emailError);
      }
    }
    
    res.json({
      success: true,
      data: {
        paymentId,
        ticketId,
        amount: event.price || 0,
        status,
        message: status === 'success' 
          ? 'Payment successful and registration complete'
          : 'Payment failed, please try again'
      }
    });
  } catch (err) {
    console.error('Payment simulation error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
});

// @route   GET /api/payments/history
// @desc    Get payment history for the logged in user
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate({
        path: 'event',
        select: 'title startDate endDate location'
      })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
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

// @route   POST /api/payments/test-email
// @desc    Test email functionality
// @access  Private/Admin
router.post('/test-email', protect, authorize('admin'), async (req, res) => {
  try {
    const { email } = req.body;
    const testEmail = email || req.user.email;
    
    // Get a sample event and user
    const event = await Event.findOne().populate('organizer');
    const user = await User.findById(req.user.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'No events found to test with'
      });
    }
    
    // Generate a test ticket ID
    const ticketId = `TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Send test email
    await sendEventTicket(testEmail, event, user, ticketId);
    
    res.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      details: {
        event: event.title,
        ticketId
      }
    });
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: err.message
    });
  }
});

module.exports = router; 