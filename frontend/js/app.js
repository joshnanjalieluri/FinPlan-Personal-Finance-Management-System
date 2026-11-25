// ==========================================
// FINPLAN - FRONTEND JAVASCRIPT
// ==========================================

const API_URL = "http://localhost:5000/api";

let allTransactionsData = [];
let allBudgetsData = [];
let allGoalsData = [];

// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(message) {
    alert(message);
}

// ==========================================
// GET USER PROFILE
// ==========================================

function getUserProfile() {
    try {
        const profile = localStorage.getItem("finplanUser");
        return profile ? JSON.parse(profile) : null;
    } catch (error) {
        return null;
    }
}

// ==========================================
// FORMAT CURRENCY
// ==========================================

function formatCurrency(amount, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency
    }).format(Number(amount) || 0);
}

// ==========================================
// API REQUEST FUNCTION
// ==========================================

async function apiRequest(endpoint, method = "GET", data = null) {
    const token = localStorage.getItem("finplanToken");

    const headers = {
        "Content-Type": "application/json"
    };

    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    const options = {
        method: method,
        headers: headers
    };

    if (data !== null) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(API_URL + endpoint, options);

    const text = await response.text();

    let result = {};

    try {
        result = text ? JSON.parse(text) : {};
    } catch (error) {
        result = {};
    }

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
    }

    return result;
}

// ==========================================
// REGISTRATION
// ==========================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const userData = {
            name: document.getElementById("registerName").value.trim(),
            email: document.getElementById("registerEmail").value.trim(),
            password: document.getElementById("registerPassword").value,
            currency: document.getElementById("currency").value
        };

        try {
            const result = await apiRequest("/auth/register", "POST", userData);

            showMessage(result.message || "Registration successful! Please login.");

            registerForm.reset();

        } catch (error) {
            showMessage(error.message);
        }
    });
}

// ==========================================
// LOGIN
// ==========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const loginData = {
            email: document.getElementById("loginEmail").value.trim(),
            password: document.getElementById("loginPassword").value
        };

        try {
            const result = await apiRequest("/auth/login", "POST", loginData);

            localStorage.setItem("finplanToken", result.token);
            localStorage.setItem("finplanUser", JSON.stringify(result.user));

            showMessage("Login successful!");

            loginForm.reset();

            await loadDashboard();

        } catch (error) {
            showMessage(error.message);
        }
    });
}

// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {
    try {
        const result = await apiRequest("/dashboard");

        const dashboard = document.getElementById("dashboard");

        if (dashboard) {
            dashboard.style.display = "block";
        }

        const profile = getUserProfile();
        const currency = profile?.currency || "INR";

        const userName = document.getElementById("dashboardUserName");

        if (userName) {
            userName.textContent = profile?.name || "User";
        }

        const summary = result.summary || {};

        document.getElementById("totalBalance").textContent =
            formatCurrency(summary.balance, currency);

        document.getElementById("totalIncome").textContent =
            formatCurrency(summary.totalIncome, currency);

        document.getElementById("totalExpenses").textContent =
            formatCurrency(summary.totalExpenses, currency);

        document.getElementById("monthlySavings").textContent =
            formatCurrency(summary.monthlySavings, currency);

        document.getElementById("monthlyIncome").textContent =
            formatCurrency(summary.monthlyIncome, currency);

        document.getElementById("monthlyExpenses").textContent =
            formatCurrency(summary.monthlyExpenses, currency);

        document.getElementById("savingsRate").textContent =
            (summary.savingsRate || 0) + "%";

        displayRecentTransactions(
            result.recentTransactions || [],
            currency
        );

        try {
            await loadAllTransactions();
            try {
    await loadFinancialCharts();
} catch (error) {
    console.error("Financial charts loading error:", error);
}
        } catch (error) {
            console.error("Transaction loading error:", error);
        }

        try {
            await loadBudgets();
        } catch (error) {
            console.error("Budget loading error:", error);
        }

        try {
            await loadGoals();
        } catch (error) {
            console.error("Savings goals loading error:", error);
        }

        dashboard.scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {
        showMessage(error.message);
    }
}

