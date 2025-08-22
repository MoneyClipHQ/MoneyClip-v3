import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { resetPasswordSchema, type ResetPasswordData } from "@shared/schema";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  // Get email from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email') || '';

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromUrl,
      token: "",
      newPassword: "",
    },
  });

  // Set email if it comes from URL
  useEffect(() => {
    if (emailFromUrl) {
      form.setValue('email', emailFromUrl);
    }
  }, [emailFromUrl, form]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in.",
      });
    },
    onError: (error: any) => {
      console.error("Reset password error:", error);
      
      let errorMessage = "Failed to reset password. Please try again.";
      if (error.message?.includes("INVALID_TOKEN")) {
        errorMessage = "Invalid or expired reset code. Please request a new one.";
      } else if (error.message?.includes("VALIDATION_ERROR")) {
        errorMessage = "Please check your form data.";
      }

      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordData) => {
    resetPasswordMutation.mutate(data);
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
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code from your email and your new password.
          </p>
        </div>

        {!isSuccess ? (
          <Card>
            <CardHeader>
              <CardTitle>Create New Password</CardTitle>
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

                  <FormField
                    control={form.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>6-digit reset code</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            data-testid="input-reset-code"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your new password"
                              data-testid="input-new-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {resetPasswordMutation.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {resetPasswordMutation.error instanceof Error 
                          ? resetPasswordMutation.error.message 
                          : "An unexpected error occurred"}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={resetPasswordMutation.isPending}
                    data-testid="button-reset-password"
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
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
                <h3 className="text-lg font-semibold text-gray-900">Password Reset Complete!</h3>
                <p className="text-sm text-gray-600">
                  Your password has been successfully updated. You can now log in with your new password.
                </p>
                
                <Button 
                  onClick={() => navigate("/login")}
                  className="w-full"
                  data-testid="button-go-to-login"
                >
                  Go to Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Links */}
        <div className="flex justify-between text-center">
          <Link href="/forgot-password">
            <span className="inline-flex items-center text-sm font-medium text-primary hover:text-blue-500 cursor-pointer" data-testid="link-back-to-forgot-password">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Forgot Password
            </span>
          </Link>
          
          <Link href="/login">
            <span className="text-sm font-medium text-primary hover:text-blue-500 cursor-pointer" data-testid="link-to-login">
              Sign In
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}