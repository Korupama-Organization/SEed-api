import { Router } from 'express';
import {
    cancelLivestream,
    createLivestream,
    endLivestream,
    healthLivestream,
    startLivestream,
} from '../controllers/livestream.lifecycle.controller';
import { joinLivestream, leaveLivestream, rejoinLivestream } from '../controllers/livestream.join.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/domain-authorization.middleware';

const router = Router();

router.get('/health', healthLivestream);
router.post('/', requireAuth, requireRole('teacher'), createLivestream);
router.patch('/:livestreamId/start', requireAuth, requireRole('teacher'), startLivestream);
router.patch('/:livestreamId/end', requireAuth, requireRole('teacher'), endLivestream);
router.patch('/:livestreamId/cancel', requireAuth, requireRole('teacher'), cancelLivestream);
router.post('/:livestreamId/join', requireAuth, joinLivestream);
router.post('/:livestreamId/rejoin', requireAuth, rejoinLivestream);
router.post('/:livestreamId/leave', requireAuth, leaveLivestream);

export default router;