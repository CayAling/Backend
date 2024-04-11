const express = require('express');
const router = express.Router();
const collectorController = require('../controllers/collectors.controller');
const { verifyToken } = require('../middlewares/auth');

// Booking routes
router.get('/collector/:userId', collectorController.getCollectorDetails); // Get collector details by user ID
router.get('/dashboard/collector', collectorController.viewDashboardByCollector); // View dashboard by team
router.put('/complete-collection', collectorController.completeCollection); // Mark collection as completed
router.get('/viewCompletedServices', collectorController.viewCompletedServices); // Mark booking as completed
module.exports = router;
