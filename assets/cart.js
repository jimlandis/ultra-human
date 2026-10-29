/* Client-side cart (draft). Stores { variantId: qty } in this browser's localStorage only.
   Checkout hands the items to the official store via a Shopify cart permalink:
   STORE_URL/cart/VARIANT:QTY,VARIANT:QTY  (+ affiliate param from config.js). */
(function () {
  var C = window.SITE_CONFIG || {}, CAT = window.CATALOG || {}, KEY = "pfp_cart_v1", MAX = 10;
  var base = (document.currentScript && document.currentScript.src || "").replace(/assets\/cart\.js.*$/, "");
  var index = {};
  Object.keys(CAT).forEach(function (slug) {
    CAT[slug].packs.forEach(function (pk) {
      pk.variants.forEach(function (v) {
        index[v.id] = { slug: slug, name: CAT[slug].name, pack: pk.label, flavor: v.title === "Default Title" ? "" : v.title, price: v.price, img: CAT[slug].img };
      });
    });
  });
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || "{}"); Object.keys(o).forEach(function (k) { if (!index[k]) delete o[k]; }); return o; } catch (e) { return {}; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  function money(n) { return "$" + n.toFixed(2); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); }
  var cart = load();

  function checkoutUrl() {
    var ids = Object.keys(cart).filter(function (k) { return cart[k] > 0; });
    if (!ids.length) return null;
    var store = (C.STORE_URL || "https://theultrahuman.net").replace(/\/$/, "");
    var url = new URL(store + "/cart/" + ids.map(function (k) { return k + ":" + cart[k]; }).join(","));
    if (C.CHECKOUT_MODE !== "checkout") url.searchParams.set("storefront", "true");
    if (C.AFFILIATE_ID) url.searchParams.set(C.AFFILIATE_PARAM || "sca_ref", C.AFFILIATE_ID);
    return url.toString();
  }
  window.PFP_CART = { get: function () { return JSON.parse(JSON.stringify(cart)); }, checkoutUrl: checkoutUrl };

  function render() {
    var ids = Object.keys(cart), count = 0, sub = 0, html = "";
    ids.forEach(function (k) {
      var it = index[k], q = cart[k]; count += q; sub += it.price * q;
      html += '<div class="cd-item" data-id="' + k + '"><span class="cd-img p-' + it.slug + '"><img src="' + base + "assets/img/" + it.img + '" alt=""></span>' +
        '<div class="cd-info"><strong>' + esc(it.name) + "</strong><span>" + esc(it.pack + (it.flavor ? " · " + it.flavor : "")) + "</span>" +
        '<div class="qty sm" role="group" aria-label="Quantity for ' + esc(it.name) + '"><button type="button" data-dq="-1" aria-label="Decrease">&minus;</button><output>' + q + '</output><button type="button" data-dq="1" aria-label="Increase">+</button></div></div>' +
        '<div class="cd-right"><span class="cd-price">' + money(it.price * q) + '</span><button type="button" class="cd-rm" data-rm>Remove</button></div></div>';
    });
    document.querySelectorAll("[data-cart-items]").forEach(function (el) { el.innerHTML = html || '<p class="cd-empty">Your cart is empty.</p>'; });
    document.querySelectorAll("[data-cart-subtotal]").forEach(function (el) { el.textContent = money(sub); });
    document.querySelectorAll("[data-cart-count]").forEach(function (el) { el.textContent = count; el.hidden = !count; });
    var url = checkoutUrl();
    document.querySelectorAll("[data-cart-checkout]").forEach(function (a) {
      if (url) { a.href = url; a.removeAttribute("aria-disabled"); } else { a.href = "#"; a.setAttribute("aria-disabled", "true"); }
    });
  }
  function setQty(id, q) { q = Math.max(0, Math.min(MAX, q | 0)); if (q) cart[id] = q; else delete cart[id]; save(cart); render(); }

  var drawer, overlay, lastFocus;
  function open() { lastFocus = document.activeElement; overlay.hidden = false; requestAnimationFrame(function () { document.body.classList.add("cart-open"); }); drawer.setAttribute("aria-hidden", "false"); var x = drawer.querySelector(".cd-x"); x && x.focus(); }
  function close() { document.body.classList.remove("cart-open"); drawer.setAttribute("aria-hidden", "true"); setTimeout(function () { overlay.hidden = true; }, 350); lastFocus && lastFocus.focus && lastFocus.focus(); }

  function initBuybox(form) {
    var slug = form.getAttribute("data-buybox"), prod = CAT[slug]; if (!prod) return;
    var sel = form.querySelector("[data-flavor]"), wrap = form.querySelector("[data-flavor-wrap]"),
        qIn = form.querySelector("[data-qty-input]"), lp = form.querySelector("[data-line-price]");
    function pack() { var r = form.querySelector("input[type=radio]:checked"); return prod.packs[r ? +r.value : 0]; }
    function variant() { var pk = pack(); return pk.variants.filter(function (v) { return String(v.id) === sel.value; })[0] || pk.variants[0]; }
    function fillFlavors() {
      var pk = pack(), prev = sel.selectedOptions[0] && sel.selectedOptions[0].textContent;
      sel.innerHTML = pk.variants.map(function (v) { return '<option value="' + v.id + '">' + esc(v.title) + "</option>"; }).join("");
      var keep = pk.variants.filter(function (v) { return v.title === prev; })[0]; if (keep) sel.value = String(keep.id);
      wrap.hidden = pk.variants.length === 1 && pk.variants[0].title === "Default Title";
      price();
    }
    function qty() { var q = parseInt(qIn.value, 10); q = isNaN(q) ? 1 : Math.max(1, Math.min(MAX, q)); return q; }
    function price() { lp.textContent = money(variant().price * qty()); }
    form.querySelectorAll("input[type=radio]").forEach(function (r) { r.addEventListener("change", fillFlavors); });
    sel.addEventListener("change", price);
    qIn.addEventListener("input", price);
    qIn.addEventListener("change", function () { qIn.value = qty(); price(); });
    form.querySelectorAll("[data-qty]").forEach(function (b) { b.addEventListener("click", function () { qIn.value = Math.max(1, Math.min(MAX, qty() + +b.getAttribute("data-qty"))); price(); }); });
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = variant(); setQty(v.id, (cart[v.id] || 0) + qty()); open(); });
    fillFlavors();
  }

  function init() {
    drawer = document.getElementById("cart-drawer"); overlay = document.querySelector(".cart-overlay");
    if (!drawer) return;
    document.querySelectorAll("[data-cart-open]").forEach(function (b) { b.addEventListener("click", open); });
    document.querySelectorAll("[data-cart-close]").forEach(function (b) { b.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("cart-open")) close(); });
    drawer.addEventListener("click", function (e) {
      var row = e.target.closest(".cd-item"); if (!row) return; var id = row.getAttribute("data-id");
      if (e.target.closest("[data-rm]")) setQty(id, 0);
      var d = e.target.closest("[data-dq]"); if (d) setQty(id, (cart[id] || 0) + +d.getAttribute("data-dq"));
    });
    drawer.querySelector("[data-cart-checkout]").addEventListener("click", function (e) { if (!checkoutUrl()) e.preventDefault(); });
    window.addEventListener("storage", function (e) { if (e.key === KEY) { cart = load(); render(); } });
    document.querySelectorAll("[data-buybox]").forEach(initBuybox);
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
