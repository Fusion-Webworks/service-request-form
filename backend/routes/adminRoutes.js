const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { protect, authorize } = require('../middleware/authMiddleware');
const ErrorResponse = require('../utils/errorResponse');

// @route    GET /api/v1/admin/users
// @desc     Get all users
// @access   Private/Admin
router.get('/users', protect, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
});

// @route    GET /api/v1/admin/tickets
// @desc     Get all tickets (admin view)
// @access   Private/Admin
router.get('/tickets', protect, authorize('admin'), async (req, res, next) => {
  try {
    const tickets = await Ticket.find()
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');
    
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    next(err);
  }
});

// @route    PUT /api/v1/admin/tickets/:id/assign
// @desc     Assign ticket to support user
// @access   Private/Admin
router.put('/tickets/:id/assign', protect, authorize('admin'), async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return next(new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404));
    }

    const supportUser = await User.findById(req.body.userId);
    if (!supportUser || supportUser.role !== 'support') {
      return next(new ErrorResponse(`Invalid support user ID`, 400));
    }

    ticket.assignedTo = req.body.userId;
    ticket.status = 'pending';
    await ticket.save();

    // Send email notification
    try {
      await sendTicketAssignedEmail(
        supportUser.email,
        ticket._id,
        req.user.name
      );
    } catch (emailErr) {
      console.error('Failed to send assignment email:', emailErr);
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

module.exports = router;