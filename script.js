// ---------- Product catalog ----------
// Edit this list to change what's shown on the Products page.
// `id` is a stable key used by the cart (and by saved carts in localStorage),
// so avoid changing existing ids once customers may have items saved.
const PRODUCTS = [
    { id: 'candle',  name: 'Soy Candle',       price: 14.00, emoji: '🕯️', desc: 'Hand-poured lavender soy candle, 40-hour burn.' },
    { id: 'soap',    name: 'Oatmeal Soap',     price: 8.50,  emoji: '🧼', desc: 'Gentle exfoliating oatmeal and honey bar.' },
    { id: 'jam',     name: 'Strawberry Jam',   price: 9.00,  emoji: '🍓', desc: 'Small-batch jam from local summer berries.' },
    { id: 'honey',   name: 'Wildflower Honey', price: 12.00, emoji: '🍯', desc: 'Raw, unfiltered honey from backyard hives.' },
    { id: 'cookies', name: 'Shortbread Box',   price: 11.00, emoji: '🍪', desc: 'Buttery shortbread cookies, box of twelve.' },
    { id: 'tote',    name: 'Canvas Tote',      price: 18.00, emoji: '👜', desc: 'Hand-printed cotton tote with the logo.' },
];

// ---------- Cart state (persisted in localStorage) ----------
// cart: { [productId]: quantity }
const CART_STORAGE_KEY = 'euphoric-cart';
let cart = loadCart();

function loadCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        // Keep only ids that still exist in the catalog and have valid quantities.
        const clean = {};
        for (const [id, qty] of Object.entries(parsed)) {
            if (getProduct(id) && Number.isFinite(qty) && qty > 0) {
                clean[id] = qty;
            }
        }
        return clean;
    } catch {
        return {};
    }
}

function saveCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
        /* storage full or unavailable — cart still works for this session */
    }
}

// ---------- Helpers ----------
function formatPrice(value) {
    return '$' + value.toFixed(2);
}

function getProduct(id) {
    return PRODUCTS.find(p => p.id === id);
}

// ---------- Page builders ----------
// Each function returns the HTML string for the right-side content area.

function productsPage() {
    const cards = PRODUCTS.map(p => `
        <div class="product-card">
            <div class="product-thumb">${p.emoji}</div>
            <div class="product-body">
                <div class="product-name">${p.name}</div>
                <div class="product-desc">${p.desc}</div>
                <div class="product-price">${formatPrice(p.price)}</div>
                <button class="add-btn" data-id="${p.id}">Add to Cart</button>
            </div>
        </div>
    `).join('');

    return `
        <div class="products-bar">
            <div>
                <h2 class="page-title">Products</h2>
                <p class="page-intro">Lovingly handmade, in small batches, with care.</p>
            </div>
            <button id="cart-toggle" class="cart-toggle" aria-label="Open cart">
                🛒 <span id="cart-count" class="cart-count">0</span>
            </button>
        </div>
        <div class="product-grid">${cards}</div>
    `;
}

function servicesPage() {
    return `
        <h2 class="page-title">Services</h2>
        <p class="page-intro">Beyond the shelf, here is how I can help.</p>
        <ul class="service-list">
            <li class="service-item">
                <h3>Custom Candle Blends</h3>
                <p>Pick your scent, color, and vessel for a one-of-a-kind candle.</p>
            </li>
            <li class="service-item">
                <h3>Gift Baskets</h3>
                <p>Curated bundles of handmade goods for any occasion.</p>
            </li>
            <li class="service-item">
                <h3>Workshops</h3>
                <p>Small-group soap and candle making classes, held monthly.</p>
            </li>
        </ul>
    `;
}

function contactPage() {
    return `
        <h2 class="page-title">Contact Us</h2>
        <p class="page-intro">Questions, custom orders, or just want to say hi? Send a note.</p>
        <form class="contact-form" id="contact-form">
            <div class="form-field">
                <label for="name">Name</label>
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-field">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-field">
                <label for="message">Message</label>
                <textarea id="message" name="message" required></textarea>
            </div>
            <button type="submit" class="submit-btn">Send Message</button>
            <p class="form-note" id="form-note" hidden>Thanks! Your message has been sent (demo).</p>
        </form>
    `;
}

