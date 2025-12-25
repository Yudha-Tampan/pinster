const API_URL = 'https://your-vercel-app.vercel.app/api';

// Load pins
async function loadPins() {
  try {
    const response = await fetch(`${API_URL}/posts`);
    const data = await response.json();
    
    const grid = document.getElementById('pinsGrid');
    grid.innerHTML = '';
    
    if (data.success && data.data.length > 0) {
      data.data.forEach(pin => {
        const pinElement = document.createElement('div');
        pinElement.className = 'pin-card';
        pinElement.innerHTML = `
                    <img src="${pin.image_url}" alt="${pin.title}" class="pin-image">
                    <div class="pin-info">
                        <div class="pin-title">${pin.title || 'Untitled'}</div>
                        <p>${pin.description || ''}</p>
                        <div class="pin-user">
                            <img src="${pin.user?.avatar_url || 'https://i.pravatar.cc/300'}" 
                                 alt="${pin.user?.username}" class="user-avatar">
                            <span>@${pin.user?.username || 'unknown'}</span>
                        </div>
                        <div style="margin-top: 10px; display: flex; gap: 15px;">
                            <button onclick="likePin('${pin.id}')" style="background: none; border: none; color: #e60023; cursor: pointer;">
                                <i class="fas fa-heart"></i> ${pin.likes_count}
                            </button>
                            <button style="background: none; border: none; color: #333; cursor: pointer;">
                                <i class="fas fa-save"></i> Save
                            </button>
                        </div>
                    </div>
                `;
        grid.appendChild(pinElement);
      });
    } else {
      grid.innerHTML = '<div class="loading">No pins found. Be the first to create one!</div>';
    }
  } catch (error) {
    console.error('Error loading pins:', error);
    document.getElementById('pinsGrid').innerHTML = '<div class="loading">Error loading pins</div>';
  }
}

// Like pin
async function likePin(pinId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login to like pins');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/posts/${pinId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    if (data.success) {
      loadPins(); // Reload pins
    }
  } catch (error) {
    console.error('Error liking pin:', error);
  }
}

// Create pin modal
if (document.getElementById('createBtn')) {
  const modal = document.getElementById('createModal');
  const createBtn = document.getElementById('createBtn');
  const closeBtn = document.querySelector('.close');
  
  createBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Create pin form
  document.getElementById('createForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to create pins');
      return;
    }
    
    const imageUrl = document.getElementById('pinImage').value;
    const title = document.getElementById('pinTitle').value;
    const description = document.getElementById('pinDescription').value;
    const category = document.getElementById('pinCategory').value;
    
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image_url: imageUrl,
          title,
          description,
          category
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        modal.style.display = 'none';
        document.getElementById('createForm').reset();
        loadPins(); // Reload pins
        alert('Pin created successfully!');
      } else {
        alert(data.error || 'Failed to create pin');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadPins();
  
  // Category filter
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      // TODO: Filter pins by category
    });
  });
});