import { Router } from 'express';
import { getOrCreateStripeCustomer, createCheckoutSession } from '../stripe-service';
import { requireAuth } from '../routes';

const router = Router();

router.post('/checkout/sessions', requireAuth, async (req, res) => {
  const { email, advisorName } = req.session.advisor;

  const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';

  const priceId = process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    console.error('Stripe Price ID is not configured.');
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  try {
    const customer = await getOrCreateStripeCustomer(email, advisorName);
    const session = await createCheckoutSession(
      customer.id,
      priceId,
      `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
      `${domain}/cancel`
    );

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
