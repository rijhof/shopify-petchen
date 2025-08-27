class CartNotification {
    constructor() {
        this.notification = document.getElementById('cart-notification');
        if (!this.notification) {
            console.error('Cart notification element not found');
            return;
        }

        this.productContainer = document.getElementById('cart-notification-product');
        this.productTemplate = document.getElementById('cart-notification-product-template');
        this.closeButtons = this.notification.querySelectorAll('[data-cart-notification-close]');
        this.isOpen = false;
        this.triggerElement = null;
        this.autoCloseTimeout = null;

        this.init();
    }

    init() {
        this.closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.close();
            });
        });

        window.addEventListener('cart:item-added', (event) => {
            this.handleItemAdded(event.detail);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        this.notification.addEventListener('click', (e) => {
            if (e.target === this.notification.querySelector('.cart-notification__overlay')) {
                this.close();
            }
        });
    }

    async handleItemAdded(data) {
        this.showLoading();
        this.open();

        try {
            let product;

            if (data.product && data.product.title) {
                product = data.product;
            } else if (data.variantId) {
                product = await this.fetchProductDetails(data.variantId);
            } else {
                throw new Error('No product data available');
            }

            this.displayProduct(product, data.quantity);
        } catch (error) {
            console.error('Cart notification error:', error);
            this.showError();
        }
    }

    async fetchProductDetails(variantId) {
        const cartResponse = await fetch('/cart.js');
        const cart = await cartResponse.json();

        const cartItem = cart.items.find(item =>
            item.variant_id === parseInt(variantId) ||
            item.id === parseInt(variantId)
        );

        if (!cartItem) {
            throw new Error('Item not found in cart');
        }

        return cartItem;
    }

    displayProduct(product, quantity = 1) {
        if (!this.productTemplate || !this.productContainer) return;

        const template = this.productTemplate.content.cloneNode(true);
        const productItem = template.querySelector('.cart-notification__product-item');

        const img = productItem.querySelector('img');
        if (product.image || product.featured_image) {
            const imageUrl = product.image || product.featured_image;
            img.src = this.getSizedImageUrl(imageUrl, '160x160');
            img.alt = product.title || product.product_title || '';
        } else {
            img.style.display = 'none';
        }

        const titleLink = productItem.querySelector('.cart-notification__product-title a');
        const title = product.title || product.product_title || '';
        titleLink.textContent = title;
        titleLink.href = product.url || `/products/${product.handle || product.product_handle}`;

        const uspElement = productItem.querySelector('.cart-notification__product-usp');
        if (product.vendor) {
            uspElement.textContent = product.vendor;
        } else if (product.variant_title && product.variant_title !== 'Default Title') {
            uspElement.textContent = product.variant_title;
        } else {
            uspElement.style.display = 'none';
        }

        const quantityElement = productItem.querySelector('.cart-notification__product-quantity');
        quantityElement.textContent = `Menge: ${quantity || product.quantity || 1}`;

        const priceElement = productItem.querySelector('.cart-notification__product-price');
        const price = product.price || product.line_price || 0;
        priceElement.textContent = this.formatMoney(price);

        this.productContainer.innerHTML = '';
        this.productContainer.appendChild(productItem);
    }

    showLoading() {
        if (!this.productContainer) return;

        this.productContainer.innerHTML = `
            <div class="cart-notification__product--loading">
                <div class="cart-notification__spinner"></div>
            </div>
        `;
    }

    showError() {
        if (!this.productContainer) return;

        this.productContainer.innerHTML = `
            <div class="cart-notification__error">
                Fehler beim Laden der Produktdetails
            </div>
        `;
    }

    open() {
        if (!this.notification || this.isOpen) return;

        this.notification.classList.add('active');
        this.notification.setAttribute('aria-hidden', 'false');
        this.isOpen = true;

        document.body.style.overflow = 'hidden';

        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
        }

        this.autoCloseTimeout = setTimeout(() => {
            this.close();
        }, 8000);
    }

    close() {
        if (!this.notification || !this.isOpen) return;

        this.notification.classList.remove('active');
        this.notification.setAttribute('aria-hidden', 'true');
        this.isOpen = false;

        document.body.style.overflow = '';

        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
            this.autoCloseTimeout = null;
        }

        if (this.triggerElement && typeof this.triggerElement.focus === 'function') {
            setTimeout(() => {
                this.triggerElement.focus();
                this.triggerElement = null;
            }, 100);
        }
    }

    getSizedImageUrl(url, size) {
        if (!url) return '';

        if (url.includes('_' + size)) return url;

        const parts = url.split('.');
        if (parts.length > 1) {
            const ext = parts.pop();
            return parts.join('.') + '_' + size + '.' + ext;
        }

        return url;
    }

    formatMoney(cents) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(cents / 100);
    }

    setTriggerElement(element) {
        this.triggerElement = element;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cartNotification = new CartNotification();
    });
} else {
    window.cartNotification = new CartNotification();
}