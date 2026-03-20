// Comprita Shopify Theme JS v1.0

document.addEventListener('DOMContentLoaded', function () {
    initCartListeners();
    initMobileMenu();
    initProductCardListeners();
});

// AJAX Cart Helpers
async function addToCart(variantId, quantity = 1) {
    try {
        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [{ id: variantId, quantity: quantity }] })
        });
        const cart = await response.json();
        updateCartCount(cart.item_count);
        animateCartBadge();
        // Dispatch event for other components to update (e.g. drawer)
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

async function updateCartItem(id, quantity) {
    try {
        const response = await fetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id.toString(), quantity: quantity })
        });
        const cart = await response.json();
        updateCartCount(cart.item_count);
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
        return cart;
    } catch (error) {
        console.error('Error updating cart:', error);
    }
}

function updateCartCount(count) {
    const badge = document.querySelector('.cart-count-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function animateCartBadge() {
    const badge = document.querySelector('.cart-count-badge');
    if (badge) {
        badge.classList.remove('animate-cart-badge');
        void badge.offsetWidth; // Trigger reflow
        badge.classList.add('animate-cart-badge');
    }
}

// UI Interactions
function initProductCardListeners() {
    document.addEventListener('click', async (e) => {
        // Add to cart button
        if (e.target.closest('.add-to-cart-btn')) {
            const btn = e.target.closest('.add-to-cart-btn');
            const container = btn.closest('.product-card-actions');
            const variantId = container.dataset.variantId;

            await addToCart(variantId, 1);

            // Update UI: Toggle visibility
            btn.style.display = 'none';
            const qtySelector = container.querySelector('.quantity-selector-container');
            if (qtySelector) {
                qtySelector.style.display = 'flex';
                qtySelector.querySelector('.qty-number').textContent = '1';
            }
        }

        // Increment/Decrement in card
        if (e.target.closest('.qty-btn')) {
            const btn = e.target.closest('.qty-btn');
            const container = btn.closest('.product-card-actions');
            const variantId = container.dataset.variantId;
            const qtyLabel = container.querySelector('.qty-number');
            let currentQty = parseInt(qtyLabel.textContent);

            if (btn.classList.contains('increment')) {
                currentQty++;
                await addToCart(variantId, 1);
            } else {
                currentQty--;
                // Shopify change.js expects quantity, not diff
                // We'll use a helper to find the line item key first, or just use variantId if simplified
                // Simplified for Card: always use /cart/add.js with qty 1 or /cart/change.js
                await updateCartItemByVariant(variantId, currentQty);
            }

            if (currentQty === 0) {
                container.querySelector('.add-to-cart-btn').style.display = 'flex';
                container.querySelector('.quantity-selector-container').style.display = 'none';
            } else {
                qtyLabel.textContent = currentQty;
            }
        }
    });
}

async function updateCartItemByVariant(variantId, quantity) {
    const response = await fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { [variantId]: quantity } })
    });
    const cart = await response.json();
    updateCartCount(cart.item_count);
    animateCartBadge();
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
}

function initCartListeners() {
    const cartToggle = document.querySelector('.cart-toggle');
    const drawerOverlay = document.querySelector('.cart-drawer-overlay');
    const drawerClose = document.querySelector('.cart-drawer-close');

    if (cartToggle) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();
            openCartDrawer();
        });
    }

    if (drawerOverlay) drawerOverlay.addEventListener('click', closeCartDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeCartDrawer);
}

function openCartDrawer() {
    document.body.classList.add('cart-drawer-open');
    // Trigger drawer fetch/render if needed
}

function closeCartDrawer() {
    document.body.classList.remove('cart-drawer-open');
}

function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });
    }
}
