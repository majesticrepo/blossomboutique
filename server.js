// Blossom Boutique — payment server
//
// Serves the static site and adds the small server-side piece that real
// card payments require: creating a Stripe Checkout Session (so raw card
// numbers are typed on Stripe's own hosted page and never touch this
// server) and verifying the webhook Stripe sends back once a payment
// actually succeeds. Stripe pays out to whatever bank account is
// configured in the Stripe Dashboard (Settings → Bank accounts and
// scheduling) — see PAYMENTS.md for wiring that up to a Monzo account.
require('dotenv').config();

const express = require('express');
const path = require('path');

if(!process.env.STRIPE_SECRET_KEY){
  console.warn('\n⚠  STRIPE_SECRET_KEY is not set. Copy .env.example to .env and fill in your Stripe keys.\n   The site will still load, but checkout will fail until this is configured.\n');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_missing');

const app = express();
const PORT = process.env.PORT || 4242;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

// The Stripe webhook route needs the raw request body to verify the
// signature, so it's registered before the JSON body parser below.
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  if(process.env.STRIPE_WEBHOOK_SECRET){
    try{
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }catch(err){
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // No webhook secret configured yet (fine for quick local testing, but
    // set STRIPE_WEBHOOK_SECRET before going live — see PAYMENTS.md).
    event = JSON.parse(req.body);
  }

  if(event.type === 'checkout.session.completed'){
    const session = event.data.object;
    console.log(`✔ Payment received: ${session.id} — ${(session.amount_total / 100).toFixed(2)} ${session.currency.toUpperCase()} from ${session.customer_details && session.customer_details.email}`);
    // This is where you'd persist the order (database, email, etc.) once
    // payment is confirmed. Stripe itself moves the money on to your bank
    // account (Monzo) on its normal payout schedule — nothing further to
    // do here for the funds themselves.
  }

  res.json({ received: true });
});

app.use(express.json());
app.use(express.static(__dirname));

// Builds a Stripe Checkout Session from the cart the browser sends and
// redirects the customer to Stripe's own hosted payment page. Prices are
// taken from the request but re-derived server-side would be the next
// step once products live in a real catalog/database instead of
// localStorage — see PAYMENTS.md for that note.
app.post('/api/create-checkout-session', async (req, res) => {
  try{
    const { cart, fulfilment, contact } = req.body;

    if(!Array.isArray(cart) || cart.length === 0){
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    const line_items = cart.map(item => {
      const unitAmount = Math.round(Number(item.price) * 100);
      if(!Number.isFinite(unitAmount) || unitAmount <= 0){
        throw new Error(`Invalid price for item: ${item.product}`);
      }
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product || 'Blossom Boutique item',
            description: item.colour ? `Colour: ${item.colour}` : undefined,
          },
          unit_amount: unitAmount,
        },
        quantity: item.qty || 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${DOMAIN}/checkout.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/checkout.html?payment=cancelled`,
      customer_email: contact && contact.email ? contact.email : undefined,
      metadata: {
        fulfilment: fulfilment || 'delivery',
        customer_name: (contact && contact.name) || '',
        customer_phone: (contact && contact.phone) || '',
      },
    });

    res.json({ url: session.url });
  }catch(err){
    console.error('Error creating checkout session:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Lets the success page confirm a session actually paid before showing
// the "order placed" screen, instead of trusting the redirect alone.
app.get('/api/session-status', async (req, res) => {
  try{
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.json({ status: session.payment_status });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Blossom Boutique running at ${DOMAIN} (port ${PORT})`);
});
