
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; // Assuming useAuth hook is in this path

export default function SubscribePage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); // Assuming the hook provides a user object

  const handleSubscribeClick = async () => {
    setIsSubmitting(true);
    setError(null);

    if (!user) {
      setError('You must be logged in to subscribe.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/checkout/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Add any necessary user or plan details here
          // email: user.email,
          userId: user.id,
          priceId: 'your-price-id', // Replace with your actual Stripe Price ID
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session.');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Subscribe to MoneyClip
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Unlock premium features and take your financial advising to the next level.
          </p>
        </div>

        <div className="p-6 text-center bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800">Premium Plan</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            $10<span className="text-lg font-medium text-gray-500">/month</span>
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleSubscribeClick}
          disabled={isSubmitting}
          className="w-full px-4 py-2 text-lg font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 'Subscribe Now'}
        </button>

        <div className="text-xs text-center text-gray-500">
          <p>
            By subscribing, you agree to our{' '}
            <a href="/terms" className="underline hover:text-gray-700">
              Terms of Service
            </a>
            .
          </p>
          {/*
            Integration Points:
            1.  useAuth Hook:
                - Uncomment the `useAuth` import and usage.
                - Ensure the hook provides the user's ID and email to be sent to the backend.
                - The path might need to be adjusted based on your project structure, e.g., '@/client/src/hooks/useAuth'.

            2.  Backend API Endpoint ('/api/checkout/sessions'):
                - This frontend component assumes you have a Next.js API route at `app/api/checkout/sessions/route.js` (or `.ts`).
                - This endpoint needs to handle a POST request, create a Stripe Checkout Session, and return the session URL.

            3.  Stripe Price ID:
                - Replace 'your-price-id' with the actual ID of your subscription plan's price from your Stripe dashboard.

            4.  Styling:
                - This component uses Tailwind CSS for styling. Ensure Tailwind is properly configured in your Next.js project.
          */}
        </div>
      </div>
    </div>
  );
}