function linksPage() {
    return `
        <h2 class="page-title">Links</h2>
        <p class="page-intro">Find me around the web.</p>
        <ul class="link-list">
            <li><a href="#" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="#" target="_blank" rel="noopener">Etsy Shop</a></li>
            <li><a href="#" target="_blank" rel="noopener">Facebook</a></li>
            <li><a href="#" target="_blank" rel="noopener">Pinterest</a></li>
        </ul>
    `;
}

function etcPage() {
    return `
        <h2 class="page-title">ETC</h2>
        <p class="page-intro">A little about the Euphoric Alchemist.</p>
        <p>
            My name is Sara. After a long conversation with my inner spiritual tortoise,
            I found peace and decided to make this shop. Everything here is crafted by hand,
            in small batches, with care. Thanks for stopping by.
        </p>
    `;
}

// Map page keys to their builder functions.
const PAGES = {
    products: productsPage,
    services: servicesPage,
    contact:  contactPage,
    links:    linksPage,
    etc:      etcPage,
};

// ---------- DOM references (stable elements) ----------
const content = document.getElementById('content');
const navButtons = document.querySelectorAll('.nav-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

// ---------- Cart operations ----------
function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    openCart();
}

function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id] += delta;
    if (cart[id] <= 0) delete cart[id];
    saveCart();
    renderCart();
}

function cartTotal() {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
        const product = getProduct(id);
        return sum + (product ? product.price * qty : 0);
    }, 0);
}

function cartItemCount() {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

// ---------- Render cart ----------
function renderCart() {
    const entries = Object.entries(cart);

    // The count badge only exists while the Products page is shown.
    const countEl = document.getElementById('cart-count');
    if (countEl) countEl.textContent = cartItemCount();

    cartTotalEl.textContent = formatPrice(cartTotal());
    checkoutBtn.disabled = entries.length === 0;

    if (entries.length === 0) {
        cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
        return;
    }

    cartItemsEl.innerHTML = '';
    entries.forEach(([id, qty]) => {
        const product = getProduct(id);
        if (!product) return;

        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <div class="cart-item-emoji">${product.emoji}</div>
            <div class="cart-item-info">
                <div class="cart-item-name">${product.name}</div>
                <div class="cart-item-price">${formatPrice(product.price)} each</div>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" data-id="${id}" data-delta="-1" aria-label="Decrease quantity">−</button>
                <span class="qty-value">${qty}</span>
                <button class="qty-btn" data-id="${id}" data-delta="1" aria-label="Increase quantity">+</button>
            </div>
        `;
        cartItemsEl.appendChild(row);
    });
}

// ---------- Drawer open/close ----------
function openCart() {
    cartDrawer.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    cartOverlay.hidden = false;
}

function closeCart() {
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    cartOverlay.hidden = true;
}

// ---------- Render a page ----------
function showPage(key) {
    const builder = PAGES[key];
    if (!builder) return;

    content.innerHTML = builder();

    // Highlight the active button.
    navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === key);
    });

    // The cart only belongs to the Products page.
    if (key === 'products') {
        document.getElementById('cart-toggle').addEventListener('click', openCart);
        renderCart(); // refresh the count badge for the freshly built button
    } else {
        closeCart();
    }

    // Wire up the contact form if it's the page we just rendered.
    if (key === 'contact') {
        const form = document.getElementById('contact-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            document.getElementById('form-note').hidden = false;
            form.reset();
        });
    }
}

// ---------- Event wiring ----------
navButtons.forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
});

// Add-to-cart buttons live inside the swapped content, so delegate from `content`.
content.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-btn');
    if (btn) addToCart(btn.dataset.id);
});

// Quantity buttons live inside the cart drawer (a stable element).
cartItemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.qty-btn');
    if (btn) changeQty(btn.dataset.id, Number(btn.dataset.delta));
});

document.getElementById('cart-close').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

checkoutBtn.addEventListener('click', () => {
    const total = formatPrice(cartTotal());
    alert(`Thanks for your order!\n\nTotal: ${total}\n\n(This is a demo checkout — no payment is processed.)`);
    cart = {};
    saveCart();
    renderCart();
    closeCart();
});

// ---------- Init: show Products first ----------
showPage('products');
renderCart();
