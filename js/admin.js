/* js/admin.js */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Load Admin Name Dynamically
    loadAdminName();
    
    // 2. Staggered Entrance Animations for that premium feel
    const elements = document.querySelectorAll('.animate-element');
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('visible');
        }, index * 100); // 100ms delay between each element popping up
    });

    // 3. Admin Logout Logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Fade out the body for a smooth exit
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.4s ease';
            
            setTimeout(() => {
                // Clear admin session data
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userType');
                localStorage.removeItem('user');
                
                // Redirect straight to the index page
                window.location.href = 'admin-index.html';
            }, 400);
        });
    }

    // 4. Mobile Sidebar Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
});

// Function to load and display admin name
function loadAdminName() {
    const adminNameElements = document.querySelectorAll('#adminName');
    const savedAdminName = localStorage.getItem('adminName');
    
    if (savedAdminName) {
        // Update all admin name elements with saved name
        adminNameElements.forEach(element => {
            element.textContent = savedAdminName;
        });
    } else {
        // Set default name if not saved
        const defaultName = 'System Admin';
        adminNameElements.forEach(element => {
            element.textContent = defaultName;
        });
        localStorage.setItem('adminName', defaultName);
    }
}

// Function to update admin name (call this when admin changes name in settings)
function updateAdminName(newName) {
    if (!newName || newName.trim() === '') return;
    
    const trimmedName = newName.trim();
    localStorage.setItem('adminName', trimmedName);
    
    // Update all admin name elements across the current page
    const adminNameElements = document.querySelectorAll('#adminName');
    adminNameElements.forEach(element => {
        element.textContent = trimmedName;
    });
    
    // Also update the form field in settings if it exists
    const adminNameInput = document.querySelector('#adminNameInput');
    if (adminNameInput) {
        adminNameInput.value = trimmedName;
    }
}