// Header Section JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const headerWrapper = document.querySelector('.header-wrapper');
    let lastScrollY = window.scrollY;
    let ticking = false;

    // Set dynamic body padding based on header height
    function setBodyPadding() {
        const headerHeight = headerWrapper.offsetHeight;
        document.body.style.paddingTop = headerHeight + 'px';
    }

    setBodyPadding();
    window.addEventListener('resize', setBodyPadding);

    // Header scroll behavior
    function updateHeader() {
        const currentScrollY = window.scrollY;

        // Add shadow when scrolled
        if (currentScrollY > 10) {
            headerWrapper.classList.add('scrolled');
        } else {
            headerWrapper.classList.remove('scrolled');
        }

        // Hide/show header based on scroll direction
        if (currentScrollY > 100) {
            if (currentScrollY > lastScrollY && currentScrollY > 300) {
                // Scrolling down & past 300px
                headerWrapper.classList.add('hide');
            } else if (currentScrollY < lastScrollY) {
                // Scrolling up
                headerWrapper.classList.remove('hide');
            }
        } else {
            // Always show when near top
            headerWrapper.classList.remove('hide');
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    });

    // Search functionality
    const searchToggle = document.querySelector('.header-search-toggle');
    const searchArea = document.querySelector('.header-search');
    const searchInput = document.querySelector('#header-search-input');

    if (searchToggle && searchArea) {
        searchToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            searchArea.setAttribute('aria-hidden', isExpanded);

            if (!isExpanded) {
                searchInput.focus();
            }
        });

        // Close search on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && searchArea.getAttribute('aria-hidden') === 'false') {
                searchToggle.setAttribute('aria-expanded', 'false');
                searchArea.setAttribute('aria-hidden', 'true');
                searchToggle.focus();
            }
        });
    }

    const dropdownToggles = document.querySelectorAll('.header-nav-dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            dropdownToggles.forEach(t => {
                t.setAttribute('aria-expanded', 'false');
            });

            this.setAttribute('aria-expanded', !isExpanded);
        });
    });

    const mobileMenuToggle = document.querySelector('.header-mobile-menu-toggle');
    const mobileMenuClose = document.querySelector('.mobile-navigation-close');
    const mobileNav = document.querySelector('.mobile-navigation');

    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            mobileNav.setAttribute('aria-hidden', isExpanded);
            document.body.classList.toggle('mobile-menu-open');
        });

        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', function() {
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileNav.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('mobile-menu-open');
            });
        }
    }

    const mobileSubmenuToggles = document.querySelectorAll('.mobile-submenu-toggle');
    mobileSubmenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            const submenu = this.nextElementSibling;

            this.setAttribute('aria-expanded', !isExpanded);
            if (submenu) {
                submenu.setAttribute('aria-hidden', isExpanded);
            }
        });
    });

    document.addEventListener('click', function(e) {
        // Close desktop dropdowns when clicking outside
        if (!e.target.closest('.header-nav-item')) {
            dropdownToggles.forEach(toggle => {
                toggle.setAttribute('aria-expanded', 'false');
            });
        }

        if (!e.target.closest('.header-search') && !e.target.closest('.header-search-toggle')) {
            if (searchToggle && searchArea) {
                searchToggle.setAttribute('aria-expanded', 'false');
                searchArea.setAttribute('aria-hidden', 'true');
            }
        }
    });
});