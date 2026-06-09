/*
 * KhashStore — tiny client-side data layer for products.
 *
 * Persists product data (including photos) in the browser using IndexedDB,
 * so it survives reloads. Note: storage is per-browser / per-device — it is
 * NOT shared across visitors. Swap this module for API calls to add a backend.
 */
(function (global) {
  "use strict";

  var DB_NAME = "khashhouse";
  var DB_VERSION = 1;
  var STORE = "products";

  var dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }

  function tx(mode) {
    return openDB().then(function (db) {
      return db.transaction(STORE, mode).objectStore(STORE);
    });
  }

  function reqToPromise(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function genId() {
    return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  var KhashStore = {
    /** Returns all products, newest first. */
    getAll: function () {
      return tx("readonly").then(function (store) {
        return reqToPromise(store.getAll());
      }).then(function (items) {
        items.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        return items;
      });
    },

    get: function (id) {
      return tx("readonly").then(function (store) {
        return reqToPromise(store.get(id));
      });
    },

    /** Adds a product. `data` = {name, description, price, currency, sizes, images}. */
    add: function (data) {
      var product = {
        id: genId(),
        name: data.name || "",
        description: data.description || "",
        price: data.price != null ? Number(data.price) : null,
        currency: data.currency || "USD",
        sizes: data.sizes || [],
        images: data.images || [],
        createdAt: Date.now()
      };
      return tx("readwrite").then(function (store) {
        return reqToPromise(store.add(product));
      }).then(function () { return product; });
    },

    update: function (id, data) {
      return this.get(id).then(function (existing) {
        if (!existing) throw new Error("Product not found: " + id);
        var updated = Object.assign({}, existing, data, { id: id });
        return tx("readwrite").then(function (store) {
          return reqToPromise(store.put(updated));
        }).then(function () { return updated; });
      });
    },

    remove: function (id) {
      return tx("readwrite").then(function (store) {
        return reqToPromise(store.delete(id));
      });
    }
  };

  global.KhashStore = KhashStore;
})(window);
