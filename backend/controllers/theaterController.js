const Theater = require('../models/Theater');

// @desc    Register a new theater (Pending approval)
// @route   POST /api/theaters
// @access  Private (Theater Admin)
const requestTheater = async (req, res) => {
    const { name, location, city } = req.body;
    try {
        const theater = await Theater.create({
            name,
            location,
            city,
            adminId: req.user._id,
        });
        res.status(201).json(theater);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get approved theaters
// @route   GET /api/theaters
// @access  Public
const getTheaters = async (req, res) => {
    try {
        const theaters = await Theater.find({ status: 'approved' });
        res.json(theaters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all theaters (for Super Admin dashboard)
// @route   GET /api/theaters/all
// @access  Private (Super Admin)
const getAllTheaters = async (req, res) => {
    try {
        const theaters = await Theater.find().populate('adminId', 'name email');
        res.json(theaters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get this admin's own theaters
// @route   GET /api/theaters/mine
// @access  Private (Theater Admin)
const getMyTheaters = async (req, res) => {
    try {
        const theaters = await Theater.find({ adminId: req.user._id });
        res.json(theaters);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update theater status (Approve/Reject)
// @route   PUT /api/theaters/:id/status
// @access  Private (Super Admin)
const updateTheaterStatus = async (req, res) => {
    const { status } = req.body; 
    if (!['approved', 'rejected', 'blocked'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const theater = await Theater.findById(req.params.id);
        if (!theater) {
            return res.status(404).json({ message: 'Theater not found' });
        }

        theater.status = status;
        await theater.save();
        res.json(theater);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get unique cities with approved theaters
// @route   GET /api/theaters/cities
// @access  Public
const getTheaterCities = async (req, res) => {
    try {
        const cities = await Theater.find({ status: 'approved' }).distinct('city');
        res.json(cities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    requestTheater,
    getTheaters,
    getAllTheaters,
    getMyTheaters,
    updateTheaterStatus,
    getTheaterCities
};
