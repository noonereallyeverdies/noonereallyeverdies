// ❗️ Replace with your deployed Google Apps Script URL (must allow anonymous access if using GitHub Pages)
const API_URL = "https://script.google.com/macros/s/AKfycbzuJc8ZRAoGaox9C52UTMwzZGyJmNfQdpEkw9qF9FXrXx-TVDQo_mP58yLJYx-S9sNk/exec";

const selectors = {
    balanceDisplay: document.querySelector('#balance-display'),
    balanceUpdated: document.querySelector('#balance-updated'),
    refreshBalanceBtn: document.querySelector('#refresh-balance-btn'),
    alertsDisplay: document.querySelector('#alerts-display'),
    checkAlertsBtn: document.querySelector('#check-alerts-btn'),
    geminiPrompt: document.querySelector('#gemini-prompt'),
    askGeminiBtn: document.querySelector('#ask-gemini-btn'),
    clearGeminiBtn: document.querySelector('#clear-gemini-btn'),
    geminiResponse: document.querySelector('#gemini-response'),
    installBanner: document.querySelector('#install-banner'),
    installBtn: document.querySelector('#install-btn'),
    dismissInstallBtn: document.querySelector('#dismiss-install-btn'),
};

let deferredInstallPrompt = null;

function formatCurrency(value) {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(value);
}

function showError(target, message) {
    if (!target) return;
    target.textContent = message;
    target.classList.add('error');
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        mode: 'cors',
        cache: 'no-store',
        ...options,
    });

    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
    }

    return response.json();
}

async function getForecast() {
    selectors.balanceDisplay.textContent = 'Loading…';
    selectors.balanceUpdated.hidden = true;

    try {
        const data = await fetchJson(`${API_URL}?action=getForecast`);
        if (typeof data.forecastedBalance === 'number') {
            selectors.balanceDisplay.textContent = formatCurrency(data.forecastedBalance);
            if (data.lastUpdated) {
                selectors.balanceUpdated.textContent = `Last updated ${data.lastUpdated}`;
                selectors.balanceUpdated.hidden = false;
            }
            localStorage.setItem('financeBuddy:lastBalance', selectors.balanceDisplay.textContent);
        } else {
            throw new Error('Missing forecastedBalance in response');
        }
    } catch (error) {
        console.error('Error fetching forecast', error);
        selectors.balanceDisplay.textContent = localStorage.getItem('financeBuddy:lastBalance') || 'Error';
        selectors.balanceUpdated.hidden = true;
    }
}

async function getAlerts() {
    selectors.alertsDisplay.textContent = 'Checking…';

    try {
        const data = await fetchJson(`${API_URL}?action=getAlerts`);
        const alerts = Array.isArray(data.alerts) ? data.alerts : [];

        if (!alerts.length) {
            selectors.alertsDisplay.textContent = '✅ All budgets look good!';
            return;
        }

        selectors.alertsDisplay.innerHTML = '';
        alerts.forEach(alert => {
            const wrapper = document.createElement('p');
            const overage = typeof alert.overage === 'number' ? formatCurrency(alert.overage) : alert.overage;
            wrapper.textContent = `⚠️ You are ${overage} over budget for ${alert.category}.`;
            selectors.alertsDisplay.appendChild(wrapper);
        });
    } catch (error) {
        console.error('Error fetching alerts', error);
        selectors.alertsDisplay.textContent = 'Could not fetch alerts. Check your connection.';
    }
}

async function askAdvisor() {
    const question = selectors.geminiPrompt.value.trim();
    if (!question) {
        selectors.geminiResponse.textContent = 'Please enter a question first.';
        return;
    }

    selectors.askGeminiBtn.disabled = true;
    selectors.geminiResponse.textContent = 'Thinking…';

    const payload = {
        action: 'askGemini',
        payload: { prompt: question },
    };

    try {
        const data = await fetchJson(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
        });

        selectors.geminiResponse.textContent = data.response || 'No response from advisor.';
        localStorage.setItem('financeBuddy:lastPrompt', question);
        localStorage.setItem('financeBuddy:lastResponse', selectors.geminiResponse.textContent);
    } catch (error) {
        console.error('Error asking Gemini', error);
        selectors.geminiResponse.textContent = 'Sorry, something went wrong. Try again later.';
    } finally {
        selectors.askGeminiBtn.disabled = false;
    }
}

function restoreSession() {
    const lastBalance = localStorage.getItem('financeBuddy:lastBalance');
    const lastPrompt = localStorage.getItem('financeBuddy:lastPrompt');
    const lastResponse = localStorage.getItem('financeBuddy:lastResponse');

    if (lastBalance && selectors.balanceDisplay) {
        selectors.balanceDisplay.textContent = lastBalance;
    }

    if (lastPrompt && selectors.geminiPrompt) {
        selectors.geminiPrompt.value = lastPrompt;
    }

    if (lastResponse && selectors.geminiResponse) {
        selectors.geminiResponse.textContent = lastResponse;
    }
}

function registerEventListeners() {
    selectors.refreshBalanceBtn?.addEventListener('click', getForecast);
    selectors.checkAlertsBtn?.addEventListener('click', getAlerts);
    selectors.askGeminiBtn?.addEventListener('click', askAdvisor);
    selectors.clearGeminiBtn?.addEventListener('click', () => {
        selectors.geminiPrompt.value = '';
        selectors.geminiResponse.textContent = '';
    });

    window.addEventListener('online', () => {
        selectors.alertsDisplay.dataset.status = 'online';
    });

    window.addEventListener('offline', () => {
        selectors.alertsDisplay.dataset.status = 'offline';
        selectors.alertsDisplay.textContent = '📴 Offline mode – showing cached data if available.';
    });

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        selectors.installBanner.hidden = false;
    });

    selectors.installBtn?.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome !== 'dismissed') {
            selectors.installBanner.hidden = true;
        }
        deferredInstallPrompt = null;
    });

    selectors.dismissInstallBtn?.addEventListener('click', () => {
        selectors.installBanner.hidden = true;
        deferredInstallPrompt = null;
    });
}

async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    try {
        await navigator.serviceWorker.register('./service-worker.js');
    } catch (error) {
        console.error('Service worker registration failed', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    restoreSession();
    registerEventListeners();
    registerServiceWorker();
    getForecast();
});
