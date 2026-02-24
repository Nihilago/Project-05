// script.js

// ---------- API helpers ----------
async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('GET ' + url + ' failed ' + res.status);
  return await res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'POST ' + url + ' failed ' + res.status);
  }
  return await res.json();
}

async function apiPatch(url, body) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'PATCH ' + url + ' failed ' + res.status);
  }
  return await res.json();
}

// ---------- error helpers ----------
function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

function clearError(el) {
  if (!el) return;
  el.textContent = '';
  el.classList.remove('show');
}

// ---------- DOM refs ----------
const catalogusListEl = document.getElementById('catalogus-list');
const catalogusErrorEl = document.getElementById('catalogus-error');
const productCountLabelEl = document.getElementById('product-count-label');
const categoryBarEl = document.getElementById('category-bar');
const genderFilterEl = document.getElementById('gender-filter');

const cartToggleButtonEl = document.getElementById('cart-toggle-button');
const cartPanelEl = document.getElementById('cart-panel');
const cartErrorEl = document.getElementById('cart-error');
const cartItemsEl = document.getElementById('cart-items');
const cartItemsCountLabelEl = document.getElementById('cart-items-count-label');
const cartCountBadgeEl = document.getElementById('cart-count-badge');f
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartShippingEl = document.getElementById('cart-shipping');
const cartTotalEl = document.getElementById('cart-total');
const cartClearBtnEl = document.getElementById('cart-clear-btn');
const cartCheckoutBtnEl = document.getElementById('cart-checkout-btn');

// Modal refs
const modalBackdropEl = document.getElementById('product-modal');
const modalCloseEl = document.getElementById('product-modal-close');
const modalImgEl = document.getElementById('modal-img');
const modalTagEl = document.getElementById('modal-tag');
const modalNameEl = document.getElementById('modal-name');
const modalBrandEl = document.getElementById('modal-brand');
const modalPriceEl = document.getElementById('modal-price');
const modalFlavourEl = document.getElementById('modal-flavour');
const modalAddBtnEl = document.getElementById('modal-add-to-cart');
const modalGenderEl = document.getElementById('modal-gender');
const modalTagsEl = document.getElementById('modal-tags');
const modalSizesEl = document.getElementById('modal-sizes');

// ---------- state ----------
let allProducts = [];
let activeCategory = 'all';
let activeGender = 'all';
let modalCurrentItemId = null;
let modalCurrentSize = null;

// ---------- tag helpers ----------
function normalizeTagValue(tag) {
  if (!tag) return '';
  if (typeof tag !== 'string') return String(tag).toLowerCase();
  if (tag.startsWith('#')) return tag.slice(1).toLowerCase();
  return tag.toLowerCase();
}

function normalizeTags(tagField) {
  if (Array.isArray(tagField)) {
    return tagField.map(normalizeTagValue);
  }
  return [normalizeTagValue(tagField)];
}

// ---------- filtering ----------
function getFilteredProducts() {
  return allProducts.filter((p) => {
    const tags = normalizeTags(p.tag);
    const gender = (p.gender || 'unisex').toLowerCase();

    const categoryMatch = activeCategory === 'all' ? true : tags.includes(activeCategory);

    let genderMatch;
    if (activeGender === 'all') {
      genderMatch = true;
    } else if (activeGender === 'unisex') {
      genderMatch = gender === 'unisex';
    } else {
      genderMatch = gender === activeGender || gender === 'unisex';
    }

    return categoryMatch && genderMatch;
  });
}

