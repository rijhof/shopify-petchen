document.addEventListener('DOMContentLoaded', function() {
    const headerWrapper = document.querySelector('.header-wrapper');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function setBodyPadding() {
        const headerHeight = headerWrapper.offsetHeight;
        document.body.style.paddingTop = headerHeight + 'px';
    }

    setBodyPadding();
    window.addEventListener('resize', setBodyPadding);

    function updateHeader() {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 10) {
            headerWrapper.classList.add('scrolled');
        } else {
            headerWrapper.classList.remove('scrolled');
        }

        if (currentScrollY > 100) {
            if (currentScrollY > lastScrollY && currentScrollY > 300) {
                headerWrapper.style.transform = 'translateY(calc(-100% - 18px))';
                headerWrapper.classList.add('hide');
            } else if (currentScrollY < lastScrollY) {
                headerWrapper.style.transform = 'translateY(0)';
                headerWrapper.classList.remove('hide');
            }
        } else {
            headerWrapper.style.transform = 'translateY(0)';
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
            e.stopPropagation();
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            dropdownToggles.forEach(t => {
                if (t !== this) {
                    t.setAttribute('aria-expanded', 'false');
                }
            });

            if (isExpanded) {
                const dropdown = this.nextElementSibling;
                if (dropdown) {
                    const subdropdownToggles = dropdown.querySelectorAll('.header-subdropdown-toggle');
                    subdropdownToggles.forEach(subToggle => {
                        subToggle.setAttribute('aria-expanded', 'false');
                    });
                }
            }

            this.setAttribute('aria-expanded', !isExpanded);
        });
    });

    const subdropdownToggles = document.querySelectorAll('.header-subdropdown-toggle');
    subdropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            const parentDropdown = this.closest('.header-dropdown');
            if (parentDropdown) {
                const siblingToggles = parentDropdown.querySelectorAll('.header-subdropdown-toggle');
                siblingToggles.forEach(t => {
                    if (t !== this) {
                        t.setAttribute('aria-expanded', 'false');
                    }
                });
            }

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

    const mobileSubsubmenuToggles = document.querySelectorAll('.mobile-subsubmenu-toggle');
    mobileSubsubmenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            const subsubmenu = this.nextElementSibling;

            this.setAttribute('aria-expanded', !isExpanded);
            if (subsubmenu) {
                subsubmenu.setAttribute('aria-hidden', isExpanded);
            }
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.header-nav-item')) {
            dropdownToggles.forEach(toggle => {
                toggle.setAttribute('aria-expanded', 'false');
            });
            subdropdownToggles.forEach(toggle => {
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

    const dropdownLinks = document.querySelectorAll('.header-dropdown a, .header-subdropdown a');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
});