// ==========================================
// CREATE TRANSACTION ITEM
// ==========================================

function createTransactionItem(transaction, currency, includeActions = false) {
    const item = document.createElement("div");
    item.className = "transaction-item";

    const heading = document.createElement("h4");
    heading.textContent = transaction.category || "Uncategorized";

    const description = document.createElement("p");
    description.textContent = transaction.description || "";

    const amount = document.createElement("p");

    const sign = transaction.type === "income" ? "+" : "-";

    amount.textContent =
        sign + formatCurrency(transaction.amount, currency);

    amount.style.color =
        transaction.type === "income" ? "green" : "red";

    const date = document.createElement("p");

    date.textContent = transaction.date
        ? new Date(transaction.date).toLocaleDateString()
        : "";

    item.appendChild(heading);
    item.appendChild(description);
    item.appendChild(amount);
    item.appendChild(date);

    if (includeActions) {
        const editButton = document.createElement("button");

        editButton.textContent = "Edit";
        editButton.type = "button";

        editButton.addEventListener("click", function () {
            editTransaction(transaction);
        });

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function () {
            deleteTransaction(transaction._id);
        });

        item.appendChild(editButton);
        item.appendChild(deleteButton);
    }

    return item;
}

// ==========================================
// DISPLAY RECENT TRANSACTIONS
// ==========================================

function displayRecentTransactions(transactions, currency) {
    const container = document.getElementById("recentTransactions");

    if (!container) return;

    container.innerHTML = "";

    if (!transactions || transactions.length === 0) {
        container.textContent = "No recent transactions.";
        return;
    }

    transactions.forEach(function (transaction) {
        container.appendChild(
            createTransactionItem(transaction, currency)
        );
    });
}

// ==========================================
// LOAD ALL TRANSACTIONS
// ==========================================

async function loadAllTransactions() {
    const result = await apiRequest("/transactions");

    allTransactionsData = Array.isArray(result)
        ? result
        : (result.transactions || []);

    const profile = getUserProfile();
    const currency = profile?.currency || "INR";

    displayAllTransactions(allTransactionsData, currency);
}

// ==========================================
// DISPLAY TRANSACTION HISTORY
// ==========================================

function displayAllTransactions(transactions, currency) {
    const container = document.getElementById("allTransactions");

    if (!container) return;

    container.innerHTML = "";

    if (!transactions || transactions.length === 0) {
        container.textContent = "No transactions found.";
        return;
    }

    transactions.forEach(function (transaction) {
        container.appendChild(
            createTransactionItem(transaction, currency, true)
        );
    });
}

// ==========================================
// TRANSACTION SEARCH AND FILTER
// ==========================================

function filterTransactions() {
    const searchInput = document.getElementById("searchTransaction");
    const typeFilter = document.getElementById("filterTransactionType");

    const searchText = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const selectedType = typeFilter
        ? typeFilter.value
        : "all";

    const filteredTransactions = allTransactionsData.filter(function (transaction) {
        const category = (transaction.category || "").toLowerCase();
        const description = (transaction.description || "").toLowerCase();

        const matchesSearch =
            category.includes(searchText) ||
            description.includes(searchText);

        const matchesType =
            selectedType === "all" ||
            transaction.type === selectedType;

        return matchesSearch && matchesType;
    });

    const profile = getUserProfile();
    const currency = profile?.currency || "INR";

    displayAllTransactions(filteredTransactions, currency);
}

const searchInput = document.getElementById("searchTransaction");

if (searchInput) {
    searchInput.addEventListener("input", filterTransactions);
}

const typeFilter = document.getElementById("filterTransactionType");

if (typeFilter) {
    typeFilter.addEventListener("change", filterTransactions);
}

// ==========================================
// EDIT TRANSACTION
// ==========================================

