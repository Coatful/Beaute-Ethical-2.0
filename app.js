(function () {
  const catalogData = window.BEAUTE_CATALOG || { brands: [], products: [] };
  const products = catalogData.products || [];
  const CART_KEY = "beaute_cart_v1";

  const brandPageMap = {
    "Merikit": "merikit.html",
    "Ronas": "ronas.html",
    "Or'jade": "orjade.html",
    "B'ethique": "bethique.html"
  };

  const brandLogos = {
    "Merikit": "assets/images/MERIKIT Logo.png",
    "Ronas": "assets/images/RONAS Logo.png",
    "Or'jade": "assets/images/OR'JADE Logo.png",
    "B'ethique": "assets/images/B'ethique Logo.png"
  };

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function imgSrc(path) {
    return encodeURI(`assets/${path}`);
  }

  function productUrl(slug) {
    return `product.html?slug=${encodeURIComponent(slug)}`;
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function countCart() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
  }

  function updateCartCount() {
    document.querySelectorAll("#cartCount").forEach((el) => {
      el.textContent = String(countCart());
    });
  }

  function animateToCart(sourceImg, fallbackImageSrc) {
    const cartEl = document.getElementById("cartIcon");
    if (!cartEl) return;

    let imgEl = sourceImg;
    if (!imgEl) {
      const ghost = document.createElement("img");
      ghost.src = fallbackImageSrc || "";
      ghost.style.width = "80px";
      ghost.style.height = "80px";
      ghost.style.objectFit = "contain";
      ghost.style.position = "fixed";
      ghost.style.left = `${window.innerWidth * 0.5 - 40}px`;
      ghost.style.top = `${window.innerHeight * 0.62 - 40}px`;
      ghost.style.opacity = "0";
      document.body.appendChild(ghost);
      imgEl = ghost;
      setTimeout(() => ghost.remove(), 1200);
    }

    const s = imgEl.getBoundingClientRect();
    const d = cartEl.getBoundingClientRect();

    // Quick feedback on clicked product.
    imgEl.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.9)" },
        { transform: "scale(1)" }
      ],
      { duration: 220, easing: "ease-out" }
    );

    const clone = document.createElement("img");
    clone.src = imgEl.src || fallbackImageSrc || "";
    clone.className = "fly-item";
    const size = 88;
    const startX = s.left + s.width / 2 - size / 2;
    const startY = s.top + s.height / 2 - size / 2;
    const endX = d.left + d.width / 2 - size / 2;
    const endY = d.top + d.height / 2 - size / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 10;
    const clampedStartX = Math.max(margin, Math.min(startX, vw - size - margin));
    const clampedStartY = Math.max(margin, Math.min(startY, vh - size - margin));
    const clampedEndX = Math.max(margin, Math.min(endX, vw - size - margin));
    const clampedEndY = Math.max(margin, Math.min(endY, vh - size - margin));
    const liftY = Math.max(margin, Math.min(Math.min(clampedStartY, clampedEndY) - 110, vh - size - margin));
    const midX = Math.max(
      margin,
      Math.min((clampedStartX + clampedEndX) / 2 + (clampedEndX > clampedStartX ? 20 : -20), vw - size - margin)
    );

    clone.style.left = `${clampedStartX}px`;
    clone.style.top = `${clampedStartY}px`;
    document.body.appendChild(clone);

    if (window.gsap) {
      gsap.set(clone, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
      gsap.timeline({
        onComplete: () => {
          clone.remove();
          gsap.fromTo(cartEl, { scale: 1 }, { scale: 1.18, duration: 0.14, yoyo: true, repeat: 1 });
          showCartPop(d, "Added");
        }
      })
      .to(clone, {
        x: midX - clampedStartX,
        y: liftY - clampedStartY,
        scale: 0.68,
        rotation: -9,
        duration: 0.42,
        ease: "power2.out"
      })
      .to(clone, {
        x: clampedEndX - clampedStartX,
        y: clampedEndY - clampedStartY,
        scale: 0.12,
        rotation: 12,
        opacity: 0.08,
        duration: 0.36,
        ease: "power2.in"
      });
      return;
    }

    const supportsWAAPI = typeof clone.animate === "function";
    if (supportsWAAPI) {
      clone.animate(
        [
          { transform: "translate(0px, 0px) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
          { transform: `translate(${midX - clampedStartX}px, ${liftY - clampedStartY}px) scale(0.68) rotate(-9deg)`, opacity: 1, offset: 0.58 },
          { transform: `translate(${clampedEndX - clampedStartX}px, ${clampedEndY - clampedStartY}px) scale(0.14) rotate(12deg)`, opacity: 0.15, offset: 1 }
        ],
        { duration: 760, easing: "cubic-bezier(.22,.7,.2,1)", fill: "forwards" }
      ).onfinish = () => {
        clone.remove();
        cartEl.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.15)" },
            { transform: "scale(1)" }
          ],
          { duration: 220, easing: "ease-out" }
        );
        showCartPop(d, "Added");
      };
      return;
    }

    setTimeout(() => clone.remove(), 700);
    showCartPop(d, "Added");
  }

  function showCartPop(cartRect, text = "+1") {
    const pop = document.createElement("div");
    pop.className = "cart-pop";
    pop.textContent = text;
    pop.style.left = `${cartRect.left + cartRect.width / 2 - 8}px`;
    pop.style.top = `${cartRect.top - 6}px`;
    document.body.appendChild(pop);

    if (typeof pop.animate === "function") {
      pop.animate(
        [
          { transform: "translateY(0px) scale(0.9)", opacity: 0 },
          { transform: "translateY(-8px) scale(1)", opacity: 1 },
          { transform: "translateY(-24px) scale(0.9)", opacity: 0 }
        ],
        { duration: 620, easing: "ease-out", fill: "forwards" }
      ).onfinish = () => pop.remove();
    } else {
      setTimeout(() => pop.remove(), 650);
    }
  }

  function addToCart(slug, sourceImg) {
    const product = products.find((p) => p.slug === slug);
    if (!product) return;
    const cart = getCart();
    const hit = cart.find((x) => x.slug === slug);
    if (hit) hit.qty += 1;
    else cart.push({ slug: product.slug, qty: 1 });
    saveCart(cart);
    animateToCart(sourceImg, imgSrc(product.image));
  }

  function splitDetail(text) {
    const t = String(text || "").replace(/\s+/g, " ").trim();
    if (!t) return { en: "No details available.", cn: "" };
    const idx = t.search(/[\u4E00-\u9FFF]/);
    if (idx < 0) return { en: t, cn: "" };
    return { en: t.slice(0, idx).trim(), cn: t.slice(idx).trim() };
  }

  function linesForBrand(brand) {
    return [...new Set(products.filter((p) => p.brand === brand).map((p) => p.line))];
  }

  function cardMarkup(p, revealClass = "reveal") {
    return `
      <article class="product-window ${revealClass}" data-slug="${esc(p.slug)}">
        <a class="window-link" href="${productUrl(p.slug)}">
          <div class="window-img"><img src="${imgSrc(p.image)}" alt="${esc(p.title)}" loading="lazy" /></div>
          <span class="badge">${esc(p.line)}</span>
          <h3 class="window-title">${esc(p.title)}</h3>
          <p class="window-copy">${esc(p.summary || "View full details")}</p>
        </a>
        <div class="card-actions"><button class="add-cart" type="button" data-add="${esc(p.slug)}">Add to Cart</button></div>
      </article>
    `;
  }

  function renderProductsPage() {
    const hub = document.getElementById("brandHub");
    if (!hub) return;
    const brands = ["Merikit", "Ronas", "Or'jade", "B'ethique"];
    hub.innerHTML = brands.map((brand) => {
      const items = products.filter((p) => p.brand === brand);
      return `
        <a class="brand-card reveal" href="${brandPageMap[brand]}">
          <img src="${encodeURI(brandLogos[brand])}" alt="${esc(brand)}" loading="lazy" />
          <h3>${esc(brand)}</h3>
          <p>${items.length} products</p>
          <p>${linesForBrand(brand).length} lines / subcategories</p>
        </a>
      `;
    }).join("");
  }


  function renderBrandPage(brand) {
    const root = document.getElementById("brandContent");
    if (!root) return;
    const items = products.filter((p) => p.brand === brand);
    const byLine = items.reduce((acc, item) => {
      (acc[item.line] ||= []).push(item);
      return acc;
    }, {});

    root.innerHTML = Object.keys(byLine).sort((a, b) => a.localeCompare(b)).map((line) => `
      <section class="line-group">
        <div class="line-head reveal"><h2>${esc(line)}</h2></div>
        <div class="product-grid">${byLine[line].map((p) => cardMarkup(p)).join("")}</div>
      </section>
    `).join("");
  }

  function renderRecommended() {
    const grid = document.getElementById("recommendedGrid");
    if (!grid) return;
    const brands = ["Merikit", "Ronas", "Or'jade", "B'ethique"];
    const picks = brands.map((brand) => {
      const brandItems = products.filter((p) => p.brand === brand);
      if (!brandItems.length) return null;
      const idx = Math.floor(Math.random() * brandItems.length);
      return brandItems[idx];
    }).filter(Boolean);
    grid.innerHTML = picks.map((p) => cardMarkup(p)).join("");
  }

  function renderProductPage() {
    const root = document.getElementById("productPage");
    if (!root) return;

    const slug = new URLSearchParams(window.location.search).get("slug") || "";
    const product = products.find((p) => p.slug === slug);
    if (!product) {
      root.innerHTML = `<section class="product-panel"><h2>Product not found</h2><p>Use <a href="products.html">Products</a> to browse.</p></section>`;
      return;
    }

    const d = splitDetail(product.details || product.summary);
    const related = products.filter((p) => p.brand === product.brand && p.slug !== product.slug).slice(0, 8).map((p) => cardMarkup(p, "")).join("");

    root.innerHTML = `
      <section class="product-layout">
        <article class="product-panel reveal"><div class="window-img"><img src="${imgSrc(product.image)}" alt="${esc(product.title)}" /></div></article>
        <article class="product-panel reveal">
          <p class="eyebrow">${esc(product.brand)}</p>
          <h1 class="product-title-main">${esc(product.title)}</h1>
          <span class="badge">${esc(product.line)}</span>
          <p class="lede">${esc(product.summary || "")}</p>
          <h3 class="section-label">Details</h3>
          <p class="detail-copy"><span class="en">${esc(d.en)}</span>${d.cn ? `<span class="cn">${esc(d.cn)}</span>` : ""}</p>
          <div class="actions"><button class="add-cart" type="button" data-add="${esc(product.slug)}">Add to Cart</button></div>
        </article>
      </section>
      <section class="line-group reveal"><div class="line-head"><h2>Related Products</h2></div><div class="product-grid">${related}</div></section>
    `;

    document.title = `${product.title} | Beaute Ethical`;
  }

  function renderCartPage() {
    const root = document.getElementById("cartPage");
    if (!root) return;
    const cart = getCart();
    if (!cart.length) {
      root.innerHTML = `<p>Your cart is empty. <a href="products.html">Browse products</a>.</p>`;
      return;
    }

    root.innerHTML = cart.map((item) => {
      const p = products.find((x) => x.slug === item.slug);
      if (!p) return "";
      return `
        <div class="cart-item" data-item="${esc(item.slug)}">
          <img src="${imgSrc(p.image)}" alt="${esc(p.title)}" />
          <div class="meta"><h4>${esc(p.title)}</h4><p>${esc(p.brand)} · ${esc(p.line)}</p></div>
          <div class="cart-controls">
            <button class="qty-btn" type="button" data-dec="${esc(item.slug)}">-</button><span>${item.qty}</span><button class="qty-btn" type="button" data-inc="${esc(item.slug)}">+</button><button class="remove-btn" type="button" data-remove="${esc(item.slug)}">Remove</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function wireCartEvents() {
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      const addEl = target.closest("[data-add]");
      const add = addEl ? addEl.getAttribute("data-add") : null;
      if (add) {
        const wrap = addEl.closest(".product-window, .product-panel");
        const img = wrap ? wrap.querySelector(".window-img img") : null;
        addToCart(add, img);
      }

      const incEl = target.closest("[data-inc]");
      const decEl = target.closest("[data-dec]");
      const remEl = target.closest("[data-remove]");
      const inc = incEl ? incEl.getAttribute("data-inc") : null;
      const dec = decEl ? decEl.getAttribute("data-dec") : null;
      const rem = remEl ? remEl.getAttribute("data-remove") : null;
      if (inc || dec || rem) {
        const slug = inc || dec || rem;
        const cart = getCart();
        const idx = cart.findIndex((x) => x.slug === slug);
        if (idx < 0) return;
        if (inc) cart[idx].qty += 1;
        if (dec) cart[idx].qty -= 1;
        if (rem || cart[idx].qty <= 0) cart.splice(idx, 1);
        saveCart(cart);
        if (document.body.dataset.page === "cart") renderCartPage();
      }
    });
  }

  function setupRipple() {
    const bg = document.querySelector(".ambient-bg");
    if (!bg) return;
    let layer = bg.querySelector(".ripple-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "ripple-layer";
      bg.appendChild(layer);
    }

    const move = (x, y) => {
      bg.style.setProperty("--mx", `${x}%`);
      bg.style.setProperty("--my", `${y}%`);
    };

    const spawnRipple = (x, y, isClick = false) => {
      const ripple = document.createElement("span");
      ripple.className = `water-ripple${isClick ? " click" : ""}`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      layer.appendChild(ripple);
      setTimeout(() => ripple.remove(), isClick ? 1800 : 1200);
    };

    window.addEventListener("mousemove", (e) => {
      move((e.clientX / window.innerWidth) * 100, (e.clientY / window.innerHeight) * 100);
    });

    window.addEventListener("touchmove", (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      move((t.clientX / window.innerWidth) * 100, (t.clientY / window.innerHeight) * 100);
    }, { passive: true });

    window.addEventListener("click", (e) => {
      spawnRipple(e.clientX, e.clientY, true);
    });
  }


  function animate() {
    if (!window.gsap) return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });

    gsap.to(".orb-a", { x: 90, y: 56, scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: true } });
    gsap.to(".orb-b", { x: -120, y: -72, scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: true } });
  }

  const page = document.body.dataset.page;
  if (page === "products") renderProductsPage();
  if (page === "brand") renderBrandPage(document.body.dataset.brand || "");
  if (page === "product") renderProductPage();
  if (page === "home") renderRecommended();
  if (page === "cart") renderCartPage();

  updateCartCount();
  wireCartEvents();
  setupRipple();
  animate();
})();
