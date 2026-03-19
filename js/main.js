/* ============================================================
   NØ QUIT PERFORMANCE — Main JS
   Shared across all pages

   SHOPIFY INTEGRATION: Fill in the four CONFIGURE values below
   with your real credentials. Until then, the site runs in
   demo mode — cart drawer works, no real orders placed.
============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     SHOPIFY CONFIGURATION — FILL THESE IN

     SHOPIFY_DOMAIN:
       Your store URL without /admin
       Example: 'noquit-performance.myshopify.com'

     STOREFRONT_TOKEN:
       Shopify admin → Settings → Apps → Develop apps
       → Create app "NQ Storefront" → Storefront API scopes
       → enable these three:
           unauthenticated_read_product_listings
           unauthenticated_write_checkouts
           unauthenticated_read_checkouts
       → Install app → copy the access token (starts with shpat_)

     VARIANT_ONETIME:
       Shopify admin → Products → your product
       → click one-time variant → URL ends in /variants/XXXXXXXXXX
       → format as: 'gid://shopify/ProductVariant/XXXXXXXXXX'

     VARIANT_SUBSCRIBE:
       Same process, for the subscribe variant
       (created automatically when you install Seal Subscriptions)
  ---------------------------------------------------------- */
  const SHOPIFY_DOMAIN    = 'YOUR-STORE.myshopify.com';        // CONFIGURE
  const STOREFRONT_TOKEN  = 'YOUR-STOREFRONT-TOKEN';            // CONFIGURE
  const VARIANT_ONETIME   = 'gid://shopify/ProductVariant/YOUR-ONETIME-ID';   // CONFIGURE
  const VARIANT_SUBSCRIBE = 'gid://shopify/ProductVariant/YOUR-SUBSCRIBE-ID'; // CONFIGURE

  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */
  const state = {
    cartOpen: false,
    mobileNavOpen: false,
    cartItems: [],
    selectedOption: 'subscribe',
    qty: 1,
  };

  /* ----------------------------------------------------------
     DOM HELPERS
  ---------------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ----------------------------------------------------------
     HEADER — scroll behavior
  ---------------------------------------------------------- */
  const header = $('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------
     CART DRAWER
  ---------------------------------------------------------- */
  const cartBackdrop = $('#cartBackdrop');
  const cartDrawer   = $('#cartDrawer');
  const cartTrigger  = $$('.cart-trigger');
  const cartClose    = $('#cartClose');

  function openCart() {
    if (!cartDrawer) return;
    state.cartOpen = true;
    cartDrawer.classList.add('open');
    cartBackdrop?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    state.cartOpen = false;
    cartDrawer?.classList.remove('open');
    cartBackdrop?.classList.remove('open');
    document.body.style.overflow = '';
  }

  cartTrigger.forEach(btn =>
    btn.addEventListener('click', () => state.cartOpen ? closeCart() : openCart())
  );
  cartClose?.addEventListener('click', closeCart);
  cartBackdrop?.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (state.cartOpen) closeCart();
      if (state.mobileNavOpen) closeMobileNav();
    }
  });

  /* ----------------------------------------------------------
     MOBILE NAV
  ---------------------------------------------------------- */
  const hamburger   = $('#navHamburger');
  const mobileNav   = $('#mobileNav');
  const mobileClose = $('#mobileNavClose');

  function openMobileNav() {
    state.mobileNavOpen = true;
    hamburger?.classList.add('open');
    mobileNav?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    state.mobileNavOpen = false;
    hamburger?.classList.remove('open');
    mobileNav?.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', () =>
    state.mobileNavOpen ? closeMobileNav() : openMobileNav()
  );
  mobileClose?.addEventListener('click', closeMobileNav);
  $$('.mobile-nav a').forEach(a => a.addEventListener('click', closeMobileNav));

  /* ----------------------------------------------------------
     SCROLL ANIMATIONS — IntersectionObserver
  ---------------------------------------------------------- */
  const animObserver = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        animObserver.unobserve(entry.target);
      }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  $$('[data-animate]').forEach(el => animObserver.observe(el));

  /* ----------------------------------------------------------
     ACCORDION
  ---------------------------------------------------------- */
  $$('.accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.accordion-item');
      const isOpen = item.classList.contains('open');
      $$('.accordion-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.accordion-body').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        const body = item.querySelector('.accordion-body');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  /* ----------------------------------------------------------
     QUANTITY SELECTOR
  ---------------------------------------------------------- */
  $$('.qty-selector').forEach(sel => {
    const dec = sel.querySelector('.qty-dec');
    const inc = sel.querySelector('.qty-inc');
    const val = sel.querySelector('.qty-val');
    if (!dec || !inc || !val) return;
    state.qty = parseInt(val.textContent) || 1;
    dec.addEventListener('click', () => {
      if (state.qty > 1) { state.qty--; val.textContent = state.qty; }
    });
    inc.addEventListener('click', () => {
      if (state.qty < 99) { state.qty++; val.textContent = state.qty; }
    });
  });

  /* ----------------------------------------------------------
     PURCHASE TOGGLE (subscribe / one-time)
     Tracks which option is selected so checkout uses
     the correct Shopify variant ID.
  ---------------------------------------------------------- */
  $$('.purchase-option').forEach(opt => {
    opt.addEventListener('click', () => {
      $$('.purchase-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        state.selectedOption = radio.value === 'onetime' ? 'onetime' : 'subscribe';
      }
    });
  });

  // Set default selected state on page load
  const defaultOpt =
    $('.purchase-option input[type="radio"]:checked')?.closest('.purchase-option')
    || $('.purchase-option');
  if (defaultOpt) {
    defaultOpt.classList.add('selected');
    const r = defaultOpt.querySelector('input[type="radio"]');
    if (r) state.selectedOption = r.value === 'onetime' ? 'onetime' : 'subscribe';
  }

  /* ----------------------------------------------------------
     SHOPIFY STOREFRONT API — create real checkout

     When credentials are filled in above, this calls Shopify
     and returns a secure checkout URL. The customer is
     redirected there to complete payment.

     What happens after checkout:
       - Shopify Flow fires order alert to Elias
       - Klaviyo sends order confirmation email
       - Seal Subscriptions records subscription if applicable
       - Pirate Ship syncs the order for label printing
  ---------------------------------------------------------- */
  async function createShopifyCheckout(variantId, quantity) {
    const query = `
      mutation checkoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout { id webUrl }
          checkoutUserErrors { code field message }
        }
      }
    `;
    const resp = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query,
          variables: { input: { lineItems: [{ variantId, quantity }] } },
        }),
      }
    );
    const data     = await resp.json();
    const checkout = data?.data?.checkoutCreate?.checkout;
    const errors   = data?.data?.checkoutCreate?.checkoutUserErrors;
    if (errors?.length) throw new Error(errors[0].message);
    return checkout;
  }

  /* ----------------------------------------------------------
     ADD TO CART — wired to Shopify
  ---------------------------------------------------------- */
  $$('.add-to-cart-btn').forEach(btn => {
    if (!btn.id) btn.id = 'checkoutBtn';

    btn.addEventListener('click', async () => {
      const originalText = btn.textContent;
      btn.textContent    = 'Loading...';
      btn.disabled       = true;

      try {
        // DEMO MODE: credentials not yet configured
        if (SHOPIFY_DOMAIN === 'YOUR-STORE.myshopify.com') {
          const price = state.selectedOption === 'onetime' ? '$59.00' : '$50.15';
          addToCartDemo({
            name:    'NØ QUIT Phenylcapsaicin',
            variant: state.selectedOption === 'onetime'
              ? '60 Capsules — One-time'
              : '60 Capsules — Subscribe & Save',
            price,
            qty: state.qty,
            img: 'images/bottle.png',
          });
          openCart();
          btn.textContent = originalText;
          btn.disabled    = false;
          return;
        }

        // LIVE MODE: create real Shopify checkout and redirect
        const variantId = state.selectedOption === 'onetime'
          ? VARIANT_ONETIME
          : VARIANT_SUBSCRIBE;
        const checkout = await createShopifyCheckout(variantId, state.qty);
        window.location.href = checkout.webUrl;

      } catch (err) {
        console.error('Checkout error:', err);
        btn.textContent = 'Try again';
        btn.disabled    = false;
        setTimeout(() => { btn.textContent = originalText; }, 2000);
      }
    });
  });

  /* ----------------------------------------------------------
     CART DEMO — used until Shopify credentials are filled in
     Identical behaviour to the original cart drawer.
  ---------------------------------------------------------- */
  function addToCartDemo(item) {
    state.cartItems.push(item);
    renderCart();
    updateCartCount();
  }

  function renderCart() {
    const empty   = $('#cartEmpty');
    const itemsEl = $('#cartItemsWrap');
    const totalEl = $('#cartTotal');
    if (!itemsEl) return;

    if (state.cartItems.length === 0) {
      if (empty) empty.style.display = 'flex';
      itemsEl.style.display = 'none';
    } else {
      if (empty) empty.style.display = 'none';
      itemsEl.style.display = 'block';
      itemsEl.innerHTML = state.cartItems.map((item, i) => `
        <div class="cart-item">
          <div class="cart-item-img">
            <img src="${item.img}" alt="${item.name}" loading="lazy"
              style="object-fit:contain;background:#161616;">
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-sub">${item.variant}</div>
            <div class="cart-item-controls">
              <button class="cart-qty-btn" data-action="dec" data-index="${i}">−</button>
              <span class="cart-qty-val">${item.qty}</span>
              <button class="cart-qty-btn" data-action="inc" data-index="${i}">+</button>
            </div>
          </div>
          <div class="cart-item-price">${item.price}</div>
        </div>
      `).join('');

      $$('.cart-qty-btn', itemsEl).forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.index);
          if (btn.dataset.action === 'dec')
            state.cartItems[i].qty = Math.max(1, state.cartItems[i].qty - 1);
          if (btn.dataset.action === 'inc')
            state.cartItems[i].qty++;
          renderCart();
          updateCartCount();
        });
      });
    }

    const total = state.cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0) * item.qty;
    }, 0);
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
  }

  function updateCartCount() {
    const total = state.cartItems.reduce((s, i) => s + i.qty, 0);
    $$('.cart-count').forEach(el => {
      el.textContent = total;
      el.classList.toggle('visible', total > 0);
    });
  }

  /* ----------------------------------------------------------
     STICKY CTA — hide when purchase module is visible
  ---------------------------------------------------------- */
  const stickyCta   = $('.sticky-cta');
  const purchaseMod = $('.purchase-module');
  if (stickyCta && purchaseMod) {
    new IntersectionObserver(
      entries => entries.forEach(entry => {
        stickyCta.style.transform = entry.isIntersecting
          ? 'translateY(100%)' : 'translateY(0)';
      }),
      { threshold: 0.1 }
    ).observe(purchaseMod);
  }

  /* ----------------------------------------------------------
     EMAIL FORM — submit feedback
  ---------------------------------------------------------- */
  $$('.email-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('.email-input');
      const btn   = form.querySelector('button[type="submit"]');
      if (!input?.value.trim()) return;
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Done.';
        btn.disabled    = true;
        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled    = false;
          input.value     = '';
        }, 3000);
      }
    });
  });

  /* ----------------------------------------------------------
     PRODUCT IMAGE GALLERY (PDP)
  ---------------------------------------------------------- */
  const thumbs  = $$('.gallery-thumb');
  const mainImg = $('#galleryMain');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImg) {
        mainImg.style.opacity    = '0';
        mainImg.style.transition = 'opacity 0.2s ease';
        setTimeout(() => {
          mainImg.src           = thumb.dataset.src;
          mainImg.style.opacity = '1';
        }, 200);
      }
    });
  });

  /* ----------------------------------------------------------
     VIDEO — play/pause on viewport visibility
  ---------------------------------------------------------- */
  $$('video[data-autoplay]').forEach(video => {
    new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      }),
      { threshold: 0.3 }
    ).observe(video);
  });

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  renderCart();

})();
