import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // or whatever the latest is that the project wants, 2023-10-16 is common
});

/**
 * Creates a Stripe checkout session for a given price and customer.
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    
    console.log(`[Stripe] Created checkout session ${session.id} for customer ${customerId}`);
    return session;
  } catch (error) {
    console.error(`[Stripe] Error creating checkout session:`, error);
    throw error;
  }
}

/**
 * Retrieves an existing Stripe customer by email, or creates a new one.
 */
export async function getOrCreateStripeCustomer(
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  try {
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      console.log(`[Stripe] Found existing customer for email ${email}`);
      return existingCustomers.data[0];
    }

    const newCustomer = await stripe.customers.create({
      email,
      name,
    });

    console.log(`[Stripe] Created new customer ${newCustomer.id} for email ${email}`);
    return newCustomer;
  } catch (error) {
    console.error(`[Stripe] Error in getOrCreateStripeCustomer:`, error);
    throw error;
  }
}

/**
 * Retrieves a Stripe subscription by ID.
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log(`[Stripe] Retrieved subscription ${subscriptionId}`);
    return subscription;
  } catch (error) {
    console.error(`[Stripe] Error retrieving subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Cancels a Stripe subscription.
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  try {
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
    console.log(`[Stripe] Canceled subscription ${subscriptionId}`);
    return canceledSubscription;
  } catch (error) {
    console.error(`[Stripe] Error canceling subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Parses and verifies a Stripe webhook event.
 */
export function parseWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    console.log(`[Stripe] Parsed webhook event ${event.id} of type ${event.type}`);
    return event;
  } catch (error) {
    console.error(`[Stripe] Error parsing webhook event:`, error);
    throw error;
  }
}
