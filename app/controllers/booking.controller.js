const Booking = require('../models/Booking');
const BinCategory = require('../models/BinCategory');
const User = require('../models/User');
const Collector = require('../models/collectors');
const Role = require('../models/Role');
const mongoose = require('mongoose');
const { calculateTotalPayment } = require('../utils/calculateTotalPayment');

// Predefined date and time slots
const availableSlots = {
    '2024-03-10': ['10:00 AM', '10:30 AM', '5:00 PM'],
    '2024-03-11': ['9:00 AM', '11:00 AM', '4:00 PM'],
    '2024-03-12': ['9:00 AM', '11:00 AM', '4:00 PM']
};

exports.bookSchedule = async (req, res) => {
    try {
        const { userId, binCategoryId, scheduleDate, scheduleTime } = req.body;

        console.log('Received booking request:', { userId, binCategoryId, scheduleDate, scheduleTime });

        const binCategory = await BinCategory.findById(binCategoryId);

        // Fetch the user's profile to get their location
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const location = user.location;

        console.log('User location:', location);

        // Check if the selected date and time are valid
        if (!availableSlots.hasOwnProperty(scheduleDate)) {
            throw new Error('Invalid date selected');
        }

        const validTimes = availableSlots[scheduleDate];
        if (!validTimes.includes(scheduleTime)) {
            throw new Error('Invalid time selected for the given date');
        }

        // Fetch all collectors in the same location with status "available"
        const availableCollectors = await Collector.find({ status: 'available', verified:'true' }).populate('userId');

        console.log('Available collectors:', availableCollectors);
        // Filter collectors based on their availability for the requested date and time
        const filteredCollectors = availableCollectors.filter(collector => {
            // Check if the collector exists, has a user associated with it, and the user has a 'location' property
            return collector && collector.userId && collector.userId.location === location;
        });

        console.log('Filtered collectors based on location:', filteredCollectors);

        const capacityFilteredCollectors = filteredCollectors.filter(collector => {
            // Check if the collector exists and has the necessary properties
            return collector && collector.quantityGarbageSack && binCategory && binCategory.quantity && collector.quantityGarbageSack >= binCategory.quantity;
        });

        console.log('Capacity filtered collectors:', capacityFilteredCollectors);
        
        // Sort capacity filtered collectors based on their quantityGarbageSack
        capacityFilteredCollectors.sort((a, b) => a.quantityGarbageSack - b.quantityGarbageSack);

        if (capacityFilteredCollectors.length > 0) {
            const selectedCollector = capacityFilteredCollectors[0];
            const binCategoryId = new mongoose.Types.ObjectId(req.body.binCategoryId); 
            const totalPayment = await calculateTotalPayment(binCategoryId);

            console.log('Selected collector:', selectedCollector);

            // Update the status of the selected collector to "booked"
            selectedCollector.status = 'booked';
            await selectedCollector.save();

            console.log('Selected collector marked as booked');

            const booking = new Booking({
                userId,
                binCategoryId,
                location,
                scheduleDate,
                scheduleTime,
                collectorId: selectedCollector._id,
                totalPayment,
                quantityGarbageSack: user.quantityGarbageSack,
                collectorName: selectedCollector.userId.username, // Provide the collector's name
                status: 'booked' // Initially marked as booked
            });

            console.log('Booking object:', booking);
            
            await booking.save();

            console.log('Booking created successfully');

            res.status(201).json({ message: 'Booking created successfully' });
        } else {
            return res.status(404).json({ message: 'No available collectors in the location at the specified date and time' });
        }
    } catch (err) {
        console.error('Error while booking collector:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
exports.viewBookingDetails = async (req, res) => {
    try {
        const { userId } = req.params; // Get the userId from URL params

        console.log('Viewing booking details for user:', userId); // Log user ID for whom details are being viewed

        // Find bookings for the user and populate fields with names
        const bookings = await Booking.find({ userId }) // Use find method with userId as filter
            .populate({
                path: 'userId',
                select: 'username' // Populate the resident's name
            })
            .populate({
                path: 'binCategoryId',
                select: 'category quantity' // Populate the bin category's name and quantity
            });

        // Format the response to include collector details and payment amount
        const formattedBookings = bookings.map(booking => {
            const collector = booking.collectorId ? {
                name: booking.collectorId.userId.name,
                contact: booking.collectorId.userId.contact,
                vehicleType: booking.collectorId.vehicleType,
                quantityGarbageSack: booking.collectorId.quantityGarbageSack
            } : null;
            
            return {
                ...booking.toJSON(),
                totalPayment: booking.totalPayment || 0 // Assuming totalPayment is a field in the schema
            };
        });

        res.status(200).json({ bookings: formattedBookings });
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
exports.cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        console.log('Canceling booking with ID:', bookingId); // Log booking ID being canceled

        // Find the booking to be cancelled
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update the status of the booking from 'booked' to 'cancelled'
        booking.status = 'cancelled';
        await booking.save();

        // Fetch the selected collector using the collectorId from the booking
        const selectedCollector = await Collector.findById(booking.collectorId);

        if (!selectedCollector) {
            console.log('Collector not found for booking ID:', bookingId);
            return res.status(404).json({ message: 'Collector not found for booking' });
        }

        // Update the status of the selected collector to "available"
        selectedCollector.status = 'available';
        await selectedCollector.save();

        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
