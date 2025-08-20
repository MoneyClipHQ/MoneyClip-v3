import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { signupSchema, type SignupData, PLANS, type PlanId } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { LoaderIcon, CheckIcon, CreditCardIcon } from "lucide-react";

interface SignupResponse {
  success: boolean;
  advisor: {
    id: string;
    advisorName: string;
    companyName: string;
    email: string;
  };
  subscription: {
    id: string;
    planName: string;
    amount: string;
    status: string;
    nextBillingDate: string;
  };
  error?: string;
  message?: string;
}

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmationData, setConfirmationData] = useState<SignupResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearch();

  // Get selected plan from URL params
  const urlParams = new URLSearchParams(searchParams);
  const preselectedPlan = urlParams.get('plan') as PlanId | null;
  const selectedPlanData = preselectedPlan && PLANS[preselectedPlan] ? PLANS[preselectedPlan] : PLANS.starter;

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      advisorName: "",
      companyName: "",
      email: "",
      password: "",
      cardholderName: "",
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvc: "",
      postalCode: "",
      agreeToTerms: false,
      marketingEmails: false,
      selectedPlan: preselectedPlan || "starter",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      const response = await apiRequest("POST", "/api/signup", data);
      return await response.json() as SignupResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        setConfirmationData(data);
        setIsSuccess(true);
        toast({
          title: "Account created successfully!",
          description: "Welcome to MoneyClip. Your subscription is now active.",
        });
      }
    },
    onError: (error: any) => {
      console.error("Signup error:", error);
      
      if (error?.error === "EMAIL_ALREADY_EXISTS") {
        form.setError("email", {
          type: "manual",
          message: error.message,
        });
        toast({
          title: "Email already registered",
          description: "Please use a different email or log in to your existing account.",
          variant: "destructive",
        });
      } else if (error?.error === "VALIDATION_ERROR") {
        // Handle validation errors
        if (error.errors) {
          error.errors.forEach((err: any) => {
            if (err.path && err.path.length > 0) {
              form.setError(err.path[0] as keyof SignupData, {
                type: "manual",
                message: err.message,
              });
            }
          });
        }
        toast({
          title: "Form validation failed",
          description: "Please check your form data and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signup failed",
          description: error?.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: SignupData) => {
    signupMutation.mutate(data);
  };

  // Success confirmation view
  if (isSuccess && confirmationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">Account Created Successfully!</CardTitle>
            <p className="text-sm text-muted-foreground">
              Welcome to MoneyClip. Your subscription is now active.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Advisor</p>
                  <p className="font-semibold">{confirmationData.advisor.advisorName}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Company</p>
                  <p className="font-semibold">{confirmationData.advisor.companyName}</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-sm">Email</p>
                <p className="font-semibold">{confirmationData.advisor.email}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Plan</span>
                <span className="font-semibold">{confirmationData.subscription.planName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Amount</span>
                <span className="font-semibold">${confirmationData.subscription.amount}/month</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {confirmationData.subscription.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Next billing</span>
                <span className="font-semibold">{confirmationData.subscription.nextBillingDate}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Confirmation email sent!</strong> Check your inbox for account details and getting started guide.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => setLocation('/dashboard')} 
                className="w-full"
                data-testid="button-continue-dashboard"
              >
                Continue to Dashboard
              </Button>
              <div className="text-center">
                <Link href="/billing">
                  <Button variant="outline" size="sm" data-testid="link-manage-billing">
                    Manage billing
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl text-center">Create your MoneyClip account</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Get started with professional screen recording for financial advisors
          </p>
        </CardHeader>
        <CardContent>
          {/* Plan Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CreditCardIcon className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-blue-900">
                    {selectedPlanData.name} plan • ${selectedPlanData.price}/month
                  </p>
                  <Link href="/pricing">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                      Change plan
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-blue-700">{selectedPlanData.description}</p>
                <p className="text-sm text-blue-700 mt-1">Billing monthly. Cancel anytime.</p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  Account Information
                </h3>
                
                <FormField
                  control={form.control}
                  name="advisorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advisor Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="John Smith"
                          data-testid="input-advisor-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Smith Financial Advisory"
                          data-testid="input-company-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email" 
                          placeholder="john@smithadvisory.com"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="••••••••"
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  Payment Details
                </h3>
                
                <FormField
                  control={form.control}
                  name="cardholderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cardholder Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="John Smith"
                          data-testid="input-cardholder-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          data-testid="input-card-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="expiryMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="MM"
                            maxLength={2}
                            data-testid="input-expiry-month"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="expiryYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="YYYY"
                            maxLength={4}
                            data-testid="input-expiry-year"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cvc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVC</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="123"
                            maxLength={4}
                            data-testid="input-cvc"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="12345"
                          data-testid="input-postal-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              {/* Agreements */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-agree-terms"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          I agree to the{" "}
                          <Link href="/terms" className="text-blue-600 hover:underline">
                            Terms and Privacy Policy
                          </Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="marketingEmails"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-marketing-emails"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Send me product updates and marketing emails (optional)
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
                data-testid="button-start-subscription"
              >
                {signupMutation.isPending && (
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Start subscription
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline" data-testid="link-login">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}