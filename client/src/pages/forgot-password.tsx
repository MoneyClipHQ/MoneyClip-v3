import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { forgotPasswordSchema, type ForgotPasswordData } from "@shared/schema";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ForgotPassword() {
  usePageTitle("MoneyClip - Forgot Password");
  
  const [, navigate] = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Reset Code Sent",
        description: "Check your email for the 6-digit reset code.",
      });
    },
    onError: (error: any) => {
      console.error("Forgot password error:", error);
      
      let errorMessage = "Failed to send reset code. Please try again.";
      if (error.message?.includes("VALIDATION_ERROR")) {
        errorMessage = "Please enter a valid email address.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordData) => {
    forgotPasswordMutation.mutate(data);
  };

  const handleContinueToReset = () => {
    const email = form.getValues("email");
    navigate(`/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/">
            <span className="text-3xl font-bold text-primary cursor-pointer hover:text-blue-700 transition-colors">
              MoneyClip
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a reset code.
          </p>
        </div>

        {!isSubmitted ? (
          <Card>
            <CardHeader>
              <CardTitle>Reset Your Password</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {forgotPasswordMutation.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {forgotPasswordMutation.error instanceof Error 
                          ? forgotPasswordMutation.error.message 
                          : "An unexpected error occurred"}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={forgotPasswordMutation.isPending}
                    data-testid="button-send-reset-code"
                  >
                    {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Code"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900">Code Sent!</h3>
                <p className="text-sm text-gray-600">
                  If an account exists for <strong>{form.getValues("email")}</strong>, 
                  you will receive a 6-digit reset code shortly.
                </p>
                <p className="text-xs text-gray-500">
                  The code will expire in 10 minutes.
                </p>
                
                <Button 
                  onClick={handleContinueToReset}
                  className="w-full"
                  data-testid="button-continue-to-reset"
                >
                  Continue to Reset Password
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Login */}
        <div className="text-center">
          <Link href="/login">
            <span className="inline-flex items-center text-sm font-medium text-primary hover:text-blue-500 cursor-pointer" data-testid="link-back-to-login">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign In
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}