async function editTransaction(transaction) {
    const amount = prompt(
        "Enter new amount:",
        transaction.amount
    );

    if (amount === null) return;

    const category = prompt(
        "Enter category:",
        transaction.category
    );

    if (category === null) return;

    const description = prompt(
        "Enter description:",
        transaction.description || ""
    );

    if (description === null) return;

    if (Number(amount) <= 0 || !Number.isFinite(Number(amount))) {
        showMessage("Please enter a valid amount.");
        return;
    }

    try {
        await apiRequest(
            "/transactions/" + transaction._id,
            "PUT",
            {
                amount: Number(amount),
                category: category.trim(),
                description: description.trim()
            }
        );

        showMessage("Transaction updated successfully!");

        await loadDashboard();

    } catch (error) {
        showMessage(error.message);
    }
}

// ==========================================
// DELETE TRANSACTION
// ==========================================

async function deleteTransaction(id) {
    const confirmation = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmation) return;

    try {
        await apiRequest("/transactions/" + id, "DELETE");

        showMessage("Transaction deleted successfully!");

        await loadDashboard();

    } catch (error) {
        showMessage(error.message);
    }
}

// ==========================================
// ADD TRANSACTION
// ==========================================

const transactionForm = document.getElementById("transactionForm");

if (transactionForm) {
    transactionForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const transactionData = {
            type: document.getElementById("transactionType").value,
            amount: Number(document.getElementById("transactionAmount").value),
            category: document.getElementById("transactionCategory").value.trim(),
            description: document.getElementById("transactionDescription").value.trim(),
            date: document.getElementById("transactionDate").value,
            paymentMethod: document.getElementById("paymentMethod").value
        };

        try {
            await apiRequest("/transactions", "POST", transactionData);

            showMessage("Transaction added successfully!");

            transactionForm.reset();

            await loadDashboard();

        } catch (error) {
            showMessage(error.message);
        }
    });
}

// ==========================================
// LOAD BUDGETS
// ==========================================

async function loadBudgets() {
    const result = await apiRequest("/budgets");

    allBudgetsData = Array.isArray(result)
        ? result
        : (result.budgets || []);

    displayBudgets();
}

// ==========================================
// DISPLAY BUDGETS
// ==========================================

function displayBudgets() {
    const container = document.getElementById("budgetList");

    if (!container) return;

    container.innerHTML = "";

    if (!allBudgetsData || allBudgetsData.length === 0) {
        container.textContent = "No budgets available yet.";
        return;
    }

    const profile = getUserProfile();
    const currency = profile?.currency || "INR";

    allBudgetsData.forEach(function (budget) {
        const card = document.createElement("div");
        card.className = "budget-card";

        const heading = document.createElement("h4");
        heading.textContent = budget.category;

        const month = document.createElement("p");

        const monthNames = [
            "January", "February", "March", "April",
            "May", "June", "July", "August",
            "September", "October", "November", "December"
        ];

        month.textContent =
            (monthNames[Number(budget.month) - 1] || "Unknown") +
            " " + budget.year;

        const amount = document.createElement("p");
        amount.textContent =
            "Budget: " + formatCurrency(budget.amount, currency);

        const spent = document.createElement("p");
        spent.textContent =
            "Spent: " + formatCurrency(budget.spent, currency);

        const remaining = document.createElement("p");
        remaining.textContent =
            "Remaining: " + formatCurrency(budget.remaining, currency);

        const status = document.createElement("p");

        if (budget.exceeded) {
            status.textContent = "Budget exceeded!";
            status.style.color = "red";
        } else {
            status.textContent = "Within budget";
            status.style.color = "green";
        }

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.type = "button";

        editButton.addEventListener("click", function () {
            editBudget(budget);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function () {
            deleteBudget(budget._id);
        });

        card.appendChild(heading);
        card.appendChild(month);
        card.appendChild(amount);
        card.appendChild(spent);
        card.appendChild(remaining);
        card.appendChild(status);
        card.appendChild(editButton);
        card.appendChild(deleteButton);

        container.appendChild(card);
    });
}

// ==========================================
// CREATE BUDGET
// ==========================================

const budgetForm = document.getElementById("budgetForm");

if (budgetForm) {
    budgetForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const budgetData = {
            category: document.getElementById("budgetCategory").value.trim(),
            amount: Number(document.getElementById("budgetAmount").value),
            month: Number(document.getElementById("budgetMonth").value),
            year: Number(document.getElementById("budgetYear").value)
        };

        if (
            !budgetData.category ||
            budgetData.amount <= 0 ||
            !Number.isFinite(budgetData.amount)
        ) {
            showMessage("Please enter valid budget details.");
            return;
        }

        try {
            await apiRequest("/budgets", "POST", budgetData);

            showMessage("Budget created successfully!");

            budgetForm.reset();

            await loadBudgets();

        } catch (error) {
            showMessage(error.message);
        }
    });
}

