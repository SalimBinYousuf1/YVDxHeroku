// Main JavaScript for TasVID

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.body.classList.toggle('mobile-menu-open');
        });
    }
    
    // Theme switcher (if on settings page)
    const themeOptions = document.querySelectorAll('input[name="theme"]');
    if (themeOptions.length > 0) {
        themeOptions.forEach(option => {
            option.addEventListener('change', function() {
                // Remove all theme classes
                document.body.classList.remove('cream-theme', 'dark-theme', 'neon-theme', 'dot-theme');
                // Add selected theme class
                document.body.classList.add(`${this.value}-theme`);
            });
        });
    }
});