// ---------- render catalog ----------
function renderCatalogGrid() {
  if (!catalogusListEl || !productCountLabelEl) return;

  const items = getFilteredProducts();
  catalogusListEl.innerHTML = '';

  if (!items.length) {
    catalogusListEl.innerHTML = 'No pieces in this selection yet.';
    productCountLabelEl.textContent = '0 pieces';
    return;
  }

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'product-card';
    if (item.id) card.dataset.id = item.id;

    const tags = normalizeTags(item.tag);
    const categoryLabel = (tags[0] || 'piece').toUpperCase();
    const price = Number(item.prijs || item.price || 0);
    const genderLabel = (item.gender || 'unisex').toUpperCase();

    card.innerHTML = `
      <div class="product-image-wrapper">
        <img src="${item.afbeelding || ''}" alt="${item.naam || ''}">
        <span class="product-tag">${categoryLabel}</span>
      </div>
      <div class="product-info">
        <div class="product-title-row">
          <h3>${item.naam || ''}</h3>
          <span class="product-price">€ ${price.toFixed(2)}</span>
        </div>
        <div class="product-meta">
          <span>${item.merk || '"2005"'}</span>
          <span>${genderLabel}</span>
        </div>
        <div class="product-actions">
          <button type="button" class="btn-add" data-id="${item.id}">
            View
          </button>
        </div>
      </div>
    `;

    fragment.appendChild(card);
  });

  catalogusListEl.appendChild(fragment);
  productCountLabelEl.textContent = `${items.length} pieces`;

  catalogusListEl.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (!id) return;
      const product = allProducts.find((p) => p.id === id);
      if (!product) return;
      openProductModal(product);
    });
  });
}

// ---------- filters UI ----------
function renderCategoryBar() {
  if (!categoryBarEl) return;
  const allTags = new Set();

  allProducts.forEach((p) => {
    normalizeTags(p.tag).forEach((t) => {
      if (t) allTags.add(t);
    });
  });

  const tags = Array.from(allTags).sort();
  categoryBarEl.innerHTML = '';

  const allChip = document.createElement('button');
  allChip.className = 'chip category-chip';
  if (activeCategory === 'all') allChip.classList.add('active');
  allChip.innerHTML = `<span class="chip-dot"></span><span>All</span>`;
  allChip.addEventListener('click', () => {
    activeCategory = 'all';
    renderCategoryBar();
    renderCatalogGrid();
  });
  categoryBarEl.appendChild(allChip);

  tags.forEach((tag) => {
    const chip = document.createElement('button');
    chip.className = 'chip category-chip';
    if (activeCategory === tag) chip.classList.add('active');
    chip.innerHTML = `<span class="chip-dot"></span><span>${tag}</span>`;
    chip.addEventListener('click', () => {
      activeCategory = tag;
      renderCategoryBar();
      renderCatalogGrid();
    });
    categoryBarEl.appendChild(chip);
  });
}

function renderGenderFilter() {
  if (!genderFilterEl) return;

  const options = [
    { id: 'all', label: 'All' },
    { id: 'women', label: 'Women' },
    { id: 'men', label: 'Men' },
    { id: 'unisex', label: 'Unisex' },
  ];

  genderFilterEl.innerHTML = '';

  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    if (activeGender === opt.id) btn.classList.add('active');
    btn.innerHTML = `<span class="chip-dot"></span><span>${opt.label}</span>`;
    btn.addEventListener('click', () => {
      activeGender = opt.id;
      renderGenderFilter();
      renderCatalogGrid();
    });
    genderFilterEl.appendChild(btn);
  });
}

