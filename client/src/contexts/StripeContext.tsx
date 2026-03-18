
import React, { createContext, useContext, useMemo } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Replace with your actual publishable key or load from environment variables
const STRIPE_PUBLIC_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY';

interface StripeContextType {
  stripe: Promise<Stripe | null> | null;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stripePromise = useMemo(() => {
    if (STRIPE_PUBLIC_KEY) {
      return loadStripe(STRIPE_PUBLIC_KEY);
    }
    return null;
  }, []);

  return (
    <StripeContext.Provider value={{ stripe: stripePromise }}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripeContext = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
};
