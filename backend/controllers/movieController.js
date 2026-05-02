const axios = require('axios');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const ShowTime = require('../models/ShowTime');

// @desc    Search OMDB for movies
// @route   GET /api/movies/search
// @access  Private (Admins) or Public (depending on req. We will make it Private to Admins for syncing)
const searchOmdbMovies = async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: 'Query parameter q is required' });
    }

    try {
        const { data } = await axios.get(`http://www.omdbapi.com/?s=${q}&apikey=${process.env.OMDB_API_KEY}`);
        
        if (data.Response === 'False') {
            return res.status(404).json({ message: data.Error });
        }

        res.json(data.Search); // Returns array of basic movie details (Title, Year, imdbID, Type, Poster)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Sync a movie from OMDB to Local DB
// @route   POST /api/movies/sync
// @access  Private (TheaterAdmin / SuperAdmin)
const syncMovie = async (req, res) => {
    const { omdbId } = req.body;
    
    if (!omdbId) {
        return res.status(400).json({ message: 'omdbId is required' });
    }

    try {
        // Check if already in DB
        let movie = await Movie.findOne({ omdbId });
        if (movie) {
            return res.status(400).json({ message: 'Movie is already synced', movie });
        }

        // Fetch detailed info
        const { data } = await axios.get(`http://www.omdbapi.com/?i=${omdbId}&apikey=${process.env.OMDB_API_KEY}`);
        
        if (data.Response === 'False') {
            return res.status(404).json({ message: data.Error });
        }

        movie = await Movie.create({
            omdbId: data.imdbID,
            title: data.Title,
            plot: data.Plot,
            posterUrl: data.Poster,
            releaseDate: data.Released,
            runtime: data.Runtime,
            genre: data.Genre,
            director: data.Director,
            actors: data.Actors,
            imdbRating: data.imdbRating
        });

        res.status(201).json(movie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all local movies
// @route   GET /api/movies
// @access  Public
const getMovies = async (req, res) => {
    const { city, sort, limit } = req.query;
    
    try {
        let filter = {};
        
        if (city) {
            const theaters = await Theater.find({ city: { $regex: new RegExp(city, 'i') }, status: 'approved' });
            const theaterIds = theaters.map(t => t._id);
            
            const showtimes = await ShowTime.find({ 
                theaterId: { $in: theaterIds },
                startTime: { $gte: new Date() }
            }).distinct('movieId');
            
            filter = { _id: { $in: showtimes } };
        }

        let query = Movie.find(filter);

        // Sorting Logic
        if (sort === 'rating') {
            // Sort by imdbRating desc
            query = query.sort({ imdbRating: -1 });
        } else if (sort === 'latest') {
            // Sort by createdAt desc
            query = query.sort({ createdAt: -1 });
        }

        // Limit Logic
        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const movies = await Movie.find(filter)
            .sort(sort === 'rating' ? { imdbRating: -1 } : sort === 'latest' ? { createdAt: -1 } : {})
            .limit(limit ? parseInt(limit) : 0);
            
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get local movie details by ID
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (movie) {
            res.json(movie);
        } else {
            res.status(404).json({ message: 'Movie not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a synced movie
// @route   DELETE /api/movies/:id
// @access  Private (Super Admin)
const deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (movie) {
            await movie.deleteOne();
            res.json({ message: 'Movie removed successfully' });
        } else {
            res.status(404).json({ message: 'Movie not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    searchOmdbMovies,
    syncMovie,
    getMovies,
    getMovieById,
    deleteMovie
};