// ==========================================
// EDIT BUDGET
// ==========================================

async function editBudget(budget) {
    const newAmount = prompt(
        "Enter the new budget amount:",
        budget.amount
    );

    if (newAmount === null) return;

    if (Number(newAmount) <= 0 || !Number.isFinite(Number(newAmount))) {
        showMessage("Please enter a valid amount.");
        return;
    }

    try {
        await apiRequest(
            "/budgets/" + budget._id,
            "PUT",
            {
                amount: Number(newAmount)
            }
        );

        showMessage("Budget updated successfully!");

        await loadBudgets();

    } catch (error) {
        showMessage(error.message);
    }
}

// ==========================================
// DELETE BUDGET
// ==========================================

async function deleteBudget(id) {
    const confirmation = confirm(
        "Are you sure you want to delete this budget?"
    );

    if (!confirmation) return;

    try {
        await apiRequest("/budgets/" + id, "DELETE");

        showMessage("Budget deleted successfully!");

        await loadBudgets();

    } catch (error) {
        showMessage(error.message);
    }
}

// ==========================================
// SAVINGS GOALS - LOAD GOALS
// ==========================================

async function loadGoals() {
    const result = await apiRequest("/goals");

    allGoalsData = Array.isArray(result)
        ? result
        : (result.goals || []);

    displayGoals();
}

// ==========================================
// SAVINGS GOALS - DISPLAY GOALS
// ==========================================

function displayGoals() {
    const container = document.getElementById("goalsList");

    if (!container) return;

    container.innerHTML = "";

    if (!allGoalsData || allGoalsData.length === 0) {
        container.textContent = "No savings goals available yet.";
        return;
    }

    const profile = getUserProfile();
    const currency = profile?.currency || "INR";

    allGoalsData.forEach(function (goal) {

        const card = document.createElement("div");
        card.className = "goal-card";

        const heading = document.createElement("h4");
        heading.textContent = goal.name;

        const target = document.createElement("p");
        target.textContent =
            "Target: " + formatCurrency(goal.targetAmount, currency);

        const saved = document.createElement("p");
        saved.textContent =
            "Saved: " + formatCurrency(goal.savedAmount, currency);

        const remaining = document.createElement("p");
        remaining.textContent =
            "Remaining: " + formatCurrency(
                goal.remainingAmount,
                currency
            );

        const progress = Math.min(
            Number(goal.progress) || 0,
            100
        );

        const progressText = document.createElement("p");
        progressText.textContent =
            "Progress: " + progress.toFixed(1) + "%";

        const progressBar = document.createElement("div");
        progressBar.className = "goal-progress-bar";

        const progressFill = document.createElement("div");
        progressFill.className = "goal-progress-fill";
        progressFill.style.width = progress + "%";

        progressBar.appendChild(progressFill);

        const targetDate = document.createElement("p");

        targetDate.textContent =
            "Target Date: " +
            new Date(goal.targetDate).toLocaleDateString();

        const completed = Number(goal.savedAmount) >=
            Number(goal.targetAmount);

        const status = document.createElement("p");

        if (completed) {
            status.textContent = "🎉 Goal Completed!";
            status.style.color = "green";
        } else {
            status.textContent = "Keep saving towards your goal!";
        }

        // Add Money Button
        const contributeButton = document.createElement("button");

        contributeButton.textContent = "Add Money";
        contributeButton.type = "button";
        contributeButton.disabled = completed;

        contributeButton.addEventListener("click", function () {
            addGoalContribution(goal);
        });

        // Edit Button
        const editButton = document.createElement("button");

        editButton.textContent = "Edit";
        editButton.type = "button";

        editButton.addEventListener("click", function () {
            editGoal(goal);
        });

        // Delete Button
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function () {
            deleteGoal(goal._id);
        });

        card.appendChild(heading);
        card.appendChild(target);
        card.appendChild(saved);
        card.appendChild(remaining);
        card.appendChild(progressText);
        card.appendChild(progressBar);
        card.appendChild(targetDate);
        card.appendChild(status);
        card.appendChild(contributeButton);
        card.appendChild(editButton);
        card.appendChild(deleteButton);

        container.appendChild(card);
    });
}

