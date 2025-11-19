// Function to load and display user profile in sidebar
function loadUserProfile() {
    // Get stored user data from localStorage
    const userDataStr = localStorage.getItem('userData');
    
    if (userDataStr) {
        try {
            const userData = JSON.parse(userDataStr);
            
            // Get the sidebar elements
            const userNameElement = document.querySelector('#sidebar .font-medium.text-gray-900');
            const userEmailElement = document.querySelector('#sidebar .text-xs.text-gray-500');
            
            // Update the user name
            if (userNameElement && userData.first_name) {
                const fullName = `${userData.first_name} ${userData.last_name || ''}`.trim();
                userNameElement.textContent = fullName;
            }
            
            // Update the user email
            if (userEmailElement && userData.email) {
                userEmailElement.textContent = userData.email;
            }
            
            console.log('User profile loaded successfully');
            
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    } else {
        console.log('No user data found in localStorage');
    }
}

// Load user profile when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
});