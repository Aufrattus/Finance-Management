const categoryConfig = {
  Salary: { icon: '<i class="fas fa-money-bill"></i>', color: '#34d399' },
  Freelance: { icon: '<i class="fas fa-laptop-code"></i>', color: '#60a5fa' },
  Investment: { icon: '<i class="fas fa-chart-line"></i>', color: '#fbbf24' },
  Business: { icon: '<i class="fas fa-briefcase"></i>', color: '#f97316' },
  Food: { icon: '<i class="fas fa-hamburger"></i>', color: '#ef4444' },
  Transportation: { icon: '<i class="fas fa-bus"></i>', color: '#3b82f6' },
  Shopping: { icon: '<i class="fas fa-shopping-cart"></i>', color: '#8b5cf6' },
  Utilities: { icon: '<i class="fas fa-bolt"></i>', color: '#facc15' },
  Other: { icon: '<i class="fas fa-ellipsis-h"></i>', color: '#9ca3af' },
};

// App State
let appData = {
    user: {
        name: 'User',
        avatar: null
    },
    balance: 0,
    savings: {
        current: 0,
        goal: 0,
        purpose: 'Savings goal purpose'
    },
    emergencyFund: {
        current: 0,
        goal: 0,
        purpose: 'Financial safety net for unexpected expenses'
    },
    monthlyExpenses: 0,
    currency: 'USD',
    transactions: [],
    budget: {
        income: [],
        expenses: []
    }
};

// Google Sheets API configuration
// Update these constants with your actual IDs
const SCRIPT_URL = 'https://script.google.com/macros/s/1YVCz3MTMc7a9GczAsvVIRUa7_Ok3fk2SvJXU1s6AyK4OT7q-0SEzLi3D/exec';
const SPREADSHEET_ID = '1kLrzOMwEec-r3rrPSfwGzpowxwnTB4KTLET5mQi02Iw';

