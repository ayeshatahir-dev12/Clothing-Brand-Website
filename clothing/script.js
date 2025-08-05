// ======= Utilities =======
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const formatPrice = p => `$${parseFloat(p).toFixed(2)}`;

// ======= Cart Logic =======
const CART_KEY = 'clothify_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getCartCount() {
  const cart = loadCart();
  return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = getCartCount();
}

function addToCart(product) {
  const cart = loadCart();
  // Deduplicate by id+size
  const existing = cart.find(i => i.id === product.id && i.size === product.size);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + product.quantity, 99);
  } else {
    cart.push(product);
  }
  saveCart(cart);
  updateCartBadge();
  showToast("Added to cart!");
}

// ======= Toast =======
let toastInstance = null;
function showToast(msg) {
  const toastEl = document.getElementById('cartToast');
  if (!toastEl) return;
  toastEl.querySelector('.toast-body').textContent = msg;
  if (!toastInstance) {
    toastInstance = new bootstrap.Toast(toastEl, { delay: 1500 });
  }
  toastInstance.show();
}

// ======= Smooth Scroll =======
function enableSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update URL hash without jump
        history.pushState(null, '', this.getAttribute('href'));
      }
    });
  });
}

// ======= Modal Population =======
function setupProductModal() {
  const modalEl = document.getElementById('universalProductModal');
  if (!modalEl) return;
  const modal = new bootstrap.Modal(modalEl);
  let currentData = null;

  qsa('.open-product').forEach(btn => {
    btn.addEventListener('click', function () {
      // Parse attributes
      const name = this.dataset.name || 'Product';
      const price = this.dataset.price || '0';
      const description = this.dataset.description || '';
      const id = this.dataset.id || name.toLowerCase().replace(/\s+/g, '-');
      const imagesRaw = this.dataset.images || '';
      const featuresRaw = this.dataset.features || '[]';
      const sizesRaw = this.dataset.sizes || '[]';

      // Normalize
      let images = imagesRaw.split(',').map(s => s.trim()).filter(Boolean);
      if (images.length === 0) images = ['https://via.placeholder.com/500x400?text=No+Image'];
      let features = [];
      try { features = JSON.parse(featuresRaw); } catch { features = []; }
      let sizes = [];
      try { sizes = JSON.parse(sizesRaw); } catch { sizes = []; }

      currentData = {
        id,
        name,
        price: parseFloat(price),
        description,
        images,
        features,
        sizes
      };

      // Populate modal fields
      qs('#universalProductModalLabel').textContent = name;
      qs('#modal-price').textContent = formatPrice(price);
      qs('#modal-description').textContent = description;

      // Sizes
      const sizeSel = qs('#modal-size');
      sizeSel.innerHTML = '';
      if (sizes.length) {
        sizes.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s;
          opt.textContent = s;
          sizeSel.appendChild(opt);
        });
      } else {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'One size';
        sizeSel.appendChild(opt);
      }

      // Quantity
      qs('#modal-qty').value = 1;

      // Features
      const featUl = qs('#modal-features');
      featUl.innerHTML = '';
      features.forEach(f => {
        const li = document.createElement('li');
        li.textContent = f;
        featUl.appendChild(li);
      });

      // Gallery
      const mainImg = qs('#modal-main-image');
      mainImg.src = images[0];
      mainImg.alt = name;

      const thumbsContainer = qs('#modal-thumbs');
      thumbsContainer.innerHTML = '';
      images.forEach((src, idx) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = name + ' thumb ' + (idx + 1);
        img.classList.add('rounded');
        img.style.cursor = 'pointer';
        if (idx === 0) img.classList.add('active');
        img.addEventListener('click', () => {
          mainImg.src = src;
          thumbsContainer.querySelectorAll('img').forEach(i => i.classList.remove('active'));
          img.classList.add('active');
        });
        thumbsContainer.appendChild(img);
      });

      // Show modal
      modal.show();
    });
  });

  // Add to cart button inside modal
  const addBtn = qs('#modal-add-to-cart');
  addBtn.addEventListener('click', () => {
    if (!currentData) return;
    const selectedSize = qs('#modal-size').value;
    const qty = parseInt(qs('#modal-qty').value) || 1;
    const productToAdd = {
      id: currentData.id,
      name: currentData.name,
      price: currentData.price,
      size: selectedSize,
      quantity: qty,
      timestamp: Date.now()
    };
    addToCart(productToAdd);
  });
}

// ======= Init =======
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  enableSmoothScroll();
  setupProductModal();

  // If URL has hash on load, smooth scroll to it after a tick
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
});
 document.addEventListener('DOMContentLoaded', function () {
  const quickViewButtons = document.querySelectorAll('[data-bs-target="#quickViewModal"]');
  quickViewButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const title = this.getAttribute('data-title') || '';
      const price = this.getAttribute('data-price') || '';
      let images = [];
      try {
        images = JSON.parse(this.getAttribute('data-images') || '[]');
      } catch (e) {
        console.warn('Invalid data-images JSON', e);
      }

      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalPrice').textContent = price;

      const inner = document.getElementById('modalCarouselInner');
      inner.innerHTML = '';
      images.forEach((src, idx) => {
        const item = document.createElement('div');
        item.className = 'carousel-item' + (idx === 0 ? ' active' : '');
        item.innerHTML = `<img src="${src}" class="d-block w-100" alt="${title} image ${idx + 1}" loading="lazy">`;
        inner.appendChild(item);
      });
    });
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const quickViewButtons = document.querySelectorAll('[data-bs-target="#quickViewModal"]');

  quickViewButtons.forEach(button => {
    button.addEventListener('click', () => {
      const title = button.getAttribute('data-title');
      const price = button.getAttribute('data-price');
      const images = JSON.parse(button.getAttribute('data-images'));

      // Set modal title and price
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalPrice').textContent = price;

      // Clear and populate carousel
      const carouselInner = document.getElementById('modalCarouselInner');
      carouselInner.innerHTML = '';

      images.forEach((src, index) => {
        const active = index === 0 ? 'active' : '';
        const item = `
          <div class="carousel-item ${active}">
            <img src="${src}" class="d-block w-100" alt="${title} image ${index + 1}">
          </div>
        `;
        carouselInner.insertAdjacentHTML('beforeend', item);
      });
    });
  });
});