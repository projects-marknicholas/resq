// API Configuration
const API_BASE_URL = 'http://localhost/resq';
let userData = null;
let barangays = [];

// DOM Elements
const editProfileModal = document.getElementById('editProfileModal');
const editProfileBtn = document.getElementById('editProfileBtn');
const closeModal = document.getElementById('closeModal');
const cancelEdit = document.getElementById('cancelEdit');
const saveProfile = document.getElementById('saveProfile');
const changePhotoBtn = document.getElementById('changePhotoBtn');
const loadingState = document.getElementById('loadingState');
const profileContent = document.getElementById('profileContent');
const errorState = document.getElementById('errorState');
const retryButton = document.getElementById('retryButton');

// Get stored user data
function getStoredUserData() {
    const userDataStr = localStorage.getItem('userData');
    const userRole = localStorage.getItem('userRole');
    const csrfToken = localStorage.getItem('csrf_token');
    
    return userDataStr ? {
        user: JSON.parse(userDataStr),
        role: userRole,
        csrfToken: csrfToken
    } : null;
}

// API Headers
function getHeaders() {
    const storedData = getStoredUserData();
    if (!storedData) {
        throw new Error('No user data found. Please login again.');
    }

    return {
        'Authorization': `Bearer ${storedData.user.api_key}`,
        'X-CSRF-Token': storedData.csrfToken,
        'Content-Type': 'application/json'
    };
}

// Fetch user profile
async function fetchUserProfile() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            userData = data.data;
            loadUserData();
            showContent();
            
            // Fetch barangays after profile is loaded
            await fetchBarangays();
        } else {
            throw new Error(data.error || 'Failed to load profile');
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        showError(error.message);
    }
}