async function loadData() {
  try {
    const response = await fetch(`${SCRIPT_URL}?action=getData&sheetId=${SPREADSHEET_ID}`);
    const result = await response.json();
    
    if (result.success) {
      appData = result.data;
      updateUI();
    } else {
      console.error('Error loading data:', result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

async function saveData() {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveData',
        sheetId: SPREADSHEET_ID,
        data: appData
      })
    });
    
    const result = await response.json();
    if (!result.success) {
      console.error('Error saving data:', result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Update your initialization
document.addEventListener('DOMContentLoaded', function() {
  // First load data, then initialize
  loadData().then(() => {
    initializeApp();
    setupEventListeners();
    updateUI();
  });
});

// Currency symbols
const currencySymbols = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 
    'AUD': 'A$', 'CAD': 'C$', 'CNY': '¥', 'INR': '₹',
    'IDR': 'Rp', 'SGD': 'S$'
};

// Categories
const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Business', 'Other'],
    expense: ['Food', 'Transportation', 'Housing', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other']
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDataFromGoogleSheets();
});

function initializeApp() {
    // Set current date
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Set today's date as default for transaction form
    document.getElementById('transactionDate').valueAsDate = now;

    // Load user preferences
    loadUserData();
    
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            showPage(page);
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Transaction form
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    
    // Transaction type change
    document.getElementById('transactionType').addEventListener('change', function() {
        updateCategoryOptions(this.value);
    });

    // Profile picture upload
    document.getElementById('profilePictureInput').addEventListener('change', handleProfilePictureUpload);

    // Scroll handling for bottom nav
    let lastScrollTop = 0;
    let isScrolling;
    const bottomNav = document.getElementById('bottomNav');

    window.addEventListener('scroll', function() {
        const st = window.pageYOffset || document.documentElement.scrollTop;
        
        if (st > lastScrollTop) {
            // Scrolling down
            bottomNav.classList.add('hidden');
        } else {
            // Scrolling up
            bottomNav.classList.remove('hidden');
        }
        
        lastScrollTop = st <= 0 ? 0 : st;
        
        // Clear timeout if user is still scrolling
        clearTimeout(isScrolling);
        
        // Set timeout to show nav when scrolling stops
        isScrolling = setTimeout(function() {
            bottomNav.classList.remove('hidden');
        }, 200);
    }, false);

    // Format amount inputs
    document.addEventListener('input', function(e) {
        if (e.target.id === 'transactionAmount' || e.target.classList.contains('budget-amount-input')) {
            formatCurrencyInput(e.target);
        }
    });
}

function formatCurrencyInput(input) {
    // Get the current value and remove all non-digit characters
    let value = input.value.replace(/[^\d]/g, '');
    
    // If empty, set to 0
    if (value === '') {
        input.value = '';
        return;
    }
    
    // Convert to number and format with commas
    const numValue = parseFloat(value) / 100;
    input.value = formatCurrency(numValue, false);
}

function formatCurrency(amount, withSymbol = true) {
    const currencySymbol = currencySymbols[appData.currency] || '$';
    const formatted = amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return withSymbol ? `${currencySymbol}${formatted}` : formatted;
}

function parseCurrencyInput(value) {
    return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
}

async function loadDataFromGoogleSheets() {
    try {
        const response = await fetch(`${scriptURL}?action=getData&sheetId=${spreadsheetId}`);
        const data = await response.json();
        
        if (data.success) {
            // Process the data from Google Sheets
            appData = {
                ...appData,
                ...data.data
            };
            
            // Update the UI with the loaded data
            updateDashboard();
            updateTransactionsList();
            updateSavingsGoalsDisplay();
            updateBudgetDisplay();
            setupCharts();
        }
    } catch (error) {
        console.error('Error loading data from Google Sheets:', error);
    }
}

async function saveDataToGoogleSheets() {
    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'saveData',
                sheetId: spreadsheetId,
                data: appData
            })
        });
        
        const result = await response.json();
        if (!result.success) {
            console.error('Error saving data to Google Sheets');
        }
    } catch (error) {
        console.error('Error saving data to Google Sheets:', error);
    }
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    const targetPage = document.getElementById(pageId);
    
    // Fade in the new page
    setTimeout(() => {
        pages.forEach(page => page.classList.remove('active'));
        targetPage.classList.add('active');
    }, 100);

    // Update specific page content if needed
    if (pageId === 'dashboard') {
        updateDashboard();
        setupCharts();
    } else if (pageId === 'transactions') {
        updateTransactionsList();
    } else if (pageId === 'savings') {
        updateSavingsGoalsDisplay();
    } else if (pageId === 'budgeting') {
        updateBudgetDisplay();
    }
}

function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('transactionCategory');
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    if (type && categories[type]) {
        categories[type].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const formData = {
        id: Date.now(),
        date: document.getElementById('transactionDate').value,
        type: document.getElementById('transactionType').value,
        category: document.getElementById('transactionCategory').value,
        amount: parseCurrencyInput(document.getElementById('transactionAmount').value),
        description: document.getElementById('transactionDescription').value
    };

    // Add transaction to data
    appData.transactions.unshift(formData);
    
    // Update balance
    if (formData.type === 'income') {
        appData.balance += formData.amount;
    } else {
        appData.balance -= formData.amount;
    }

    // Reset form
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionDate').valueAsDate = new Date();
    
    // Update displays
    updateDashboard();
    updateTransactionsList();
    setupCharts();
    
    // Save to Google Sheets
    saveDataToGoogleSheets();
    
    // Show success message
    showNotification('Transaction added successfully!', 'success');
}

function clearTransactions() {
    if (confirm('Are you sure you want to clear all transactions?')) {
        // Reset income and expense values
        appData.transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                appData.balance -= transaction.amount;
            } else {
                appData.balance += transaction.amount;
            }
        });
        
        appData.transactions = [];
        updateTransactionsList();
        updateDashboard();
        setupCharts();
        saveDataToGoogleSheets();
        showNotification('Transaction history cleared!', 'success');
    }
}

