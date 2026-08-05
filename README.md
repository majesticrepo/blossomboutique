# Blossom Boutique

A site for Blossom Boutique, a handcrafted folding-fan shop. Built with plain HTML, CSS, and JavaScript, plus a small Node/Express server for Stripe-powered checkout.

## Project structure

```
index.html        Home page: hero + the colour/detail overlay pages
products.html      Product listing: colour dots (link to the colour pages) + a product card per fan (name, scent, photo, Add to Cart/Buy Now)
cart.html          Cart page: reads/removes items from the localStorage cart
checkout.html      Checkout: contact/delivery details, hands off to Stripe Checkout for payment
about.html         About page
contact.html       Contact page
reviews.html       Customer reviews: star ratings, submit/edit/delete/report
unfold.html        "The Unfold": scroll-scrubbed video of a fan coming apart/together
css/style.css      Styles
js/main.js         Nav, colour/detail page switching, cart, checkout, reviews, petal animation
js/unfold.js       Scroll-scrubbing logic for unfold.html
images/            Site imagery (placeholders — see note below)
videos/            Fan assembly/disassembly footage used on unfold.html
server.js          Express server: serves the site + creates Stripe Checkout Sessions and handles the payment webhook
PAYMENTS.md        How to set up Stripe and route payouts to a bank account (e.g. Monzo)
```

## Running locally

Checkout requires the Node server (it talks to Stripe), so use:

```bash
npm install
npm start
```

Then open `http://localhost:4242`. See [PAYMENTS.md](PAYMENTS.md) for setting up Stripe
keys first — without them the site loads but checkout will fail.

If you just want to browse the front-end without payments, a plain static server still
works for every page except checkout:

```bash
npm run static
```

## Notes

- **Product cards and colour pages use bespoke SVG fan illustrations**, one per colour, each themed to that fan's scent flower (e.g. Sakura Fan → cherry blossom, Crimson Fan → rose, Onyx Fan → black orchid — see the `<symbol id="fan...">` defs at the top of `index.html`/`products.html`). These are stand-ins for real product photography; swap a card's `<svg class="product-card-flower">` for an `<img>` once a photo exists for that colour, no other markup changes needed.
- **The `#detail-*` pages** (reached by clicking the fan illustration on a colour page) still use `images/rose-detail.jpg`/`images/rose-hero.png` as placeholder photography — swap those in `images/` whenever real photos are ready.
- **Cart is local-only**, stored in `localStorage` (`bb_cart`) and read by the nav badge/`cart.html`. **Checkout payment is real**, powered by Stripe — see [PAYMENTS.md](PAYMENTS.md) for how to connect your own Stripe account and route payouts to your bank account.
- **Reviews are per-browser by default.** They're stored in `localStorage`, so right now only the browser that posted a review can see it. To make reviews visible to every visitor, set `REMOTE_REVIEWS_URL` near the top of the reviews block in `js/main.js` to a JSON storage endpoint that supports `GET` (returns the reviews array, or `{reviews:[...]}`) and `POST` (overwrites it with a JSON array body) — for example a free bin from [npoint.io](https://www.npoint.io) (no account needed: create a bin there, paste `{"reviews":[]}` as the content, and use the URL it gives you). Once set, the page pulls the shared list on load and polls it every 60 seconds so new reviews show up for everyone within about a minute.
- **Review reports** open a small dialog asking for a reason and tag the review with a red "Reported for: …" note visible on the page — there's no separate email/push alert.
- **`unfold.html`** pins `videos/fan-disassemble.mp4` full-screen while its scroll section passes by and maps scroll position straight onto the video's `currentTime` (see `js/unfold.js`) — scrolling down plays the disassembly forward, scrolling back up runs the same footage backward, so the two directions always match frame-for-frame. `videos/fan-assemble.mp4` is used as a small looping preview above it. Visitors with `prefers-reduced-motion` get the video inline with native controls instead of the scroll-pinned effect.
