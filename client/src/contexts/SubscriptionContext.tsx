
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

const SubscriptionContext = createContext({
  isSubscribed: false,
  isLoading: true,
});

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // In a real app, you'd fetch subscription status from your backend
      // For now, we'll simulate it
      const checkSubscription = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Replace with your actual subscription check logic
        const MOCK_SUBSCRIPTION_STATUS = true; 
        setIsSubscribed(MOCK_SUBSCRIPTION_STATUS);
        setIsLoading(false);
      };
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, isLoading }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
