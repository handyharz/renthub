import { Router } from 'express';
import { createReview, getPropertyReviews } from '../controllers/reviewController';

import { requireAuth } from '../middleware/auth';

const router: Router = Router();

router.post('/', requireAuth, createReview);
router.get('/properties/:id', getPropertyReviews);

export default router;
