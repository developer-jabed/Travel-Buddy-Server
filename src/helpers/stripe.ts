import Stripe from "stripe";
import config from "../config";

if (!config.stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is missing in environment variables");
}

export const stripe = new Stripe(config.stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
});
