import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailIcon, PhoneIcon } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Contact() {
  usePageTitle("MoneyClip - Contact");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Contact Us</CardTitle>
              <p className="text-muted-foreground">
                Get in touch with the MoneyClip team
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Support</h3>
                  <div className="flex items-center gap-3">
                    <MailIcon className="h-5 w-5 text-muted-foreground" />
                    <span>support@moneyclip.io</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-muted-foreground" />
                    <span>1-800-MONEYCLIP</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sales</h3>
                  <p className="text-muted-foreground">
                    Questions about our plans or need a demo? Get in touch with our sales team.
                  </p>
                  <Button data-testid="button-schedule-demo">
                    Schedule a Demo
                  </Button>
                </div>
              </div>
              
              <div className="pt-6 border-t">
                <Link href="/pricing">
                  <Button data-testid="button-back-pricing">
                    Back to Pricing
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