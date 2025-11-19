// API Configuration
const API_BASE_URL = 'http://localhost/resq';
let map;
let incidents = [];

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

// Fetch dashboard statistics
async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/dashboard`, {
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
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
}

// Fetch incidents from API
async function fetchIncidents() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/incidents`, {
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

// Get color based on incident status
function getStatusColor(status) {
    const colors = {
        'pending': '#f59e0b', // yellow-500
        'ongoing': '#3b82f6', // blue-500
        'resolved': '#10b981' // green-500
    };
    return colors[status] || colors['pending'];
}

// Get incident type icon
function getIncidentTypeIcon(type) {
    const icons = {
        'flood': 'fa-water',
        'fire': 'fa-fire',
        'medical': 'fa-heartbeat',
        'accident': 'fa-car-crash',
        'crime': 'fa-shield-alt',
        'landslide': 'fa-mountain',
        'power': 'fa-bolt',
        'other': 'fa-exclamation-triangle'
    };
    return icons[type] || icons['other'];
}

// Update dashboard stats in the UI
function updateDashboardStats(stats) {
    document.getElementById('statsReportsSubmitted').textContent = stats.reports_submitted || 0;
    document.getElementById('statsResolved').textContent = stats.resolved || 0;
    document.getElementById('statsPending').textContent = stats.pending || 0;
    document.getElementById('statsTotalIncidents').textContent = stats.total_incidents || 0;
}

// Create custom pin markers
function createPinMarker(lat, lng, color, icon) {
    // Create a custom icon with pin shape
    const pinIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
            <div style="
                position: relative;
                width: 24px;
                height: 32px;
                transform: translate(-12px, -32px);
            ">
                <!-- Pin body -->
                <div style="
                    position: absolute;
                    width: 24px;
                    height: 24px;
                    background: ${color};
                    border: 2px solid white;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="fas ${icon}" style="
                        color: white;
                        font-size: 10px;
                        transform: rotate(45deg);
                    "></i>
                </div>
                <!-- Pin point -->
                <div style="
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 4px;
                    height: 8px;
                    background: ${color};
                    border-radius: 0 0 2px 2px;
                "></div>
            </div>
        `,
        iconSize: [24, 32],
        iconAnchor: [12, 32]
    });

    return L.marker([lat, lng], { icon: pinIcon });
}

// Initialize map with pin markers
async function initializeMap() {
    // Initialize map
    map = L.map('map').setView([14.2769, 121.4164], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    try {
        // Fetch dashboard stats
        const statsResponse = await fetchDashboardStats();
        if (statsResponse.success) {
            updateDashboardStats(statsResponse.data);
        }

        // Fetch incidents from API
        const data = await fetchIncidents();
        console.log(data);
        
        if (data.success) {
            incidents = data.data;
            
            // Update incident counts
            updateIncidentCounts(incidents);
            
            // Add incident pin markers to map
            incidents.forEach(incident => {
                const lat = parseFloat(incident.latitude);
                const lng = parseFloat(incident.longitude);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                    const color = getStatusColor(incident.status);
                    const icon = getIncidentTypeIcon(incident.incident_type);
                    
                    const marker = createPinMarker(lat, lng, color, icon).addTo(map);
                    
                    marker.bindPopup(`
                        <div class="p-2 min-w-[200px]">
                            <div class="flex items-center gap-2 mb-2">
                                <i class="fas ${icon} text-gray-600"></i>
                                <strong class="text-sm capitalize">${incident.incident_type}</strong>
                            </div>
                            <p class="text-xs text-gray-600 mb-1">${incident.description}</p>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="px-2 py-1 text-xs rounded-full text-white" style="background-color: ${color}">
                                    ${incident.status.toUpperCase()}
                                </span>
                                <span class="text-xs text-gray-500 capitalize">${incident.severity_level} severity</span>
                            </div>
                            <p class="text-xs text-gray-500">${incident.baranggay?.baranggay_name || incident.baranggay?.baranggay || 'Unknown location'}</p>
                            <p class="text-xs text-gray-400 mt-1">${new Date(incident.created_at).toLocaleString()}</p>
                        </div>
                    `);
                }
            });

            // Adjust map view to show all markers if there are incidents
            if (incidents.length > 0) {
                const group = new L.featureGroup(incidents.map(incident => {
                    const lat = parseFloat(incident.latitude);
                    const lng = parseFloat(incident.longitude);
                    return !isNaN(lat) && !isNaN(lng) ? L.marker([lat, lng]) : null;
                }).filter(Boolean));
                
                if (group.getLayers().length > 0) {
                    map.fitBounds(group.getBounds().pad(0.1));
                }
            }
        }
    } catch (error) {
        console.error('Error loading incidents:', error);
        // Fallback to demo incidents if API fails
        loadDemoIncidents();
        loadDemoStats();
    }
}

// Update incident counts in the UI
function updateIncidentCounts(incidents) {
    const pendingCount = incidents.filter(inc => inc.status === 'pending').length;
    const ongoingCount = incidents.filter(inc => inc.status === 'ongoing').length;
    const resolvedCount = incidents.filter(inc => inc.status === 'resolved').length;

    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('ongoingCount').textContent = ongoingCount;
    document.getElementById('resolvedCount').textContent = resolvedCount;
}

// Load demo incidents if API fails
function loadDemoIncidents() {
    const demoIncidents = [
        { 
            latitude: 14.2769, 
            longitude: 121.4164, 
            incident_type: 'flood', 
            status: 'ongoing',
            severity_level: 'high',
            description: 'Flooding in low-lying areas',
            baranggay: { baranggay: 'San Pablo' },
            created_at: new Date().toISOString()
        },
        { 
            latitude: 14.2850, 
            longitude: 121.4250, 
            incident_type: 'fire', 
            status: 'pending',
            severity_level: 'critical',
            description: 'House fire reported',
            baranggay: { baranggay: 'Santa Cruz' },
            created_at: new Date().toISOString()
        },
        { 
            latitude: 14.2700, 
            longitude: 121.4100, 
            incident_type: 'medical', 
            status: 'resolved',
            severity_level: 'medium',
            description: 'Medical emergency response',
            baranggay: { baranggay: 'Calamba' },
            created_at: new Date().toISOString()
        }
    ];

    demoIncidents.forEach(incident => {
        const color = getStatusColor(incident.status);
        const icon = getIncidentTypeIcon(incident.incident_type);
        
        const marker = createPinMarker(incident.latitude, incident.longitude, color, icon).addTo(map);
        
        marker.bindPopup(`
            <div class="p-2 min-w-[200px]">
                <div class="flex items-center gap-2 mb-2">
                    <i class="fas ${icon} text-gray-600"></i>
                    <strong class="text-sm capitalize">${incident.incident_type}</strong>
                </div>
                <p class="text-xs text-gray-600 mb-1">${incident.description}</p>
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-1 text-xs rounded-full text-white" style="background-color: ${color}">
                        ${incident.status.toUpperCase()}
                    </span>
                    <span class="text-xs text-gray-500 capitalize">${incident.severity_level} severity</span>
                </div>
                <p class="text-xs text-gray-500">${incident.baranggay.baranggay}</p>
                <p class="text-xs text-gray-400 mt-1">${new Date(incident.created_at).toLocaleString()}</p>
            </div>
        `);
    });

    updateIncidentCounts(demoIncidents);
}

// Load demo stats if API fails
function loadDemoStats() {
    const demoStats = {
        total_incidents: 15,
        reports_submitted: 8,
        resolved: 6,
        pending: 2
    };
    updateDashboardStats(demoStats);
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

// Simulate mesh network status
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

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Initialize
initializeMap();
updateMeshStatus();
updateOnlineStatus();

// Update mesh status every 5 seconds
setInterval(updateMeshStatus, 5000);

// Notification button handler
document.getElementById('notificationBtn').addEventListener('click', function() {
    window.location.href = 'alerts.html';
});

// Add some CSS for the pin markers
const style = document.createElement('style');
style.textContent = `
    .custom-pin-marker {
        background: transparent !important;
        border: none !important;
    }
    
    .custom-pin-marker:hover {
        transform: scale(1.1);
        transition: transform 0.2s ease;
    }
    
    .leaflet-popup-content {
        margin: 8px 12px !important;
    }
    
    .leaflet-popup-content-wrapper {
        border-radius: 8px !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    }
`;
document.head.appendChild(style);