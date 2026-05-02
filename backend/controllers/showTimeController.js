const ShowTime = require('../models/ShowTime');
const Theater = require('../models/Theater');
const mongoose = require('mongoose');

// Helper to generate complex seat layouts
const generateSeats = (layoutConfig, globalSeatsPerRow = 10) => {
    // Fallback to default if no config provided
    if (!layoutConfig || layoutConfig.length === 0) {
        const rows = ['A', 'B', 'C', 'D', 'E'];
        const seats = [];
        rows.forEach(r => {
            for (let i = 1; i <= globalSeatsPerRow; i++) {
                seats.push({ seatNumber: `${r}${i}`, status: 'available', category: 'General', price: 150 });
            }
        });
        return seats;
    }

    const seats = [];
    layoutConfig.forEach(config => {
        const { category, rows, price } = config;
        rows.forEach(row => {
            for (let i = 1; i <= globalSeatsPerRow; i++) {
                seats.push({
                    seatNumber: `${row}${i}`,
                    status: 'available',
                    category,
                    price
                });
            }
        });
    });
    return seats;
};

// @desc    Create a new showtime
// @route   POST /api/showtimes
// @access  Private (Theater Admin)
const createShowTime = async (req, res) => {
    const { movieId, theaterId, screen, startTime, ticketPrice, layoutConfig, seatsPerRow } = req.body;

    try {
        // Verify if theater belongs to this admin
        const theater = await Theater.findById(theaterId);
        if (!theater || theater.adminId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to add showtime to this theater' });
        }
        if (theater.status !== 'approved') {
            return res.status(400).json({ message: 'Theater is not approved yet' });
        }

        const showTime = await ShowTime.create({
            movieId,
            theaterId,
            screen: screen || 'Screen 1',
            startTime,
            ticketPrice: ticketPrice || 0,
            seatsPerRow: seatsPerRow || 10,
            layoutConfig,
            seats: generateSeats(layoutConfig, seatsPerRow || 10),
        });

        res.status(201).json(showTime);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get showtimes for a movie
// @route   GET /api/showtimes/movie/:movieId
// @access  Public
const getShowTimesForMovie = async (req, res) => {
    try {
        const showtimes = await ShowTime.find({ 
            movieId: req.params.movieId,
            startTime: { $gte: new Date() } 
        })
            .populate('theaterId', 'name location city')
            .sort('startTime');
        res.json(showtimes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single showtime (with seats)
// @route   GET /api/showtimes/:id
// @access  Public
const getShowTimeById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        const showtime = await ShowTime.findById(req.params.id)
            .populate('movieId', 'title posterUrl runtime')
            .populate('theaterId', 'name location');
        
        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }
        res.json(showtime);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createShowTime,
    getShowTimesForMovie,
    getShowTimeById
};
