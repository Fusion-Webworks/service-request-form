const Ticket = require('../models/Ticket');
const ErrorResponse = require('../utils/errorResponse');
const cloudinary = require('cloudinary').v2;

exports.getTickets = async (queryStr) => {
  // Advanced filtering, sorting, pagination
  const features = new ApiFeatures(Ticket.find(), queryStr)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tickets = await features.query.populate('user', 'name email');
  return tickets;
};

exports.getTicketById = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId)
    .populate('user', 'name email')
    .populate('assignedTo', 'name email');

  if (!ticket) {
    throw new ErrorResponse(`Ticket not found with id of ${ticketId}`, 404);
  }

  return ticket;
};

exports.createTicket = async (ticketData) => {
  const ticket = await Ticket.create(ticketData);
  return ticket;
};

exports.updateTicket = async (ticketId, updateData, userId, userRole) => {
  let ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw new ErrorResponse(`Ticket not found with id of ${ticketId}`, 404);
  }

  // Make sure user is ticket owner or admin
  if (ticket.user.toString() !== userId && userRole !== 'admin') {
    throw new ErrorResponse(
      `User ${userId} is not authorized to update this ticket`,
      401
    );
  }

  ticket = await Ticket.findByIdAndUpdate(ticketId, updateData, {
    new: true,
    runValidators: true
  });

  return ticket;
};

exports.deleteTicket = async (ticketId, userId, userRole) => {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw new ErrorResponse(`Ticket not found with id of ${ticketId}`, 404);
  }

  // Make sure user is ticket owner or admin
  if (ticket.user.toString() !== userId && userRole !== 'admin') {
    throw new ErrorResponse(
      `User ${userId} is not authorized to delete this ticket`,
      401
    );
  }

  // Delete attachments from Cloudinary
  if (ticket.attachments && ticket.attachments.length > 0) {
    for (const attachment of ticket.attachments) {
      await cloudinary.uploader.destroy(attachment.public_id);
    }
  }

  await ticket.remove();
  return ticket;
};

exports.uploadAttachment = async (ticketId, file, userId, userRole) => {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    throw new ErrorResponse(`Ticket not found with id of ${ticketId}`, 404);
  }

  // Make sure user is ticket owner or admin
  if (ticket.user.toString() !== userId && userRole !== 'admin') {
    throw new ErrorResponse(
      `User ${userId} is not authorized to update this ticket`,
      401
    );
  }

  if (!file) {
    throw new ErrorResponse(`Please upload a file`, 400);
  }

  // Check file type
  if (!file.mimetype.startsWith('image') && !file.mimetype.startsWith('application')) {
    throw new ErrorResponse(`Please upload an image or PDF file`, 400);
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    throw new ErrorResponse(
      `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
      400
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
  return ticket;
};