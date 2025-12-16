import { Router } from 'express';
import {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
} from '../controllers/issueController';
import {
  validateCreateIssue,
  validateUpdateIssue,
  validateIssueId,
  validatePagination,
  handleValidationErrors,
} from '../middleware/validation';

const router = Router();

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

export default router;

