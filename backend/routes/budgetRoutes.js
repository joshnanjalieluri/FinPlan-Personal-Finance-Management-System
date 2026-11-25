const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    addBudget,
    getBudgets,
    updateBudget,
    deleteBudget
} = require("../controllers/budgetController");

// Create a budget
router.post("/", protect, addBudget);

// Get all budgets
router.get("/", protect, getBudgets);

// Update a budget
router.put("/:id", protect, updateBudget);

// Delete a budget
router.delete("/:id", protect, deleteBudget);

module.exports = router;