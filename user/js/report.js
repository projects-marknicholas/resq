// API Configuration
const API_BASE_URL = 'http://localhost/resq';
let userData = null;
let map, marker;
let selectedType = null;
let selectedSeverity = null;
let photoAttached = false;
let currentLatitude = null;
let currentLongitude = null;

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

// Load user data
function loadUserData() {
    const storedData = getStoredUserData();
    if (storedData && storedData.user) {
        userData = storedData.user;
        document.getElementById('sidebarUserName').textContent = `${userData.first_name || ''} ${userData.last_name || ''}`;
        document.getElementById('sidebarUserEmail').textContent = userData.email || '';
    }
}

// Initialize map
function initMap() {
    map = L.map('reportMap').setView([14.2769, 121.4164], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add draggable marker
    marker = L.marker([14.2769, 121.4164], { draggable: true }).addTo(map);
    
    marker.on('dragend', function(e) {
        const position = marker.getLatLng();
        currentLatitude = position.lat;
        currentLongitude = position.lng;
        updateAddress(position.lat, position.lng);
    });

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            currentLatitude = lat;
            currentLongitude = lng;
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
            updateAddress(lat, lng);
        });
    }
}

function updateAddress(lat, lng) {
    // In a real app, use reverse geocoding API
    document.getElementById('address').value = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
}

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

// Incident type selection
document.querySelectorAll('.incident-icon').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.incident-icon').forEach(btn => {
            btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
            btn.classList.add('border-gray-200');
            
            // Reset icon colors
            const icon = btn.querySelector('i');
            if (icon.classList.contains('fa-water')) icon.classList.add('text-blue-600');
            if (icon.classList.contains('fa-fire')) icon.classList.add('text-red-600');
            if (icon.classList.contains('fa-heartbeat')) icon.classList.add('text-green-600');
            if (icon.classList.contains('fa-car-crash')) icon.classList.add('text-yellow-600');
            if (icon.classList.contains('fa-shield-alt')) icon.classList.add('text-purple-600');
            if (icon.classList.contains('fa-mountain')) icon.classList.add('text-orange-600');
            if (icon.classList.contains('fa-bolt')) icon.classList.add('text-gray-600');
            if (icon.classList.contains('fa-ellipsis-h')) icon.classList.add('text-gray-600');
        });
        
        this.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
        this.classList.remove('border-gray-200');
        
        // Make icon white when selected
        const icon = this.querySelector('i');
        icon.classList.remove('text-blue-600', 'text-red-600', 'text-green-600', 'text-yellow-600', 'text-purple-600', 'text-orange-600', 'text-gray-600');
        icon.classList.add('text-white');
        
        selectedType = this.dataset.type;
        document.getElementById('incidentType').value = selectedType;
    });
});

// Severity selection
document.querySelectorAll('.severity-option').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.severity-option').forEach(btn => {
            btn.classList.remove('border-blue-500', 'ring-2', 'ring-blue-200');
        });
        
        this.classList.add('border-blue-500', 'ring-2', 'ring-blue-200');
        selectedSeverity = this.dataset.severity;
        document.getElementById('severity').value = selectedSeverity;
    });
});

// Character counter
document.getElementById('description').addEventListener('input', function() {
    const count = this.value.length;
    document.getElementById('charCount').textContent = count;
    if (count > 500) {
        this.value = this.value.substring(0, 500);
        document.getElementById('charCount').textContent = 500;
    }
});

// Photo handling
document.getElementById('takePhotoBtn').addEventListener('click', function() {
    document.getElementById('photoInput').click();
});

document.getElementById('photoInput').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('cameraPreview').src = event.target.result;
            document.getElementById('cameraPreview').classList.remove('hidden');
            document.getElementById('cameraPlaceholder').classList.add('hidden');
            document.getElementById('removePhotoBtn').classList.remove('hidden');
            photoAttached = true;
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

