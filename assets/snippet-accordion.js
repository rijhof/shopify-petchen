// Accordion functionality
class ProductAccordion {
    constructor() {
        this.accordions = document.querySelectorAll('.accordion-item');
        this.init();
    }

    init() {
        this.accordions.forEach(accordion => {
            const header = accordion.querySelector('.accordion-header');
            const content = accordion.querySelector('.accordion-content');

            // Check if accordion should be open by default
            const isOpen = accordion.dataset.accordionOpen === 'true';
            if (isOpen) {
                // Set initial open state with proper height calculation after DOM is ready
                setTimeout(() => {
                    this.openAccordion(header, content);
                }, 10);
            }

            header.addEventListener('click', () => {
                const isExpanded = header.getAttribute('aria-expanded') === 'true';

                if (isExpanded) {
                    this.closeAccordion(header, content);
                } else {
                    this.openAccordion(header, content);
                }
            });
        });
    }

    openAccordion(header, content) {
        header.setAttribute('aria-expanded', 'true');
        content.setAttribute('aria-hidden', 'false');

        // Calculate the actual height needed
        const contentInner = content.querySelector('.accordion-content-inner');
        const height = contentInner.scrollHeight;
        content.style.maxHeight = height + 'px';
    }

    closeAccordion(header, content) {
        header.setAttribute('aria-expanded', 'false');
        content.setAttribute('aria-hidden', 'true');
        content.style.maxHeight = '0';
    }
}

// Initialize accordion when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ProductAccordion();
    });
} else {
    new ProductAccordion();
}