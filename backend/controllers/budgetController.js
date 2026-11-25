const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

// Add a new budget
const addBudget = async (req, res) => {
    try {
        const { category, amount, month, year } = req.body;

        if (
            typeof category !== "string" ||
            !category.trim() ||
            amount === undefined ||
            month === undefined ||
            year === undefined
        ) {
            return res.status(400).json({
                message: "Please provide all budget details"
            });
        }

        const budgetAmount = Number(amount);
        const budgetMonth = Number(month);
        const budgetYear = Number(year);

        if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
            return res.status(400).json({
                message: "Budget amount must be greater than zero"
            });
        }

        if (
            !Number.isInteger(budgetMonth) ||
            budgetMonth < 1 ||
            budgetMonth > 12 ||
            !Number.isInteger(budgetYear) ||
            budgetYear < 2000
        ) {
            return res.status(400).json({
                message: "Please provide a valid month and year"
            });
        }

        const budget = await Budget.create({
            user: req.user.id,
            category: category.trim(),
            amount: budgetAmount,
            month: budgetMonth,
            year: budgetYear
        });

        res.status(201).json({
            message: "Budget created successfully",
            budget
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "A budget for this category already exists for this month"
            });
        }

        res.status(500).json({
            message: "Failed to create budget",
            error: error.message
        });
    }
};


// Get budgets with spending information
const getBudgets = async (req, res) => {
    try {
        const currentDate = new Date();

        const month = req.query.month !== undefined
            ? Number(req.query.month)
            : currentDate.getMonth() + 1;

        const year = req.query.year !== undefined
            ? Number(req.query.year)
            : currentDate.getFullYear();

        if (
            !Number.isInteger(month) ||
            month < 1 ||
            month > 12 ||
            !Number.isInteger(year) ||
            year < 2000
        ) {
            return res.status(400).json({
                message: "Invalid month or year"
            });
        }

        const budgets = await Budget.find({
            user: req.user.id,
            month,
            year
        });

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        const budgetDetails = await Promise.all(
            budgets.map(async (budget) => {
                const expenses = await Transaction.find({
                    user: req.user.id,
                    type: "expense",
                    category: budget.category,
                    date: {
                        $gte: startDate,
                        $lt: endDate
                    }
                });

                const spent = expenses.reduce(
                    (total, transaction) => total + transaction.amount,
                    0
                );

                return {
                    ...budget.toObject(),
                    spent,
                    remaining: budget.amount - spent,
                    exceeded: spent > budget.amount
                };
            })
        );

        res.status(200).json({
            message: "Budgets retrieved successfully",
            count: budgetDetails.length,
            budgets: budgetDetails
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve budgets",
            error: error.message
        });
    }
};


// Update a budget
const updateBudget = async (req, res) => {
    try {
        const { amount } = req.body;

        if (
            amount === undefined ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0
        ) {
            return res.status(400).json({
                message: "Budget amount must be greater than zero"
            });
        }

        const budget = await Budget.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user.id
            },
            {
                amount: Number(amount)
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!budget) {
            return res.status(404).json({
                message: "Budget not found"
            });
        }

        res.status(200).json({
            message: "Budget updated successfully",
            budget
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update budget",
            error: error.message
        });
    }
};


// Delete a budget
const deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!budget) {
            return res.status(404).json({
                message: "Budget not found"
            });
        }

        res.status(200).json({
            message: "Budget deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete budget",
            error: error.message
        });
    }
};


module.exports = {
    addBudget,
    getBudgets,
    updateBudget,
    deleteBudget
};