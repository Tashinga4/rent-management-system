/**
 * AUTHENTICATION HELPER SCRIPT
 * 
 * Purpose: Manages authentication state and provides utilities for protected pages
 * 
 * This script handles:
 * - Checking if user is logged in
 * - Retrieving stored authentication data
 * - Managing logout functionality
 * - Updating user profile display
 * - Redirecting unauthorized users to login
 * 
 * Usage: Include in <head> of protected pages with:
 * <script src="../assets/js/auth.js"></script>
 */

/**
 * AUTHENTICATION CONFIGURATION
 * 
 * Stores all localStorage keys and API endpoint
 * Centralized configuration makes it easy to update keys across entire app
 */
const AUTH_CONFIG = {
  API_URL: 'http://localhost:5000/api',  // Backend API base URL
  TOKEN_KEY: 'authToken',                 // Key for JWT authentication token
  EMAIL_KEY: 'userEmail',                 // Key for user email (for PDF receipts)
  USER_ID_KEY: 'userId',                  // Key for user ID
  USER_ROLE_KEY: 'userRole',              // Key for user role (admin, manager, tenant)
  USER_NAME_KEY: 'userName'               // Key for user display name
};

/**
 * Get stored authentication token
 * 
 * The JWT token is required for authenticated API requests
 * Token is issued by server after successful login
 * Expires after 7 days
 * 
 * @returns {string|null} JWT token or null if not logged in
 */
function getAuthToken() {
  return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
}

/**
 * Get stored user email
 * 
 * Email is collected during login and used for:
 * - Sending PDF payment receipts
 * - System notifications
 * - Account recovery
 * 
 * @returns {string|null} User email or null if not available
 */
function getUserEmail() {
  return localStorage.getItem(AUTH_CONFIG.EMAIL_KEY);
}

/**
 * Get stored user ID
 * 
 * Used to:
 * - Identify user for API calls
 * - Query user-specific data
 * - Track user actions
 * 
 * @returns {string|null} User ID or null if not available
 */
function getUserId() {
  return localStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
}

/**
 * Get stored user role
 * 
 * Role determines what features user can access:
 * - admin: Full system access
 * - manager: Management features
 * - owner: Property owner features
 * - tenant: Limited tenant features
 * 
 * @returns {string|null} User role or null if not available
 */
function getUserRole() {
  return localStorage.getItem(AUTH_CONFIG.USER_ROLE_KEY);
}

/**
 * Get stored user name
 * 
 * Used for personalization:
 * - Display in navbar
 * - Welcome messages
 * - Audit logs
 * 
 * @returns {string|null} User name or null if not available
 */
function getUserName() {
  return localStorage.getItem(AUTH_CONFIG.USER_NAME_KEY);
}

/**
 * Check if user is currently authenticated
 * 
 * Returns true only if:
 * - User has valid token in localStorage
 * - Token has not expired (checked by server when used)
 * 
 * @returns {boolean} True if user is authenticated, false otherwise
 */
function isAuthenticated() {
  // Double negation: !! converts truthy/falsy to boolean
  // Returns true if token exists, false if null
  return !!getAuthToken();
}

/**
 * Require authentication to access page
 * 
 * If user is not logged in:
 * - Redirects to login.html
 * - Prevents access to protected pages
 * 
 * Call this at the top of protected pages
 * 
 * @returns {boolean} True if authenticated, false if redirected
 */
function requireAuth() {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    // Redirect to login page if not authenticated
    window.location.href = 'login.html';
    return false;
  }
  // User is authenticated, continue
  return true;
}

/**
 * Logout user and clear session
 * 
 * This function:
 * 1. Removes all authentication data from localStorage
 * 2. Clears cached user information
 * 3. Redirects to login page
 * 
 * Called when user clicks logout button or session expires
 */
function logout() {
  /**
   * Clear all stored authentication data
   * This prevents user from accessing protected pages
   * and erases sensitive information from local storage
   */
  
  // Remove JWT authentication token
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  
  // Remove user email
  localStorage.removeItem(AUTH_CONFIG.EMAIL_KEY);
  
  // Remove user ID
  localStorage.removeItem(AUTH_CONFIG.USER_ID_KEY);
  
  // Remove user role
  localStorage.removeItem(AUTH_CONFIG.USER_ROLE_KEY);
  
  // Remove user name
  localStorage.removeItem(AUTH_CONFIG.USER_NAME_KEY);
  
  /**
   * Redirect to login page
   * User must login again to access the system
   */
  window.location.href = 'login.html';
}

