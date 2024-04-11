// Import required modules and models
const Booking = require('../models/Booking');
const Collector = require('../models/collectors');
const BinCategory = require('../models/BinCategory')
const User = require ('../models/User')
const { calculateTotalPayment } = require('../utils/calculateTotalPayment');
const { completeCollectionService } = require('../middlewares/bookingServices');

// Controller to get collector details by user ID
exports.getCollectorDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find the collector record associated with the user ID
        const collector = await Collector.findOne({ userId });

        if (!collector) {
            return res.status(404).json({ message: 'Collector details not found' });
        }

        res.status(200).json(collector);
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
exports.viewDashboardByCollector = async (req, res) => {
    try {
        const collectorId = req.body.collectorId; // Assuming collectorId is sent in the request body
        if (!collectorId) {
            return res.status(400).json({ message: 'Collector ID not provided in the request body' });
        }

        // Fetch bookings for the collector based on the collector's ID
        const bookings = await Booking.find({ collectorId })
            .populate({
                path: 'userId',
                select: 'username contact location' // Populate the resident's name and contact
            })
            .populate({
                path: 'binCategoryId',
                select: 'category quantity' // Populate the bin category's name
            })
            .populate({
                path: 'collectorId',
                select: 'name' // Populate the collector's name
            });

        res.status(200).json({ bookings });
    } catch (err) {
        console.error('Error while fetching dashboard data:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

exports.completeCollection = async (req, res) => {
    try {
        const { bookingId, collectorId } = req.body;

        console.log("collectorId:", collectorId);
        console.log("bookingId:", bookingId);

        // Retrieve the booking and the associated bin category
        const booking = await Booking.findOne({ _id: bookingId, collectorId });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found or not assigned to this collector' });
        }

        // Retrieve the bin category and its price
        const binCategory = await BinCategory.findById(booking.binCategoryId);
        if (!binCategory) {
            return res.status(404).json({ message: 'Bin category not found' });
        }
        // Calculate total payment for the booking based on bin category
        const totalPayment = await calculateTotalPayment(booking.binCategoryId);
        if (isNaN(totalPayment)) {
            return res.status(500).json({ message: 'Failed to calculate total payment' });
        }
       // Calculate income for the collector (2% commission per sack)
       let income;
       if (binCategory.category === 'smallSack' || binCategory.category === 'bigSack') {
           const price = binCategory.category === 'smallSack' ? 10 : 15; // Price for small and big sacks
           income = (price * binCategory.quantity) * 0.30;
       } else {
           return res.status(500).json({ message: 'Invalid bin category' });
       }

     // Update booking status to 'Completed' and save income
     booking.status = 'Completed';
     booking.income = income;
     await booking.save();

     // Update the user's completed services count and check for a free service
     await User.findByIdAndUpdate(booking.userId, { $inc: { completedServices: 1 } });
     const user = await User.findById(booking.userId);
     if (user.completedServices >= 10) {
         // Call completeBooking function to handle free service
         await exports.completeBooking(req, res);
     }

        // Fetch the collector using the collectorId from the booking
        const collector = await Collector.findById(collectorId);
        if (!collector) {
            console.log('Collector not found for collector ID:', collectorId);
            return res.status(404).json({ message: 'Collector not found for booking' });
        }

        // Update the status of the collector to "available"
        collector.status = 'available';
        await collector.save();

        res.status(200).json({ message: 'Collection completed successfully', income });
    } catch (err) {
        console.error('Error while completing collection:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
exports.viewCompletedServices = async (req, res) => {
    try {
        const { userId } = req.body;

        // Find the user by userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate the remaining bookings needed for a free service
        const remainingBookingsForFreeService = 10 - user.completedServices;

        // Get the completed services count
        const completedServices = user.completedServices;

        res.status(200).json({ completedServices, remainingBookingsForFreeService });
    } catch (err) {
        console.error('Error while viewing completed services:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
