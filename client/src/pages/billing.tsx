import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCardIcon, CalendarIcon } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Billing() {
  usePageTitle("MoneyClip - Billing");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
            <p className="text-muted-foreground">
              Manage your MoneyClip subscription and billing information.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Current Plan
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">MoneyClip MVP</h3>
                  <p className="text-2xl font-bold">$20<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">•••• •••• •••• 1234</p>
                  <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                </div>
                <Button variant="outline" className="w-full" data-testid="button-update-payment">
                  Update Payment Method
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your billing history will appear here after your first payment.
              </p>
              <div className="mt-4 pt-4 border-t">
                <Link href="/dashboard">
                  <Button data-testid="button-back-dashboard">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}