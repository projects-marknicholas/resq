// API Configuration
const API_BASE_URL = 'http://localhost/resq';
let userData = null;
let currentPage = 1;
let hasMorePages = true;
let allIncidents = [];
let filteredIncidents = [];
let currentImages = [];
let currentImageIndex = 0;
let incidentMap = null;
let incidentMarker = null;

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

// Fetch incidents from API
async function fetchIncidents(page = 1, limit = 10) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/incident?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching incidents:', error);
        throw error;
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get incident type icon and color
function getIncidentTypeInfo(type) {
    const types = {
        'flood': { 
            icon: 'fa-water', 
            color: 'blue', 
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            text: 'Flood'
        },
        'fire': { 
            icon: 'fa-fire', 
            color: 'red', 
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            text: 'Fire'
        },
        'medical': { 
            icon: 'fa-heartbeat', 
            color: 'green', 
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            text: 'Medical Emergency'
        },
        'accident': { 
            icon: 'fa-car-crash', 
            color: 'yellow', 
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            text: 'Accident'
        },
        'crime': { 
            icon: 'fa-shield-alt', 
            color: 'purple', 
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-800',
            borderColor: 'border-purple-200',
            text: 'Crime'
        },
        'landslide': { 
            icon: 'fa-mountain', 
            color: 'orange', 
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-800',
            borderColor: 'border-orange-200',
            text: 'Landslide'
        },
        'power': { 
            icon: 'fa-bolt', 
            color: 'gray', 
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800',
            borderColor: 'border-gray-200',
            text: 'Power Outage'
        },
        'other': { 
            icon: 'fa-ellipsis-h', 
            color: 'gray', 
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-800',
            borderColor: 'border-gray-200',
            text: 'Other Incident'
        }
    };
    
    return types[type] || types['other'];
}

// Get status info - FIXED: Use actual status from backend
function getStatusInfo(status) {
    const statuses = {
        'pending': { 
            text: 'PENDING', 
            color: 'blue', 
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            borderColor: 'border-blue-200',
            icon: 'fa-clock'
        },
        'ongoing': { 
            text: 'ONGOING', 
            color: 'yellow', 
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            icon: 'fa-spinner'
        },
        'resolved': { 
            text: 'RESOLVED', 
            color: 'green', 
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: 'fa-check-circle'
        }
    };
    
    return statuses[status] || statuses['pending'];
}

// Get severity info
function getSeverityInfo(severity) {
    const severities = {
        'low': { 
            text: 'Low Severity', 
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            borderColor: 'border-green-200',
            icon: 'fa-arrow-down'
        },
        'medium': { 
            text: 'Medium Severity', 
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            borderColor: 'border-yellow-200',
            icon: 'fa-minus'
        },
        'high': { 
            text: 'High Severity', 
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            borderColor: 'border-red-200',
            icon: 'fa-arrow-up'
        }
    };
    
    return severities[severity] || severities['medium'];
}

// FIXED: Use actual status from backend instead of calculating
function getIncidentStatus(incident) {
    // Use the status from the backend if available
    // If not, fall back to the calculation
    return incident.status || calculateStatus(incident);
}

// Keep the calculation as fallback
function calculateStatus(incident) {
    const daysAgo = Math.floor((new Date() - new Date(incident.created_at)) / (1000 * 60 * 60 * 24));
    
    if (daysAgo < 1) return 'pending';
    if (daysAgo < 3) return 'ongoing';
    return 'resolved';
}

// Create status progress bar
function createStatusProgress(status) {
    const steps = [
        { id: 'pending', label: 'Pending', icon: 'fa-clock' },
        { id: 'ongoing', label: 'Ongoing', icon: 'fa-spinner' },
        { id: 'resolved', label: 'Resolved', icon: 'fa-check-circle' }
    ];

    let html = '';
    steps.forEach((step, index) => {
        let stepClass = '';
        if (step.id === status) {
            stepClass = 'active';
        } else if (
            (status === 'ongoing' && step.id === 'pending') ||
            (status === 'resolved' && (step.id === 'pending' || step.id === 'ongoing'))
        ) {
            stepClass = 'completed';
        }

        html += `
            <div class="status-step ${stepClass}">
                <div class="status-dot">
                    <i class="fas ${step.icon}"></i>
                </div>
                <span class="status-label">${step.label}</span>
            </div>
        `;
    });

    return html;
}

// Check if photo exists and is valid
function hasValidPhoto(photo) {
    return photo && photo.trim() !== '' && photo !== 'null' && photo !== 'undefined';
}

