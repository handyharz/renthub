import { Router } from 'express';
import { ServiceTransactionController } from '../controllers/serviceTransaction.controller';
// import { requireAuth } from '../middleware/requireAuth'; // Assuming this middleware exists

const router: Router = Router();
const controller = new ServiceTransactionController();

// TODO: cache authentication middleware if available
// const auth = requireAuth; 

// Mock auth middleware for now if we can't find the real one easily, 
// but we should try to use the real one. 
// Based on progress.md, "Built auth middleware (JWT verification with Clerk)".
// It should be in ../middleware/auth or similar.
import { requireAuth } from '../middleware/auth'; // Trying standard naming

router.post('/pay', requireAuth, controller.initiate);
router.post('/verify', requireAuth, controller.verify);

export default router;
