const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    addTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction
} = require("../controllers/transactionController");

// Add transaction
router.post("/", protect, addTransaction);

// Get all transactions
router.get("/", protect, getTransactions);

// Update transaction
router.put("/:id", protect, updateTransaction);

// Delete transaction
router.delete("/:id", protect, deleteTransaction);

module.exports = router;