import { Router } from 'express';
import multer from 'multer';
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
  uploadIssuesFromCSV,
  getIssueStatistics,
} from '../controllers/issueController';
import {
  validateCreateIssue,
  validateUpdateIssue,
  validateIssueId,
  validatePagination,
  handleValidationErrors,
} from '../middleware/validation';

const router = Router();

// Configure multer for file uploads (memory storage for Lambda compatibility)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

router.post(
  '/issues',
  validateCreateIssue,
  handleValidationErrors,
  createIssue
);

router.get(
  '/issues',
  validatePagination,
  handleValidationErrors,
  getAllIssues
);

router.get(
  '/issues/stats',
  getIssueStatistics
);

router.get(
  '/issues/:id',
  validateIssueId,
  handleValidationErrors,
  getIssueById
);

router.put(
  '/issues/:id',
  validateIssueId,
  validateUpdateIssue,
  handleValidationErrors,
  updateIssue
);

router.delete(
  '/issues/:id',
  validateIssueId,
  handleValidationErrors,
  deleteIssue
);

router.post(
  '/issues/upload',
  (req, res, next) => {
    upload.single('csv')(req, res, (err) => {
      if (err) {
        // Handle multer errors (e.g., file filter rejection)
        return res.status(400).json({
          success: false,
          error: 'Invalid file',
          message: err.message || 'Only CSV files are allowed',
        });
      }
      next();
    });
  },
  uploadIssuesFromCSV
);

export default router;

