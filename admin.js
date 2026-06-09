/* Admin panel logic for The Khash House. */
(function () {
  "use strict";

  // NOTE: This is a lightweight client-side gate, NOT real security. Anyone who
  // reads the page source can find it. Change this value to your own passcode.
  // For true protection, move products behind a backend with server-side auth.
  var PASSCODE = "khash2024";

  var CURRENCY_SYMBOLS = { USD: "$", EUR: "\u20AC", GBP: "\u00A3", EGP: "E\u00A3", AED: "\u062F.\u0625", SAR: "\uFDFC" };

  var customSizes = [];      // extra sizes added via the custom field
  var pendingImages = [];    // File/Blob objects staged for the current product
  var existingImages = [];   // images carried over when editing
  var editingId = null;

  /* ---------- Passcode gate ---------- */
  function setupGate() {
    var gate = document.getElementById("gate");
    var app = document.getElementById("app");
    var form = document.getElementById("gate-form");
    var input = document.getElementById("passcode");
    var error = document.getElementById("gate-error");

    function unlock() {
      gate.hidden = true;
      app.hidden = false;
      initApp();
    }

    if (sessionStorage.getItem("kh_admin_ok") === "1") {
      unlock();
      return;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (input.value === PASSCODE) {
        sessionStorage.setItem("kh_admin_ok", "1");
        unlock();
      } else {
        error.hidden = false;
        input.value = "";
        input.focus();
      }
    });
  }

  /* ---------- Helpers ---------- */
  function symbol(cur) { return CURRENCY_SYMBOLS[cur] || ""; }

  function formatPrice(p, cur) {
    if (p == null || isNaN(p)) return "";
    return symbol(cur) + Number(p).toFixed(2);
  }

  function blobToURL(b) { return URL.createObjectURL(b); }

  function collectSizes() {
    var checked = Array.prototype.slice
      .call(document.querySelectorAll("#sizes input:checked"))
      .map(function (c) { return c.value; });
    return checked.concat(customSizes);
  }

  function renderPreview() {
    var box = document.getElementById("preview");
    box.innerHTML = "";
    var all = existingImages.concat(pendingImages);
    all.forEach(function (img, idx) {
      var wrap = document.createElement("div");
      wrap.className = "preview-item";
      var image = document.createElement("img");
      image.src = blobToURL(img);
      var del = document.createElement("button");
      del.type = "button";
      del.className = "preview-del";
      del.textContent = "\u00D7";
      del.addEventListener("click", function () {
        if (idx < existingImages.length) {
          existingImages.splice(idx, 1);
        } else {
          pendingImages.splice(idx - existingImages.length, 1);
        }
        renderPreview();
      });
      wrap.appendChild(image);
      wrap.appendChild(del);
      box.appendChild(wrap);
    });
  }

  function renderCustomSizeChips() {
    // Re-render the sizes area's custom chips by appending labels dynamically.
    var container = document.getElementById("sizes");
    // remove previously added custom chips
    Array.prototype.slice.call(container.querySelectorAll(".custom-chip")).forEach(function (n) { n.remove(); });
    customSizes.forEach(function (sz, i) {
      var label = document.createElement("label");
      label.className = "custom-chip";
      label.innerHTML = '<input type="checkbox" value="' + sz + '" checked disabled /> ' + sz + ' <span class="chip-x" data-i="' + i + '">\u00D7</span>';
      container.appendChild(label);
    });
    Array.prototype.slice.call(container.querySelectorAll(".chip-x")).forEach(function (x) {
      x.addEventListener("click", function () {
        customSizes.splice(Number(x.getAttribute("data-i")), 1);
        renderCustomSizeChips();
      });
    });
  }

  /* ---------- Product list ---------- */
  function refreshList() {
    KhashStore.getAll().then(function (items) {
      var list = document.getElementById("product-list");
      var empty = document.getElementById("empty-list");
      document.getElementById("count").textContent = items.length;
      list.innerHTML = "";
      empty.hidden = items.length > 0;

      items.forEach(function (p) {
        var card = document.createElement("div");
        card.className = "list-card";

        var thumb = document.createElement("div");
        thumb.className = "list-thumb";
        if (p.images && p.images[0]) {
          var im = document.createElement("img");
          im.src = blobToURL(p.images[0]);
          thumb.appendChild(im);
        } else {
          thumb.textContent = "No photo";
        }

        var info = document.createElement("div");
        info.className = "list-info";
        info.innerHTML =
          '<h3>' + escapeHTML(p.name) + '</h3>' +
          '<p class="list-price">' + escapeHTML(formatPrice(p.price, p.currency)) + '</p>' +
          (p.sizes && p.sizes.length ? '<p class="list-sizes">Sizes: ' + p.sizes.map(escapeHTML).join(", ") + '</p>' : '') +
          (p.description ? '<p class="list-desc">' + escapeHTML(p.description) + '</p>' : '');

        var actions = document.createElement("div");
        actions.className = "list-actions";
        var editBtn = document.createElement("button");
        editBtn.className = "btn btn--ghost btn--sm";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", function () { loadForEdit(p); });
        var delBtn = document.createElement("button");
        delBtn.className = "btn btn--danger btn--sm";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", function () {
          if (confirm("Delete \"" + p.name + "\"?")) {
            KhashStore.remove(p.id).then(refreshList);
          }
        });
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        card.appendChild(thumb);
        card.appendChild(info);
        card.appendChild(actions);
        list.appendChild(card);
      });
    });
  }

  function escapeHTML(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------- Form ---------- */
  function readFile(file) {
    // Store as Blob directly (IndexedDB supports it); File is already a Blob.
    return Promise.resolve(file);
  }

  function loadForEdit(p) {
    editingId = p.id;
    document.getElementById("product-id").value = p.id;
    document.getElementById("name").value = p.name || "";
    document.getElementById("description").value = p.description || "";
    document.getElementById("price").value = p.price != null ? p.price : "";
    document.getElementById("currency").value = p.currency || "USD";

    // sizes
    var standard = ["XS", "S", "M", "L", "XL", "XXL"];
    Array.prototype.slice.call(document.querySelectorAll("#sizes input")).forEach(function (c) {
      c.checked = (p.sizes || []).indexOf(c.value) !== -1;
    });
    customSizes = (p.sizes || []).filter(function (s) { return standard.indexOf(s) === -1; });
    renderCustomSizeChips();

    existingImages = (p.images || []).slice();
    pendingImages = [];
    renderPreview();

    document.getElementById("form-title").textContent = "Edit product";
    document.getElementById("submit-btn").textContent = "Save changes";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    editingId = null;
    document.getElementById("product-form").reset();
    document.getElementById("product-id").value = "";
    customSizes = [];
    pendingImages = [];
    existingImages = [];
    renderCustomSizeChips();
    renderPreview();
    document.getElementById("form-title").textContent = "Add a product";
    document.getElementById("submit-btn").textContent = "Add product";
  }

  function showStatus(msg) {
    var el = document.getElementById("form-status");
    el.textContent = msg;
    el.hidden = false;
    setTimeout(function () { el.hidden = true; }, 2500);
  }

  function initApp() {
    refreshList();
    renderCustomSizeChips();

    document.getElementById("photos").addEventListener("change", function (e) {
      var files = Array.prototype.slice.call(e.target.files);
      Promise.all(files.map(readFile)).then(function (blobs) {
        pendingImages = pendingImages.concat(blobs);
        renderPreview();
        e.target.value = ""; // allow re-selecting the same file
      });
    });

    document.getElementById("add-size").addEventListener("click", function () {
      var input = document.getElementById("custom-size");
      var v = input.value.trim();
      if (v && customSizes.indexOf(v) === -1) {
        customSizes.push(v);
        renderCustomSizeChips();
      }
      input.value = "";
    });

    document.getElementById("reset-btn").addEventListener("click", resetForm);

    document.getElementById("product-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("name").value.trim();
      if (!name) { return; }
      var data = {
        name: name,
        description: document.getElementById("description").value.trim(),
        price: document.getElementById("price").value === "" ? null : Number(document.getElementById("price").value),
        currency: document.getElementById("currency").value,
        sizes: collectSizes(),
        images: existingImages.concat(pendingImages)
      };

      var op = editingId
        ? KhashStore.update(editingId, data)
        : KhashStore.add(data);

      op.then(function () {
        showStatus(editingId ? "Product updated." : "Product added.");
        resetForm();
        refreshList();
      }).catch(function (err) {
        showStatus("Error: " + err.message);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", setupGate);
})();
