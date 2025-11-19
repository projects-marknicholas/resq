// Initialize AOS animations
AOS.init({
    duration: 800,
    once: true,
    offset: 100
});

// Mobile menu functionality
const mobileMenuButton = document.getElementById('mobileMenuButton');
const closeMobileMenuButton = document.getElementById('closeMobileMenu');
const mobileMenu = document.getElementById('mobileMenu');

function openMobileMenu() {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
}

mobileMenuButton.addEventListener('click', openMobileMenu);
closeMobileMenuButton.addEventListener('click', closeMobileMenu);

const mobileMenuLinks = mobileMenu.querySelectorAll('a');
mobileMenuLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

// Initialize hero map
const heroMap = L.map('heroMap').setView([14.2691, 121.4113], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(heroMap);

const sampleLocations = [
    { lat: 14.2691, lng: 121.4113, name: 'Calamba City', type: 'safe' },
    { lat: 14.1091, lng: 121.1619, name: 'San Pablo City', type: 'warning' },
    { lat: 14.4167, lng: 121.4333, name: 'Biñan City', type: 'safe' },
    { lat: 14.3500, lng: 121.4667, name: 'Santa Rosa City', type: 'alert' }
];

sampleLocations.forEach(loc => {
    const color = loc.type === 'safe' ? '#2563eb' : loc.type === 'warning' ? '#f59e0b' : '#dc2626';
    L.circleMarker([loc.lat, loc.lng], {
    radius: 8,
    fillColor: color,
    color: '#fff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
    }).addTo(heroMap).bindPopup(`<b>${loc.name}</b><br>Status: ${loc.type}`);
});

// Modal handlers
function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
    document.body.style.overflow = '';
}

function showRegisterModal() {
    closeLoginModal();
    document.getElementById('registerModal').classList.remove('hidden');
}

function closeRegisterModal() {
    document.getElementById('registerModal').classList.add('hidden');
    document.body.style.overflow = '';
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const roleElement = document.querySelector('input[name="userRole"]:checked');
    const role = roleElement ? roleElement.value : 'user';
    const loginButton = document.getElementById('loginButton');

    // Update button to show loading state
    const buttonText = document.getElementById('buttonText');
    const buttonSpinner = document.getElementById('buttonSpinner');
    
    buttonText.textContent = 'Signing In...';
    buttonSpinner.classList.remove('hidden');
    loginButton.disabled = true;

    try {
        const res = await fetch('http://localhost/resq/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('userRole', role);
            localStorage.setItem('csrf_token', data.user.csrf_token);

            Swal.fire({
                icon: 'success',
                title: 'Login Successful',
                text: data.message || 'Redirecting...',
                timer: 1500,
                showConfirmButton: false
            });

            setTimeout(() => redirectToDashboard(role), 1500);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: data.error || 'Invalid credentials'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'Login failed. Please try again.'
        });
    } finally {
        buttonText.textContent = 'Sign In';
        buttonSpinner.classList.add('hidden');
        loginButton.disabled = false;
    }
});

// Register form handler
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value.trim();
    const middleName = document.getElementById('middleName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const roleElement = document.querySelector('input[name="regUserRole"]:checked');
    const role = roleElement ? roleElement.value : 'user';
    const registerButton = document.getElementById('registerButton');

    if (!validateRegistrationForm(firstName, lastName, email, password, confirmPassword)) return;

    // Update button to show loading state
    const registerButtonText = document.getElementById('registerButtonText');
    const registerButtonSpinner = document.getElementById('registerButtonSpinner');
    
    registerButtonText.textContent = 'Creating Account...';
    registerButtonSpinner.classList.remove('hidden');
    registerButton.disabled = true;

    try {
        const res = await fetch('http://localhost/resq/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,
                middle_name: middleName,
                last_name: lastName,
                email,
                password,
                role
            })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem('userData', JSON.stringify(data.user));
            localStorage.setItem('userRole', role);
            localStorage.setItem('csrf_token', data.user.csrf_token);

            Swal.fire({
                icon: 'success',
                title: 'Registration Successful',
                text: data.message || 'Redirecting...',
                timer: 1500,
                showConfirmButton: false
            });

            closeRegisterModal();
            showLoginModal();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: data.error || 'Something went wrong'
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Server Error',
            text: 'Registration failed. Please try again.'
        });
    } finally {
        registerButtonText.textContent = 'Create Account';
        registerButtonSpinner.classList.add('hidden');
        registerButton.disabled = false;
    }
});

// Validation
function validateRegistrationForm(firstName, lastName, email, password, confirmPassword) {
    if (!firstName) return showSwalError('First name is required'), false;
    if (!lastName) return showSwalError('Last name is required'), false;
    if (!email) return showSwalError('Email is required'), false;
    if (!isValidEmail(email)) return showSwalError('Enter a valid email'), false;
    if (!password || password.length < 8) return showSwalError('Password must be at least 8 characters'), false;
    if (password !== confirmPassword) return showSwalError('Passwords do not match'), false;
    return true;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showSwalError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Invalid Input',
        text: message
    });
}

// Redirect function
function redirectToDashboard(role) {
    const dashboards = {
        'user': '/user/home.html',
        'barangay': '/barangay/dashboard.html',
        'dispatcher': '/dispatcher/dashboard.html',
        'agency': '/agency/dashboard.html',
        'admin': '/admin/dashboard.html'
    };
    window.location.href = dashboards[role] || '/user/home.html';
}

// Close modal on outside click or Escape
document.getElementById('loginModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLoginModal();
});
document.getElementById('registerModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeRegisterModal();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeLoginModal();
        closeRegisterModal();
        closeMobileMenu();
    }
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});