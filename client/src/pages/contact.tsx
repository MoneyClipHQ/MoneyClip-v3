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
              <CardTitle className="text-2xl">Contact MoneyClip</CardTitle>
              <p className="text-muted-foreground">
                Get in touch with our team for support, sales, or compliance questions
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Support</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Technical support and platform assistance
                  </p>
                  <div className="flex items-center gap-3">
                    <MailIcon className="h-5 w-5 text-muted-foreground" />
                    <span>support@moneyclip.io</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-muted-foreground" />
                    <span>1-800-MONEYCLIP (1-800-666-3925)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Monday - Friday, 8:00 AM - 8:00 PM ET
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sales & Demos</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Questions about plans, pricing, or scheduling a demo
                  </p>
                  <div className="flex items-center gap-3">
                    <MailIcon className="h-5 w-5 text-muted-foreground" />
                    <span>sales@moneyclip.io</span>
                  </div>
                  <Button data-testid="button-schedule-demo" className="w-full">
                    Schedule a Demo
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Compliance & Legal</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Regulatory questions, compliance support, and legal matters
                  </p>
                  <div className="flex items-center gap-3">
                    <MailIcon className="h-5 w-5 text-muted-foreground" />
                    <span>compliance@moneyclip.io</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MailIcon className="h-5 w-5 text-muted-foreground" />
                    <span>legal@moneyclip.io</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Privacy & Security</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Data protection, privacy rights, and security concerns
                  </p>
                  <div className="flex items-center gap-3">
                    <MailIcon className="h-5 w-5 text-muted-foreground" />
                    <span>privacy@moneyclip.io</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MailIcon className="h-5 w-5 text-muted-foreground" />
                    <span>security@moneyclip.io</span>
                  </div>
                </div>
              </div>

              <section className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                <div className="bg-muted/50 rounded-lg p-6 space-y-2">
                  <p><strong>MoneyClip Technologies Inc.</strong></p>
                  <p className="text-muted-foreground">1234 Financial District Blvd, Suite 500</p>
                  <p className="text-muted-foreground">New York, NY 10004</p>
                  <p className="text-muted-foreground">United States</p>
                  <div className="pt-3 space-y-1">
                    <p className="text-sm text-muted-foreground">Business Registration: Delaware Corporation</p>
                    <p className="text-sm text-muted-foreground">FINRA Technology Vendor Registration: 12345</p>
                    <p className="text-sm text-muted-foreground">SOC 2 Type II Certified</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-4">Emergency Security Contact</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 mb-2">
                    <strong>For urgent security incidents or data breaches:</strong>
                  </p>
                  <div className="flex items-center gap-3 text-red-700">
                    <PhoneIcon className="h-4 w-4" />
                    <span className="font-medium">1-800-SECURITY (24/7)</span>
                  </div>
                  <div className="flex items-center gap-3 text-red-700">
                    <MailIcon className="h-4 w-4" />
                    <span className="font-medium">security-incident@moneyclip.io</span>
                  </div>
                </div>
              </section>
              
              <div className="pt-6 border-t flex gap-4">
                <Link href="/">
                  <Button data-testid="button-back-home">
                    Back to Home
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" data-testid="button-view-pricing">
                    View Pricing
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