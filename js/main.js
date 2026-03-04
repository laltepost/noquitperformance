/* ============================================================
   NØ QUIT PERFORMANCE — Main JS
   Shared across all pages
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */
  const state = {
    cartOpen: false,
    mobileNavOpen: false,
    cartItems: [],
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
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
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

  cartTrigger.forEach(btn => btn.addEventListener('click', () =>
    state.cartOpen ? closeCart() : openCart()
  ));

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
  const hamburger    = $('#navHamburger');
  const mobileNav    = $('#mobileNav');
  const mobileClose  = $('#mobileNavClose');

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
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          animObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  $$('[data-animate]').forEach(el => animObserver.observe(el));

  /* ----------------------------------------------------------
     VIDEO PLAY/PAUSE — only play when in viewport
  ---------------------------------------------------------- */
  const videoPlayObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.25 }
  );
  $$('video[autoplay]').forEach(v => videoPlayObserver.observe(v));

  /* ----------------------------------------------------------
     ACCORDION
  ---------------------------------------------------------- */
  $$('.accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      const isOpen = item.classList.contains('open');

      // Close all
      $$('.accordion-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.accordion-body').style.maxHeight = null;
      });

      // Open clicked if it was closed
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

    let qty = parseInt(val.textContent) || 1;

    dec.addEventListener('click', () => {
      if (qty > 1) { qty--; val.textContent = qty; }
    });
    inc.addEventListener('click', () => {
      if (qty < 99) { qty++; val.textContent = qty; }
    });
  });

  /* ----------------------------------------------------------
     PURCHASE TOGGLE (subscribe / one-time)
  ---------------------------------------------------------- */
  $$('.purchase-option').forEach(opt => {
    opt.addEventListener('click', () => {
      $$('.purchase-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      updateCartButtonPrice(opt);
    });
  });

  function updateCartButtonPrice(opt) {
    const price = opt.querySelector('.po-price')?.textContent;
    const addBtn = $('.pdp-add-btn');
    if (addBtn && price) {
      addBtn.dataset.price = price;
    }
  }

  /* ----------------------------------------------------------
     ADD TO CART (demo behavior)
  ---------------------------------------------------------- */
  $$('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = $('.purchase-option.selected');
      const price = selected?.querySelector('.po-price')?.textContent || '$59.00';
      const qty   = parseInt($('.qty-val')?.textContent) || 1;

      addToCart({
        name: 'NØ QUIT Phenylcapsaicin',
        variant: '60 Capsules',
        price: price,
        qty: qty,
        img: '../Brand_assets/Precision-engineered_output__version_1.png',
      });

      openCart();
    });
  });

  function addToCart(item) {
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
      empty?.style && (empty.style.display = 'flex');
      itemsEl.style.display = 'none';
    } else {
      if (empty) empty.style.display = 'none';
      itemsEl.style.display = 'block';

      itemsEl.innerHTML = state.cartItems.map((item, i) => `
        <div class="cart-item">
          <div class="cart-item-img">
            <img src="${item.img}" alt="${item.name}" loading="lazy" style="object-fit:contain;background:#161616;">
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

      // Re-bind qty buttons
      $$('.cart-qty-btn', itemsEl).forEach(btn => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.index);
          const action = btn.dataset.action;
          if (action === 'dec') state.cartItems[i].qty = Math.max(1, state.cartItems[i].qty - 1);
          if (action === 'inc') state.cartItems[i].qty++;
          renderCart();
          updateCartCount();
        });
      });
    }

    // Total
    const total = state.cartItems.reduce((sum, item) => {
      const val = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
      return sum + val * item.qty;
    }, 0);
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  }

  function updateCartCount() {
    const total = state.cartItems.reduce((s, i) => s + i.qty, 0);
    $$('.cart-count').forEach(el => {
      el.textContent = total;
      el.classList.toggle('visible', total > 0);
    });
  }

  /* ----------------------------------------------------------
     STICKY CTA — hide when purchase module visible
  ---------------------------------------------------------- */
  const stickyCta  = $('.sticky-cta');
  const purchaseMod = $('.purchase-module');

  if (stickyCta && purchaseMod) {
    const stickyObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          stickyCta.style.transform = entry.isIntersecting ? 'translateY(100%)' : 'translateY(0)';
        });
      },
      { threshold: 0.1 }
    );
    stickyObserver.observe(purchaseMod);
  }

  /* ----------------------------------------------------------
     EMAIL FORM — demo submit
  ---------------------------------------------------------- */
  $$('.email-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('.email-input');
      const btn   = form.querySelector('button[type="submit"]');
      if (!input || !input.value.trim()) return;

      if (btn) {
        const orig = btn.textContent;
        btn.textContent = 'Done.';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
          input.value = '';
        }, 3000);
      }
    });
  });

  /* ----------------------------------------------------------
     PRODUCT IMAGE GALLERY (PDP)
  ---------------------------------------------------------- */
  const thumbs = $$('.gallery-thumb');
  const mainImg = $('#galleryMain');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = thumb.dataset.src;
          mainImg.style.opacity = '1';
        }, 200);
        mainImg.style.transition = 'opacity 0.2s ease';
      }
    });
  });

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  renderCart();

})();
