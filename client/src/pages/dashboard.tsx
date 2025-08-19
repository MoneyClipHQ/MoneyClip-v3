import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to MoneyClip</h1>
            <p className="text-muted-foreground">
              Your advisor dashboard - start creating professional screen recordings for your clients.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600" />
                  Account Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Your MoneyClip MVP subscription is active and ready to use.
                </p>
                <Button data-testid="button-start-recording">
                  Start Recording
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/billing">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-manage-billing">
                    Manage Billing
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start" data-testid="button-view-recordings">
                  View Recordings
                </Button>
                <Button variant="outline" className="w-full justify-start" data-testid="button-account-settings">
                  Account Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}