/**
 * Get authorization headers for API requests
 * 
 * Used with fetch() to make authenticated API calls
 * Includes JWT token in Authorization header
 * 
 * Example usage:
 * const headers = getAuthHeaders();
 * fetch('/api/tenants', { headers });
 * 
 * @returns {object} Headers object with Authorization and Content-Type
 */
function getAuthHeaders() {
  return {
    // Bearer token scheme for JWT authentication
    'Authorization': `Bearer ${getAuthToken()}`,
    // Specify that request body is JSON
    'Content-Type': 'application/json'
  };
}

/**
 * Update user profile display in navbar
 * 
 * This function:
 * 1. Gets stored user information
 * 2. Updates HTML elements in navbar/profile sections
 * 3. Personalizes page with user details
 * 
 * Call after user logs in or page loads
 */
function updateUserProfile() {
  /**
   * Retrieve user information from localStorage
   * These values were stored during login
   */
  const userName = getUserName();
  const userRole = getUserRole();
  const userEmail = getUserEmail();

  /**
   * Update navbar elements with user information
   * If elements exist, update their text content
   * If elements don't exist, skip (page may not have them)
   */
  
  // Update user name in dropdown if element exists
  const dropdownName = document.getElementById('dropdownName');
  if (dropdownName) {
    dropdownName.textContent = userName || 'User';
  }
  
  // Update user role in dropdown if element exists
  const dropdownRole = document.getElementById('dropdownRole');
  if (dropdownRole) {
    dropdownRole.textContent = userRole || 'Admin';
  }
  
  // Update email display if element exists
  const profileEmail = document.getElementById('profileEmail');
  if (profileEmail) {
    profileEmail.textContent = userEmail || 'Not set';
  }

  /**
   * Optional: Update page title with user information
   * This could show in browser tab
   */
  const pageTitle = document.querySelector('title');
  if (pageTitle) {
    const currentTitle = pageTitle.textContent;
    pageTitle.textContent = currentTitle; // Keep as is
  }
}

/**
 * Initialize authentication on page load
 * 
 * This function:
 * 1. Checks if page is protected
 * 2. Redirects to login if user is not authenticated
 * 3. Updates profile display if authenticated
 * 
 * Called automatically when page loads
 */
function initializeAuth() {
  /**
   * List of pages that require authentication
   * Users must be logged in to view these pages
   * Add page names here if you want to protect them
   */
  const protectedPages = [
    'index.html',                    // Dashboard
    'tenants-list.html',             // Tenant management
    'payments-all.html',             // Payment management
    'maintenance-requests.html',     // Maintenance requests
    'reports-overview.html'          // Reports
  ];
  
  /**
   * Get current page name from URL
   * Example: if URL is /html/index.html, get "index.html"
   */
  const currentPage = window.location.pathname.split('/').pop();

  /**
   * Check if current page is protected
   * If it is and user is not authenticated, redirect to login
   */
  if (protectedPages.includes(currentPage)) {
    requireAuth();
  }

  /**
   * If user is authenticated, update profile display
   * Shows their name, email, and role in navbar
   */
  if (isAuthenticated()) {
    updateUserProfile();
  }
}

/**
 * Fetch with authentication
 * 
 * Wrapper around fetch() that automatically includes auth token
 * 
 * Usage:
 * const response = await fetchWithAuth('/api/tenants');
 * const data = await response.json();
 * 
 * @param {string} url - API endpoint URL
 * @param {object} options - Additional fetch options
 * @returns {Promise} Fetch promise with auth headers included
 */
async function fetchWithAuth(url, options = {}) {
  /**
   * Get authorization headers with JWT token
   * These headers identify the user making the request
   */
  const headers = getAuthHeaders();
  
  /**
   * Make fetch request with auth headers merged in
   * Spread operator (...) merges headers with any existing headers
   */
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });
}

/**
 * AUTO-INITIALIZATION CODE
 * Runs when page loads to set up authentication
 */

/**
 * When DOM is fully loaded, initialize authentication
 * This checks if user is logged in and protects pages
 * Must run after DOM is ready so we can update HTML elements
 */
document.addEventListener('DOMContentLoaded', initializeAuth);

/**
 * Handle logout clicks
 * 
 * Listens for clicks on elements with data-logout attribute
 * When clicked, calls logout() function to clear session
 * 
 * HTML Usage:
 * <a href="#" data-logout>Logout</a>
 */
document.addEventListener('click', function(e) {
  /**
   * Check if clicked element or its parent has data-logout attribute
   * This allows clicks on child elements to trigger logout
   * Example: clicking icon inside <a data-logout> still works
   */
  if (e.target.closest('[data-logout]')) {
    // Prevent default link behavior
    e.preventDefault();
    // Call logout function to clear session
    logout();
  }
});

