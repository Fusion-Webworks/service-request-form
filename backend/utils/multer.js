const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    );
  }
});

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: process.env.MAX_FILE_UPLOAD },
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

// Check file type
function checkFileType(file, cb) {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images, PDFs, and Docs only!');
  }
}

module.exports = upload;