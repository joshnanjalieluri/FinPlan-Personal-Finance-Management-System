const Goal = require("../models/Goal");

// Create a new savings goal
const addGoal = async (req, res) => {
    try {
        const { name, targetAmount, targetDate } = req.body;

        if (
            !name ||
            !name.trim() ||
            targetAmount === undefined ||
            !targetDate
        ) {
            return res.status(400).json({
                message: "Please provide all required fields."
            });
        }

        const amount = Number(targetAmount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                message: "Target amount must be greater than zero."
            });
        }

        const date = new Date(targetDate);

        if (isNaN(date.getTime())) {
            return res.status(400).json({
                message: "Please provide a valid target date."
            });
        }

        const goal = await Goal.create({
            user: req.user.id,
            name: name.trim(),
            targetAmount: amount,
            targetDate: date
        });

        res.status(201).json({
            message: "Savings goal created successfully!",
            goal
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// Get all savings goals of logged-in user
const getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

        const updatedGoals = goals.map(goal => {
            const progress = Math.min(
                (goal.savedAmount / goal.targetAmount) * 100,
                100
            );

            return {
                ...goal.toObject(),
                remainingAmount: Math.max(
                    goal.targetAmount - goal.savedAmount,
                    0
                ),
                progress: Number(progress.toFixed(2))
            };
        });

        res.status(200).json({
            goals: updatedGoals
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// Add savings contribution
const addContribution = async (req, res) => {
    try {
        const { amount } = req.body;

        if (
            amount === undefined ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0
        ) {
            return res.status(400).json({
                message: "Contribution must be greater than zero."
            });
        }

        const goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!goal) {
            return res.status(404).json({
                message: "Savings goal not found."
            });
        }

        if (goal.savedAmount >= goal.targetAmount) {
            return res.status(400).json({
                message: "This savings goal is already completed."
            });
        }

        goal.savedAmount = Math.min(
            goal.savedAmount + Number(amount),
            goal.targetAmount
        );

        await goal.save();

        res.status(200).json({
            message: "Contribution added successfully!",
            goal
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// Update savings goal
const updateGoal = async (req, res) => {
    try {
        const { name, targetAmount, targetDate } = req.body;

        const goal = await Goal.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!goal) {
            return res.status(404).json({
                message: "Savings goal not found."
            });
        }

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Goal name cannot be empty."
                });
            }

            goal.name = name.trim();
        }

        if (targetDate !== undefined) {
            const date = new Date(targetDate);

            if (isNaN(date.getTime())) {
                return res.status(400).json({
                    message: "Please provide a valid target date."
                });
            }

            goal.targetDate = date;
        }

        if (targetAmount !== undefined) {
            const amount = Number(targetAmount);

            if (!Number.isFinite(amount) || amount <= 0) {
                return res.status(400).json({
                    message: "Target amount must be greater than zero."
                });
            }

            if (amount < goal.savedAmount) {
                return res.status(400).json({
                    message: "Target amount cannot be less than the amount already saved."
                });
            }

            goal.targetAmount = amount;
        }

        await goal.save();

        res.status(200).json({
            message: "Savings goal updated successfully!",
            goal
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// Delete savings goal
const deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!goal) {
            return res.status(404).json({
                message: "Savings goal not found."
            });
        }

        res.status(200).json({
            message: "Savings goal deleted successfully!"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    addGoal,
    getGoals,
    addContribution,
    updateGoal,
    deleteGoal
};