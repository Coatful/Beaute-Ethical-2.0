(function () {
  const catalogData = window.BEAUTE_CATALOG || { brands: [], products: [] };
  const products = catalogData.products || [];
  const CART_KEY = "beaute_cart_v1";
  const RECOMMENDED_CACHE_KEY = "beaute_recommended_cache_v1";
  const RECOMMENDED_WINDOW_MS = 5000;

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
  const BETHIQUE_SHARED_LINES = new Set(["AMPOULE LINE", "MODELING MASK LINE"]);
  const RECOMMENDED_GROUP_OVERRIDES = {
    "B'ethique::AMPOULE LINE": {
      title: "B'ethique Ampoules",
      summary: "Explore the full B'ethique ampoule range."
    },
    "B'ethique::MODELING MASK LINE": {
      title: "B'ethique Clay Mask",
      summary: "Explore the full B'ethique modeling mask range."
    }
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

  function brandUrl(brand) {
    return brandPageMap[brand] || "products.html";
  }

  function brandLineUrl(brand, line) {
    return `${brandUrl(brand)}?line=${encodeURIComponent(line || "")}`;
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

  function recommendedPool() {
    const grouped = new Set();
    const pool = [];

    for (const p of products) {
      const key = `${p.brand}::${p.line}`;
      const override = RECOMMENDED_GROUP_OVERRIDES[key];
      if (override) {
        if (grouped.has(key)) continue;
        grouped.add(key);
        pool.push({
          ...p,
          title: override.title,
          summary: override.summary
        });
        continue;
      }
      pool.push(p);
    }
    return pool;
  }

  function pickRandomProducts(count = 5) {
    const pool = recommendedPool();
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.min(count, pool.length));
  }

  function getRecommendedProducts(count = 5) {
    const now = Date.now();
    try {
      const cached = JSON.parse(localStorage.getItem(RECOMMENDED_CACHE_KEY) || "null");
      if (
        cached &&
        Array.isArray(cached.slugs) &&
        typeof cached.ts === "number" &&
        now - cached.ts < RECOMMENDED_WINDOW_MS
      ) {
        const mapped = cached.slugs
          .map((slug) => products.find((p) => p.slug === slug))
          .filter(Boolean);
        if (mapped.length >= Math.min(count, products.length)) return mapped.slice(0, count);
      }
    } catch {
      // ignore parse errors and regenerate
    }

    const fresh = pickRandomProducts(count);
    localStorage.setItem(
      RECOMMENDED_CACHE_KEY,
      JSON.stringify({ ts: now, slugs: fresh.map((p) => p.slug) })
    );
    return fresh;
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

  function cardMarkup(p, revealClass = "reveal", extraClass = "") {
    return `
      <article class="product-window ${revealClass} ${extraClass}" data-slug="${esc(p.slug)}">
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

  function sharedLineListMarkup(items) {
    return `
      <div class="shared-line-list">
        ${items.map((p) => `
          <article class="shared-line-item" data-slug="${esc(p.slug)}">
            <a class="shared-line-link" href="${productUrl(p.slug)}">
              <h3>${esc(p.title)}</h3>
              <p>${esc(p.summary || "View full details")}</p>
            </a>
            <button class="add-cart" type="button" data-add="${esc(p.slug)}">Add to Cart</button>
          </article>
        `).join("")}
      </div>
    `;
  }

  function linePanelMarkup(brand, line, lineItems, isActive) {
    if (brand === "B'ethique" && BETHIQUE_SHARED_LINES.has(line) && lineItems.length) {
      const banner = lineItems[0];
      return `
        <section class="line-panel ${isActive ? "active" : ""}" data-panel="${encodeURIComponent(line)}">
          <div class="shared-line-wrap">
            <div class="shared-line-banner">
              <img src="${imgSrc(banner.image)}" alt="${esc(line)} banner" loading="lazy" />
            </div>
            ${sharedLineListMarkup(lineItems)}
          </div>
        </section>
      `;
    }

    return `
      <section class="line-panel ${isActive ? "active" : ""}" data-panel="${encodeURIComponent(line)}">
        <div class="product-grid">${lineItems.map((p) => cardMarkup(p, "", "")).join("")}</div>
      </section>
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
    const lines = Object.keys(byLine).sort((a, b) => a.localeCompare(b));
    if (!lines.length) {
      root.innerHTML = `<section class="product-panel"><p>No products found.</p></section>`;
      return;
    }

    const requestedLine = new URLSearchParams(window.location.search).get("line") || "";
    const activeLine = lines.includes(requestedLine) ? requestedLine : lines[0];
    root.innerHTML = `
      <section class="brand-lines">
        <div class="line-tabs reveal" role="tablist" aria-label="${esc(brand)} lines">
          ${lines.map((line) => `
            <button
              type="button"
              class="line-tab ${line === activeLine ? "active" : ""}"
              role="tab"
              aria-selected="${line === activeLine ? "true" : "false"}"
              data-line="${encodeURIComponent(line)}"
            >${esc(line)}</button>
          `).join("")}
        </div>
        <div class="line-panels">
          ${lines.map((line) => linePanelMarkup(brand, line, byLine[line], line === activeLine)).join("")}
        </div>
      </section>
    `;

    applyBrandHeaderLogo(brand);
  }

  function applyBrandHeaderLogo(brand) {
    const pageHead = document.querySelector(".page-head");
    if (!pageHead) return;
    const title = pageHead.querySelector("h1");
    if (!title) return;
    const logoPath = brandLogos[brand];
    if (!logoPath) return;
    title.innerHTML = `<img class="brand-title-logo" src="${encodeURI(logoPath)}" alt="${esc(brand)} logo" />`;
  }

  function wireLineTabs() {
    document.addEventListener("click", (e) => {
      const btn = e.target instanceof HTMLElement ? e.target.closest(".line-tab") : null;
      if (!btn) return;
      const wrap = btn.closest(".brand-lines");
      if (!wrap) return;
      const line = btn.getAttribute("data-line");
      if (!line) return;

      wrap.querySelectorAll(".line-tab").forEach((tab) => {
        const active = tab.getAttribute("data-line") === line;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });

      wrap.querySelectorAll(".line-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.getAttribute("data-panel") === line);
      });
    });
  }

  function renderRecommended() {
    const grid = document.getElementById("recommendedGrid");
    if (!grid) return;
    const isBelowDesktop = window.matchMedia("(max-width: 1200px)").matches;
    const picks = getRecommendedProducts(isBelowDesktop ? 4 : 5);
    grid.innerHTML = picks.map((p) => cardMarkup(p, "", "tilted-card rec-card")).join("");
    setupTiltedCards();
  }

  function animateRecommendedCards() {
    if (!window.gsap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = gsap.utils.toArray("#recommendedGrid .rec-card");
    if (!cards.length) return;

    gsap.killTweensOf(cards);
    cards.forEach((card) => {
      const frame = card.querySelector(".window-img");
      const img = card.querySelector(".window-img img");
      if (frame) gsap.killTweensOf(frame);
      if (img) gsap.killTweensOf(img);
    });

    const cornerMode = window.matchMedia("(max-width: 760px)").matches && cards.length === 4;
    if (cornerMode) {
      const cornerOffsets = [
        { x: -120, y: -90, rotate: -10 },
        { x: 120, y: -90, rotate: 10 },
        { x: -120, y: 90, rotate: -8 },
        { x: 120, y: 90, rotate: 8 }
      ];

      cards.forEach((card, i) => {
        const o = cornerOffsets[i] || { x: 0, y: 50, rotate: 0 };
        gsap.set(card, { opacity: 0, x: o.x, y: o.y, scale: 0.88, rotate: o.rotate });
      });

      gsap.to(cards, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        duration: 0.82,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: {
          trigger: "#recommended",
          start: "top 84%",
          once: true
        }
      });
      return;
    }

    gsap.set(cards, { opacity: 0, y: 90, scale: 0.82, rotate: -6 });
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      duration: 0.95,
      ease: "back.out(1.55)",
      stagger: 0.11,
      scrollTrigger: {
        trigger: "#recommended",
        start: "top 78%",
        once: true
      }
    });
  }

  function wireRecommendedResponsiveCount() {
    const grid = document.getElementById("recommendedGrid");
    if (!grid) return;
    const mq = window.matchMedia("(max-width: 1200px)");
    let lastBelowDesktop = mq.matches;
    let raf = 0;
    const rerender = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nowBelowDesktop = mq.matches;
        if (nowBelowDesktop === lastBelowDesktop) return;
        lastBelowDesktop = nowBelowDesktop;
        renderRecommended();
        animateRecommendedCards();
      });
    };
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", rerender);
    else if (typeof mq.addListener === "function") mq.addListener(rerender);
    window.addEventListener("orientationchange", rerender);
    window.addEventListener("resize", rerender, { passive: true });
  }

  function setupTiltedCards() {
    const cards = document.querySelectorAll(".tilted-card");
    if (!cards.length) return;

    cards.forEach((card) => {
      const maxTilt = 14;
      let hovering = false;

      const reset = () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
        card.style.setProperty("--gloss-x", "50%");
        card.style.setProperty("--gloss-y", "30%");
      };

      reset();

      card.addEventListener("mouseenter", () => {
        hovering = true;
      });

      card.addEventListener("mousemove", (e) => {
        if (!hovering) return;
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        const tiltY = (px - 0.5) * (maxTilt * 2);
        const tiltX = (0.5 - py) * (maxTilt * 2);

        card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
        card.style.setProperty("--gloss-x", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--gloss-y", `${(py * 100).toFixed(1)}%`);
      });

      card.addEventListener("mouseleave", () => {
        hovering = false;
        reset();
      });
    });
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
    const isBethiqueSharedLine =
      product.brand === "B'ethique" &&
      (product.line === "AMPOULE LINE" || product.line === "MODELING MASK LINE");
    const detailImageClass = isBethiqueSharedLine ? "window-img detail-white-frame" : "window-img";
    const related = products.filter((p) => p.brand === product.brand && p.slug !== product.slug).slice(0, 8).map((p) => cardMarkup(p, "")).join("");

    root.innerHTML = `
      <section class="product-layout">
        <article class="product-panel reveal"><div class="${detailImageClass}"><img src="${imgSrc(product.image)}" alt="${esc(product.title)}" /></div></article>
        <article class="product-panel reveal">
          <a class="brand-pill" href="${brandUrl(product.brand)}">${esc(product.brand)}</a>
          <h1 class="product-title-main">${esc(product.title)}</h1>
          <a class="badge line-link" href="${brandLineUrl(product.brand, product.line)}">${esc(product.line)}</a>
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

  function setupLegacyHeroRipples() {
    const jq = window.jQuery || window.$;
    if (!jq || !jq.fn || !jq.fn.ripples) return false;
    const $surface = jq('body[data-page="home"] .page');
    if (!$surface.length) return false;

    try {
      try { $surface.ripples("destroy"); } catch (_) {}
      $surface.ripples({
        resolution: 512,
        dropRadius: 30,
        perturbance: 0.18
      });
    } catch (_) {
      return false;
    }

    // Strong interaction drops across full home page.
    const heroEl = $surface.get(0);
    if (!heroEl) return true;
    let lastMoveDrop = 0;

    heroEl.addEventListener("mousemove", (e) => {
      const now = performance.now();
      if (now - lastMoveDrop < 55) return;
      lastMoveDrop = now;
      const rect = heroEl.getBoundingClientRect();
      $surface.ripples("drop", e.clientX - rect.left, e.clientY - rect.top, 16, 0.11);
    }, { passive: true });

    heroEl.addEventListener("click", (e) => {
      const rect = heroEl.getBoundingClientRect();
      $surface.ripples("drop", e.clientX - rect.left, e.clientY - rect.top, 34, 0.2);
    });

    document.body.classList.add("home-ripples-active");
    document.body.classList.remove("home-ripples-fallback");
    return true;
  }

  function setupHeroInkFallback() {
    const hero = document.querySelector('body[data-page="home"] .page');
    if (!hero) return;
    let layer = hero.querySelector(".hero-ink-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "hero-ink-layer";
      hero.appendChild(layer);
    }

    const spawn = (x, y, large = false) => {
      const drop = document.createElement("span");
      drop.className = `hero-ink-drop${large ? " click" : ""}`;
      drop.style.left = `${x}px`;
      drop.style.top = `${y}px`;
      layer.appendChild(drop);
      setTimeout(() => drop.remove(), large ? 1450 : 980);
    };

    let lastMove = 0;
    hero.addEventListener("mousemove", (e) => {
      const now = performance.now();
      if (now - lastMove < 90) return;
      lastMove = now;
      const rect = hero.getBoundingClientRect();
      spawn(e.clientX - rect.left, e.clientY - rect.top, false);
    }, { passive: true });

    hero.addEventListener("click", (e) => {
      const rect = hero.getBoundingClientRect();
      spawn(e.clientX - rect.left, e.clientY - rect.top, true);
    });

    document.body.classList.add("home-ripples-fallback");
    document.body.classList.remove("home-ripples-active");
  }

  function enhanceInteractiveButtons(root = document) {
    const selector = "button, a.btn";
    const nodes = root instanceof Element ? root.querySelectorAll(selector) : document.querySelectorAll(selector);
    nodes.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.closest(".header-wrap")) return;
      if (el.dataset.fxReady === "1") return;
      if (
        el.classList.contains("qty-btn") ||
        el.hasAttribute("data-inc") ||
        el.hasAttribute("data-dec")
      ) {
        return;
      }
      if (el.classList.contains("line-tab")) {
        return;
      }

      const text = (el.textContent || "").trim();
      if (!text) return;

      el.dataset.fxReady = "1";
      el.classList.add("fx-btn");
      if (el.classList.contains("add-cart")) {
        el.classList.add("no-dot");
      }
      if (document.body.dataset.page === "cart") {
        el.classList.add("no-dot", "cart-arrow");
      }
      el.setAttribute("data-fx-text", text);
      el.innerHTML = `
        <span class="fx-btn__text">${esc(text)}</span>
        <span class="fx-btn__hover" aria-hidden="true">
          <span>${esc(text)}</span>
          <span class="fx-btn__arrow">→</span>
        </span>
        <span class="fx-btn__blob" aria-hidden="true"></span>
      `;
    });
  }

  function observeButtonInjection() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches("button, a.btn")) enhanceInteractiveButtons(node.parentElement || document);
          else enhanceInteractiveButtons(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function wireQuickSmoothAnchors() {
    const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const link = target.closest('a[href^="#"]');
      if (!(link instanceof HTMLAnchorElement)) return;

      const href = link.getAttribute("href") || "";
      if (href.length < 2) return;

      const destination = document.querySelector(href);
      if (!(destination instanceof HTMLElement)) return;

      e.preventDefault();
      const startY = window.scrollY;
      const endY = destination.getBoundingClientRect().top + window.scrollY - 8;
      const distance = endY - startY;
      if (Math.abs(distance) < 2) return;

      const duration = 460;
      const start = performance.now();
      const frame = (now) => {
        const t = Math.min((now - start) / duration, 1);
        window.scrollTo(0, startY + distance * easeInOut(t));
        if (t < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }

  function setupMobileMenu() {
    const header = document.querySelector(".header-wrap");
    const nav = header ? header.querySelector(".topbar nav") : null;
    if (!(header instanceof HTMLElement) || !(nav instanceof HTMLElement)) return;
    if (nav.querySelector(".mobile-menu-toggle")) return;

    const navLinks = Array.from(nav.querySelectorAll("a:not(.cart-link)"));
    if (!navLinks.length) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "mobile-menu-toggle";
    toggle.setAttribute("aria-label", "Open menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = '<span></span><span></span><span></span>';

    const panel = document.createElement("div");
    panel.className = "mobile-menu-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = navLinks.map((a) => a.outerHTML).join("");

    nav.insertBefore(toggle, nav.firstElementChild);
    header.appendChild(panel);

    const closeMenu = () => {
      header.classList.remove("mobile-menu-open");
      toggle.setAttribute("aria-expanded", "false");
      panel.setAttribute("aria-hidden", "true");
    };

    const openMenu = () => {
      header.classList.add("mobile-menu-open");
      toggle.setAttribute("aria-expanded", "true");
      panel.setAttribute("aria-hidden", "false");
    };

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      if (header.classList.contains("mobile-menu-open")) closeMenu();
      else openMenu();
    });

    panel.addEventListener("click", (e) => {
      const target = e.target;
      if (target instanceof HTMLElement && target.closest("a")) closeMenu();
    });

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (!header.contains(target)) closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  const page = document.body.dataset.page;
  if (page === "products") renderProductsPage();
  if (page === "brand") renderBrandPage(document.body.dataset.brand || "");
  if (page === "product") renderProductPage();
  if (page === "home") {
    renderRecommended();
    animateRecommendedCards();
    wireRecommendedResponsiveCount();
    if (!setupLegacyHeroRipples()) setupHeroInkFallback();
  }
  if (page === "cart") renderCartPage();

  updateCartCount();
  wireCartEvents();
  wireLineTabs();
  enhanceInteractiveButtons();
  observeButtonInjection();
  setupMobileMenu();
  wireQuickSmoothAnchors();
  if (page !== "home") setupRipple();
  animate();
})();
