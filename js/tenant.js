/* js/tenant.js */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Load Tenant Name Dynamically
    loadTenantName();
    
    // 2. Staggered Entrance Animations
    const elements = document.querySelectorAll('.animate-element');
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('visible');
        }, index * 100); // 100ms delay between each element
    });

    // 3. Logout Logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Optional: Add a simple animation before leaving
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.4s ease';
            
            setTimeout(() => {
                // Clear any stored user data
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userType');
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                
                // Redirect to main index page
                window.location.href = 'index.html';
            }, 400);
        });
    }

    // 4. Mobile Sidebar Toggle (If viewing on smaller screens)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
});

// Function to load and display tenant name
async function loadTenantName() {
    const tenantNameElements = document.querySelectorAll('#tenantName');
    const tenantId = localStorage.getItem("tenantId");
    
    if (!tenantId) return;
    
    try {
        const res = await fetch(`/api/tenants/${tenantId}`);
        const tenant = res.ok ? await res.json() : null;
        
        if (tenant && tenant.name) {
            // Update all tenant name elements with tenant's name
            tenantNameElements.forEach(element => {
                element.textContent = tenant.name;
            });
        }
    } catch (error) {
        console.error('Error loading tenant name:', error);
    }

    // Set default if no tenant data
    tenantNameElements.forEach(element => {
        element.textContent = "Guest";
    });
}

// Function to load tenant data from server
async function loadTenantData() {
    const tenantId = localStorage.getItem("tenantId");
    if (!tenantId) return;
    
    try {
        const response = await fetch(`/api/tenants/${tenantId}`);
        if (response.ok) {
            const tenant = await response.json();
            localStorage.setItem("tenant", JSON.stringify(tenant));
            
            // Update all tenant name elements
            const tenantNameElements = document.querySelectorAll('#tenantName');
            tenantNameElements.forEach(element => {
                element.textContent = tenant.name || "Unknown Tenant";
            });
        }
    } catch (error) {
        console.error("Failed to load tenant data:", error);
    }
}

// Function to update tenant name (call this when tenant updates their profile)
function updateTenantName(newName) {
    if (!newName || newName.trim() === '') return;
    
    const trimmedName = newName.trim();
    
    // Update tenant data in localStorage
    const tenant = JSON.parse(localStorage.getItem("tenant")) || {};
    tenant.name = trimmedName;
    localStorage.setItem("tenant", JSON.stringify(tenant));
    
    // Update all tenant name elements across the current page
    const tenantNameElements = document.querySelectorAll('#tenantName');
    tenantNameElements.forEach(element => {
        element.textContent = trimmedName;
    });
    
    // Also update welcome message in dashboard if it exists
    const welcomeNameElement = document.querySelector('#tenantName');
    if (welcomeNameElement) {
        welcomeNameElement.textContent = trimmedName;
    }
}