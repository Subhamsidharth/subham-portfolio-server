import express from 'express';

const router = express.Router();

// Example GET route
// ...existing code...
import { storeKeyClick, contactUs, getContactUs, getAnalytics } from './controllers/controller.js';

router.post('/key-click', storeKeyClick);
router.post('/contact', contactUs);
router.get('/contact', getContactUs);
router.get('/analytics', getAnalytics);
// ...existing code...

export default router;