const Booking = require('../models/Booking');
const ShowTime = require('../models/ShowTime');
const Theater = require('../models/Theater');
const Stripe = require('stripe');

// We will inject Stripe separately if process.env.STRIPE_SECRET_KEY is valid.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// @desc    Create a new booking & Stripe session using Optimistic Locking
// @route   POST /api/bookings
// @access  Private (Customer)
const createBookingIntent = async (req, res) => {
    const { showTimeId, seatNumbers } = req.body;

    try {
        // 1. Fetch Showtime
        const showTime = await ShowTime.findById(showTimeId).populate('movieId theaterId');

        if (!showTime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }

        // 2. Validate seat availability and Calculate Total Amount
        let allAvailable = true;
        let totalAmount = 0;
        
        seatNumbers.forEach(requestedSeat => {
            const seat = showTime.seats.find(s => s.seatNumber === requestedSeat);
            if (!seat || seat.status !== 'available') {
                allAvailable = false;
            } else {
                totalAmount += seat.price;
            }
        });

        if (!allAvailable) {
            return res.status(400).json({ message: 'One or more requested seats are not available.' });
        }

        // 3. Mark seats as booked (Optimistic Locking)
        seatNumbers.forEach(requestedSeat => {
            const seatIndex = showTime.seats.findIndex(s => s.seatNumber === requestedSeat);
            showTime.seats[seatIndex].status = 'booked';
        });

        await showTime.save(); 

        // 4. Create local booking record
        const booking = await Booking.create({
            userId: req.user._id,
            showTimeId: showTime._id,
            seatNumbers,
            totalAmount,
            paymentStatus: 'pending'
        });

        // 5. Create Stripe Payment Intent
        if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'your_stripe_secret_key') {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalAmount * 100), // in cents
                currency: 'inr', // default to INR for India or USD if requested
                metadata: { bookingId: booking._id.toString() },
                automatic_payment_methods: { enabled: true },
            });

            booking.paymentIntentId = paymentIntent.id;
            await booking.save();

            return res.status(200).json({ 
                clientSecret: paymentIntent.client_secret, 
                bookingId: booking._id,
                totalAmount 
            });
        } else {
            // Mock response if no Stripe Key
            return res.status(200).json({ 
                clientSecret: 'mock_secret_123', 
                bookingId: booking._id,
                totalAmount,
                isMock: true
            });
        }

    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'Seats were just taken. Please try another selection.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Stripe Webhook (Optional for MVP, but good for validation)
// @route   POST /api/bookings/webhook
// @access  Public
const webhook = async (req, res) => {
    // simplified webhook handling
    console.log('Webhook received');
    res.status(200).send('Event received');
};

const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user._id })
            .populate({
                path: 'showTimeId',
                populate: {
                    path: 'movieId theaterId'
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAdminStats = async (req, res) => {
    const { theaterId } = req.query;
    try {
        let theaterIds;
        if (req.user.role === 'super_admin') {
            if (theaterId) {
                theaterIds = [theaterId];
            } else {
                // Global view for Super Admin
                const allTheaters = await Theater.find({ status: 'approved' });
                theaterIds = allTheaters.map(t => t._id);
            }
        } else {
            const theaters = await Theater.find({ adminId: req.user._id });
            theaterIds = theaters.map(t => t._id);
        }
        
        const showtimes = await ShowTime.find({ theaterId: { $in: theaterIds } });
        const showtimeIds = showtimes.map(st => st._id);

        const bookings = await Booking.find({ showTimeId: { $in: showtimeIds } });

        const stats = {
            totalBookings: bookings.length,
            completedBookings: bookings.filter(b => b.paymentStatus === 'completed').length,
            netProfit: bookings.filter(b => b.paymentStatus === 'completed').reduce((sum, b) => sum + b.totalAmount, 0),
            pendingBookings: bookings.filter(b => b.paymentStatus === 'pending').length
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAdminBookings = async (req, res) => {
    const { page = 1, limit = 10, theaterId } = req.query;
    try {
        let theaterIds;
        if (req.user.role === 'super_admin') {
            if (theaterId) {
                theaterIds = [theaterId];
            } else {
                // Global view for Super Admin
                const allTheaters = await Theater.find({ status: 'approved' });
                theaterIds = allTheaters.map(t => t._id);
            }
        } else {
            const theaters = await Theater.find({ adminId: req.user._id });
            theaterIds = theaters.map(t => t._id);
        }
        
        const showtimes = await ShowTime.find({ theaterId: { $in: theaterIds } });
        const showtimeIds = showtimes.map(st => st._id);

        const query = { showTimeId: { $in: showtimeIds } };
        
        const bookings = await Booking.find(query)
            .populate({
                path: 'showTimeId',
                populate: { path: 'movieId theaterId' }
            })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Booking.countDocuments(query);

        res.json({
            bookings,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBookingIntent,
    getMyBookings,
    getAdminStats,
    getAdminBookings,
    webhook
};
