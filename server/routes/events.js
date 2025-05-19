const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Event = require('../models/Event');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendEventTicket } = require('../utils/ticketService');
const Payment = require('../models/Payment');
const fs = require('fs');
const { getEventTicket } = require('../utils/ticketService');

// @route   GET /api/events
// @desc    Get all events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('registeredUsers', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/events
// @desc    Create an event
// @access  Private/Admin,Organizer
router.post(
  '/',
  [
    protect,
    authorize('admin', 'organizer'),
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('startDate', 'Start date is required').not().isEmpty(),
      check('endDate', 'End date is required').not().isEmpty(),
      check('location', 'Location is required').not().isEmpty(),
      check('category', 'Category is required').not().isEmpty(),
      check('capacity', 'Capacity is required').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      category,
      isPaid,
      price,
      capacity,
      image
    } = req.body;

    try {
      const newEvent = new Event({
        title,
        description,
        startDate,
        endDate,
        location,
        category,
        isPaid: isPaid || false,
        price: price || 0,
        capacity,
        organizer: req.user.id,
        image: image || 'default-event.jpg'
      });

      const event = await newEvent.save();

      res.status(201).json({
        success: true,
        data: event
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private/Admin,Organizer
router.put(
  '/:id',
  [
    protect,
    authorize('admin', 'organizer')
  ],
  async (req, res) => {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      category,
      isPaid,
      price,
      capacity,
      image,
      isActive
    } = req.body;

    // Build event object
    const eventFields = {};
    if (title) eventFields.title = title;
    if (description) eventFields.description = description;
    if (startDate) eventFields.startDate = startDate;
    if (endDate) eventFields.endDate = endDate;
    if (location) eventFields.location = location;
    if (category) eventFields.category = category;
    if (isPaid !== undefined) eventFields.isPaid = isPaid;
    if (price !== undefined) eventFields.price = price;
    if (capacity) eventFields.capacity = capacity;
    if (image) eventFields.image = image;
    if (isActive !== undefined) eventFields.isActive = isActive;

    try {
      let event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Check if user is event organizer or admin
      if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized to update this event' });
      }

      event = await Event.findByIdAndUpdate(
        req.params.id,
        { $set: eventFields },
        { new: true }
      );

      res.json({
        success: true,
        data: event
      });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private/Admin,Organizer
router.delete('/:id', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is event organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();

    res.json({ 
      success: true,
      message: 'Event removed' 
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/events/register/:id
// @desc    Register for an event
// @access  Private
router.post('/register/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    const user = await User.findById(req.user.id);

    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if event is active
    if (!event.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'This event is no longer active' 
      });
    }

    // Check if already registered
    if (event.registeredUsers.some(userId => userId.toString() === req.user.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Already registered for this event' 
      });
    }

    // Check if event capacity is reached
    if (event.capacity && event.registeredUsers.length >= event.capacity) {
      return res.status(400).json({ 
        success: false,
        message: 'Event capacity reached' 
      });
    }

    // If paid event, redirect to payment route (handled in frontend)
    if (event.isPaid) {
      return res.json({
        success: true,
        isPaid: true,
        message: 'Payment required for registration',
        data: {
          event: event._id,
          price: event.price
        }
      });
    }

    // Add user to event registrations
    event.registeredUsers.push(req.user.id);
    await event.save();

    // Add event to user's registered events
    user.registeredEvents.push(event._id);
    await user.save();

    // Generate a ticket ID for free events
    const ticketId = `TIX-FREE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    // Create a payment record for free events to keep track of ticket
    const payment = new Payment({
      user: req.user.id,
      event: event._id,
      amount: 0,
      paymentId: `FREE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      ticketId,
      status: 'success',
      paymentMethod: 'free',
      paymentDetails: { type: 'free event' }
    });
    
    await payment.save();

    // Send ticket via email
    let ticketSent = false;
    try {
      await sendEventTicket(user.email, event, user, ticketId);
      ticketSent = true;
      console.log(`Ticket sent successfully to ${user.email} for event ${event.title}`);
    } catch (emailErr) {
      console.error('Error sending ticket:', emailErr);
      // Don't fail the registration if email fails
    }

    res.json({
      success: true,
      isPaid: false,
      ticketSent,
      message: ticketSent 
        ? 'Successfully registered for event. Ticket has been sent to your email.' 
        : 'Successfully registered for event. Ticket generation failed, please contact support.',
      data: {
        event,
        ticketId
      }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server Error' 
    });
  }
});

// @route   POST /api/events/unregister/:id
// @desc    Unregister from an event
// @access  Private
router.post('/unregister/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if registered
    if (!event.registeredUsers.some(userId => userId.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }

    // Remove user from event registrations
    event.registeredUsers = event.registeredUsers.filter(
      userId => userId.toString() !== req.user.id
    );
    await event.save();

    // Remove event from user's registered events
    user.registeredEvents = user.registeredEvents.filter(
      eventId => eventId.toString() !== req.params.id
    );
    await user.save();

    res.json({
      success: true,
      message: 'Successfully unregistered from event'
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/events/complete-payment/:id
// @desc    Complete payment and registration for a paid event
// @access  Private
router.post('/complete-payment/:id', protect, async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    const user = await User.findById(req.user.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if event is active
    if (!event.isActive) {
      return res.status(400).json({ message: 'This event is no longer active' });
    }

    // Check if already registered
    if (event.registeredUsers.some(userId => userId.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check if event capacity is reached
    if (event.registeredUsers.length >= event.capacity) {
      return res.status(400).json({ message: 'Event capacity reached' });
    }

    // Add user to event registrations
    event.registeredUsers.push(req.user.id);
    await event.save();

    // Add event to user's registered events
    user.registeredEvents.push(event._id);
    await user.save();

    // Payment details
    const paymentDetails = {
      transactionId,
      amount: event.price,
      date: new Date(),
      status: 'completed'
    };

    // Send ticket via email
    try {
      await sendEventTicket(event, user, true, paymentDetails);
    } catch (emailErr) {
      console.error('Error sending ticket:', emailErr);
      // Don't fail the registration if email fails
    }

    res.json({
      success: true,
      message: 'Payment successful and registration completed',
      data: {
        event,
        payment: paymentDetails
      }
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * @route   GET /api/events/:id/participants
 * @desc    Get all participants for an event
 * @access  Private (Admin or Organizer of the event)
 */
router.get('/:id/participants', protect, async (req, res) => {
  try {
    // Use the correct approach to get participants - already defined in another route
    const event = await Event.findById(req.params.id)
      .populate({
        path: 'registeredUsers',
        select: 'name email department year role'
      });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is admin or the organizer of the event
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    // Get payment records for this event
    const payments = await Payment.find({ event: req.params.id });
    
    // Format participants with additional info
    const participants = event.registeredUsers.map(user => {
      const payment = payments.find(p => p.user.toString() === user._id.toString());
      
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department || null,
        year: user.year || null,
        role: user.role,
        registrationDate: payment ? payment.createdAt : null,
        ticketId: payment ? payment.ticketId : null,
        paid: payment ? payment.status === 'success' : false
      };
    });

    res.json({
      success: true,
      data: {
        event: {
          _id: event._id,
          title: event.title,
          date: event.startDate,
          isPaid: event.isPaid,
          price: event.price
        },
        participants
      }
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @route   PUT /api/events/:id/participants/:participantId/attendance
 * @desc    Toggle attendance status for a participant
 * @access  Private (Admin or Organizer of the event)
 */
router.put('/:id/participants/:participantId/attendance', protect, async (req, res) => {
  try {
    const { attended } = req.body;
    
    // Validate attendance data
    if (attended === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Attendance status is required'
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is admin or the organizer of the event
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update attendance'
      });
    }

    // Find the participant
    const participantIndex = event.participants.findIndex(
      p => p._id.toString() === req.params.participantId
    );

    if (participantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Update attendance status
    event.participants[participantIndex].attended = attended;

    await event.save();

    res.json({
      success: true,
      message: `Attendance status ${attended ? 'marked' : 'unmarked'} successfully`,
      data: event.participants[participantIndex]
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/events/transactions
// @desc    Get all transactions (admin only)
// @access  Private/Admin
router.get('/transactions', protect, authorize('admin'), async (req, res) => {
  try {
    const transactions = await Payment.find()
      .populate({
        path: 'event',
        select: 'title startDate endDate'
      })
      .populate({
        path: 'user',
        select: 'name email'
      })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
});

// @route   GET /api/events/transactions/organizer
// @desc    Get transactions for events organized by the user
// @access  Private/Organizer
router.get('/transactions/organizer', protect, authorize('organizer'), async (req, res) => {
  try {
    // First get all events organized by this user
    const events = await Event.find({ organizer: req.user.id }).select('_id');
    const eventIds = events.map(event => event._id);
    
    // Then get all transactions for these events
    const transactions = await Payment.find({ event: { $in: eventIds } })
      .populate({
        path: 'event',
        select: 'title startDate endDate'
      })
      .populate({
        path: 'user',
        select: 'name email'
      })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
});

// @route   GET /api/events/organizer
// @desc    Get events created by logged in organizer
// @access  Private/Organizer
router.get('/organizer', protect, authorize('organizer'), async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
});

// @route   GET /api/events/:id/ticket
// @desc    Get ticket for an event
// @access  Private
router.get('/:id/ticket', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }
    
    // Check if user is registered for this event
    const user = await User.findById(req.user.id);
    if (!user.registeredEvents.includes(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not registered for this event'
      });
    }
    
    // Get payment record to get ticket ID
    const payment = await Payment.findOne({ 
      user: req.user.id, 
      event: req.params.id,
      status: 'success'
    });
    
    // Generate ticket
    const ticketId = payment ? payment.ticketId : `TIX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const ticketPath = await getEventTicket(event, user, ticketId);
    
    // Send the file
    res.download(ticketPath, `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ticket.pdf`, (err) => {
      // Delete the file after sending
      if (err) {
        console.error('Error sending ticket:', err);
      } else {
        try {
          fs.unlinkSync(ticketPath);
        } catch (unlinkErr) {
          console.error('Error deleting ticket file:', unlinkErr);
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error' 
    });
  }
});

module.exports = router; 