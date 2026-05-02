const express = require('express');
const router = express.Router();
const { searchOmdbMovies, syncMovie, getMovies, getMovieById, deleteMovie } = require('../controllers/movieController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getMovies);

router.route('/search')
    .get(protect, authorize('theater_admin', 'super_admin'), searchOmdbMovies);

router.route('/sync')
    .post(protect, authorize('theater_admin', 'super_admin'), syncMovie);

router.route('/:id')
    .get(getMovieById)
    .delete(protect, authorize('super_admin'), deleteMovie);

module.exports = router;
