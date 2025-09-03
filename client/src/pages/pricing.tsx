import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { PLANS, type PlanId } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, XIcon } from "lucide-react";
import logoUrl from "@/assets/logos/moneyclip-logo.png";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Pricing() {
  usePageTitle("MoneyClip - Pricing");
  
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  // Log pricing page view on mount
  const logPricingViewMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/pricing/view")
  });

  const logPlanSelectionMutation = useMutation({
    mutationFn: (planId: PlanId) => 
      apiRequest("POST", "/api/pricing/select", { planId })
  });

  const logNavigationMutation = useMutation({
    mutationFn: (planId: PlanId) => 
      apiRequest("POST", "/api/pricing/navigate-signup", { planId })
  });

  useEffect(() => {
    logPricingViewMutation.mutate();
  }, []);

  const handleChoosePlan = (planId: PlanId) => {
    setSelectedPlan(planId);
    
    // Log plan selection
    logPlanSelectionMutation.mutate(planId);
    
    // Log navigation to signup
    logNavigationMutation.mutate(planId);
    
    // Navigate to signup with selected plan
    setLocation(`/signup?plan=${planId}`);
  };

  const featureComparison = [
    {
      feature: "Screen recording + sharing",
      starter: true,
      professional: true,
      premium: true
    },
    {
      feature: "Advisor branding",
      starter: false,
      professional: true,
      premium: true
    },
    {
      feature: "CRM integration",
      starter: false,
      professional: false,
      premium: true
    },
    {
      feature: "Scripted content",
      starter: false,
      professional: false,
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <img 
                  src={logoUrl} 
                  alt="MoneyClip" 
                  className="h-10 w-auto object-contain cursor-pointer"
                  data-testid="logo-moneyclip"
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button
                  variant="ghost"
                  data-testid="button-login"
                  className="text-secondary hover:text-primary transition-colors duration-200 font-medium px-4 py-2"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  data-testid="button-signup"
                  className="bg-primary hover:bg-accent text-white hover:text-accent-foreground font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Select the perfect plan for your advisory practice. All plans include secure recording and sharing.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {(Object.entries(PLANS) as [PlanId, typeof PLANS[PlanId]][]).map(([planId, plan]) => (
              <Card 
                key={planId}
                className={`relative h-full flex flex-col transition-all duration-200 hover:shadow-lg ${
                  selectedPlan === planId ? 'ring-2 ring-primary shadow-lg' : ''
                } ${planId === 'professional' ? 'border-primary border-2' : ''}`}
                data-testid={`card-plan-${planId}`}
              >
                {planId === 'professional' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Billed monthly. Cancel anytime.
                  </p>
                </CardHeader>
                
                <CardContent className="flex flex-col h-full">
                  <div className="flex-grow space-y-6">
                    <p className="text-sm text-center text-muted-foreground">
                      {plan.description}
                    </p>
                    
                    <div className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <CheckIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                      
                      {plan.notIncluded.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 opacity-60">
                          <XIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleChoosePlan(planId)}
                    className={`w-full mt-6 ${
                      planId === 'professional' 
                        ? 'bg-primary hover:bg-accent text-white hover:text-accent-foreground' 
                        : 'bg-gray-900 hover:bg-accent text-white hover:text-accent-foreground'
                    }`}
                    data-testid={`button-choose-${planId}`}
                  >
                    Choose Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Feature Comparison</h2>
              <p className="text-muted-foreground">
                <a href="#comparison" className="text-blue-600 hover:underline">
                  What's included?
                </a>
              </p>
            </div>
            
            <Card id="comparison">
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Feature</th>
                        <th className="text-center py-3 px-4">Starter</th>
                        <th className="text-center py-3 px-4">Professional</th>
                        <th className="text-center py-3 px-4">Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {featureComparison.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium">{row.feature}</td>
                          <td className="py-3 px-4 text-center">
                            {row.starter ? (
                              <CheckIcon className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <XIcon className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {row.professional ? (
                              <CheckIcon className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <XIcon className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {row.premium ? (
                              <CheckIcon className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <XIcon className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Included Features Note */}
          <div className="text-center text-sm text-muted-foreground mb-8">
            <p>
              All plans include: password-protected links, captions, Terms gate, and basic analytics.
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link href="/">
              <Button variant="outline" data-testid="button-back-home">
                ← Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-x-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}