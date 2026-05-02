const express = require('express');
const router = express.Router();
const { createBookingIntent, getMyBookings, getAdminStats, getAdminBookings, webhook } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createBookingIntent);

router.get('/mybookings', protect, getMyBookings);
router.get('/admin/stats', protect, authorize('theater_admin', 'super_admin'), getAdminStats);
router.get('/admin/all', protect, authorize('theater_admin', 'super_admin'), getAdminBookings);

// Webhook for Stripe (raw body needed)
router.post('/webhook', express.raw({type: 'application/json'}), webhook);

module.exports = router;
