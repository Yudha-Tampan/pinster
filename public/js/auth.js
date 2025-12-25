const API_URL = 'https://your-vercel-app.vercel.app/api';

// Check auth status
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (window.location.pathname.includes('dashboard.html')) {
    if (!token || !user) {
      window.location.href = 'login.html';
      return null;
    }
    return JSON.parse(user);
  }
  
  if (window.location.pathname.includes('index.html')) {
    if (!token) {
      window.location.href = 'login.html';
    }
  }
  
  return user ? JSON.parse(user) : null;
}

// Register
if (document.getElementById('registerForm')) {
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('regEmail').value;
    const username = document.getElementById('regUsername').value;
    const fullName = document.getElementById('regFullName').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, full_name: fullName, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'index.html';
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  });
}

// Login
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'index.html';
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  });
}

// Logout
if (document.getElementById('logoutBtn')) {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  });
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', checkAuth);