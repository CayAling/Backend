const Booking = require('../models/Booking');
const { calculateTotalPayment } = require('../utils/calculateTotalPayment')

const completeCollectionService = async (userId, bookingId) => {
    try {
        // Update the booking status to "Completed"
        await Booking.findByIdAndUpdate(bookingId, { status: 'Completed' });

        // Retrieve the booking details
        const booking = await Booking.findById(bookingId);

        // Calculate the total payment based on the quantity of bins collected and the pricing structure
        const totalPayment = calculateTotalPayment(booking.quantity, booking.binCategoryId);

        // Update the user's completed services count
        await User.findByIdAndUpdate(userId, { $inc: { completedServices: 1 } });

        // Check if the user is eligible for a free service after completing the booking
        const user = await User.findById(userId);
        if (user.completedServices >= 10) {
            // Find the next booking for the user that is not already marked as free
            const nextBooking = await Booking.findOne({ userId, status: { $ne: 'Free' } }).sort({ createdAt: 1 });

            if (nextBooking) {
                // Mark the next booking as free
                await Booking.findByIdAndUpdate(nextBooking._id, { status: 'Free' });
                // You can also set a flag in the booking document to indicate it's a free service if needed
            } else {
                console.log('No eligible bookings found for a free service.');
            }
        }
    } catch (error) {
        console.error('Error in completeCollectionService:', error);
        throw new Error('Failed to complete the collection service');
    }
};

module.exports = { completeCollectionService };