// ---------- cart rendering ----------
async function loadCart() {
  if (!cartItemsEl) return;
  clearError(cartErrorEl);

  let data;
  try {
    data = await apiGet('/api/cart');
  } catch (err) {
    showError(cartErrorEl, 'Could not load basket.');
    return;
  }

  const items = Array.isArray(data.items) ? data.items : [];
  cartItemsEl.innerHTML = '';

  if (!items.length) {
    cartItemsEl.innerHTML = '<div class="empty-cart">Your basket is empty.</div>';
    if (cartItemsCountLabelEl) cartItemsCountLabelEl.textContent = '0 items';
    if (cartCountBadgeEl) cartCountBadgeEl.textContent = '0';
    if (cartSubtotalEl) cartSubtotalEl.textContent = '0.00';
    if (cartShippingEl) cartShippingEl.textContent = '0.00';
    if (cartTotalEl) cartTotalEl.textContent = '0.00';
    return;
  }

  const fragment = document.createDocumentFragment();
  let subtotal = 0;

  items.forEach((ci) => {
    const price = Number(ci.prijs || ci.price || 0);
    const qty = Number(ci.aantal || ci.quantity || ci.qty || 1);
    const lineTotal = Number(ci.regelTotaal || ci.lineTotal || price * qty);
    subtotal += lineTotal;

    const selectedSize = ci.size || '';

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.id = ci.itemId || ci.id;

    row.innerHTML = `
      <img src="${ci.afbeelding || ci.image || ''}" alt="${ci.naam || ci.name || ''}">
      <div class="cart-item-info">
        <h4>${ci.naam || ci.name || ''}</h4>
        <p>${ci.merk || ci.brand || '"2005"'}</p>
        <div class="cart-item-meta-row">
          <span>€ ${price.toFixed(2)}</span>
          ${selectedSize ? `<span>Size: ${selectedSize}</span>` : ''}
        </div>
      </div>
      <div class="cart-item-right">
        <span class="cart-item-price">€ ${lineTotal.toFixed(2)}</span>
        <div class="qty-controls">
          <button class="btn-qty" data-action="dec" data-id="${ci.itemId || ci.id}">-</button>
          <span>${qty}</span>
          <button class="btn-qty" data-action="inc" data-id="${ci.itemId || ci.id}">+</button>
        </div>
      </div>
    `;

    fragment.appendChild(row);
  });

  cartItemsEl.appendChild(fragment);

  const shipping = Number(data.shipping || 0);
  const total = subtotal + shipping;

  if (cartItemsCountLabelEl) cartItemsCountLabelEl.textContent = `${items.length} items`;
  if (cartCountBadgeEl) cartCountBadgeEl.textContent = String(items.length);
  if (cartSubtotalEl) cartSubtotalEl.textContent = subtotal.toFixed(2);
  if (cartShippingEl) cartShippingEl.textContent = shipping.toFixed(2);
  if (cartTotalEl) cartTotalEl.textContent = total.toFixed(2);
}

// ---------- cart interactions ----------

// toggle cart open/close on button
if (cartToggleButtonEl && cartPanelEl) {
  cartToggleButtonEl.addEventListener('click', (e) => {
    e.stopPropagation();
    cartPanelEl.classList.toggle('open');
  });
}

// close cart when clicking outside
document.addEventListener('click', (e) => {
  if (!cartPanelEl || !cartToggleButtonEl) return;

  const clickInsidePanel = cartPanelEl.contains(e.target);
  const clickOnToggle = cartToggleButtonEl.contains(e.target);

  if (!clickInsidePanel && !clickOnToggle) {
    cartPanelEl.classList.remove('open');
  }
});

// quantity buttons (delegated)
if (cartItemsEl) {
  cartItemsEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-qty');
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (!id || !action) return;

    let delta = 0;
    if (action === 'inc') delta = 1;
    if (action === 'dec') delta = -1;

    try {
      await apiPatch(`/api/cart/${encodeURIComponent(id)}`, { delta });
      await loadCart();
    } catch (err) {
      showError(cartErrorEl, 'Could not update quantity.');
    }
  });
}

// clear cart by deleting each line
if (cartClearBtnEl) {
  cartClearBtnEl.addEventListener('click', async () => {
    try {
      const data = await apiGet('/api/cart');
      const items = Array.isArray(data.items) ? data.items : [];
      for (const ci of items) {
        const id = ci.itemId || ci.id;
        if (!id) continue;
        await fetch(`/api/cart/${encodeURIComponent(id)}`, { method: 'DELETE' });
      }
      await loadCart();
    } catch (err) {
      showError(cartErrorEl, 'Could not clear basket.');
    }
  });
}

// fake checkout
if (cartCheckoutBtnEl) {
  cartCheckoutBtnEl.addEventListener('click', () => {
    alert('Demo store – no real checkout.');
  });
}

// ---------- modal helpers ----------
function renderModalTags(item) {
  if (!modalTagsEl) return;
  modalTagsEl.innerHTML = '';

  const tags = normalizeTags(item.tag);
  tags.forEach((t) => {
    const span = document.createElement('span');
    span.className = 'product-modal-tag-chip';
    span.textContent = `#${t}`;
    modalTagsEl.appendChild(span);
  });
}

