// Helper function to set up authentication for testing
export const setupTestAuth = async () => {
  try {
    console.log('🔐 Setting up test authentication...');
    
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'kkarson@wesleyan.edu',
        password: '2004Duvie#'
      }),
    });

    const data = await response.json();

    if (response.ok && data.tokens) {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('✅ Test authentication successful');
      console.log('👤 User:', data.user.firstName, data.user.lastName);
      
      // Dispatch custom event to notify socket context of auth state change
      const authEvent = new CustomEvent('authStateChanged', {
        detail: { user: data.user, token: data.tokens.accessToken }
      });
      window.dispatchEvent(authEvent);
      
      console.log('✅ Authentication event dispatched, socket should reconnect automatically');
      
      return true;
    } else {
      console.log('❌ Test authentication failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Test authentication error:', error);
    return false;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const token = localStorage.getItem('accessToken');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Export the same function with the alias for compatibility
export const checkUserAuth = isAuthenticated;

// Helper function to get current user
export const getCurrentUser = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}; 