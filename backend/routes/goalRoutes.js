const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    addGoal,
    getGoals,
    addContribution,
    updateGoal,
    deleteGoal
} = require("../controllers/goalController");

// Create a goal
router.post("/", protect, addGoal);

// Get all goals
router.get("/", protect, getGoals);

// Add money to a goal
router.post("/:id/contribute", protect, addContribution);

// Update a goal
router.put("/:id", protect, updateGoal);

// Delete a goal
router.delete("/:id", protect, deleteGoal);

module.exports = router;