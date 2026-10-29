/* =====================================================================
   SITE CONFIG — the ONE place to edit.
   - SITE_NAME: rename the site everywhere (header, footer, page titles).
   - AFFILIATE_PARAM / AFFILIATE_ID: Ultra Human runs its affiliate
     program on UpPromote, which tracks clicks with ?sca_ref=<your code>.
     Paste the code from your UpPromote affiliate link here.
     Example link from UpPromote: https://theultrahuman.net/?sca_ref=1234567.AbCdEfGh
       -> AFFILIATE_ID: "1234567.AbCdEfGh"
   - STORE_URL: the merchant store all buy buttons point to.
   - CHECKOUT_MODE: where the cart's checkout button sends people.
       "cart"     -> official store cart page, pre-filled (recommended).
                     URL: STORE_URL/cart/ID:QTY,ID:QTY?storefront=true&sca_ref=CODE
                     The store's own pages load, so UpPromote's script can
                     record the referral before the shopper clicks Checkout.
       "checkout" -> straight to Shopify checkout (one click less, but the
                     store's UpPromote script never runs; attribution riskier).
   ===================================================================== */
window.SITE_CONFIG = {
  SITE_NAME: "Peak Fuel Picks",
  STORE_URL: "https://theultrahuman.net",
  AFFILIATE_PARAM: "sca_ref",
  AFFILIATE_ID: "AFFILIATE_ID",
  CHECKOUT_MODE: "cart",
  CONTACT_EMAIL: "hello@example.com"
};

/* --- no need to edit below this line --- */
(function () {
  var c = window.SITE_CONFIG;
  function apply() {
    document.querySelectorAll("[data-site-name]").forEach(function (el) { el.textContent = c.SITE_NAME; });
    document.querySelectorAll("[data-contact-email]").forEach(function (el) {
      el.textContent = c.CONTACT_EMAIL; el.setAttribute("href", "mailto:" + c.CONTACT_EMAIL);
    });
    document.title = document.title.replace(/Peak Fuel Picks/g, c.SITE_NAME);
    document.querySelectorAll("a[data-store-path]").forEach(function (a) {
      var url = new URL(c.STORE_URL.replace(/\/$/, "") + a.getAttribute("data-store-path"));
      if (c.AFFILIATE_ID) url.searchParams.set(c.AFFILIATE_PARAM, c.AFFILIATE_ID);
      a.href = url.toString();
      a.rel = "sponsored noopener";
      a.target = "_blank";
    });
    var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply); else apply();
})();
