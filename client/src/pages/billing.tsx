import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const plans = [
  { id: 'starter', name: 'Starter', price: 20, description: 'Essential features for individual advisors.' },
  { id: 'professional', name: 'Professional', price: 45, description: 'Advanced tools for growing teams.' },
  { id: 'premium', name: 'Premium', price: 60, description: 'Full access for enterprise clients.' },
];

type Subscription = {
  id: string;
  planName: string;
  status: string;
  nextBillingDate: string;
  stripeSubscriptionId: string;
};

const BillingPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data: subscriptionData, isLoading: isSubscriptionLoading, error: subscriptionError } = useQuery<{ subscriptions: Subscription[] }>({
    queryKey: ['subscriptions', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/billing/subscriptions');
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const checkoutMutation = useMutation<any, Error, string>({
    mutationFn: (planId) =>
      fetch('/api/billing/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      }).then((res) => res.json()),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create checkout session. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const cancelMutation = useMutation<any, Error, string>({
      mutationFn: (stripeSubscriptionId) =>
      fetch(`/api/billing/subscriptions/${stripeSubscriptionId}/cancel`, {
          method: 'POST',
      }).then((res) => res.json()),
      onSuccess: () => {
          toast({
              title: 'Success',
              description: 'Your subscription has been cancelled.',
          });
          queryClient.invalidateQueries({ queryKey: ['subscriptions', user?.id] });
      },
      onError: () => {
          toast({
              title: 'Error',
              description: 'Failed to cancel subscription. Please contact support.',
              variant: 'destructive',
          });
      },
  });

  useEffect(() => {
    if (searchParams.get('success')) {
      toast({
        title: 'Subscription Activated!',
        description: 'Welcome to your new plan.',
      });
      setSearchParams({});
    }
    if (searchParams.get('cancel')) {
      toast({
        title: 'Checkout Cancelled',
        description: 'You have not been charged.',
        variant: 'destructive',
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleSubscribe = (planId: string) => {
    checkoutMutation.mutate(planId);
  };

    const handleCancel = () => {
        const activeSubscription = subscriptionData?.subscriptions.find(sub => sub.status === 'active');
        if (activeSubscription) {
            cancelMutation.mutate(activeSubscription.stripeSubscriptionId);
        }
    };

  const isLoading = isAuthLoading || isSubscriptionLoading;
  const activeSubscription = subscriptionData?.subscriptions.find(sub => sub.status === 'active');

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (subscriptionError) {
      return (
          <div className="container mx-auto p-4">
              <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{subscriptionError.message}</AlertDescription>
              </Alert>
          </div>
      )
  }


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Billing</h1>
      
      {activeSubscription ? (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Plan: <span className="font-semibold">{activeSubscription.planName}</span></p>
                <p>Next Billing Date: <span className="font-semibold">{new Date(activeSubscription.nextBillingDate).toLocaleDateString()}</span></p>
            </CardContent>
            <CardFooter>
                <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Plan'}
                </Button>
            </CardFooter>
        </Card>
      ) : (
          <Alert>
              <AlertDescription>No active subscription.</AlertDescription>
          </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>${plan.price}/month</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{plan.description}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSubscribe(plan.id)} disabled={checkoutMutation.isPending || !!activeSubscription}>
                {checkoutMutation.isPending ? 'Redirecting...' : 'Subscribe'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BillingPage;