function updateDashboard() {
    // Update balance with currency symbol
    document.getElementById('totalBalance').textContent = formatCurrency(appData.balance);

    // Update user greeting
    document.getElementById('userGreeting').textContent = `Hello, ${appData.user.name}!`;
    
    // Update user initials
    const initials = appData.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userInitials').textContent = initials || 'U';

    // Update savings progress
    const savingsProgress = appData.savings.goal > 0 ? 
        (appData.savings.current / appData.savings.goal) * 100 : 0;
    document.getElementById('savingsProgress').style.width = `${Math.min(savingsProgress, 100)}%`;
    document.getElementById('currentSavings').textContent = formatCurrency(appData.savings.current);
    document.getElementById('savingsGoal').textContent = formatCurrency(appData.savings.goal);
    document.getElementById('savingsPercentage').textContent = `${Math.round(savingsProgress)}%`;
}

function updateSavingsGoalsDisplay() {
    // Update savings goal display
    const savingsProgress = appData.savings.goal > 0 ? 
        (appData.savings.current / appData.savings.goal) * 100 : 0;
    
    document.getElementById('savingsGoalProgress').style.width = `${Math.min(savingsProgress, 100)}%`;
    document.getElementById('currentSavingsDisplay').textContent = formatCurrency(appData.savings.current);
    
    // Make goal amount clickable to edit
    const goalDisplay = document.getElementById('savingsGoalDisplay');
    goalDisplay.innerHTML = `
        <span onclick="makeSavingsGoalEditable()" style="cursor: pointer;">
            ${formatCurrency(appData.savings.goal)}
        </span>
    `;
    
    document.getElementById('savingsPurposeText').textContent = appData.savings.purpose;
    document.getElementById('savingsGoalPercentage').textContent = `${Math.round(savingsProgress)}%`;
}

function makeSavingsGoalEditable() {
    const goalDisplay = document.getElementById('savingsGoalDisplay');
    const goalInput = document.createElement('input');
    goalInput.type = 'text';
    goalInput.className = 'form-input';
    goalInput.value = formatCurrency(appData.savings.goal, false);
    
    goalDisplay.innerHTML = '';
    goalDisplay.appendChild(goalInput);
    goalInput.focus();
    
    goalInput.addEventListener('blur', function() {
        const newGoal = parseCurrencyInput(this.value);
        appData.savings.goal = newGoal;
        updateSavingsGoalsDisplay();
        saveDataToGoogleSheets();
    });
    
    goalInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const newGoal = parseCurrencyInput(this.value);
            appData.savings.goal = newGoal;
            updateSavingsGoalsDisplay();
            saveDataToGoogleSheets();
            this.blur();
        }
    });
}

function addToSavings() {
    const amount = parseCurrencyInput(document.getElementById('savingsAmountInput').value);
    
    if (amount > 0) {
        if (amount > appData.balance) {
            showNotification('Not enough funds in your balance!', 'error');
            return;
        }
        
        appData.savings.current += amount;
        appData.balance -= amount;
        document.getElementById('savingsAmountInput').value = '';
        
        updateDashboard();
        updateSavingsGoalsDisplay();
        saveDataToGoogleSheets();
        showNotification(`${formatCurrency(amount)} added to savings!`, 'success');
    }
}

function resetSavingsForm() {
    document.getElementById('savingsAmountInput').value = '';
}