// ==========================================
// SAVINGS GOALS - CREATE GOAL
// ==========================================

const goalForm = document.getElementById("goalForm");

if (goalForm) {
    goalForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const goalData = {
            name: document.getElementById("goalName").value.trim(),
            targetAmount: Number(
                document.getElementById("goalTargetAmount").value
            ),
            targetDate: document.getElementById("goalTargetDate").value
        };

        if (
            !goalData.name ||
            !Number.isFinite(goalData.targetAmount) ||
            goalData.targetAmount <= 0 ||
            !goalData.targetDate
        ) {
            showMessage("Please enter valid savings goal details.");
            return;
        }

        try {
            const result = await apiRequest(
                "/goals",
                "POST",
                goalData
            );

            showMessage(
                result.message || "Savings goal created successfully!"
            );

            goalForm.reset();

            await loadGoals();

        } catch (error) {
            showMessage(error.message);
        }
    });
}

// ==========================================
// SAVINGS GOALS - ADD CONTRIBUTION
// ==========================================

async function addGoalContribution(goal) {

    const amount = prompt(
        "Enter the amount you want to add to this savings goal:"
    );

    if (amount === null) return;

    if (
        !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0
    ) {
        showMessage("Please enter a valid contribution amount.");
        return;
    }

    try {
        const result = await apiRequest(
            "/goals/" + goal._id + "/contribute",
            "POST",
            {
                amount: Number(amount)
            }
        );

        showMessage(
            result.message || "Contribution added successfully!"
        );

        await loadGoals();

    } catch (error) {
        showMessage(error.message);
    }
}

// ==========================================
// SAVINGS GOALS - EDIT GOAL
// ==========================================

async function editGoal(goal) {

    const newName = prompt(
        "Enter new goal name:",
        goal.name
    );

    if (newName === null) return;

    const newAmount = prompt(
        "Enter new target amount:",
        goal.targetAmount
    );

    if (newAmount === null) return;

    const newDate = prompt(
        "Enter target date (YYYY-MM-DD):",
        new Date(goal.targetDate).toISOString().split("T")[0]
    );

    if (newDate === null) return;

    if (
        !newName.trim() ||
        !Number.isFinite(Number(newAmount)) ||
        Number(newAmount) <= 0 ||
        !newDate ||
        Number.isNaN(Date.parse(newDate))
    ) {
        showMessage("Please enter valid goal details.");
        return;
    }

    try {
        const result = await apiRequest(
            "/goals/" + goal._id,
            "PUT",
            {
                name: newName.trim(),
                targetAmount: Number(newAmount),
                targetDate: newDate
            }
        );

        showMessage(
            result.message || "Savings goal updated successfully!"
        );

        await loadGoals();

    } catch (error) {
        showMessage(error.message);
    }
}

