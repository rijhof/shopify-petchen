/* assets/snippet-image.js */
(function() {
    'use strict';

    // Lazysizes Konfiguration
    if (!window.lazySizesConfig) {
        window.lazySizesConfig = window.lazySizesConfig || {};
        window.lazySizesConfig.lazyClass = 'lazyload';
        window.lazySizesConfig.loadingClass = 'lazyloading';
        window.lazySizesConfig.loadedClass = 'lazyloaded';
        window.lazySizesConfig.preloadAfterLoad = true;
        window.lazySizesConfig.expand = 370;
        window.lazySizesConfig.expFactor = 1.5;
        window.lazySizesConfig.hFac = 0.8;
        window.lazySizesConfig.loadMode = 2;
        window.lazySizesConfig.loadHidden = true;
    }

    // Lazysizes Library laden (nur einmal)
    if (!window.lazySizes && !document.querySelector('script[src*="lazysizes"]')) {
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.head.appendChild(script);
    }

    // Blur-up Effect Handler
    document.addEventListener('lazyloaded', function(e) {
        var img = e.target;

        // Füge loaded Klasse zum Wrapper hinzu für blur-up effect
        if (img.classList.contains('blur-up')) {
            var wrapper = img.closest('.image__wrapper');
            if (wrapper) {
                wrapper.classList.add('image--loaded');
            }
        }
    });

    // Intersection Observer für Decorations Animation
    if ('IntersectionObserver' in window) {
        var decorationObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('image--decoration-visible');
                    decorationObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });

        // Beobachte alle Bilder mit Dekoration
        document.addEventListener('DOMContentLoaded', function() {
            var decoratedImages = document.querySelectorAll('.image--has-decoration');
            decoratedImages.forEach(function(image) {
                decorationObserver.observe(image);
            });
        });
    }
})();