function updateTransactionsList() {
    const container = document.getElementById('transactionsList');
    
    if (appData.transactions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No transactions yet. Add your first transaction!</p>';
        return;
    }

    const recentTransactions = appData.transactions.slice(0, 10);
    container.innerHTML = recentTransactions.map(transaction => {
        const config = categoryConfig[transaction.category] || { icon: '<i class="fas fa-box"></i>', color: '#6b7280' };
        const isIncome = transaction.type === 'income';
        
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-icon" style="background-color: ${config.color}">
                        ${config.icon}
                    </div>
                    <div class="transaction-details">
                        <h4>${transaction.category}</h4>
                        <p>${transaction.description || 'No description'} • ${new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                    ${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
    }).join('');
}

function updateBudgetDisplay() {
    const incomeContainer = document.getElementById('incomeBudgetItems');
    const expenseContainer = document.getElementById('expenseBudgetItems');
    
    // Render income items
    incomeContainer.innerHTML = appData.budget.income.map((item, index) => `
        <div class="budget-item">
            <input type="text" class="budget-amount-input" value="${formatCurrency(item.amount, false)}" 
                   onchange="updateBudgetItem('income', ${index}, this.value)">
            <button class="btn btn-clear" onclick="removeBudgetItem('income', ${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    // Render expense items
    expenseContainer.innerHTML = appData.budget.expenses.map((item, index) => `
        <div class="budget-item">
            <input type="text" class="budget-amount-input" value="${formatCurrency(item.amount, false)}" 
                   onchange="updateBudgetItem('expenses', ${index}, this.value)">
            <button class="btn btn-clear" onclick="removeBudgetItem('expenses', ${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    // Calculate totals
    const totalIncome = appData.budget.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = appData.budget.expenses.reduce((sum, item) => sum + item.amount, 0);
    const netBudget = totalIncome - totalExpenses;
    
    // Update totals display
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('netBudget').textContent = formatCurrency(netBudget);
    document.getElementById('netBudget').style.color = netBudget >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)';
}

function addBudgetItem(type) {
    appData.budget[type].push({ amount: 0 });
    updateBudgetDisplay();
    saveDataToGoogleSheets();
}

function updateBudgetItem(type, index, value) {
    const amount = parseCurrencyInput(value);
    appData.budget[type][index].amount = amount;
    updateBudgetDisplay();
    saveDataToGoogleSheets();
}

function removeBudgetItem(type, index) {
    appData.budget[type].splice(index, 1);
    updateBudgetDisplay();
    saveDataToGoogleSheets();
}

function toggleTheme() {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    toggle.classList.toggle('active');
    
    // Save theme preference
    localStorage.setItem('theme', newTheme);
}

function updateProfile() {
    const name = document.getElementById('userName').value.trim();
    
    if (name) {
        appData.user.name = name;
        updateDashboard();
        saveDataToGoogleSheets();
        showNotification('Profile updated successfully!', 'success');
    }
}

function handleProfilePictureUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatar = document.getElementById('userAvatar');
            avatar.innerHTML = `<img src="${e.target.result}" alt="Profile Picture">`;
            appData.user.avatar = e.target.result;
            saveDataToGoogleSheets();
            showNotification('Profile picture updated!', 'success');
        };
        reader.readAsDataURL(file);
    }
}

function savePreferences() {
    const currency = document.getElementById('currencySelect').value;
    appData.currency = currency;
    
    // Save to localStorage
    localStorage.setItem('currency', currency);
    
    // Update all displays with new currency
    updateDashboard();
    updateSavingsGoalsDisplay();
    updateBudgetDisplay();
    updateTransactionsList();
    setupCharts();
    saveDataToGoogleSheets();
    
    showNotification('Preferences saved!', 'success');
}

function loadUserData() {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
        document.getElementById('themeToggle').classList.add('active');
    }

    // Load currency preference
    const savedCurrency = localStorage.getItem('currency') || 'USD';
    appData.currency = savedCurrency;
    document.getElementById('currencySelect').value = savedCurrency;

    // Load form values
    document.getElementById('userName').value = appData.user.name;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--secondary-color)' : 
                    type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: var(--shadow-lg);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
function updateUI() {
  // Hide loader, show app
  document.getElementById('loading').style.display = 'none';
  document.getElementById('app-content').style.display = 'block';
  
  // Update all your UI components
  updateDashboard();
  updateTransactionsList();
  updateSavingsGoalsDisplay();
  updateBudgetDisplay();
  setupCharts();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