// ==========================================
// SAVINGS GOALS - DELETE GOAL
// ==========================================

async function deleteGoal(id) {

    const confirmation = confirm(
        "Are you sure you want to delete this savings goal?"
    );

    if (!confirmation) return;

    try {
        const result = await apiRequest(
            "/goals/" + id,
            "DELETE"
        );

        showMessage(
            result.message || "Savings goal deleted successfully!"
        );

        await loadGoals();

    } catch (error) {
        showMessage(error.message);
    }
}

// ==========================================
// LOGOUT
// ==========================================

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function () {

        localStorage.removeItem("finplanToken");
        localStorage.removeItem("finplanUser");

        const dashboard = document.getElementById("dashboard");

        if (dashboard) {
            dashboard.style.display = "none";
        }

        showMessage("Logged out successfully!");

        window.location.href = "#home";
    });
}

// ==========================================
// FINANCIAL ANALYTICS
// ==========================================

let incomeExpenseChart = null;
let expenseBreakdownChart = null;

async function loadFinancialCharts() {

    try {
        const result = await apiRequest("/transactions");

        const transactions = Array.isArray(result)
            ? result
            : (result.transactions || []);

        const profile = getUserProfile();
        const currency = profile?.currency || "INR";

        let totalIncome = 0;
        let totalExpenses = 0;

        const categoryExpenses = {};

        transactions.forEach(function (transaction) {

            const amount = Number(transaction.amount) || 0;

            if (transaction.type === "income") {
                totalIncome += amount;
            }

            if (transaction.type === "expense") {
                totalExpenses += amount;

                const category = transaction.category || "Other";

                categoryExpenses[category] =
                    (categoryExpenses[category] || 0) + amount;
            }

        });

        // Income vs Expenses Chart
        const incomeCanvas = document.getElementById("incomeExpenseChart");

        if (incomeCanvas) {

            if (incomeExpenseChart) {
                incomeExpenseChart.destroy();
            }

            incomeExpenseChart = new Chart(incomeCanvas, {
                type: "bar",

                data: {
                    labels: ["Income", "Expenses"],

                    datasets: [{
                        label: "Amount",
                        data: [totalIncome, totalExpenses],
                        backgroundColor: ["#20a879", "#e65b70"],
                        borderRadius: 8
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,

                    plugins: {
                        legend: {
                            display: false
                        },

                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return formatCurrency(context.raw, currency);
                                }
                            }
                        }
                    },

                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Expense Breakdown Chart
        const expenseCanvas = document.getElementById("expenseBreakdownChart");

        if (expenseCanvas) {

            if (expenseBreakdownChart) {
                expenseBreakdownChart.destroy();
            }

            const categories = Object.keys(categoryExpenses);
            const amounts = Object.values(categoryExpenses);

            if (categories.length > 0) {

                expenseBreakdownChart = new Chart(expenseCanvas, {
                    type: "doughnut",

                    data: {
                        labels: categories,

                        datasets: [{
                            data: amounts,
                            backgroundColor: [
                                "#6956d8",
                                "#3985e8",
                                "#20a879",
                                "#e65b70",
                                "#f2b84b",
                                "#9b59b6",
                                "#16a085"
                            ]
                        }]
                    },

                    options: {
                        responsive: true,
                        maintainAspectRatio: false,

                        plugins: {
                            legend: {
                                position: "bottom"
                            },

                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        return context.label + ": " +
                                            formatCurrency(context.raw, currency);
                                    }
                                }
                            }
                        }
                    }
                });

            } else {
                const message = document.createElement("p");
                message.textContent = "No expense data available yet.";

                expenseCanvas.parentElement.appendChild(message);
            }
        }

    } catch (error) {
        console.error("Financial charts error:", error);
    }
}

// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("finplanToken");

    if (token) {
        loadDashboard();
    }

    console.log("FinPlan application loaded successfully!");
});