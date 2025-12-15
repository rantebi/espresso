import { Router } from 'express';
import {
  createIssue,
  getIssueById,
  updateIssue,
  deleteIssue,
} from '../controllers/issueController';
import {
  validateCreateIssue,
  validateUpdateIssue,
  handleValidationErrors,
} from '../middleware/validation';

const router = Router();

router.post(
  '/issues',
  validateCreateIssue,
  handleValidationErrors,
  createIssue
);

router.get('/issues/:id', getIssueById);

router.put(
  '/issues/:id',
  validateUpdateIssue,
  handleValidationErrors,
  updateIssue
);

router.delete('/issues/:id', deleteIssue);

export default router;