// Safe number conversion for coordinates
function safeToFixed(value, decimals = 6) {
    if (value === null || value === undefined) return 'N/A';
    const num = parseFloat(value);
    return isNaN(num) ? 'N/A' : num.toFixed(decimals);
}

// Initialize map for incident location
function initIncidentMap(lat, lng) {
    const mapContainer = document.getElementById('incidentMap');
    if (!mapContainer) return;
    
    // Clear existing map
    if (incidentMap) {
        incidentMap.remove();
    }
    
    try {
        // Initialize new map
        incidentMap = L.map('incidentMap').setView([lat, lng], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(incidentMap);
        
        // Add marker
        if (incidentMarker) {
            incidentMap.removeLayer(incidentMarker);
        }
        
        incidentMarker = L.marker([lat, lng])
            .addTo(incidentMap)
            .bindPopup('Incident Location')
            .openPopup();
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Render incidents
function renderIncidents(incidents) {
    const container = document.getElementById('reportsContainer');
    if (!container) return;
    
    if (incidents.length === 0) {
        document.getElementById('emptyState').classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    document.getElementById('emptyState').classList.add('hidden');
    
    // Group incidents by month
    const incidentsByMonth = {};
    incidents.forEach(incident => {
        const date = new Date(incident.created_at);
        const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!incidentsByMonth[monthYear]) {
            incidentsByMonth[monthYear] = [];
        }
        incidentsByMonth[monthYear].push(incident);
    });

    let html = '';
    
    Object.keys(incidentsByMonth).forEach(monthYear => {
        html += `
            <div class="flex items-center gap-3 mb-2">
                <div class="w-3 h-3 bg-blue-600 rounded-full"></div>
                <h3 class="font-semibold text-gray-900">${monthYear}</h3>
            </div>
        `;
        
        incidentsByMonth[monthYear].forEach(incident => {
            const typeInfo = getIncidentTypeInfo(incident.incident_type);
            const status = getIncidentStatus(incident.status);
            const statusInfo = getStatusInfo(incident.status);
            const severityInfo = getSeverityInfo(incident.severity_level);
            const hasPhoto = hasValidPhoto(incident.photo);
            
            html += `
                <div class="report-card bg-white rounded-lg shadow-sm overflow-hidden border-l-4 ${statusInfo.borderColor}" data-status="${status}" data-search="${incident.description.toLowerCase()} ${incident.incident_type.toLowerCase()}">
                    <div class="p-4">
                        <div class="flex items-start justify-between mb-3">
                            <div class="min-w-0 flex-1">
                                <div class="flex flex-wrap items-center gap-2 mb-1">
                                    <span class="text-sm font-semibold text-gray-900 truncate">#${incident.incident_id.substring(0, 8)}</span>
                                    <span class="status-badge ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border">
                                        <i class="fas ${statusInfo.icon}"></i>
                                        ${statusInfo.text}
                                    </span>
                                    <span class="severity-badge ${severityInfo.bgColor} ${severityInfo.textColor} ${severityInfo.borderColor} border">
                                        <i class="fas ${severityInfo.icon}"></i>
                                        ${severityInfo.text}
                                    </span>
                                </div>
                                <p class="text-xs text-gray-500">${formatDate(incident.created_at)}</p>
                            </div>
                            <button class="text-blue-600 hover:text-blue-700 flex-shrink-0 ml-2">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        
                        <div class="flex items-start gap-3 mb-3">
                            <div class="w-10 h-10 ${typeInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas ${typeInfo.icon} ${typeInfo.textColor}"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <h3 class="font-semibold text-gray-900 mb-1 truncate">${typeInfo.text} - ${incident.baranggay?.baranggay_name || 'Unknown Location'}</h3>
                                <p class="text-sm text-gray-600 mb-2 line-clamp-2">${incident.description}</p>
                                
                                ${hasPhoto ? `
                                    <div class="mb-2">
                                        <div class="image-gallery">
                                            <div class="image-item" onclick="previewImage('${incident.photo}', ['${incident.photo}'])">
                                                <img src="${incident.photo}" alt="Incident photo" class="rounded" onerror="this.style.display='none'">
                                            </div>
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <div class="flex flex-wrap gap-3 text-xs text-gray-500">
                                    <span class="flex items-center gap-1 truncate">
                                        <i class="fas fa-map-marker-alt flex-shrink-0"></i>
                                        ${incident.baranggay?.baranggay_name || 'Unknown Location'}
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <i class="fas fa-exclamation-triangle flex-shrink-0"></i>
                                        ${incident.severity_level.toUpperCase()} severity
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex gap-2">
                            ${status === 'resolved' ? `
                                <button class="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                    <i class="fas fa-star mr-1"></i>Rate Response
                                </button>
                            ` : ''}
                            <button class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors view-details" data-incident-id="${incident.incident_id}">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    });

    container.innerHTML = html;
    
    // Add event listeners to view details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const incidentId = this.dataset.incidentId;
            showIncidentModal(incidentId);
        });
    });
}

// Show incident details modal
function showIncidentModal(incidentId) {
    const incident = allIncidents.find(inc => inc.incident_id === incidentId);
    if (!incident) {
        console.error('Incident not found:', incidentId);
        return;
    }

    const typeInfo = getIncidentTypeInfo(incident.incident_type);
    const status = getIncidentStatus(incident); // FIXED: Use actual status
    const statusInfo = getStatusInfo(status);
    const severityInfo = getSeverityInfo(incident.severity_level);
    const hasPhoto = hasValidPhoto(incident.photo);
    const lat = parseFloat(incident.latitude);
    const lng = parseFloat(incident.longitude);

    // Update status progress bar
    const statusProgress = document.getElementById('statusProgress');
    if (statusProgress) {
        statusProgress.innerHTML = createStatusProgress(status);
    }

    // Update modal header with type icon
    const typeIcon = document.getElementById('modalTypeIcon');
    if (typeIcon) {
        typeIcon.className = `w-12 h-12 ${typeInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`;
        typeIcon.innerHTML = `<i class="fas ${typeInfo.icon} ${typeInfo.textColor} text-xl"></i>`;
    }

    // Update modal content
    const updateElement = (id, content) => {
        const element = document.getElementById(id);
        if (element) element.textContent = content;
    };

    const updateHTML = (id, content) => {
        const element = document.getElementById(id);
        if (element) element.innerHTML = content;
    };

    updateElement('modalType', typeInfo.text);
    updateElement('modalIncidentId', incident.incident_id);
    updateHTML('modalSeverity', `<span class="severity-badge ${severityInfo.bgColor} ${severityInfo.textColor} ${severityInfo.borderColor} border"><i class="fas ${severityInfo.icon}"></i> ${severityInfo.text}</span>`);
    updateHTML('modalStatus', `<span class="status-badge ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border"><i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}</span>`);
    updateElement('modalLocation', incident.baranggay?.baranggay_name || 'Unknown Location');
    updateElement('modalCoordinates', `${safeToFixed(incident.latitude)}, ${safeToFixed(incident.longitude)}`);
    updateElement('modalSubmitted', formatDate(incident.created_at));
    updateElement('modalUpdated', formatDate(incident.updated_at));
    updateElement('modalDescription', incident.description);

    // Initialize map if coordinates are valid
    if (!isNaN(lat) && !isNaN(lng)) {
        setTimeout(() => {
            initIncidentMap(lat, lng);
        }, 100);
        
        // Set up open in maps button
        const openInMapsBtn = document.getElementById('openInMaps');
        if (openInMapsBtn) {
            openInMapsBtn.onclick = () => {
                window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`, '_blank');
            };
        }
    }

    // Handle photos
    const imageSection = document.getElementById('modalImageSection');
    const imageGallery = document.getElementById('modalImageGallery');
    
    if (hasPhoto && imageSection && imageGallery) {
        imageSection.classList.remove('hidden');
        imageGallery.innerHTML = `
            <div class="image-item" onclick="previewImage('${incident.photo}', ['${incident.photo}'])">
                <img src="${incident.photo}" alt="Incident photo" class="rounded" onerror="this.style.display='none'">
            </div>
        `;
    } else if (imageSection) {
        imageSection.classList.add('hidden');
    }

    // Show response info for resolved incidents
    const responseInfo = document.getElementById('modalResponseInfo');
    if (responseInfo) {
        if (status === 'resolved') {
            responseInfo.classList.remove('hidden');
            const responseDetails = document.getElementById('modalResponseDetails');
            if (responseDetails) {
                responseDetails.textContent = 'This incident has been successfully resolved by our emergency response team.';
            }
        } else {
            responseInfo.classList.add('hidden');
        }
    }

    // Show modal
    const modal = document.getElementById('incidentModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Scroll to top of modal content
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.scrollTop = 0;
        }
    }
}

// Update statistics
function updateStatistics(incidents) {
    const total = incidents.length;
    const resolved = incidents.filter(inc => getIncidentStatus(inc) === 'resolved').length;
    const ongoing = incidents.filter(inc => getIncidentStatus(inc) === 'ongoing').length;
    const pending = incidents.filter(inc => getIncidentStatus(inc) === 'pending').length;

    const updateStat = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    updateStat('totalReports', total);
    updateStat('resolvedReports', resolved);
    updateStat('ongoingReports', ongoing);
    updateStat('pendingReports', pending);
}

// Filter incidents
function filterIncidents(filter = 'all', searchTerm = '') {
    let filtered = allIncidents;

    // Apply status filter
    if (filter !== 'all') {
        filtered = filtered.filter(incident => getIncidentStatus(incident) === filter);
    }

    // Apply search filter
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(incident => 
            incident.description.toLowerCase().includes(term) ||
            incident.incident_type.toLowerCase().includes(term) ||
            (incident.baranggay?.baranggay_name.toLowerCase() || '').includes(term)
        );
    }

    filteredIncidents = filtered;
    renderIncidents(filtered);
    updateStatistics(filtered);
}

// Initialize and load data
async function initializePage() {
    try {
        showLoading();
        loadUserData();
        
        const data = await fetchIncidents(currentPage);
        
        if (data.success) {
            allIncidents = data.data;
            hasMorePages = data.pagination.has_next;
            
            // Show load more button if there are more pages
            const loadMoreContainer = document.getElementById('loadMoreContainer');
            if (loadMoreContainer) {
                if (hasMorePages) {
                    loadMoreContainer.classList.remove('hidden');
                } else {
                    loadMoreContainer.classList.add('hidden');
                }
            }
            
            filterIncidents('all', '');
            showContent();
        } else {
            throw new Error(data.error || 'Failed to load reports');
        }
    } catch (error) {
        console.error('Error initializing page:', error);
        showError(error.message);
    }
}

// Show loading state
function showLoading() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const contentState = document.getElementById('contentState');
    
    if (loadingState) loadingState.classList.remove('hidden');
    if (errorState) errorState.classList.add('hidden');
    if (contentState) contentState.classList.add('hidden');
}

// Show content
function showContent() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const contentState = document.getElementById('contentState');
    
    if (loadingState) loadingState.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');
    if (contentState) contentState.classList.remove('hidden');
}

// Show error state
function showError(message) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const contentState = document.getElementById('contentState');
    const errorMessage = document.getElementById('errorMessage');
    
    if (loadingState) loadingState.classList.add('hidden');
    if (errorState) errorState.classList.remove('hidden');
    if (contentState) contentState.classList.add('hidden');
    if (errorMessage) errorMessage.textContent = message;
}

// Sidebar functionality
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const closeSidebar = document.getElementById('closeSidebar');

function openSidebar() {
    if (sidebar) sidebar.classList.remove('-translate-x-full');
}

function closeSidebarFunc() {
    if (sidebar) sidebar.classList.add('-translate-x-full');
}

if (menuToggle) menuToggle.addEventListener('click', openSidebar);
if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', openSidebar);
if (closeSidebar) closeSidebar.addEventListener('click', closeSidebarFunc);

// Close sidebar when clicking outside
document.addEventListener('click', (event) => {
    if (!sidebar) return;
    
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isClickOnMenuToggle = (menuToggle && menuToggle.contains(event.target)) || (mobileMenuToggle && mobileMenuToggle.contains(event.target));
    
    if (!isClickInsideSidebar && !isClickOnMenuToggle && !sidebar.classList.contains('-translate-x-full')) {
        closeSidebarFunc();
    }
});

// Modal functionality
const incidentModal = document.getElementById('incidentModal');
const closeModal = document.getElementById('closeModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');

function closeIncidentModal() {
    if (incidentModal) incidentModal.classList.add('hidden');
    // Clean up map
    if (incidentMap) {
        incidentMap.remove();
        incidentMap = null;
        incidentMarker = null;
    }
}

if (closeModal) closeModal.addEventListener('click', closeIncidentModal);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeIncidentModal);

// Close modal when clicking outside
if (incidentModal) {
    incidentModal.addEventListener('click', (event) => {
        if (event.target === incidentModal) {
            closeIncidentModal();
        }
    });
}

// Image preview functionality
const imagePreviewModal = document.getElementById('imagePreviewModal');
const closeImagePreviewBtn = document.getElementById('closeImagePreview');
const prevImageBtn = document.getElementById('prevImage');
const nextImageBtn = document.getElementById('nextImage');

if (closeImagePreviewBtn) closeImagePreviewBtn.addEventListener('click', closeImagePreview);
if (prevImageBtn) prevImageBtn.addEventListener('click', () => navigateImage(-1));
if (nextImageBtn) nextImageBtn.addEventListener('click', () => navigateImage(1));

// Close image preview when clicking outside
if (imagePreviewModal) {
    imagePreviewModal.addEventListener('click', (event) => {
        if (event.target === imagePreviewModal) {
            closeImagePreview();
        }
    });
}

// Close image preview with Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeImagePreview();
        closeIncidentModal();
    }
});

// Filter functionality
document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', function() {
        // Update active filter
        document.querySelectorAll('.filter-chip').forEach(c => {
            c.classList.remove('active', 'bg-blue-600', 'text-white');
            c.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
        });
        this.classList.add('active', 'bg-blue-600', 'text-white');
        this.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');

        const filter = this.dataset.filter;
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value : '';
        filterIncidents(filter, searchTerm);
    });
});

// Search functionality
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value;
        const activeFilter = document.querySelector('.filter-chip.active');
        const currentFilter = activeFilter ? activeFilter.dataset.filter : 'all';
        filterIncidents(currentFilter, searchTerm);
    });
}

// Load more functionality
const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreIncidents);
}

async function loadMoreIncidents() {
    if (!hasMorePages) return;

    currentPage++;
    try {
        const data = await fetchIncidents(currentPage);
        
        if (data.success) {
            allIncidents = [...allIncidents, ...data.data];
            hasMorePages = data.pagination.has_next;
            
            // Re-apply current filters
            const activeFilter = document.querySelector('.filter-chip.active');
            const currentFilter = activeFilter ? activeFilter.dataset.filter : 'all';
            const searchInput = document.getElementById('searchInput');
            const currentSearch = searchInput ? searchInput.value : '';
            filterIncidents(currentFilter, currentSearch);
            
            // Hide load more button if no more pages
            const loadMoreContainer = document.getElementById('loadMoreContainer');
            if (loadMoreContainer && !hasMorePages) {
                loadMoreContainer.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error loading more incidents:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load more reports',
            confirmButtonColor: '#ef4444'
        });
    }
}

// Retry functionality
const retryButton = document.getElementById('retryButton');
if (retryButton) {
    retryButton.addEventListener('click', initializePage);
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
const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', logout);
}

// Mesh status simulation
function updateMeshStatus() {
    const statuses = [
        { color: 'bg-green-500', text: 'Connected', class: 'mesh-status' },
        { color: 'bg-yellow-500', text: 'Searching', class: 'mesh-status' },
        { color: 'bg-red-500', text: 'Offline', class: '' }
    ];
    
    const status = statuses[0]; // Default to connected
    
    const meshStatus = document.getElementById('meshStatus');
    const meshStatusText = document.getElementById('meshStatusText');
    const meshStatusSidebar = document.getElementById('meshStatusSidebar');
    
    if (meshStatus) meshStatus.className = `w-2.5 h-2.5 rounded-full ${status.color} ${status.class}`;
    if (meshStatusText) meshStatusText.textContent = status.text;
    if (meshStatusSidebar) meshStatusSidebar.className = `w-2.5 h-2.5 rounded-full ${status.color} ${status.class}`;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    updateMeshStatus();
    setInterval(updateMeshStatus, 5000);
});

// Make functions global for onclick handlers
window.previewImage = previewImage;
window.closeImagePreview = closeImagePreview;
window.navigateImage = navigateImage;

// Preview image in full screen
function previewImage(imageSrc, images = []) {
    currentImages = images;
    currentImageIndex = images.indexOf(imageSrc);
    
    const previewModal = document.getElementById('imagePreviewModal');
    const previewImage = document.getElementById('previewImage');
    
    if (previewImage) previewImage.src = imageSrc;
    if (previewModal) previewModal.classList.remove('hidden');
    
    // Update navigation buttons visibility
    const prevImage = document.getElementById('prevImage');
    const nextImage = document.getElementById('nextImage');
    if (prevImage) prevImage.style.display = images.length > 1 ? 'flex' : 'none';
    if (nextImage) nextImage.style.display = images.length > 1 ? 'flex' : 'none';
}

// Navigate through images
function navigateImage(direction) {
    if (currentImages.length <= 1) return;
    
    currentImageIndex += direction;
    if (currentImageIndex < 0) currentImageIndex = currentImages.length - 1;
    if (currentImageIndex >= currentImages.length) currentImageIndex = 0;
    
    const previewImage = document.getElementById('previewImage');
    if (previewImage) previewImage.src = currentImages[currentImageIndex];
}

// Close image preview
function closeImagePreview() {
    const imagePreviewModal = document.getElementById('imagePreviewModal');
    if (imagePreviewModal) imagePreviewModal.classList.add('hidden');
    currentImages = [];
    currentImageIndex = 0;
}