const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Define routes for admin registration and login
router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.loginAdmin);
// Routes for posting announcements based on roles
router.post('/announcements', adminController.postAnnouncementByRole);
// Routes for getting announcements based on roles
router.get('/announcements/:roleName', adminController.getAnnouncementsByRole);
router.put('/users/:id/verify', adminController.verifyUserById);
router.get('/users', adminController.getAllUsers); // Get all users
router.get('/usersVerified', adminController.getVerifiedCollectors);
router.get('/usersAvailable', adminController.getAvailableCollectors);
router.get('/usersBooked', adminController.getBookedCollectors);
router.get('/users/:id', adminController.getUserById); // Get user by ID
router.put('/users/:id', adminController.updateUserById); // Update user by ID
router.delete('/users/:id', adminController.deleteUserById); // Delete user by ID


module.exports = router;
