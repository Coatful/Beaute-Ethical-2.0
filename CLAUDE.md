# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Beaute Ethical** is a static e-commerce product catalog site for a Singapore-based professional skincare distribution company. It showcases four Korean skincare brands: Merikit, Ronas, Or'jade, and B'ethique. There is no build system, bundler, or package manager — all files are served as plain HTML/CSS/JS.

## Development

Open any `.html` file directly in a browser, or use a local static server:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

There are no tests, linters, or build steps.

## Architecture

### Page routing via `data-page` attribute

Each HTML page sets `<body data-page="...">` (and optionally `data-brand="..."`). The single [app.js](app.js) IIFE reads this attribute at the bottom to decide which renderer to call:

- `home` → `renderRecommended()` + hero ripple effects (index.html)
- `products` → `renderProductsPage()` — brand hub cards
- `brand` → `renderBrandPage(data-brand)` — tabbed product lines for one brand
- `product` → `renderProductPage()` — single product detail via `?slug=` query param
- `cart` → `renderCartPage()` — cart + order enquiry form
- `orders` → `renderOrdersPage()` — admin passcode-gated order log viewer

### Key files

| File | Role |
|------|------|
| [index.html](index.html) | Home page — **self-contained** with all CSS inlined (~2400 lines), uses a pill-nav instead of the shared header |
| [styles.css](styles.css) | Shared stylesheet for all other pages |
| [app.js](app.js) | All application logic in a single IIFE — rendering, cart, order submission, animations |
| [data/catalog.js](data/catalog.js) | Product catalog — sets `window.BEAUTE_CATALOG` with `brands[]` and `products[]` arrays |
| Brand pages (`merikit.html`, `ronas.html`, `orjade.html`, `bethique.html`) | Identical shell structure with `data-page="brand"` and `data-brand="BrandName"` |

### Data flow

- **Catalog**: [data/catalog.js](data/catalog.js) exposes `window.BEAUTE_CATALOG`. Products have `slug`, `brand`, `line`, `title`, `summary`, `details` (English + Chinese), and `image` path.
- **Cart**: Stored in `localStorage` under key `beaute_cart_v1` as `[{slug, qty}]`.
- **Order enquiry**: Cart submission posts JSON to a Google Apps Script webhook (`window.BEAUTE_ORDER_WEBHOOK_URL`, set only on [cart.html](cart.html)). Orders are also saved in `localStorage` under `beaute_order_log_v1`.
- **Orders admin**: [orders.html](orders.html) is passcode-protected (prompt-based, set via `window.BEAUTE_ORDER_VIEW_PASSCODE`).

### External libraries (CDN only)

- **GSAP 3.12.5** + ScrollTrigger — scroll-reveal animations, fly-to-cart effect, tilted card animations
- **Three.js 0.160.0** — loaded but usage is limited to index.html hero effects
- **jQuery Ripples** (optional) — WebGL water ripple effect on home page with CSS ink-drop fallback

### Dual navigation patterns

- **index.html**: Uses a custom floating pill-nav (`.pill-nav`) with entirely inline CSS
- **All other pages**: Use a shared `.header-wrap` / `.topbar nav` with styles from [styles.css](styles.css) and a programmatic mobile hamburger menu (`setupMobileMenu()`)

### B'ethique brand special handling

B'ethique's AMPOULE LINE and MODELING MASK LINE use a shared-line layout (`sharedLineListMarkup()`) instead of the standard product card grid. This is controlled by the `BETHIQUE_SHARED_LINES` set and `RECOMMENDED_GROUP_OVERRIDES` in [app.js](app.js).

### Image paths

All product images live under `assets/images/{BrandName}/`. The `catalog.js` `image` field stores the relative path from `assets/` (e.g., `images/Merikit/AC Infusion Mask.jpg`). The `imgSrc()` helper prepends `assets/` and URI-encodes spaces.

## Conventions

- Product slugs follow the pattern: `{brand}-{line}-{title}` all lowercased and hyphenated
- HTML entities are escaped via the `esc()` helper — always use it when injecting dynamic content into markup
- CSS custom properties are used extensively: `--bg`, `--surface`, `--text`, `--muted`, `--line`, `--shadow`, etc.
- The `.reveal` class marks elements for GSAP scroll-triggered fade-in
- Buttons are dynamically enhanced by `enhanceInteractiveButtons()` with hover blob/arrow effects (class `.fx-btn`)
