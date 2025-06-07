const PDFDocument = require('pdfkit');
const fs = require('fs');

const generatePDF = async (ticket) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });

      // Add ticket header
      doc
        .fontSize(20)
        .text('Ticket Details', { align: 'center' })
        .moveDown(0.5);

      // Add ticket information
      doc
        .fontSize(14)
        .text(`Ticket ID: ${ticket._id}`)
        .text(`Title: ${ticket.title}`)
        .text(`Status: ${ticket.status}`)
        .text(`Priority: ${ticket.priority}`)
        .text(`Created By: ${ticket.user.name} (${ticket.user.email})`)
        .moveDown();

      if (ticket.assignedTo) {
        doc
          .text(`Assigned To: ${ticket.assignedTo.name} (${ticket.assignedTo.email})`)
          .moveDown();
      }

      // Add description
      doc
        .fontSize(12)
        .text('Description:', { underline: true })
        .moveDown(0.5)
        .text(ticket.description, { width: 500 })
        .moveDown();

      // Add attachments if any
      if (ticket.attachments.length > 0) {
        doc
          .fontSize(12)
          .text('Attachments:', { underline: true })
          .moveDown(0.5);

        ticket.attachments.forEach((attachment, index) => {
          doc.text(`${index + 1}. ${attachment.originalname}`);
        });
      }

      // Add footer
      doc
        .fontSize(10)
        .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });

      resolve(doc);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generatePDF;