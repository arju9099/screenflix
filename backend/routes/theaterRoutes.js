const express = require('express');
const router = express.Router();
const { requestTheater, getTheaters, getAllTheaters, getMyTheaters, updateTheaterStatus, getTheaterCities } = require('../controllers/theaterController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/cities', getTheaterCities);

router.route('/')
    .get(getTheaters)
    .post(protect, authorize('theater_admin', 'super_admin'), requestTheater);

router.route('/all')
    .get(protect, authorize('super_admin'), getAllTheaters);

router.route('/mine')
    .get(protect, authorize('theater_admin'), getMyTheaters);

router.route('/:id/status')
    .put(protect, authorize('super_admin'), updateTheaterStatus);

module.exports = router;
