# Blossom Boutique

A static site for Blossom Boutique, a handcrafted folding-fan shop. Built with plain HTML, CSS, and JavaScript — no build step required.

## Project structure

```
index.html        Home page: hero + the colour/detail overlay pages
products.html      Product listing: one evenly-spaced row of colour dots + a card per colour
about.html         About page
contact.html       Contact page
reviews.html       Customer reviews: star ratings, submit/edit/delete/report
css/style.css      Styles
js/main.js         Nav, colour/detail page switching, reviews, petal animation
images/            Site imagery (placeholders — see note below)
```

## Running locally

Any static file server works. For example:

```bash
npx serve .
```

Then open the printed local URL in your browser.

## Notes

- **Product photos are placeholders.** `images/rose-hero.png` and `images/rose-detail.jpg` are still the original flower photography reused (with CSS colour filters) as stand-ins for the fan product line. Swap them for real fan photography whenever it's ready — no other code changes needed.
- **Reviews are per-browser by default.** They're stored in `localStorage`, so right now only the browser that posted a review can see it. To make reviews visible to every visitor, set `REMOTE_REVIEWS_URL` near the top of the reviews block in `js/main.js` to a JSON storage endpoint that supports `GET` (returns the reviews array, or `{reviews:[...]}`) and `POST` (overwrites it with a JSON array body) — for example a free bin from [npoint.io](https://www.npoint.io) (no account needed: create a bin there, paste `{"reviews":[]}` as the content, and use the URL it gives you). Once set, the page pulls the shared list on load and polls it every 60 seconds so new reviews show up for everyone within about a minute.
- **Review reports** open a small dialog asking for a reason and tag the review with a red "Reported for: …" note visible on the page — there's no separate email/push alert.
