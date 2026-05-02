const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Theater = require('./models/Theater');
const Movie = require('./models/Movie');
const ShowTime = require('./models/ShowTime');
const User = require('./models/User');

dotenv.config();

const seedTheatersAndShows = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const admin = await User.findOne({ role: 'super_admin' });
        if (!admin) {
            console.log('Please run seedSuperAdmin.js first');
            process.exit(1);
        }

        // 1. Create or Find Movies
        const movies = await Movie.find({});
        if (movies.length < 2) {
            console.log('Please sync at least 2 movies via Admin dash first');
            process.exit(1);
        }

        const movie1 = movies[0];
        const movie2 = movies[1];

        // 2. Create Theaters in different cities
        const theaters = [
            { name: 'PVR Phoenix', city: 'Mumbai', location: 'Lower Parel', adminId: admin._id, status: 'approved' },
            { name: 'PVR Select Citywalk', city: 'Delhi', location: 'Saket', adminId: admin._id, status: 'approved' },
            { name: 'PVR Orion', city: 'Bangalore', location: 'Malleshwaram', adminId: admin._id, status: 'approved' }
        ];

        for (const t of theaters) {
            let theater = await Theater.findOne({ name: t.name });
            if (!theater) {
                theater = await Theater.create(t);
                console.log(`Created Theater: ${t.name} in ${t.city}`);
            }

            // 3. Create Showtimes for these theaters
            // Movie 1 in Mumbai & Delhi
            // Movie 2 in Bangalore only
            if (t.city === 'Mumbai' || t.city === 'Delhi') {
                await ShowTime.create({
                    movieId: movie1._id,
                    theaterId: theater._id,
                    startTime: new Date(Date.now() + 86400000), // tomorrow
                    seats: Array.from({ length: 100 }, (_, i) => ({
                        seatNumber: `A${i+1}`,
                        status: 'available',
                        category: 'Silver',
                        price: 200
                    }))
                });
                console.log(`Created ShowTime for ${movie1.title} in ${t.name}`);
            }

            if (t.city === 'Bangalore') {
                await ShowTime.create({
                    movieId: movie2._id,
                    theaterId: theater._id,
                    startTime: new Date(Date.now() + 86400000),
                    seats: Array.from({ length: 100 }, (_, i) => ({
                        seatNumber: `A${i+1}`,
                        status: 'available',
                        category: 'Gold',
                        price: 300
                    }))
                });
                console.log(`Created ShowTime for ${movie2.title} in ${t.name}`);
            }
        }

        console.log('Test Discovery Data Seeded Successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding test theaters:', error);
        process.exit(1);
    }
};

seedTheatersAndShows();
