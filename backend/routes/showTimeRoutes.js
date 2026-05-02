const express = require('express');
const router = express.Router();
const { createShowTime, getShowTimesForMovie, getShowTimeById } = require('../controllers/showTimeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('theater_admin'), createShowTime);

router.route('/movie/:movieId')
    .get(getShowTimesForMovie);

router.route('/:id')
    .get(getShowTimeById);

module.exports = router;
