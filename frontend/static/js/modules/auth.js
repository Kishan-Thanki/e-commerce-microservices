import { fetchData, showMessage } from '../main.js';

const AuthModule = (function() {
    let accessToken = localStorage.getItem('access_token');
    let refreshToken = localStorage.getItem('refresh_token');
    let userId = localStorage.getItem('user_id');
    let userRole = localStorage.getItem('user_role'); // Added userRole from localStorage

    function saveAuthData(data) {
        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        userId = data.user_id;
        userRole = data.role || 'user'; // Assuming 'role' comes from login response, default to 'user'

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user_id', data.user_id);
        localStorage.setItem('user_role', data.role || 'user'); // Save user's role
    }

    function clearAuthData() {
        accessToken = null;
        refreshToken = null;
        userId = null;
        userRole = null;

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_role');
    }

    async function register(username, email, password) {
        try {
            // FIX: Add /api/ prefix
            const data = await fetchData('/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            // FIX: Use explicit elementId for form-specific message
            showMessage('success', 'Registration successful! Please log in.', 'register-message-container');
            return data;
        } catch (error) {
            // FIX: Use explicit elementId for form-specific message
            showMessage('error', error.message || 'Registration failed.', 'register-message-container');
            throw error;
        }
    }

    async function login(username, password) {
        try {
            // FIX: Add /api/ prefix
            const data = await fetchData('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            saveAuthData(data);
            // FIX: Use explicit elementId for form-specific message
            showMessage('success', 'Logged in successfully!', 'login-message-container');
            window.location.href = '/products.html';
            return data;
        } catch (error) {
            // FIX: Use explicit elementId for form-specific message
            showMessage('error', error.message || 'Login failed.', 'login-message-container');
            throw error;
        }
    }

    async function logout() {
        try {
            if (accessToken) {
                // FIX: Add /api/ prefix
                await fetchData('/api/users/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            clearAuthData();
            // Using global message container for logout confirmation
            showMessage('success', 'You have been logged out.');
            window.location.href = '/login.html';
        } catch (error) {
            // Even if server communication fails, clear local data for UX
            clearAuthData();
            showMessage('error', error.message || 'Logout failed (server session might persist). Please log in again if issues occur.', 'message-container', 8000); // Longer duration for critical error
            window.location.href = '/login.html';
        }
    }

    // New generic role verification function
    async function verifyRole(requiredRole = 'user') { // Default to 'user' for general access check
        // If no token, clearly not authorized
        if (!accessToken) {
            console.warn(`Attempted to verify role '${requiredRole}' without an access token.`);
            return false;
        }

        // If the user's locally stored role is already known and insufficient, we can short-circuit (optional)
        // This avoids an API call if client-side info is enough
        if (userRole && userRole !== requiredRole && userRole !== 'admin') { // Basic check, adjust logic if roles are hierarchical
            if (requiredRole === 'admin' && userRole !== 'admin') {
                console.warn(`User is '${userRole}', not '${requiredRole}'. Denying client-side.`);
                return false;
            }
        }

        try {
            // FIX: Add /api/ prefix
            const data = await fetchData(`/api/users/verify-role?role=${requiredRole}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            // Backend should return { status: 'authorized', role: 'admin' } or similar
            if (data.status === 'authorized' && data.role === requiredRole) {
                return true;
            }
            console.warn(`Server denied role '${requiredRole}' for token. Response:`, data);
            return false;

        } catch (error) {
            console.error(`Role verification for '${requiredRole}' failed:`, error);
            // If the error indicates token expiry or invalidity, clear data and redirect
            if (error.message.includes('Unauthorized') || error.message.includes('Forbidden') || error.message.includes('expired') || error.message.includes('Invalid')) {
                showMessage('error', 'Session expired or invalid. Please log in again.', 'message-container', 8000);
                clearAuthData();
                window.location.href = '/login.html';
            }
            return false;
        }
    }

    function getAuthData() {
        return {
            accessToken,
            userId,
            userRole, // Include userRole
            isAuthenticated: !!accessToken
        };
    }

    return {
        register,
        login,
        logout,
        verifyAdmin: () => verifyRole('admin'), // Helper for admin check
        verifyRole, // Generic role check
        getAuthData,
        isAuthenticated: () => !!accessToken // Simple check for any logged in status
    };
})();

export { AuthModule };