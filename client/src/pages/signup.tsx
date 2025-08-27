import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { signupSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { LoaderIcon, CheckIcon, CreditCardIcon } from "lucide-react";

type SignupData = z.infer<typeof signupSchema>;

interface SignupResponse {
  success: boolean;
  advisor: {
    id: string;
    advisorName: string;
    companyName: string;
    email: string;
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

  // Remove plan selection for beta signup

  const form = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      advisorName: "",
      companyName: "",
      email: "",
      password: "",
      agreeToTerms: false,
      marketingEmails: false,
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
          title: "Welcome to MoneyClip Beta!",
          description: "Your account has been created successfully. Start recording today!",
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
            <CardTitle className="text-xl">Welcome to MoneyClip Beta!</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your account has been created successfully. Start recording professional videos for your clients.
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
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Welcome to the beta!</strong> You now have full access to MoneyClip's screen recording features. A welcome email has been sent to your inbox.
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
                <p className="text-sm text-muted-foreground">
                  Ready to start creating professional video content for your clients!
                </p>
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
          {/* Beta Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckIcon className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">
                  Beta Access - Free Registration
                </p>
                <p className="text-sm text-green-700">Join MoneyClip's beta program and start recording professional videos for your clients at no cost during our MVP phase.</p>
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
                data-testid="button-create-account"
              >
                {signupMutation.isPending && (
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Account - Join Beta
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