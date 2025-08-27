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

        console.log('CartNotification initialized');
        this.init();
    }

    init() {
        this.closeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.close();
            });
        });

        console.log('Registering cart:item-added event listener');
        window.addEventListener('cart:item-added', (event) => {
            console.log('cart:item-added event received:', event.detail);
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
        console.log('handleItemAdded called with data:', data);

        this.showLoading();
        this.open();

        try {
            let product;

            if (data.product && (data.product.title || data.product.product_title)) {
                console.log('Using provided product data');
                product = data.product;
            } else if (data.variantId) {
                console.log('Fetching product details from cart');
                product = await this.fetchProductDetails(data.variantId);
            } else {
                console.error('No valid product data found:', data);
                throw new Error('No product data available');
            }

            console.log('Product data for display:', product);
            this.displayProduct(product, data.quantity);

            await this.updateCartViewButton();
        } catch (error) {
            console.error('Cart notification error:', error);
            this.showError();
        }
    }

    async updateCartViewButton() {
        try {
            const response = await fetch('/cart.js');
            const cart = await response.json();

            const cartViewButton = this.notification.querySelector('.cart-notification__actions .button-secondary');
            if (cartViewButton && cartViewButton.textContent.includes('Warenkorb')) {
                cartViewButton.textContent = `Warenkorb ansehen (${cart.item_count})`;
            }
        } catch (error) {
            console.error('Error updating cart view button:', error);
        }
    }

    async fetchProductDetails(variantId) {
        console.log('Fetching product details for variant:', variantId);

        try {
            const cartResponse = await fetch('/cart.js');
            const cart = await cartResponse.json();

            console.log('Cart data:', cart);

            const cartItem = cart.items.find(item =>
                item.variant_id === parseInt(variantId) ||
                item.id === parseInt(variantId)
            );

            if (!cartItem) {
                throw new Error('Item not found in cart');
            }

            console.log('Found cart item:', cartItem);
            return cartItem;
        } catch (error) {
            console.error('Error fetching product details:', error);
            throw error;
        }
    }

    displayProduct(product, quantity = 1) {
        if (!this.productTemplate || !this.productContainer) {
            console.error('Missing template or container elements');
            return;
        }

        console.log('Displaying product:', { product, quantity });

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
        const title = product.title || product.product_title || 'Unbekanntes Produkt';
        titleLink.textContent = title;

        let productUrl = product.url;
        if (!productUrl && (product.handle || product.product_handle)) {
            productUrl = `/products/${product.handle || product.product_handle}`;
        }
        if (productUrl) {
            titleLink.href = productUrl;
        }

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

        console.log('Product displayed successfully');
    }

    showLoading() {
        if (!this.productContainer) return;

        console.log('Showing loading state');
        this.productContainer.innerHTML = `
            <div class="cart-notification__product--loading">
                <div class="cart-notification__spinner"></div>
            </div>
        `;
    }

    showError() {
        if (!this.productContainer) return;

        console.log('Showing error state');
        this.productContainer.innerHTML = `
            <div class="cart-notification__error">
                Fehler beim Laden der Produktdetails
            </div>
        `;
    }

    open() {
        if (!this.notification || this.isOpen) return;

        console.log('Opening cart notification');

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

        console.log('Closing cart notification');

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
        console.log('Initializing CartNotification on DOMContentLoaded');
        window.cartNotification = new CartNotification();
    });
} else {
    console.log('Initializing CartNotification immediately');
    window.cartNotification = new CartNotification();
}