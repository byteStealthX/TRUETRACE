// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Theme Management
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-toggle-icon path');
const html = document.documentElement;

// Load saved theme or default to dark
const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

// Theme toggle handler
themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    if (theme === 'light') {
        // Sun icon
        themeIcon.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z');
    } else {
        // Moon icon
        themeIcon.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
    }
}

// DOM Elements
const urlInput = document.getElementById('urlInput');
const contextInput = document.getElementById('contextInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingState = document.getElementById('loadingState');
const resultsSection = document.getElementById('resultsSection');
const errorState = document.getElementById('errorState');

// Result Elements
const riskBadge = document.getElementById('riskBadge');
const analyzedUrl = document.getElementById('analyzedUrl');
const verdict = document.getElementById('verdict');
const reasons = document.getElementById('reasons');
const tips = document.getElementById('tips');
const sourcesSection = document.getElementById('sourcesSection');
const sourcesList = document.getElementById('sourcesList');

// Error Elements
const errorTitle = document.getElementById('errorTitle');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
analyzeBtn.addEventListener('click', analyzeUrl);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeUrl();
});

// Main Analysis Function
async function analyzeUrl() {
    const url = urlInput.value.trim();
    const context = contextInput.value.trim();

    // Validation
    if (!url) {
        showError('URL Required', 'Please enter a URL to analyze');
        return;
    }

    // Reset states
    hideAllStates();
    loadingState.classList.remove('hidden');
    analyzeBtn.disabled = true;

    try {
        // Make API request
        const response = await fetch(`${API_BASE_URL}/api/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                context: context || undefined
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to analyze URL');
        }

        // Display results
        displayResults(data);

    } catch (error) {
        console.error('Analysis error:', error);
        showError(
            'Analysis Failed',
            error.message || 'Unable to analyze the URL. Please check your connection and try again.'
        );
    } finally {
        loadingState.classList.add('hidden');
        analyzeBtn.disabled = false;
    }
}

// Display Results
function displayResults(data) {
    hideAllStates();

    // Set analyzed URL
    analyzedUrl.textContent = data.url;

    // Set risk badge
    const riskLevel = data.riskLevel.toLowerCase();
    riskBadge.className = `risk-badge ${riskLevel}`;
    riskBadge.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" fill="currentColor" opacity="0.2"/>
            <circle cx="8" cy="8" r="3" fill="currentColor"/>
        </svg>
        ${data.riskLevel} RISK
    `;

    // Set verdict
    verdict.textContent = data.verdict;

    // Set reasons
    reasons.textContent = data.reasons;

    // Set tips
    tips.textContent = data.tips;

    // Handle sources
    if (data.sources && data.sources.length > 0) {
        sourcesSection.classList.remove('hidden');
        sourcesList.innerHTML = data.sources
            .map(source => `
                <a href="${source}" target="_blank" rel="noopener noreferrer" class="source-link">
                    ${source}
                </a>
            `)
            .join('');
    } else {
        sourcesSection.classList.add('hidden');
    }

    // Show results
    resultsSection.classList.remove('hidden');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show Error
function showError(title, message) {
    hideAllStates();
    errorTitle.textContent = title;
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
}

// Hide All States
function hideAllStates() {
    loadingState.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorState.classList.add('hidden');
}

// Sample URLs for testing (can be triggered via console)
window.testUrls = {
    safe: 'https://google.com',
    suspicious: 'https://bit.ly/urgent-payment',
    phishing: 'https://secure-login-verify.com/account'
};

// Console helper
console.log('%c🚀 AntiGravity Frontend Loaded', 'color: #667eea; font-size: 16px; font-weight: bold;');
console.log('%cTest URLs available via window.testUrls', 'color: #64748b;');
console.log('%cAPI endpoint:', 'color: #64748b;', API_BASE_URL);

// Health check on load
fetch(`${API_BASE_URL}/health`)
    .then(res => res.json())
    .then(data => {
        console.log('%c✅ Backend Status:', 'color: #10b981; font-weight: bold;', data.status);
    })
    .catch(err => {
        console.error('%c❌ Backend Offline:', 'color: #ef4444; font-weight: bold;', err.message);
        console.log('%cMake sure the backend server is running on', 'color: #f59e0b;', API_BASE_URL);
    });