document.getElementById('removePhotoBtn').addEventListener('click', function() {
    document.getElementById('cameraPreview').src = '';
    document.getElementById('cameraPreview').classList.add('hidden');
    document.getElementById('cameraPlaceholder').classList.remove('hidden');
    document.getElementById('photoInput').value = '';
    this.classList.add('hidden');
    photoAttached = false;
});

// Submit report to API
async function submitReport(reportData) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/incident`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(reportData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error submitting report:', error);
        throw error;
    }
}

// Form submission
document.getElementById('reportForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validation
    if (!selectedType) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please select an incident type',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    if (!selectedSeverity) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please select a severity level',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    if (!currentLatitude || !currentLongitude) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please ensure location is set',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    const description = document.getElementById('description').value.trim();
    if (!description) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Please provide a description of the incident',
            confirmButtonColor: '#2563eb'
        });
        return;
    }

    // Show loading state
    document.getElementById('loadingOverlay').classList.remove('hidden');
    document.getElementById('submitBtn').disabled = true;

    try {
        // Prepare report data
        const reportData = {
            latitude: currentLatitude,
            longitude: currentLongitude,
            incident_type: selectedType,
            severity_level: selectedSeverity,
            description: description,
            photo: '' // File path or empty string
        };

        // Handle photo if attached - SIMPLIFIED VERSION
        // Just send the filename or empty string
        if (photoAttached) {
            const photoFile = document.getElementById('photoInput').files[0];
            if (photoFile) {
                // Just send the filename, not the actual file data
                reportData.photo = photoFile.name;
            }
        }

        // Submit report
        const result = await submitReport(reportData);

        // Hide loading state
        document.getElementById('loadingOverlay').classList.add('hidden');

        if (result.success) {
            // Show success modal
            const confirmationModal = document.getElementById('confirmationModal');
            const confirmationMessage = document.getElementById('confirmationMessage');
            
            confirmationMessage.textContent = 'Your report has been successfully submitted and will be reviewed by our team.';
            confirmationModal.classList.remove('hidden');
            
            // Update confirmation message with barangay info if available
            if (result.data && result.data.baranggay_name) {
                confirmationMessage.textContent = `Your report has been successfully submitted to ${result.data.baranggay_name} and will be reviewed by our team.`;
            }
        } else {
            throw new Error(result.error || 'Failed to submit report');
        }
    } catch (error) {
        // Hide loading state
        document.getElementById('loadingOverlay').classList.add('hidden');
        document.getElementById('submitBtn').disabled = false;
        
        // Show error message
        Swal.fire({
            icon: 'error',
            title: 'Submission Failed',
            text: error.message,
            confirmButtonColor: '#ef4444'
        });
    }
});

// Mesh status simulation
function updateMeshStatus() {
    const statuses = [
        { color: 'bg-green-500', text: 'Connected', class: 'mesh-status' },
        { color: 'bg-yellow-500', text: 'Searching', class: 'mesh-status' },
        { color: 'bg-red-500', text: 'Offline', class: '' }
    ];
    
    const status = statuses[0]; // Default to connected
    
    document.getElementById('meshStatus').className = `w-2.5 h-2.5 rounded-full ${status.color} ${status.class}`;
    document.getElementById('meshStatusText').textContent = status.text;
    document.getElementById('meshStatusSidebar').className = `w-2.5 h-2.5 rounded-full ${status.color} ${status.class}`;
}

// Check online/offline status
function updateOnlineStatus() {
    const offlineBanner = document.getElementById('offlineBanner');
    if (!navigator.onLine) {
        offlineBanner.classList.remove('hidden');
    } else {
        offlineBanner.classList.add('hidden');
    }
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

// Event listeners for logout
// document.getElementById('sidebarLogoutBtn').addEventListener('click', logout);

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    updateMeshStatus();
    updateOnlineStatus();
    loadUserData();
    setInterval(updateMeshStatus, 5000);
});

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);