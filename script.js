// Navigation background change on scroll
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navList = document.querySelector('.nav-list');

if(hamburger) {
    hamburger.addEventListener('click', () => {
        // Simple toggle for demo purpose. In a full solution, use a mobile-specific class/menu overlay.
        if (navList.style.display === 'flex') {
            navList.style.display = 'none';
        } else {
            navList.style.display = 'flex';
            navList.style.flexDirection = 'column';
            navList.style.position = 'absolute';
            navList.style.top = '100%';
            navList.style.left = '0';
            navList.style.width = '100%';
            navList.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            navList.style.padding = '20px';
            navList.style.boxShadow = '0 10px 10px rgba(0,0,0,0.1)';
            
            // Adjust text color for mobile menu
            const links = navList.querySelectorAll('a');
            links.forEach(link => {
                link.style.color = '#1a4331';
                link.style.padding = '10px 0';
                link.style.display = 'block';
            });
        }
    });
}

// Intersection Observer for Scroll Animations
const observeElements = document.querySelectorAll('.fade-up, .fade-in, .fade-left, .fade-right');

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15 // Trigger when 15% of the element is visible
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Unobserve after animating once
        }
    });
}, observerOptions);

observeElements.forEach(el => {
    observer.observe(el);
});
