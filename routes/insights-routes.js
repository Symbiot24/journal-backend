import express from 'express';
import { jwtAuthMiddleware } from '../middleware/auth.js';
import { 
  getJournalInsights, 
  getUserInsightsSummary, 
  getUserMoodTrends 
} from '../controllers/insights-controller.js';

const router = express.Router();

// Route to get insights for a specific journal entry
router.get('/journal/:journalId', jwtAuthMiddleware, getJournalInsights);

// Route to get a summary of all user insights
router.get('/insights/summary', jwtAuthMiddleware, getUserInsightsSummary);

// Route to get mood trends over time
router.get('/insights/trends', jwtAuthMiddleware, getUserMoodTrends);

export default router;
