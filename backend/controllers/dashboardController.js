const Transaction = require("../models/Transaction");

// Get dashboard data
const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all transactions of the logged-in user
        const transactions = await Transaction.find({
            user: userId
        }).sort({ date: -1 });

        // Calculate total income and expenses
        let totalIncome = 0;
        let totalExpenses = 0;

        transactions.forEach((transaction) => {
            if (transaction.type === "income") {
                totalIncome += transaction.amount;
            } else if (transaction.type === "expense") {
                totalExpenses += transaction.amount;
            }
        });

        // Calculate available balance
        const balance = totalIncome - totalExpenses;

        // Get current month's transactions
        const now = new Date();

        const monthStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        const nextMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
        );

        const monthlyTransactions = transactions.filter((transaction) => {
            return transaction.date >= monthStart &&
                   transaction.date < nextMonthStart;
        });

        let monthlyIncome = 0;
        let monthlyExpenses = 0;

        monthlyTransactions.forEach((transaction) => {
            if (transaction.type === "income") {
                monthlyIncome += transaction.amount;
            } else {
                monthlyExpenses += transaction.amount;
            }
        });

        // Calculate monthly savings and savings rate
        const monthlySavings = monthlyIncome - monthlyExpenses;

        const savingsRate = monthlyIncome > 0
            ? (monthlySavings / monthlyIncome) * 100
            : 0;

        // Calculate expense breakdown by category
        const categoryBreakdown = {};

        monthlyTransactions.forEach((transaction) => {
            if (transaction.type === "expense") {
                const category = transaction.category;

                categoryBreakdown[category] =
                    (categoryBreakdown[category] || 0) +
                    transaction.amount;
            }
        });

        // Get the five most recent transactions
        const recentTransactions = transactions.slice(0, 5);

        res.status(200).json({
            message: "Dashboard data retrieved successfully",

            summary: {
                totalIncome,
                totalExpenses,
                balance,
                monthlyIncome,
                monthlyExpenses,
                monthlySavings,
                savingsRate: Number(savingsRate.toFixed(2))
            },

            categoryBreakdown,

            recentTransactions
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to retrieve dashboard data",
            error: error.message
        });
    }
};

module.exports = {
    getDashboardData
};