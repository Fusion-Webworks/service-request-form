const Ticket = require('../models/Ticket');
const ErrorResponse = require('../utils/errorResponse');
const ApiFeatures = require('../utils/apiFeatures');
const generatePDF = require('../utils/generatePdf');
const cloudinary = require('cloudinary').v2;

// @desc    Get all tickets
// @route   GET /api/v1/tickets
// @access  Private
exports.getTickets = async (req, res, next) => {
  try {
    // Advanced filtering, sorting, pagination
    const features = new ApiFeatures(Ticket.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tickets = await features.query.populate('user', 'name email');

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single ticket
// @route   GET /api/v1/tickets/:id
// @access  Private
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      return next(
        new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new ticket
// @route   POST /api/v1/tickets
// @access  Private
exports.createTicket = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    const ticket = await Ticket.create(req.body);

    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update ticket
// @route   PUT /api/v1/tickets/:id
// @access  Private
exports.updateTicket = async (req, res, next) => {
  try {
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return next(
        new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is ticket owner or admin
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this ticket`,
          401
        )
      );
    }

    ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete ticket
// @route   DELETE /api/v1/tickets/:id
// @access  Private
exports.deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return next(
        new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is ticket owner or admin
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this ticket`,
          401
        )
      );
    }

    // Delete attachments from Cloudinary
    if (ticket.attachments && ticket.attachments.length > 0) {
      for (const attachment of ticket.attachments) {
        await cloudinary.uploader.destroy(attachment.public_id);
      }
    }

    await ticket.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload attachment for ticket
// @route   PUT /api/v1/tickets/:id/attachment
// @access  Private
exports.uploadAttachment = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return next(
        new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is ticket owner or admin
    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this ticket`,
          401
        )
      );
    }

    if (!req.files) {
      return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const file = req.files.file;

    // Check file type
    if (!file.mimetype.startsWith('image') && !file.mimetype.startsWith('application')) {
      return next(new ErrorResponse(`Please upload an image or PDF file`, 400));
    }

    // Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
          400
        )
      );
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'ticket-attachments',
      resource_type: 'auto'
    });

    ticket.attachments.push({
      url: result.secure_url,
      public_id: result.public_id,
      originalname: file.name
    });

    await ticket.save();

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate PDF for ticket
// @route   GET /api/v1/tickets/:id/pdf
// @access  Private
exports.generateTicketPDF = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      return next(
        new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404)
      );
    }

    // Generate PDF
    const pdfDoc = await generatePDF(ticket);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=ticket-${ticket._id}.pdf`
    );

    // Send the PDF
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    next(err);
  }
};