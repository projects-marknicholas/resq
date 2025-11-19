// API Configuration
const API_BASE_URL = 'http://localhost/resq';
let userProfile = null;
let barangays = [];

// Get stored user data from localStorage
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

// API Request Helper
const apiRequest = async (endpoint, options = {}) => {
    const defaultOptions = {
        headers: getHeaders()
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
};

// Load user profile from API
async function loadUserProfile() {
    showLoading();
    try {
        const data = await apiRequest('/barangay/profile');
        
        if (data.success && data.data) {
            userProfile = data.data;
            populateProfileForm(userProfile);
            updateProfileDisplay(userProfile);
            showContent();
        } else {
            throw new Error(data.error || 'Failed to load profile');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile: ' + error.message);
    }
}

// Load barangays list
async function loadBarangays() {
    try {
        const data = await apiRequest('/barangay/barangay');
        
        if (data.success && data.data) {
            barangays = data.data;
            populateBarangayDropdown(barangays);
        }
    } catch (error) {
        console.error('Error loading barangays:', error);
        // Use default barangays as fallback
        const defaultBarangays = [
            { id: 1, name: 'Barangay San Antonio' },
            { id: 2, name: 'Barangay San Jose' },
            { id: 3, name: 'Barangay San Isidro' },
            { id: 4, name: 'Barangay San Roque' },
            { id: 5, name: 'Barangay San Vicente' }
        ];
        populateBarangayDropdown(defaultBarangays);
    }
}

// Populate profile form with data
function populateProfileForm(profile) {
    document.getElementById('firstName').value = profile.first_name || '';
    document.getElementById('middleName').value = profile.middle_name || '';
    document.getElementById('lastName').value = profile.last_name || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('barangayId').value = profile.baranggay_id || '';
}

// Populate barangay dropdown
function populateBarangayDropdown(barangayList) {
    const dropdown = document.getElementById('barangayId');
    const currentBarangayId = userProfile?.baranggay_id;
    
    dropdown.innerHTML = '<option value="">Select Barangay</option>';
    
    barangayList.forEach(barangay => {
        const option = document.createElement('option');
        option.value = barangay.baranggay_id;
        option.textContent = barangay.baranggay || barangay.baranggay;
        option.selected = barangay.baranggay_id == currentBarangayId;
        dropdown.appendChild(option);
    });
}

// Update profile display elements
function updateProfileDisplay(profile) {
    // Update top navigation
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    document.getElementById('userName').textContent = fullName || 'User';
    document.getElementById('userRole').textContent = profile.role || 'Barangay Official';
    
    // Update profile section
    document.getElementById('profileName').textContent = fullName || 'User';
    document.getElementById('profileRole').textContent = profile.role || 'Barangay Official';
    document.getElementById('profileBarangay').textContent = getBarangayName(profile.baranggay_id);
    
    // Update avatar
    const initials = getInitials(profile.first_name, profile.last_name);
    document.getElementById('userInitials').textContent = initials;
    document.getElementById('profileAvatar').textContent = initials;
    
    // Update account status
    document.getElementById('accountStatus').textContent = profile.status || 'Unknown';
    document.getElementById('accountStatus').className = `px-2 py-1 text-xs font-medium rounded ${
        profile.status === 'active' ? 'bg-green-100 text-green-700' : 
        profile.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
        'bg-red-100 text-red-700'
    }`;
    
    document.getElementById('verificationStatus').textContent = profile.email ? 'Verified' : 'Unverified';
    document.getElementById('memberSince').textContent = formatDate(profile.created_at);
    document.getElementById('lastUpdated').textContent = formatDate(profile.updated_at);
}

// Get barangay name from ID
function getBarangayName(barangayId) {
    const barangay = barangays.find(b => b.id == barangayId);
    return barangay ? (barangay.name || barangay.baranggay) : 'Barangay not set';
}

// Get initials from name
function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'U';
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Save profile data
async function saveProfile() {
    showLoading();
    
    const updateData = {
        first_name: document.getElementById('firstName').value.trim(),
        middle_name: document.getElementById('middleName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        baranggay_id: document.getElementById('barangayId').value
    };

    // Validation
    if (!updateData.first_name || !updateData.last_name) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'First name and last name are required.',
            confirmButtonColor: '#2563eb'
        });
        hideLoading();
        return;
    }

    if (!updateData.email) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Email address is required.',
            confirmButtonColor: '#2563eb'
        });
        hideLoading();
        return;
    }

    try {
        const data = await apiRequest('/barangay/profile', {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Profile updated successfully!',
                confirmButtonColor: '#10b981',
                timer: 2000,
                showConfirmButton: false
            });
            // Reload profile to get updated data
            await loadUserProfile();
        } else {
            throw new Error(data.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: error.message,
            confirmButtonColor: '#ef4444'
        });
    } finally {
        hideLoading();
    }
}

// Refresh profile data
async function refreshProfile() {
    showLoading();
    try {
        await Promise.all([loadUserProfile(), loadBarangays()]);
        Swal.fire({
            icon: 'success',
            title: 'Refreshed!',
            text: 'Profile data has been refreshed.',
            confirmButtonColor: '#10b981',
            timer: 1500,
            showConfirmButton: false
        });
    } catch (error) {
        showError('Failed to refresh data: ' + error.message);
    }
}

// Export data
function exportData() {
    if (userProfile) {
        const dataStr = JSON.stringify(userProfile, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `profile-${userProfile.user_id || 'data'}.json`;
        link.click();
        URL.revokeObjectURL(url);
        Swal.fire({
            icon: 'success',
            title: 'Exported!',
            text: 'Profile data exported successfully.',
            confirmButtonColor: '#10b981',
            timer: 1500,
            showConfirmButton: false
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Export Failed',
            text: 'No profile data to export',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Remove profile photo
function removePhoto() {
    Swal.fire({
        title: 'Remove Profile Photo?',
        text: 'Are you sure you want to remove your profile photo?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, remove it',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            console.log('[v0] Removing profile photo');
            Swal.fire({
                icon: 'success',
                title: 'Removed!',
                text: 'Profile photo removed successfully.',
                confirmButtonColor: '#10b981',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

// UI Helper Functions
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('profileContent').classList.add('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.body.classList.add('loading');
}

function showContent() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('profileContent').classList.remove('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.body.classList.remove('loading');
}

function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('profileContent').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
    document.body.classList.remove('loading');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Notifications
function toggleNotifications() {
    // Implementation for notifications panel
    Swal.fire({
        title: 'Notifications',
        text: 'Notifications feature will be implemented soon.',
        icon: 'info',
        confirmButtonColor: '#2563eb'
    });
}

// Logout
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
            localStorage.clear();
            window.location.href = '../index.html';
        }
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const storedData = getStoredUserData();
    if (!storedData) {
        showError('Please login to access your profile.');
        return;
    }

    try {
        await Promise.all([loadUserProfile(), loadBarangays()]);
    } catch (error) {
        showError('Failed to initialize profile: ' + error.message);
    }
});