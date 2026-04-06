// PWA Installation
let deferredPrompt;
const installBanner = document.createElement('div');
installBanner.className = 'install-banner';
installBanner.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
            <strong>Install Winners Chapel App</strong>
            <p style="margin: 0; font-size: 0.9rem;">Install for easy access</p>
        </div>
        <button id="installBtn" style="background: #4F46E5; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer;">Install</button>
        <button id="closeBanner" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
    </div>
`;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show the custom install banner
    if (installBanner) {
        document.body.appendChild(installBanner);
        installBanner.style.display = 'block';
    }
    console.log('Install banner is ready to show');
});

// Handle install button click
document.addEventListener('click', (e) => {
    if (e.target.id === 'installBtn') {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    installBanner.style.display = 'none';
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
            });
        }
    }
    
    if (e.target.id === 'closeBanner') {
        installBanner.style.display = 'none';
    }
});

// Handle app installed event
window.addEventListener('appinstalled', () => {
    console.log('App was installed successfully');
    if (installBanner) {
        installBanner.style.display = 'none';
    }
    deferredPrompt = null;
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registered: ', registration);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Check if already installed
window.addEventListener('load', () => {
    // Check if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is running as installed PWA');
    }
});