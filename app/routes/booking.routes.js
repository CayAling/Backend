// routes/booking.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');

// Route to book a schedule
router.post('/bookings', bookingController.bookSchedule);

// Route to view booking details for a specific user
router.get('/bookings/:userId', bookingController.viewBookingDetails);

// Route to cancel a booking
router.put('/bookings/:bookingId', bookingController.cancelBooking);



module.exports = router;
