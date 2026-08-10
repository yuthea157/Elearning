import "server-only";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set — add it to .env.local");
}

// Single Stripe SDK instance for the whole app — everything Stripe-specific
// lives under src/lib/billing/ (see docs/ARCHITECTURE.md "Payments"); no
// other module should import the `stripe` package directly.
export const stripe = new Stripe(secretKey);
