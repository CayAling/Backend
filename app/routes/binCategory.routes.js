const express = require('express');
const router = express.Router();
const binCategoryController = require('../controllers/binCategory.controller');

// Route to create a new bin category
router.post('/bin-categories', binCategoryController.createBinCategory);

// Route to get all bin categories
router.get('/bin-categories', binCategoryController.getAllBinCategories);

// Route to get a bin category by ID
router.get('/bin-categories/:id', binCategoryController.getBinCategoryById);

// Route to get a bin category by ID
router.get('/bin-categories/userid/:userId', binCategoryController.getUserById);

// Route to update a bin category by ID
router.put('/bin-categories/:id', binCategoryController.updateBinCategoryById);

// Route to delete a bin category by ID
router.delete('/bin-categories/:id', binCategoryController.deleteBinCategoryById);

module.exports = router;
