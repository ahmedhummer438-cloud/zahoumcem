# The Khash House

A professional one-page website for **The Khash House** ("Understated luxury").

## Structure

- `index.html` — home page (header, hero, about, experience, contact, footer)
- `shop.html` / `shop.js` — public catalogue rendering products from storage
- `admin.html` / `admin.js` — passcode-gated admin panel to add/edit/delete products
- `store.js` — IndexedDB data layer shared by the admin and shop pages
- `styles.css` — site theme (elegant dark + gold luxury, responsive)
- `admin.css` — styles for the admin panel and shop page
- `script.js` — minor enhancements (auto-updating footer year)

## Admin panel

Visit `admin.html` and enter the passcode (default `khash2024`, set at the top of
`admin.js` — change it). From there you can add products with a **name,
description, price + currency, sizes, and one or more photos**, then edit or
delete them. Products appear automatically on `shop.html`.

> **Important:** products and photos are stored in the browser via **IndexedDB**,
> so they are saved per-browser/per-device and are **not shared across visitors**.
> The passcode is a client-side gate, not real security. To make products visible
> to everyone from any device (and to add real authentication), the storage layer
> in `store.js` should be replaced with calls to a backend API + database.

## Social media

The official social links are wired into the header and footer:

| Platform  | URL |
|-----------|-----|
| Instagram | https://www.instagram.com/the.khash.house |
| TikTok    | https://www.tiktok.com/@thekhashhouse |
| Facebook  | https://www.facebook.com/share/192KsNtEvM/?mibextid=wwXIfr |

## Running locally

It's a static site — open `index.html` directly, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Editing content

The About, Experience, and Contact sections contain placeholder copy — replace
the text in `index.html` with your own brand voice.