function renderModalSizes(item) {
  if (!modalSizesEl) return;
  modalSizesEl.innerHTML = '';

  const sizes = Array.isArray(item.maten) ? item.maten : [];
  sizes.forEach((size) => {
    const span = document.createElement('span');
    span.className = 'product-modal-size-pill';
    span.textContent = size;
    span.dataset.size = size;
    span.addEventListener('click', () => {
      modalCurrentSize = size;
      modalSizesEl
        .querySelectorAll('.product-modal-size-pill')
        .forEach((el) => el.classList.toggle('active', el.dataset.size === size));
    });
    modalSizesEl.appendChild(span);
  });

  if (sizes.length) {
    modalCurrentSize = sizes[0];
    const first = modalSizesEl.querySelector('.product-modal-size-pill');
    if (first) first.classList.add('active');
  } else {
    modalCurrentSize = null;
  }
}

function openProductModal(item) {
  if (!modalBackdropEl) return;
  modalCurrentItemId = item.id || null;

  if (modalImgEl) {
    modalImgEl.src = item.afbeelding || '';
    modalImgEl.alt = item.naam || '';
  }
  if (modalTagEl) {
    const tags = normalizeTags(item.tag);
    modalTagEl.textContent = (tags[0] || 'piece').toUpperCase();
  }
  if (modalNameEl) modalNameEl.textContent = item.naam || '';
  if (modalBrandEl) modalBrandEl.textContent = item.merk || '"2005"';
  if (modalPriceEl) {
    const price = Number(item.prijs || item.price || 0);
    modalPriceEl.textContent = price.toFixed(2);
  }
  if (modalFlavourEl) modalFlavourEl.textContent = item.flavour || '';
  if (modalGenderEl) modalGenderEl.textContent = (item.gender || 'unisex').toUpperCase();

  renderModalTags(item);
  renderModalSizes(item);

  modalBackdropEl.classList.add('open');
}

function closeProductModal() {
  if (!modalBackdropEl) return;
  modalBackdropEl.classList.remove('open');
  modalCurrentItemId = null;
  modalCurrentSize = null;
}

// modal events
if (modalCloseEl) {
  modalCloseEl.addEventListener('click', closeProductModal);
}

if (modalBackdropEl) {
  modalBackdropEl.addEventListener('click', (e) => {
    if (e.target === modalBackdropEl) {
      closeProductModal();
    }
  });
}

// add to cart from modal
if (modalAddBtnEl) {
  modalAddBtnEl.addEventListener('click', async () => {
    if (!modalCurrentItemId) return;

    try {
      await apiPost('/api/cart', {
        itemId: modalCurrentItemId,
        quantity: 1,
        size: modalCurrentSize || null,
      });
      await loadCart();
      closeProductModal();
    } catch (err) {
      showError(cartErrorEl, 'Could not add to basket.');
    }
  });
}

// ---------- Conveyor display on home page ----------
    async function apiGet(url) {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("GET " + url + " failed " + res.status);
      }
      return await res.json();
    }

    async function initHomeFeaturedConveyor() {
      const trackEl = document.getElementById("home-feature-track");
      if (!trackEl) return;

      try {
        const data = await apiGet("/api/clothes");
        const items = Array.isArray(data) ? data.slice(0, 20) : [];
        if (!items.length) return;

        function buildStrip() {
          const strip = document.createElement("div");
          strip.className = "home-feature-strip";
          items.forEach((item) => {
            if (!item || !item.afbeelding) return;
            const img = document.createElement("img");
            img.src = item.afbeelding;
            img.alt = item.naam || "";
            strip.appendChild(img);
          });
          return strip;
        }

        trackEl.innerHTML = "";
        trackEl.appendChild(buildStrip());
        trackEl.appendChild(buildStrip());
      } catch (err) {
        console.error("Home featured conveyor failed", err);
      }
    }

    document.addEventListener("DOMContentLoaded", initHomeFeaturedConveyor);

// ---------- initial load ----------
async function init() {
  try {
    const data = await apiGet('/api/clothes');
    allProducts = Array.isArray(data) ? data : [];
  } catch (err) {
    showError(catalogusErrorEl, 'Could not load catalog.');
    allProducts = [];
  }

  renderCategoryBar();
  renderGenderFilter();
  renderCatalogGrid();
  loadCart();
}

init();
