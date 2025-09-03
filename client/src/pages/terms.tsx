import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Terms() {
  usePageTitle("MoneyClip - Terms of Service");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Terms of Service</CardTitle>
              <p className="text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()} | Effective Date: January 1, 2024
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">Agreement to Terms</h3>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using MoneyClip's screen recording platform ("Service"), you agree to be bound 
                  by these Terms of Service ("Terms"). These Terms apply to all users of the Service, including 
                  financial advisors, registered investment advisors, and their clients. If you disagree with any 
                  part of these Terms, you may not access the Service.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Service Description</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  MoneyClip provides a secure screen recording platform specifically designed for financial advisors 
                  to create, manage, and share video communications with their clients. Our Service includes:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Screen recording capabilities with audio and webcam integration</li>
                  <li>Secure video storage and sharing with password protection</li>
                  <li>Compliance features including audit trails and disclosure management</li>
                  <li>Client communication tools with expiring links and access controls</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">User Eligibility and Account Requirements</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Eligible Users</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Licensed financial advisors and registered investment advisors</li>
                      <li>Employees of registered investment advisory firms</li>
                      <li>Insurance agents licensed to provide investment advice</li>
                      <li>Other financial services professionals as approved by MoneyClip</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Account Responsibilities</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Maintain accurate and current account information</li>
                      <li>Protect account credentials and immediately report any unauthorized access</li>
                      <li>Ensure compliance with all applicable financial services regulations</li>
                      <li>Pay all fees and charges associated with your account</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Compliance and Regulatory Requirements</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Users are responsible for ensuring their use of the Service complies with all applicable laws and regulations, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Securities and Exchange Commission (SEC) regulations</li>
                  <li>Financial Industry Regulatory Authority (FINRA) rules</li>
                  <li>State insurance and investment advisor regulations</li>
                  <li>Anti-money laundering (AML) and know your customer (KYC) requirements</li>
                  <li>Data protection and privacy laws (CCPA, GDPR where applicable)</li>
                  <li>Record retention and archival requirements for financial communications</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Acceptable Use Policy</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Permitted Uses</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Client education and portfolio explanations</li>
                      <li>Market updates and investment commentary</li>
                      <li>Financial planning presentations</li>
                      <li>Compliance training and educational content</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Prohibited Uses</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Recording or sharing material non-public information</li>
                      <li>Creating content that violates securities laws or regulations</li>
                      <li>Sharing login credentials or unauthorized account access</li>
                      <li>Using the Service for any unlawful or fraudulent purpose</li>
                      <li>Circumventing security measures or attempting to gain unauthorized access</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Data Security and Privacy</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  MoneyClip implements enterprise-grade security measures to protect your data:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>AES-256 encryption for data at rest and TLS 1.3 for data in transit</li>
                  <li>SOC 2 Type II compliance with annual audits</li>
                  <li>Role-based access controls and multi-factor authentication</li>
                  <li>Regular security assessments and penetration testing</li>
                  <li>Compliance with financial services data protection standards</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Subscription and Payment Terms</h3>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Subscription fees are billed monthly in advance. Prices are subject to change with 30 days' notice. 
                    You may cancel your subscription at any time, with cancellation effective at the end of the current billing period.
                  </p>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Refund Policy</h4>
                    <p className="text-sm text-muted-foreground">
                      We offer a 30-day money-back guarantee for new subscriptions. 
                      Refunds are processed within 5-10 business days of approval.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Limitation of Liability</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by law, MoneyClip shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, including but not limited to loss 
                  of profits, data, or business opportunities, arising from your use of the Service.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Governing Law</h3>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms are governed by the laws of the State of Delaware, United States, without regard 
                  to its conflict of law provisions. Any disputes shall be resolved through binding arbitration 
                  in accordance with the rules of the American Arbitration Association.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms of Service, contact us at:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 mt-3">
                  <p className="text-muted-foreground">
                    <strong>Legal Department</strong><br />
                    MoneyClip Technologies Inc.<br />
                    Email: legal@moneyclip.io<br />
                    Phone: 1-800-MONEYCLIP
                  </p>
                </div>
              </section>
              
              <div className="pt-6 border-t">
                <Link href="/signup">
                  <Button data-testid="button-get-started">
                    Get Started
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