/* Renders the shop catalogue from KhashStore. */
(function () {
  "use strict";

  var CURRENCY_SYMBOLS = { USD: "$", EUR: "\u20AC", GBP: "\u00A3", EGP: "E\u00A3", AED: "\u062F.\u0625", SAR: "\uFDFC" };

  function symbol(cur) { return CURRENCY_SYMBOLS[cur] || ""; }
  function formatPrice(p, cur) {
    if (p == null || isNaN(p)) return "";
    return symbol(cur) + Number(p).toFixed(2);
  }
  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function setupLightbox() {
    var box = document.getElementById("lightbox");
    var img = document.getElementById("lightbox-img");
    var close = document.getElementById("lightbox-close");
    function open(src) { img.src = src; box.hidden = false; }
    function hide() { box.hidden = true; img.src = ""; }
    close.addEventListener("click", hide);
    box.addEventListener("click", function (e) { if (e.target === box) hide(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
    return open;
  }

  function buildCard(p, openLightbox) {
    var card = document.createElement("article");
    card.className = "product-card";

    var gallery = document.createElement("div");
    gallery.className = "product-media";
    if (p.images && p.images.length) {
      var mainUrl = URL.createObjectURL(p.images[0]);
      var main = document.createElement("img");
      main.className = "product-img";
      main.src = mainUrl;
      main.alt = p.name;
      main.addEventListener("click", function () { openLightbox(main.src); });
      gallery.appendChild(main);

      if (p.images.length > 1) {
        var thumbs = document.createElement("div");
        thumbs.className = "product-thumbs";
        p.images.forEach(function (blob) {
          var u = URL.createObjectURL(blob);
          var t = document.createElement("img");
          t.src = u;
          t.alt = p.name;
          t.addEventListener("click", function () { main.src = u; });
          thumbs.appendChild(t);
        });
        gallery.appendChild(thumbs);
      }
    } else {
      gallery.classList.add("product-media--empty");
      gallery.textContent = "No photo";
    }

    var body = document.createElement("div");
    body.className = "product-body";
    body.innerHTML =
      '<h2 class="product-name">' + escapeHTML(p.name) + '</h2>' +
      (p.price != null && !isNaN(p.price) ? '<p class="product-price">' + escapeHTML(formatPrice(p.price, p.currency)) + '</p>' : '') +
      (p.description ? '<p class="product-desc">' + escapeHTML(p.description) + '</p>' : '') +
      (p.sizes && p.sizes.length
        ? '<div class="product-sizes">' + p.sizes.map(function (s) { return '<span class="size-chip">' + escapeHTML(s) + '</span>'; }).join("") + '</div>'
        : '');

    card.appendChild(gallery);
    card.appendChild(body);
    return card;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var openLightbox = setupLightbox();
    var grid = document.getElementById("shop-grid");
    var empty = document.getElementById("shop-empty");

    KhashStore.getAll().then(function (items) {
      empty.hidden = items.length > 0;
      items.forEach(function (p) {
        grid.appendChild(buildCard(p, openLightbox));
      });
    }).catch(function () {
      empty.hidden = false;
    });
  });
})();