// Fetch barangays
async function fetchBarangays() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/barangay`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            barangays = data.data;
            populateBarangayDropdown();
        }
    } catch (error) {
        console.error('Error fetching barangays:', error);
    }
}

// Update user profile
async function updateUserProfile(updateData) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            throw new Error(data.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

// Load user data to UI
function loadUserData() {
    if (!userData) return;

    // Header section
    document.getElementById('userName').textContent = `${userData.first_name} ${userData.last_name}`;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('memberSince').textContent = `Member since ${formatDate(userData.created_at)}`;
    
    // Sidebar
    document.getElementById('sidebarUserName').textContent = `${userData.first_name} ${userData.last_name}`;
    document.getElementById('sidebarUserEmail').textContent = userData.email;
    
    // Modal fields
    document.getElementById('modalFirstName').value = userData.first_name || '';
    document.getElementById('modalMiddleName').value = userData.middle_name || '';
    document.getElementById('modalLastName').value = userData.last_name || '';
    document.getElementById('modalUserEmail').value = userData.email || '';
    
    // Information sections
    document.getElementById('infoFirstName').textContent = userData.first_name || '-';
    document.getElementById('infoLastName').textContent = userData.last_name || '-';
    document.getElementById('infoMiddleName').textContent = userData.middle_name || '-';
    document.getElementById('infoEmail').textContent = userData.email || '-';
    document.getElementById('infoRole').textContent = userData.role || '-';
    document.getElementById('infoStatus').textContent = userData.status || '-';
    document.getElementById('infoCreatedAt').textContent = formatDateTime(userData.created_at);
    document.getElementById('infoUpdatedAt').textContent = formatDateTime(userData.updated_at);
    
    // Google badge
    const googleBadge = document.getElementById('googleBadge');
    if (userData.google_id) {
        googleBadge.innerHTML = '<i class="fas fa-google"></i> Google Account';
    }
}

// Get barangay name from ID
function getBarangayName(barangayId) {
    if (!barangayId || !barangays.length) return null;
    const barangay = barangays.find(b => b.baranggay_id == barangayId);
    return barangay ? barangay.baranggay : null;
}

// Populate barangay dropdown
function populateBarangayDropdown() {
    const dropdown = document.getElementById('modalBarangay');
    dropdown.innerHTML = '<option value="">Select Barangay</option>';
    
    barangays.forEach(barangay => {
        const option = document.createElement('option');
        option.value = barangay.baranggay_id;
        option.textContent = barangay.baranggay;
        if (userData && userData.baranggay_id == barangay.baranggay_id) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    });
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

// Format date and time for display
function formatDateTime(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show loading state
function showLoading() {
    loadingState.classList.remove('hidden');
    profileContent.classList.add('hidden');
    errorState.classList.add('hidden');
}

// Show content
function showContent() {
    loadingState.classList.add('hidden');
    profileContent.classList.remove('hidden');
    errorState.classList.add('hidden');
}

// Show error state
function showError(message) {
    loadingState.classList.add('hidden');
    profileContent.classList.add('hidden');
    errorState.classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Modal Functions
function openModal() {
    editProfileModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModalFunc() {
    editProfileModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Save profile changes
async function saveProfileChanges() {
    const saveButton = document.getElementById('saveProfile');
    const saveButtonText = document.getElementById('saveButtonText');
    const saveButtonSpinner = document.getElementById('saveButtonSpinner');
    
    const firstName = document.getElementById('modalFirstName').value.trim();
    const middleName = document.getElementById('modalMiddleName').value.trim();
    const lastName = document.getElementById('modalLastName').value.trim();
    const baranggayId = document.getElementById('modalBarangay').value;

    // Validation
    if (!firstName || !lastName) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'First name and last name are required.',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    const updateData = {
        first_name: firstName,
        last_name: lastName
    };

    if (middleName) {
        updateData.middle_name = middleName;
    }

    if (baranggayId) {
        updateData.baranggay_id = baranggayId;
    }

    try {
        // Show loading state
        saveButton.disabled = true;
        saveButtonText.textContent = 'Saving...';
        saveButtonSpinner.classList.remove('hidden');

        const result = await updateUserProfile(updateData);
        
        if (result.success) {
            // Update local user data
            userData = result.data;
            loadUserData();
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Profile updated successfully!',
                confirmButtonColor: '#10b981',
                timer: 2000,
                showConfirmButton: false
            });
            
            closeModalFunc();
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: error.message,
            confirmButtonColor: '#ef4444'
        });
    } finally {
        // Restore button state
        saveButton.disabled = false;
        saveButtonText.textContent = 'Save Changes';
        saveButtonSpinner.classList.add('hidden');
    }
}

// Change profile photo
function changeProfilePhoto() {
    Swal.fire({
        title: 'Change Profile Photo',
        text: 'In a real app, this would open the device camera or photo gallery to select a new profile picture.',
        icon: 'info',
        confirmButtonColor: '#2563eb'
    });
}

// Logout function
function logout() {
    Swal.fire({
        title: 'Logout?',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            // Clear local storage
            localStorage.removeItem('userData');
            localStorage.removeItem('userRole');
            localStorage.removeItem('csrf_token');
            
            // Redirect to login page
            window.location.href = '../index.html';
        }
    });
}

// Event Listeners
editProfileBtn.addEventListener('click', openModal);
closeModal.addEventListener('click', closeModalFunc);
cancelEdit.addEventListener('click', closeModalFunc);
saveProfile.addEventListener('click', saveProfileChanges);
changePhotoBtn.addEventListener('click', changeProfilePhoto);
retryButton.addEventListener('click', fetchUserProfile);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('sidebarLogoutBtn').addEventListener('click', logout);

// Close modal when clicking outside
editProfileModal.addEventListener('click', (e) => {
    if (e.target === editProfileModal) {
        closeModalFunc();
    }
});

// Sidebar functionality
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const closeSidebar = document.getElementById('closeSidebar');

function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
}

function closeSidebarFunc() {
    sidebar.classList.add('-translate-x-full');
}

menuToggle.addEventListener('click', openSidebar);
mobileMenuToggle.addEventListener('click', openSidebar);
closeSidebar.addEventListener('click', closeSidebarFunc);

// Close sidebar when clicking outside
document.addEventListener('click', (event) => {
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isClickOnMenuToggle = menuToggle.contains(event.target) || mobileMenuToggle.contains(event.target);
    
    if (!isClickInsideSidebar && !isClickOnMenuToggle && !sidebar.classList.contains('-translate-x-full')) {
        closeSidebarFunc();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    fetchUserProfile();
});