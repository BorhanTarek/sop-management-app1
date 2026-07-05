const router = require('express').Router();
const ctrl = require('./safetyNotices.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${Date.now()}-${basename}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only images (PNG, JPG, JPEG, GIF, WEBP) and PDF files are allowed'));
    }
    cb(null, true);
  }
});

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', authorize('admin', 'station_manager', 'transport_manager'), upload.single('image'), ctrl.create);
router.patch('/:id', authorize('admin', 'station_manager', 'transport_manager'), upload.single('image'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);
router.post('/:id/acknowledge', ctrl.acknowledge);
router.get('/:id/logs', authorize('admin', 'station_manager', 'transport_manager'), ctrl.logs);

module.exports = router;
