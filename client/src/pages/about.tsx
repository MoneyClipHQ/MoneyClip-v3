import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Shield, Users, Award, TrendingUp } from "lucide-react";

export default function About() {
  usePageTitle("MoneyClip - About Us");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-center">About MoneyClip</CardTitle>
              <p className="text-muted-foreground text-center text-lg">
                Secure screen recording platform built specifically for financial advisors
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  MoneyClip empowers financial advisors to create secure, professional screen recordings 
                  for client communication. We understand the unique challenges of explaining complex 
                  financial concepts while maintaining the highest standards of security and compliance 
                  required in the financial services industry.
                </p>
              </section>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Security First</h4>
                      <p className="text-sm text-muted-foreground">
                        Bank-grade encryption and compliance standards protect your client communications.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Built for Advisors</h4>
                      <p className="text-sm text-muted-foreground">
                        Designed specifically for financial advisory workflows and client relationships.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Award className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Compliance Ready</h4>
                      <p className="text-sm text-muted-foreground">
                        Meet regulatory requirements with built-in audit trails and disclosure management.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-6 w-6 text-primary mt-1" />
                    <div>
                      <h4 className="font-semibold">Client Engagement</h4>
                      <p className="text-sm text-muted-foreground">
                        Enhance client understanding with visual portfolio explanations and market updates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <section>
                <h3 className="text-xl font-semibold mb-4">Regulatory Compliance</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  MoneyClip is designed to support financial advisors in meeting their regulatory obligations 
                  while delivering exceptional client service. Our platform includes features for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Comprehensive audit logging of all recording activities</li>
                  <li>Secure client communication with password protection and expiring links</li>
                  <li>Disclosure management and compliance tracking</li>
                  <li>Data retention policies aligned with financial services requirements</li>
                  <li>SOC 2 Type II compliant infrastructure and security controls</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">Company Information</h3>
                <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                  <p><strong>MoneyClip Technologies Inc.</strong></p>
                  <p className="text-muted-foreground">
                    Incorporated in Delaware, United States
                  </p>
                  <p className="text-muted-foreground">
                    Registered Investment Advisor Technology Provider
                  </p>
                  <p className="text-muted-foreground">
                    SOC 2 Type II Certified | FINRA Technology Vendor
                  </p>
                </div>
              </section>
              
              <div className="pt-6 border-t flex gap-4 justify-center">
                <Link href="/signup">
                  <Button data-testid="button-get-started">
                    Get Started
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" data-testid="button-contact-us">
                    Contact Us
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