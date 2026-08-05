# Taking real payments (and getting them into your Monzo account)

Checkout is wired to [Stripe Checkout](https://stripe.com/payments/checkout): the customer
enters their card details on Stripe's own hosted page (never on this site), Stripe charges
the card, and Stripe then pays the money out to whatever bank account you register with
them on its normal payout schedule (daily by default, after a short initial hold for a new
account). **That bank account can be your Monzo account** — Monzo works exactly like any
other UK bank account for this purpose, there's no special integration needed.

## 1. Create a Stripe account

1. Sign up at [stripe.com/register](https://dashboard.stripe.com/register).
2. In the Dashboard, toggle **Test mode** (top right) while you're setting things up — you
   can test the whole flow with fake card numbers before taking real payments.

## 2. Add Monzo as your payout bank account

1. In the Dashboard, go to **Settings → Bank accounts and scheduling**
   (`https://dashboard.stripe.com/settings/bank-accounts`).
2. Click **Add a bank account** and enter your Monzo **sort code** and **account number**
   (find these in the Monzo app: Account → the "..." menu → Bank details).
3. Stripe will verify the account (sometimes via a micro-deposit) before payouts start.
4. Once verified, every Stripe payout lands in that Monzo account automatically — nothing
   in this codebase needs to know your account number, it's configured entirely on Stripe's
   side.
5. You'll also need to complete Stripe's business/identity verification (**Settings →
   Account details**) before you can leave test mode and take live payments.

## 3. Get your API keys

From **Developers → API keys** (`https://dashboard.stripe.com/apikeys`):

- **Publishable key** (`pk_test_...` / `pk_live_...`)
- **Secret key** (`sk_test_...` / `sk_live_...`) — keep this private, never commit it or put
  it in client-side code.

## 4. Configure this project

```bash
cp .env.example .env
```

Fill in `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # see step 6
DOMAIN=http://localhost:4242
PORT=4242
```

`.env` is already git-ignored — it should never be committed.

## 5. Run it

```bash
npm install
npm start
```

Open `http://localhost:4242`, add something to the cart, go to checkout, fill in the
contact details, and click **Continue to Payment** — you'll land on Stripe's hosted
payment page. In test mode, use Stripe's test card `4242 4242 4242 4242`, any future
expiry, any CVC.

## 6. Listen for confirmed payments (webhook)

The server has a `/api/webhook` route that Stripe calls once a payment actually completes
(more reliable than trusting the browser redirect alone).

**Local testing**, using the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:4242/api/webhook
```

It prints a `whsec_...` value — put that in `.env` as `STRIPE_WEBHOOK_SECRET`.

**In production**, add an endpoint in the Dashboard (**Developers → Webhooks → Add
endpoint**) pointing at `https://your-domain.com/api/webhook`, subscribed to the
`checkout.session.completed` event, and use the signing secret it gives you.

## 7. Going live

1. Switch off **Test mode** in the Dashboard.
2. Swap the `sk_test_...` / `pk_test_...` / `whsec_...` values in `.env` (or your host's
   environment variable settings) for the live equivalents.
3. Update `DOMAIN` to your real production URL.
4. Make sure your Monzo bank account (step 2) is verified under the live account too.

## How the money actually flows

```
Customer's card
      │  (charged on Stripe's hosted Checkout page)
      ▼
   Stripe balance
      │  (Stripe's payout schedule, e.g. daily, minus Stripe's fees)
      ▼
Your Monzo account  (sort code + account number set in step 2)
```

Nothing in this repository ever holds or transmits a real card number — that's handled
entirely by Stripe's hosted page, which is what keeps this setup out of PCI-DSS scope for
you as the merchant.
