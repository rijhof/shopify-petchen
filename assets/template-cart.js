/* assets/template-cart.js */
document.addEventListener('DOMContentLoaded', function() {
    const cartForm = document.querySelector('.cart__form');
    if (!cartForm) return;

    // Update cart item quantity via AJAX
    function updateCartItem(lineKey, quantity) {
        const cartItem = document.querySelector(`[data-line-item-key="${lineKey}"]`);
        if (cartItem) {
            cartItem.classList.add('cart-item--updating');
        }

        fetch('/cart/change.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                line: lineKey,
                quantity: quantity
            })
        })
            .then(response => response.json())
            .then(cart => {
                updateCartDisplay(cart);
                if (cartItem) {
                    cartItem.classList.remove('cart-item--updating');
                }
            })
            .catch(error => {
                console.error('Error updating cart:', error);
                if (cartItem) {
                    cartItem.classList.remove('cart-item--updating');
                }
            });
    }

    // Update the cart display with new cart data
    function updateCartDisplay(cart) {
        // Update subtotal
        const subtotalPrice = document.querySelector('.cart__subtotal-price');
        if (subtotalPrice) {
            subtotalPrice.textContent = formatMoney(cart.total_price);
        }

        // Update individual line items
        cart.items.forEach((item, index) => {
            const cartItem = document.querySelector(`[data-line-item-key="${index + 1}"]`);
            if (cartItem) {
                // Update quantity input
                const quantityInput = cartItem.querySelector('.cart-item__quantity-input');
                if (quantityInput) {
                    quantityInput.value = item.quantity;
                }

                // Update line price
                const priceTotal = cartItem.querySelector('.cart-item__price-total');
                if (priceTotal) {
                    priceTotal.textContent = formatMoney(item.line_price);
                }
            }
        });

        // Remove items with 0 quantity
        const cartItems = document.querySelectorAll('.cart-item');
        cartItems.forEach((cartItem, index) => {
            const correspondingCartItem = cart.items[index];
            if (!correspondingCartItem || correspondingCartItem.quantity === 0) {
                cartItem.remove();
            }
        });

        // If cart is empty, reload page to show empty state
        if (cart.item_count === 0) {
            window.location.reload();
        }

        // Update cart count in header if it exists
        updateCartCount(cart.item_count);
    }

    // Update cart count bubble in header
    function updateCartCount(count) {
        // Update all possible cart count selectors
        const cartCountSelectors = [
            '.cart-count-bubble',
            '[data-cart-count]',
            '.header-cart-count'
        ];

        cartCountSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.textContent = count;
                if (count > 0) {
                    element.classList.remove('hidden');
                    element.setAttribute('aria-hidden', 'true');
                } else {
                    element.classList.add('hidden');
                }
            });
        });

        // Update cart link aria-label
        const cartLinks = document.querySelectorAll('.header-cart, a[href*="cart"]');
        cartLinks.forEach(link => {
            if (link.classList.contains('header-cart') || link.href.includes('/cart')) {
                const itemText = count === 1 ? 'item' : 'items';
                link.setAttribute('aria-label', `Shopping cart with ${count} ${itemText}`);
            }
        });
    }

    // Format money like Shopify
    function formatMoney(cents) {
        const amount = (cents / 100).toFixed(2);
        return `€${amount.replace('.', ',')}`;
    }

    // Clear cart function
    function clearCart() {
        if (confirm('Möchten Sie wirklich alle Artikel aus dem Warenkorb entfernen?')) {
            // Show loading state
            const clearButton = document.querySelector('.cart__clear-button');
            if (clearButton) {
                const originalText = clearButton.textContent;
                clearButton.textContent = 'Wird geleert...';
                clearButton.disabled = true;
            }

            fetch('/cart/clear.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
                .then(response => response.json())
                .then(() => {
                    window.location.reload();
                })
                .catch(error => {
                    console.error('Error clearing cart:', error);
                    if (clearButton) {
                        clearButton.textContent = originalText;
                        clearButton.disabled = false;
                    }
                    alert('Fehler beim Leeren des Warenkorbs. Bitte versuchen Sie es erneut.');
                });
        }
    }

    // Quantity buttons
    const quantityButtons = cartForm.querySelectorAll('.cart-item__quantity-button');
    quantityButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const wrapper = this.closest('.cart-item__quantity-wrapper');
            const input = wrapper.querySelector('.cart-item__quantity-input');
            const cartItem = this.closest('.cart-item');
            const lineKey = cartItem.getAttribute('data-line-item-key');
            const currentValue = parseInt(input.value) || 0;
            const action = this.dataset.action;
            let newQuantity = currentValue;

            if (action === 'increase') {
                newQuantity = currentValue + 1;
            } else if (action === 'decrease' && currentValue > 0) {
                newQuantity = currentValue - 1;
            }

            if (newQuantity !== currentValue) {
                input.value = newQuantity;
                updateCartItem(lineKey, newQuantity);
            }
        });
    });

    // Remove buttons
    const removeButtons = cartForm.querySelectorAll('.cart-item__remove');
    removeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const cartItem = this.closest('.cart-item');
            const lineKey = cartItem.getAttribute('data-line-item-key');
            updateCartItem(lineKey, 0);
        });
    });

    // Direct input changes
    const quantityInputs = cartForm.querySelectorAll('.cart-item__quantity-input');
    quantityInputs.forEach(input => {
        let previousValue = input.value;

        input.addEventListener('focus', function() {
            previousValue = this.value;
        });

        input.addEventListener('blur', function() {
            const newValue = parseInt(this.value) || 0;
            const previousVal = parseInt(previousValue) || 0;

            if (newValue !== previousVal) {
                const cartItem = this.closest('.cart-item');
                const lineKey = cartItem.getAttribute('data-line-item-key');
                updateCartItem(lineKey, newValue);
            }
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
    });

    // Clear cart button event listener
    const clearCartButton = document.querySelector('.cart__clear-button');
    if (clearCartButton) {
        clearCartButton.addEventListener('click', clearCart);
    }

    // Prevent form submission
    cartForm.addEventListener('submit', function(e) {
        const submitButton = e.submitter;
        if (submitButton && submitButton.name === 'checkout') {
            // Allow checkout submission
            return;
        }
        // Prevent update submissions since we handle via AJAX
        e.preventDefault();
    });

    // Make clearCart function globally available for inline onclick if needed
    window.clearCart = clearCart;
});