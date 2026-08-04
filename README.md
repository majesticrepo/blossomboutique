# Blossom Boutique

A static site for Blossom Boutique, a handcrafted folding-fan shop. Built with plain HTML, CSS, and JavaScript — no build step required.

## Project structure

```
index.html        Home page: hero + the colour/detail overlay pages
products.html      Product listing: colour dots (link to the colour pages) + a product card per fan (name, scent, photo, Add to Cart/Buy Now)
cart.html          Cart page: reads/removes items from the localStorage cart
about.html         About page
contact.html       Contact page
reviews.html       Customer reviews: star ratings, submit/edit/delete/report
css/style.css      Styles
js/main.js         Nav, colour/detail page switching, cart, reviews, petal animation
images/            Site imagery (placeholders — see note below)
```

## Running locally

Any static file server works. For example:

```bash
npx serve .
```

Then open the printed local URL in your browser.

## Notes

- **Product cards and colour pages use bespoke SVG fan illustrations**, one per colour, each themed to that fan's scent flower (e.g. Sakura Fan → cherry blossom, Crimson Fan → rose, Onyx Fan → black orchid — see the `<symbol id="fan...">` defs at the top of `index.html`/`products.html`). These are stand-ins for real product photography; swap a card's `<svg class="product-card-flower">` for an `<img>` once a photo exists for that colour, no other markup changes needed.
- **The `#detail-*` pages** (reached by clicking the fan illustration on a colour page) still use `images/rose-detail.jpg`/`images/rose-hero.png` as placeholder photography — swap those in `images/` whenever real photos are ready.
- **Cart is local-only.** `js/main.js` stores cart items in `localStorage` (`bb_cart`) and the nav badge/`cart.html` read from it — there's no backend or checkout yet.
- **Reviews are per-browser by default.** They're stored in `localStorage`, so right now only the browser that posted a review can see it. To make reviews visible to every visitor, set `REMOTE_REVIEWS_URL` near the top of the reviews block in `js/main.js` to a JSON storage endpoint that supports `GET` (returns the reviews array, or `{reviews:[...]}`) and `POST` (overwrites it with a JSON array body) — for example a free bin from [npoint.io](https://www.npoint.io) (no account needed: create a bin there, paste `{"reviews":[]}` as the content, and use the URL it gives you). Once set, the page pulls the shared list on load and polls it every 60 seconds so new reviews show up for everyone within about a minute.
- **Review reports** open a small dialog asking for a reason and tag the review with a red "Reported for: …" note visible on the page — there's no separate email/push alert.
