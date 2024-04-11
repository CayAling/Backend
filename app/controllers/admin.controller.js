const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const Role = require('../models/Role')
const User = require('../models/User');
const Collector = require('../models/collectors');
const Announcement = require('../models/announcement')
const config = require('../config/auth.config');

exports.registerAdmin = async (req, res) => {
    try {
        // Check if an admin already exists
        const existingAdmin = await Admin.findOne();
        if (existingAdmin) {
            return res.status(400).json({ message: 'An admin account already exists' });
        }

        const { username, email, password, roleId } = req.body;

        // Check if any required field is missing
        if (!username || !email || !password || !roleId) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if the provided roleId exists
        const role = await Role.findById(roleId);
        if (!role) {
            return res.status(400).json({ error: 'Invalid role ID' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new admin object and associate the role
        const newAdmin = new Admin({ username, email, password: hashedPassword, roles: [roleId] });

        // Save the admin
        await newAdmin.save();

        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the admin exists
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check if the password is correct
        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ adminId: admin._id }, config.secret, { expiresIn: '24h' });

        // Return admin data and token
        res.status(200).json({
            _id: admin._id,
            email: admin.email,
            accessToken: token
        });
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};


// Fetch all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
const postAnnouncement = async (req, res, targetRoles) => {
    try {
        const { title, content } = req.body;

        // Create announcement object
        const announcement = new Announcement({ title, content });

        // Save the announcement
        await announcement.save();

        // Fetch all users with the specified roles
        const users = await User.find({ roles: { $in: targetRoles } });
        // Send the announcement to each user
        await Promise.all(users.map(async (user) => {
            try {
                //notification sending logic goes here
                console.log(`Sending notification to user ${user.username} for announcement: ${announcement.title}`);
            } catch (error) {
                // Handle any errors that occur during sending notifications
                console.error(`Error sending notification to user ${user.username}:`, error);
            }
        }));


        res.status(201).json({ message: `Announcement posted and sent to users with specified roles successfully` });
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
exports.postAnnouncementByRole = async (req, res) => {
    try {
        const { roleName } = req.body;

        // Find the role corresponding to the provided role name
        const role = await Role.findOne({ name: roleName });
        if (!role) {
            console.log(`Role not found for name: ${roleName}`);
            return res.status(400).json({ message: 'Role not found' });
        }

        console.log(`Found role: ${roleName}, ID: ${role._id}`);

        // Create announcement object
        const { title, content } = req.body;
        const announcement = new Announcement({ title, content, targetRoles: [role._id] });

        // Save the announcement
        await announcement.save();

        console.log(`Announcement saved with targetRoles: ${announcement.targetRoles}`);

        // Fetch all users with the specified roles
        const users = await User.find({ roles: { $in: [role._id] } });
        // Send the announcement to each user
        await Promise.all(users.map(async (user) => {
            try {
                // Notification sending logic goes here
                console.log(`Sending notification to user ${user.username} for announcement: ${announcement.title}`);
            } catch (error) {
                // Handle any errors that occur during sending notifications
                console.error(`Error sending notification to user ${user.username}:`, error);
            }
        }));

        // Send response after successful operation
        res.status(201).json({ message: 'Announcement posted and sent to users with specified role successfully' });
    } catch (err) {
        console.error('Error while posting announcement:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

exports.getAnnouncementsByRole = async (req, res) => {
    try {
        const { roleName } = req.params;

        console.log(`Fetching announcements for role: ${roleName}`);

        // Find the role corresponding to the provided role name
        const role = await Role.findOne({ name: roleName });
        if (!role) {
            console.log(`Role not found for name: ${roleName}`);
            return res.status(400).json({ message: 'Role not found' });
        }

        console.log(`Found role: ${roleName}, ID: ${role._id}`);

        // Fetch announcements targeting the specified role
        const announcements = await Announcement.find({ targetRoles: role._id });

        console.log(`Fetched ${announcements.length} announcements`);

        res.status(200).json({ announcements });
    } catch (err) {
        console.error('Error while fetching announcements by role:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// Verify user by ID
exports.verifyUserById = async (req, res) => {
    try {
        const collectorId = req.params.id;

        // Check if the user exists
        const user = await Collector.findById(collectorId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user verification status
        user.verified = true;
        await user.save();

        res.status(200).json({ message: 'User verified successfully', user });
    } catch (err) {
        console.error('Error while verifying user:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// Fetch user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = {
            username: user.username,
            email: user.email,
            role: user.roles,
            profilePicture: user.roles,
            contact: user.contact,
            location: user.location
        };
        res.status(200).json(userData);
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// Update user by ID
exports.updateUserById = async (req, res) => {
    try {
        const { roleId} = req.body;

        console.log("Request Body:", req.body); // Log request body to check if vehicleType and quantityGarbageSack are included

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log("User before update:", user); // Log user document before update

        // Update user data
        user.roles = roleId;


        const updatedUser = await user.save(); // Save the updated user document

        console.log("User after update:", updatedUser); // Log user document after update

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
exports.deleteUserById = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find the user to be deleted
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user's role is 'collector'
        const role = await Role.findById(user.roles);
        if (role && role.name === 'collector') {
            // If the user is a collector, delete the corresponding collector data
            await Collector.deleteOne({ userId: userId });
        }

        // Delete the user
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error while handling database error:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
exports.getVerifiedCollectors = async (req, res) => {
    try {
        const verifiedCollectors = await Collector.find({ verified:true });
        res.status(200).json({ collectors: verifiedCollectors });
    } catch (error) {
        console.error('Error retrieving verified collectors:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// get collectors with status = 'available'
exports.getAvailableCollectors = async (req, res) => {
    try {
        const availableCollectors = await Collector.find({ status: 'available', verified: true });
        res.status(200).json({ collectors: availableCollectors });
    } catch (error) {
        console.error('Error retrieving available collectors:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// get collectors with status = 'available'
exports.getBookedCollectors = async (req, res) => {
    try {
        const availableCollectors = await Collector.find({ status: 'booked' });
        res.status(200).json({ collectors: availableCollectors });
    } catch (error) {
        console.error('Error retrieving available collectors:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
