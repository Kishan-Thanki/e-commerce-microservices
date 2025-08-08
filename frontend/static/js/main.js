// frontend/static/js/main.js

// Imports from your AuthModule
import { AuthModule } from './modules/auth.js'; // Ensure this path is correct relative to main.js

// Your existing utility functions (fetchData and showMessage)
const API_BASE_URL = ''; // Nginx will handle routing, so no specific port needed here

async function fetchData(url, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            credentials: 'include' // For cookies if using them (e.g., sessions, CSRF)
        });

        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        const data = isJson ? await response.json().catch(() => ({})) : {};

        if (!response.ok) {
            let errorMessage = data.message || data.error || `HTTP error! Status: ${response.status}`;
            if (!isJson) {
                if (response.status === 401) errorMessage = 'Unauthorized. Please log in.';
                else if (response.status === 403) errorMessage = 'Forbidden. You do not have permission.';
                else if (response.status === 404) errorMessage = 'Resource not found.';
                else if (response.status >= 500) errorMessage = 'Server error. Please try again later.';
                else errorMessage = `Server responded with status ${response.status}. Please try again.`;
            }
            const error = new Error(errorMessage);
            error.status = response.status;
            throw error;
        }
        return data;
    } catch (error) {
        console.error('Fetch operation failed:', error);
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Network error. Please check your internet connection or try again later.');
        }
        throw error;
    }
}

function showMessage(type, message, elementId = 'message-container', duration = 5000) {
    const container = document.getElementById(elementId);
    if (!container) {
        console.warn(`Message container with ID '${elementId}' not found. Message: ${message}`);
        if (type === 'error') console.error(`Message: ${message}`);
        else if (type === 'success') console.log(`Message: ${message}`);
        else console.info(`Message: ${message}`);
        return;
    }
    container.innerHTML = `
        <div class="message ${type}">
            ${message}
            <span class="close-btn">&times;</span>
        </div>
    `;
    container.style.display = 'block';
    container.querySelector('.close-btn')?.addEventListener('click', () => {
        container.style.display = 'none';
        container.innerHTML = '';
    });
    if (duration > 0) {
        setTimeout(() => {
            container.style.display = 'none';
            container.innerHTML = '';
        }, duration);
    }
}

// **START OF NEW/MOVED CODE FROM HEADER.HTML SCRIPT BLOCK**

// Auth state management logic - moved from header.html
const updateAuthUI = async () => {
    const { isAuthenticated, userRole } = AuthModule.getAuthData();

    document.querySelectorAll('.guest-only').forEach(el => {
        el.style.display = isAuthenticated ? 'none' : 'block';
    });

    document.querySelectorAll('.auth-only').forEach(el => {
        el.style.display = isAuthenticated ? 'block' : 'none';
    });

    if (isAuthenticated) {
        const isAdmin = await AuthModule.verifyAdmin();
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });
    } else {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
};

// **END OF NEW/MOVED CODE FROM HEADER.HTML SCRIPT BLOCK**


// Initialize common UI elements
function initCommonUI() {
    // Highlight active nav link
    const currentPath = window.location.pathname;
    document.querySelectorAll('.header nav a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === currentPath);
    });

    // Close message when clicking outside the message container
    document.addEventListener('click', (e) => {
        const globalMessageContainer = document.getElementById('message-container');
        if (globalMessageContainer && globalMessageContainer.style.display === 'block' && !globalMessageContainer.contains(e.target)) {
            globalMessageContainer.style.display = 'none';
            globalMessageContainer.innerHTML = '';
        }
    });

    // Ensure global message container is hidden on page load if empty
    const globalMessageContainer = document.getElementById('message-container');
    if (globalMessageContainer && !globalMessageContainer.innerHTML.trim()) {
        globalMessageContainer.style.display = 'none';
    }
}


// Initialize UI elements when the DOM is fully loaded AND header is populated
document.addEventListener('DOMContentLoaded', () => {
    // Call initCommonUI which handles general UI elements
    initCommonUI();

    // Use a small delay to ensure header HTML (loaded via fetch) is fully in the DOM
    // before attempting to find elements within it.
    setTimeout(async () => {
        // Mobile menu toggle (now that the header is in the DOM)
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav');

        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }

        // Logout handler (now that the header and its elements are in the DOM)
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault(); // This will now correctly prevent default behavior
                console.log("Logout button clicked - Event listener in main.js fired!"); // Debugging log
                await AuthModule.logout();
                await updateAuthUI(); // Update UI after logout
            });
        }

        // Initial UI update for auth/admin-only elements after header is fully loaded
        await updateAuthUI();

        // Update UI when auth state changes (e.g., after login/logout from another tab/window)
        window.addEventListener('storage', updateAuthUI);

    }, 100); // 100ms delay: common practice, usually enough for header to load
});

// Export utilities for other modules
export { fetchData, showMessage, initCommonUI };