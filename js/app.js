// Application State
let currentUser = null;
let isAdmin = false;
let uploadedFiles = [];
let chatMessages = [];

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
  await initializeApp();
});

async function initializeApp() {
  try {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token by making a request
      try {
        await api.getChatMessages();
        // If successful, user is logged in
        currentUser = { token };
        updateUserStatus();
      } catch (error) {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
        api.token = null;
      }
    }

    await loadData();
    initializeEventListeners();
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

async function loadData() {
  try {
    // Load files
    const filesData = await api.getFiles();
    uploadedFiles = filesData.files || [];
    loadUploadedFiles();

    // Load chat messages if user is logged in
    if (currentUser) {
      const chatData = await api.getChatMessages();
      chatMessages = chatData.messages || [];
      loadChatHistory();
    }

    // Load admin stats if admin
    if (isAdmin) {
      await updateAdminStats();
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function initializeEventListeners() {
  // File upload listener
  const fileInput = document.getElementById('fileUpload');
  if (fileInput) {
    fileInput.addEventListener('change', function() {
      const files = Array.from(this.files);
      if (files.length > 0) {
        displaySelectedFiles(files);
      }
    });
  }

  // Chat input listener
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', handleChatKeyPress);
  }
}

// Authentication Functions
async function login() {
  try {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    const data = await api.login(username, password);
    currentUser = data.user;
    isAdmin = data.user.isAdmin;

    updateUserStatus();
    closeModal('loginModal');
    alert('Login successful!');

    // Reload data for authenticated user
    await loadData();
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
}

async function createAccount() {
  try {
    const email = document.getElementById('createEmail').value;
    const username = document.getElementById('createUsername').value;
    const password = document.getElementById('createPassword').value;

    if (!email || !username || !password) {
      alert('Please fill all fields');
      return;
    }

    const data = await api.register(email, username, password);
    currentUser = data.user;
    isAdmin = data.user.isAdmin;

    updateUserStatus();
    closeModal('createAccountModal');
    alert('Account created successfully!');

    // Reload data for new user
    await loadData();
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
}

function logout() {
  api.logout();
  currentUser = null;
  isAdmin = false;
  updateUserStatus();
  document.getElementById('adminPanel').style.display = 'none';
  
  // Clear sensitive data
  uploadedFiles = [];
  chatMessages = [];
  loadUploadedFiles();
  document.getElementById('chatMessages').innerHTML = `
    <div style="color: #00ff88; margin-bottom: 1rem;">
      <strong>Chris AI:</strong> Hello! Please login to access the full chat experience.
    </div>
  `;
  
  alert('Logged out successfully');
}

function updateUserStatus() {
  const statusDiv = document.getElementById('userStatus');
  const loginBtn = document.getElementById('loginBtn');

  if (currentUser) {
    statusDiv.innerHTML = `Welcome, ${currentUser.username}${isAdmin ? ' (Admin)' : ''}`;
    loginBtn.innerHTML = 'Logout';
    loginBtn.onclick = logout;
  } else {
    statusDiv.innerHTML = 'Not Logged In';
    loginBtn.innerHTML = 'Login';
    loginBtn.onclick = showLoginModal;
  }
}

// File Upload Functions
async function uploadFiles() {
  if (!currentUser) {
    alert('Please login to upload files');
    return;
  }

  const fileInput = document.getElementById('fileUpload');
  const files = fileInput.files;

  if (files.length === 0) {
    alert('Please select files to upload');
    return;
  }

  try {
    const uploadBtn = event.target;
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    const data = await api.uploadFiles(Array.from(files));
    
    alert(`${data.files.length} file(s) uploaded successfully!`);
    fileInput.value = '';
    
    // Reload files
    await loadData();
  } catch (error) {
    alert('Upload failed: ' + error.message);
  } finally {
    const uploadBtn = document.querySelector('button[onclick="uploadFiles()"]');
    if (uploadBtn) {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload';
    }
  }
}

function displaySelectedFiles(files) {
  const container = document.getElementById('uploadedFiles');
  const selectedDiv = document.createElement('div');
  selectedDiv.id = 'selectedFiles';
  selectedDiv.innerHTML = '<h4 style="color: #00ff88;">Selected Files:</h4>';
  
  files.forEach(file => {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-item';
    fileDiv.innerHTML = `
      <h4>${file.name}</h4>
      <p>Size: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
      <p>Type: ${file.type || 'Unknown'}</p>
    `;
    selectedDiv.appendChild(fileDiv);
  });
  
  // Remove previous selection display
  const existing = document.getElementById('selectedFiles');
  if (existing) existing.remove();
  
  container.appendChild(selectedDiv);
}

function loadUploadedFiles() {
  const container = document.getElementById('uploadedFiles');
  
  // Clear selected files display
  const selectedFiles = document.getElementById('selectedFiles');
  if (selectedFiles) selectedFiles.remove();
  
  container.innerHTML = '';

  uploadedFiles.forEach(file => {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-item';
    fileDiv.innerHTML = `
      <h4>${file.original_name}</h4>
      <p>Size: ${(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
      <p>Uploaded by: ${file.users?.username || 'Unknown'}</p>
      <p>Date: ${new Date(file.created_at).toLocaleDateString()}</p>
      <p>Downloads: ${file.download_count}</p>
      <button class="btn" onclick="downloadFile('${file.id}')" style="margin: 0.5rem;">Download</button>
      ${isAdmin ? `<button class="btn" onclick="deleteFile('${file.id}')" style="background: #ff4444;">Delete</button>` : ''}
    `;
    container.appendChild(fileDiv);
  });

  if (uploadedFiles.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #cccccc;">No files uploaded yet. Be the first to share!</p>';
  }
}

async function downloadFile(fileId) {
  try {
    const data = await api.downloadFile(fileId);
    window.open(data.downloadUrl, '_blank');
  } catch (error) {
    alert('Download failed: ' + error.message);
  }
}

async function deleteFile(fileId) {
  if (!isAdmin) {
    alert('Admin access required');
    return;
  }

  if (confirm('Are you sure you want to delete this file?')) {
    try {
      await api.deleteFile(fileId);
      alert('File deleted successfully');
      await loadData();
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  }
}

// Chat Functions
async function sendMessage() {
  if (!currentUser) {
    alert('Please login to chat');
    return;
  }

  const input = document.getElementById('chatInput');
  const message = input.value.trim();

  if (!message) return;

  try {
    // Add user message to UI immediately
    addMessageToUI(currentUser.username, message, false);
    input.value = '';

    // Send to server
    await api.sendMessage(message);

    // AI response will be added via polling or websocket
    setTimeout(async () => {
      await loadChatHistory();
    }, 1500);
  } catch (error) {
    alert('Failed to send message: ' + error.message);
  }
}

function addMessageToUI(username, message, isAI) {
  const messagesDiv = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.style.marginBottom = '1rem';
  
  if (isAI) {
    messageDiv.style.color = '#00ff88';
    messageDiv.innerHTML = `<strong>Chris AI:</strong> ${message}`;
  } else {
    messageDiv.style.textAlign = 'right';
    messageDiv.innerHTML = `<strong>${username}:</strong> ${message}`;
  }
  
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function loadChatHistory() {
  if (!currentUser) return;

  try {
    const data = await api.getChatMessages();
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.innerHTML = '';

    data.messages.forEach(msg => {
      addMessageToUI(
        msg.is_ai ? 'Chris AI' : msg.users?.username || 'Unknown',
        msg.message,
        msg.is_ai
      );
    });
  } catch (error) {
    console.error('Failed to load chat history:', error);
  }
}

function handleChatKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// Admin Functions
async function adminLogin() {
  try {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    const data = await api.login(username, password);
    
    if (data.user.isAdmin) {
      currentUser = data.user;
      isAdmin = true;
      updateUserStatus();
      closeModal('adminModal');
      document.getElementById('adminPanel').style.display = 'block';
      alert('Admin login successful!');
      await updateAdminStats();
    } else {
      alert('Admin access required');
    }
  } catch (error) {
    alert('Admin login failed: ' + error.message);
  }
}

async function updateAdminStats() {
  if (!isAdmin) return;

  try {
    const stats = await api.getAdminStats();
    document.getElementById('userCount').textContent = stats.users;
    document.getElementById('fileCount').textContent = stats.files;
    document.getElementById('messageCount').textContent = stats.messages;
  } catch (error) {
    console.error('Failed to load admin stats:', error);
  }
}

async function viewUsers() {
  if (!isAdmin) {
    alert('Access denied');
    return;
  }

  try {
    const data = await api.getUsers();
    let userList = 'Registered Users:\n\n';
    
    data.users.forEach(user => {
      userList += `• ${user.username} (${user.email}) - Admin: ${user.is_admin ? 'Yes' : 'No'} - Created: ${new Date(user.created_at).toLocaleDateString()}\n`;
    });

    if (data.users.length === 0) {
      userList += 'No users registered yet.';
    }

    alert(userList);
  } catch (error) {
    alert('Failed to load users: ' + error.message);
  }
}

// Modal Functions (keeping existing ones)
function showLoginModal() {
  document.getElementById('loginModal').style.display = 'block';
}

function showCreateAccount() {
  closeModal('loginModal');
  document.getElementById('createAccountModal').style.display = 'block';
}

function showAdminLogin() {
  document.getElementById('adminModal').style.display = 'block';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Game video functions (keeping existing)
function showGameVideo(game) {
  const modal = document.getElementById('gameVideoModal');
  const container = document.getElementById('gameVideoContainer');

  let videoContent = '';

  switch(game) {
    case 'gta':
      videoContent = `
        <h3>GTA Series</h3>
        <iframe width="560" height="315" src="https://www.youtube.com/embed/QkkoHAzjnUs" 
        frameborder="0" allowfullscreen style="border-radius: 10px; max-width: 100%;"></iframe>
        <p style="margin-top: 1rem;">Download GTA series from our partner sites!</p>
      `;
      break;
    case 'cod':
      videoContent = `
        <h3>Call of Duty</h3>
        <iframe width="560" height="315" src="https://www.youtube.com/embed/mzGgOz-9FXI" 
        frameborder="0" allowfullscreen style="border-radius: 10px; max-width: 100%;"></iframe>
        <p style="margin-top: 1rem;">Get the latest COD games compressed!</p>
      `;
      break;
    case 'fifa':
      videoContent = `
        <h3>FIFA Series</h3>
        <iframe width="560" height="315" src="https://www.youtube.com/embed/o3V-GvvzjE4" 
        frameborder="0" allowfullscreen style="border-radius: 10px; max-width: 100%;"></iframe>
        <p style="margin-top: 1rem;">Download FIFA and PES games here!</p>
      `;
      break;
  }

  container.innerHTML = videoContent;
  modal.style.display = 'block';
}

// Google OAuth simulation
async function continueWithGoogle() {
  try {
    const googleEmail = prompt('Enter your Google email:');
    if (!googleEmail) return;

    // Simulate Google OAuth by creating account with Google email
    const username = googleEmail.split('@')[0];
    const tempPassword = 'google_oauth_' + Math.random().toString(36);

    const data = await api.register(googleEmail, username, tempPassword);
    currentUser = data.user;
    isAdmin = data.user.isAdmin;

    updateUserStatus();
    closeModal('loginModal');
    closeModal('createAccountModal');
    
    if (isAdmin) {
      alert('Welcome Admin!');
    } else {
      alert('Signed in with Google!');
    }

    await loadData();
  } catch (error) {
    alert('Google sign-in failed: ' + error.message);
  }
}

// Admin panel functions
function changeAdminPassword() {
  alert('Password change functionality would integrate with the backend user management system.');
}

function editWebsite() {
  if (!isAdmin) {
    alert('Access denied');
    return;
  }
  alert('Website editor would open here. This feature allows admins to modify content, add new games, and update information.');
}

function manageFiles() {
  if (!isAdmin) {
    alert('Access denied');
    return;
  }
  viewUsers(); // Show users for now, can be expanded
}

// Utility functions
function createGroup() {
  if (!currentUser) {
    alert('Please login to create groups');
    return;
  }

  const groupName = prompt('Enter group name:');
  if (groupName) {
    alert(`Group "${groupName}" created! This feature will be fully implemented with real-time chat and file sharing.`);
  }
}

function joinGroup() {
  if (!currentUser) {
    alert('Please login to join groups');
    return;
  }

  const groupId = prompt('Enter group ID or name:');
  if (groupId) {
    alert(`You've joined the group: ${groupId}. Real-time group features coming soon!`);
  }
}

// Close modals when clicking outside
window.onclick = function(event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// Auto-refresh data every 30 seconds
setInterval(async () => {
  if (currentUser) {
    await loadData();
  }
}, 30000);