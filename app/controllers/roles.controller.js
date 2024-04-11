const Role = require('../models/Role');

// Controller to create a new role
exports.createRole = async (req, res) => {
    try {
        const { name } = req.body;

        // Check if the role name is provided
        if (!name) {
            return res.status(400).json({ error: 'Role name is required' });
        }

        // Check if the role already exists
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            return res.status(400).json({ message: 'Role already exists' });
        }

        // Create a new role
        const newRole = new Role({ name });

        // Save the role
        await newRole.save();

        res.status(201).json({ message: 'Role created successfully', role: newRole });
    } catch (err) {
        console.error('Error while creating role:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// Controller to get all roles
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find();
        res.status(200).json(roles);
    } catch (err) {
        console.error('Error while fetching roles:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// Controller to get role by ID
exports.getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        res.status(200).json(role);
    } catch (err) {
        console.error('Error while fetching role by ID:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};

// Controller to delete role by ID
exports.deleteRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        await role.remove();
        res.status(200).json({ message: 'Role deleted successfully' });
    } catch (err) {
        console.error('Error while deleting role:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
};
