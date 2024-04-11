const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/roles.controller');

// Route to create a new role
router.post('/roles', RoleController.createRole);

// Route to get all roles
router.get('/roles', RoleController.getAllRoles);

// Route to get role by ID
router.get('/roles/:id', RoleController.getRoleById);

// Route to delete role by ID
router.delete('/roles/:id', RoleController.deleteRoleById);

module.exports = router;
