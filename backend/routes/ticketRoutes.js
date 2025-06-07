const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  uploadAttachment
} = require('../services/ticketService');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');

// @route    GET /api/v1/tickets
// @desc     Get all tickets
// @access   Private
router.get('/', protect, async (req, res, next) => {
  try {
    let query = {};
    
    // Non-admins can only see their own tickets
    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const tickets = await getTickets({ ...req.query, ...query });
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    next(err);
  }
});

// @route    GET /api/v1/tickets/:id
// @desc     Get single ticket
// @access   Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const ticket = await getTicketById(req.params.id);
    
    // Make sure user is ticket owner or admin
    if (ticket.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ErrorResponse(
        `User ${req.user.id} is not authorized to view this ticket`,
        401
      );
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

// @route    POST /api/v1/tickets
// @desc     Create new ticket
// @access   Private
router.post('/', protect, async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;
    const ticket = await createTicket(req.body);
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

// @route    PUT /api/v1/tickets/:id
// @desc     Update ticket
// @access   Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const ticket = await updateTicket(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );
    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

// @route    DELETE /api/v1/tickets/:id
// @desc     Delete ticket
// @access   Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    await deleteTicket(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
});

// @route    PUT /api/v1/tickets/:id/attachment
// @desc     Upload attachment for ticket
// @access   Private
router.put('/:id/attachment', protect, upload.single('file'), async (req, res, next) => {
  try {
    const ticket = await uploadAttachment(
      req.params.id,
      req.file,
      req.user.id,
      req.user.role
    );
    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

module.exports = router;