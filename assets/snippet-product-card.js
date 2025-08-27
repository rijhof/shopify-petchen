class ProductCard {
    constructor() {
        this.init();
    }

    init() {
        this.initWishlist();
        this.initQuickAdd();
        this.trackRecentlyViewed();
    }

    initWishlist() {
        const wishlistButtons = document.querySelectorAll('.product-card__wishlist');

        wishlistButtons.forEach(button => {
            const productId = button.dataset.productId;
            const wishlist = this.getWishlist();

            if (wishlist.includes(productId)) {
                button.classList.add('active');
            }

            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleWishlist(productId, button);
            });
        });
    }

    toggleWishlist(productId, button) {
        let wishlist = this.getWishlist();

        if (wishlist.includes(productId)) {
            wishlist = wishlist.filter(id => id !== productId);
            button.classList.remove('active');
            this.showNotification('Produkt von der Wunschliste entfernt');
        } else {
            wishlist.push(productId);
            button.classList.add('active');
            this.showNotification('Produkt zur Wunschliste hinzugefügt');
        }

        localStorage.setItem('wishlist', JSON.stringify(wishlist));

        window.dispatchEvent(new CustomEvent('wishlist:updated', {
            detail: { productId, wishlist }
        }));
    }

    getWishlist() {
        const wishlist = localStorage.getItem('wishlist');
        return wishlist ? JSON.parse(wishlist) : [];
    }

    initQuickAdd() {
        const quickAddButtons = document.querySelectorAll('.quick-add-trigger');

        quickAddButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productHandle = button.dataset.productHandle;

                if (window.cartNotification) {
                    window.cartNotification.setTriggerElement(button);
                }

                this.openQuickAdd(productHandle);
            });
        });

        const quickAddForms = document.querySelectorAll('.product-card__form');

        quickAddForms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const submitButton = form.querySelector('button[type="submit"]');
                if (window.cartNotification && submitButton) {
                    window.cartNotification.setTriggerElement(submitButton);
                }

                this.addToCart(form);
            });
        });
    }

    async openQuickAdd(productHandle) {
        try {
            const response = await fetch(`/products/${productHandle}.js`);
            const product = await response.json();

            this.showQuickAddModal(product);
        } catch (error) {
            console.error('Error loading product:', error);
            this.showNotification('Fehler beim Laden des Produkts', 'error');
        }
    }

    showQuickAddModal(product) {
        const modalHTML = `
            <div class="quick-add-modal" data-product-id="${product.id}">
                <div class="quick-add-modal__overlay"></div>
                <div class="quick-add-modal__content">
                    <button class="quick-add-modal__close" aria-label="Schließen">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    
                    <h3 class="quick-add-modal__title">${product.title}</h3>
                    
                    <div class="quick-add-modal__price">
                        ${product.compare_at_price > product.price ?
            `<span class="quick-add-modal__price--compare">${this.formatMoney(product.compare_at_price)}</span>` : ''}
                        <span class="quick-add-modal__price--current">${this.formatMoney(product.price)}</span>
                    </div>
                    
                    ${product.variants.length > 1 ? this.createVariantSelector(product) : ''}
                    
                    <div class="quick-add-modal__quantity">
                        <label for="quick-add-quantity">Menge:</label>
                        <input type="number" id="quick-add-quantity" min="1" value="1">
                    </div>
                    
                    <button class="button-primary quick-add-modal__submit" data-variant-id="${product.variants[0].id}">
                        In den Warenkorb
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.querySelector('.quick-add-modal');
        modal._productData = product;

        const closeBtn = modal.querySelector('.quick-add-modal__close');
        const overlay = modal.querySelector('.quick-add-modal__overlay');
        const submitBtn = modal.querySelector('.quick-add-modal__submit');

        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);

        if (product.variants.length > 1) {
            this.initVariantSelector(modal, product);
        }

        submitBtn.addEventListener('click', async () => {
            const variantId = submitBtn.dataset.variantId;
            const quantity = modal.querySelector('#quick-add-quantity').value;
            const productData = modal._productData;

            try {
                const response = await fetch('/cart/add.js', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: variantId,
                        quantity: parseInt(quantity)
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    this.triggerCartNotification(result, productData);
                    this.updateCartCount();
                    closeModal();
                } else {
                    throw new Error(result.description || 'Fehler beim Hinzufügen zum Warenkorb');
                }
            } catch (error) {
                console.error('Add to cart error:', error);
                this.showNotification(error.message, 'error');
            }
        });

        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    createVariantSelector(product) {
        let optionsHTML = '';

        product.options.forEach((option, index) => {
            optionsHTML += `
                <div class="quick-add-modal__option">
                    <label>${option.name}:</label>
                    <select class="variant-selector" data-option-index="${index}">
                        ${option.values.map(value =>
                `<option value="${value}">${value}</option>`
            ).join('')}
                    </select>
                </div>
            `;
        });

        return `<div class="quick-add-modal__options">${optionsHTML}</div>`;
    }

    initVariantSelector(modal, product) {
        const selectors = modal.querySelectorAll('.variant-selector');
        const submitBtn = modal.querySelector('.quick-add-modal__submit');
        const priceElement = modal.querySelector('.quick-add-modal__price--current');

        selectors.forEach(selector => {
            selector.addEventListener('change', () => {
                const selectedOptions = Array.from(selectors).map(s => s.value);

                const variant = product.variants.find(v => {
                    return v.options.every((opt, i) => opt === selectedOptions[i]);
                });

                if (variant) {
                    submitBtn.dataset.variantId = variant.id;
                    submitBtn.disabled = !variant.available;
                    submitBtn.textContent = variant.available ? 'In den Warenkorb' : 'Ausverkauft';

                    if (priceElement) {
                        priceElement.textContent = this.formatMoney(variant.price);
                    }
                }
            });
        });
    }

    async addToCart(form) {
        const formData = new FormData(form);

        try {
            const response = await fetch('/cart/add.js', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.triggerCartNotification(result);
                this.updateCartCount();
            } else {
                throw new Error(result.description || 'Fehler beim Hinzufügen zum Warenkorb');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showNotification(error.message, 'error');
        }
    }

    triggerCartNotification(cartItem, productData = null) {
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cart:item-added', {
                detail: {
                    variantId: cartItem.variant_id || cartItem.id,
                    quantity: cartItem.quantity || 1,
                    product: productData || {
                        title: cartItem.product_title,
                        product_title: cartItem.product_title,
                        handle: cartItem.handle,
                        product_handle: cartItem.handle,
                        image: cartItem.image,
                        featured_image: cartItem.image,
                        price: cartItem.price,
                        line_price: cartItem.line_price,
                        vendor: cartItem.vendor,
                        variant_title: cartItem.variant_title,
                        url: cartItem.url
                    }
                }
            }));
        }, 100);
    }

    async updateCartCount() {
        try {
            const response = await fetch('/cart.js');
            const cart = await response.json();

            const cartCountElements = document.querySelectorAll('.cart-count');
            cartCountElements.forEach(el => {
                el.textContent = cart.item_count;
            });

            window.dispatchEvent(new CustomEvent('cart:updated', {
                detail: cart
            }));
        } catch (error) {
            console.error('Error updating cart count:', error);
        }
    }

    trackRecentlyViewed() {
        if (window.location.pathname.includes('/products/')) {
            const productCard = document.querySelector('.product-card');
            if (productCard) {
                const productId = productCard.dataset.productId;
                if (productId) {
                    this.addToRecentlyViewed(productId);
                }
            }
        }
    }

    addToRecentlyViewed(productId) {
        let recentlyViewed = localStorage.getItem('recentlyViewed');
        recentlyViewed = recentlyViewed ? JSON.parse(recentlyViewed) : [];

        recentlyViewed = recentlyViewed.filter(id => id !== productId);
        recentlyViewed.unshift(productId);
        recentlyViewed = recentlyViewed.slice(0, 10);

        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    }

    formatMoney(cents) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(cents / 100);
    }

    showNotification(message, type = 'success') {
        const existingNotification = document.querySelector('.product-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `product-notification product-notification--${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('active');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('active');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ProductCard();
    });
} else {
    new ProductCard();
}