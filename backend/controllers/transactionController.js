const Transaction = require("../models/Transaction");

// Add a new transaction
const addTransaction = async (req, res) => {
    try {
        const {
            type,
            amount,
            category,
            description,
            date,
            paymentMethod
        } = req.body;

        if (
            !type ||
            amount === undefined ||
            typeof category !== "string" ||
            !category.trim()
        ) {
            return res.status(400).json({
                message: "Type, amount and category are required"
            });
        }

        if (!["income", "expense"].includes(type)) {
            return res.status(400).json({
                message: "Type must be income or expense"
            });
        }

        const transactionAmount = Number(amount);

        if (
            !Number.isFinite(transactionAmount) ||
            transactionAmount <= 0
        ) {
            return res.status(400).json({
                message: "Amount must be a positive number"
            });
        }

        let transactionDate;

        if (date !== undefined && date !== "") {
            transactionDate = new Date(date);

            if (isNaN(transactionDate.getTime())) {
                return res.status(400).json({
                    message: "Please provide a valid transaction date"
                });
            }
        }

        const transaction = await Transaction.create({
            user: req.user.id,
            type,
            amount: transactionAmount,
            category: category.trim(),
            description,
            ...(transactionDate && { date: transactionDate }),
            paymentMethod
        });

        res.status(201).json({
            message: "Transaction added successfully",
            transaction
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to add transaction",
            error: error.message
        });
    }
};


// Get all transactions of logged-in user
const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.user.id
        }).sort({ date: -1 });

        res.status(200).json({
            count: transactions.length,
            transactions
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch transactions",
            error: error.message
        });
    }
};


// Delete a transaction
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        res.status(200).json({
            message: "Transaction deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete transaction",
            error: error.message
        });
    }
};


// Update a transaction
const updateTransaction = async (req, res) => {
    try {
        const allowedFields = [
            "type",
            "amount",
            "category",
            "description",
            "date",
            "paymentMethod"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "Please provide at least one field to update"
            });
        }

        if (
            updates.type !== undefined &&
            !["income", "expense"].includes(updates.type)
        ) {
            return res.status(400).json({
                message: "Type must be income or expense"
            });
        }

        if (updates.amount !== undefined) {
            updates.amount = Number(updates.amount);

            if (
                !Number.isFinite(updates.amount) ||
                updates.amount <= 0
            ) {
                return res.status(400).json({
                    message: "Amount must be a positive number"
                });
            }
        }

        if (updates.category !== undefined) {
            if (
                typeof updates.category !== "string" ||
                !updates.category.trim()
            ) {
                return res.status(400).json({
                    message: "Category cannot be empty"
                });
            }

            updates.category = updates.category.trim();
        }

        if (updates.date !== undefined) {
            const transactionDate = new Date(updates.date);

            if (isNaN(transactionDate.getTime())) {
                return res.status(400).json({
                    message: "Please provide a valid transaction date"
                });
            }

            updates.date = transactionDate;
        }

        const transaction = await Transaction.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.id
            },
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        res.status(200).json({
            message: "Transaction updated successfully",
            transaction
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update transaction",
            error: error.message
        });
    }
};


module.exports = {
    addTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction
};