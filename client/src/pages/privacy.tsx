import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Privacy() {
  usePageTitle("MoneyClip - Privacy Policy");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Privacy Policy</CardTitle>
              <p className="text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()} | Effective Date: January 1, 2024
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">Introduction</h3>
                <p className="text-muted-foreground leading-relaxed">
                  MoneyClip Technologies Inc. ("MoneyClip," "we," "us," or "our") is committed to protecting 
                  your privacy and maintaining the confidentiality of your personal and financial information. 
                  This Privacy Policy describes how we collect, use, disclose, and safeguard your information 
                  when you use our screen recording platform designed for financial advisors.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Information We Collect</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Personal Information</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Name, email address, phone number, and business information</li>
                      <li>Financial advisory credentials and regulatory information</li>
                      <li>Billing and payment information (processed through secure third-party providers)</li>
                      <li>Account authentication data and access credentials</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Usage Information</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Screen recording metadata and session information</li>
                      <li>Platform usage analytics and feature interaction data</li>
                      <li>Device information, IP addresses, and browser details</li>
                      <li>Audit logs for compliance and security purposes</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Client Communication Data</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                      <li>Video recordings and associated transcripts</li>
                      <li>Client names and contact information (as provided by advisors)</li>
                      <li>Share link access logs and viewer interaction data</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">How We Use Your Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Provide and maintain our screen recording platform services</li>
                  <li>Process payments and manage your subscription</li>
                  <li>Ensure compliance with financial services regulations</li>
                  <li>Provide customer support and technical assistance</li>
                  <li>Improve our platform through analytics and user feedback</li>
                  <li>Communicate important service updates and security notifications</li>
                  <li>Maintain audit trails for regulatory compliance purposes</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Data Security and Protection</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>AES-256 encryption for data at rest and TLS 1.3 for data in transit</li>
                  <li>SOC 2 Type II compliant infrastructure and security controls</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Multi-factor authentication and role-based access controls</li>
                  <li>Secure data centers with 24/7 monitoring and access controls</li>
                  <li>Employee background checks and security training programs</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Information Sharing and Disclosure</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We do not sell, trade, or rent your personal information. We may share information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>With your explicit consent or at your direction</li>
                  <li>To comply with legal obligations, court orders, or regulatory requirements</li>
                  <li>With trusted service providers under strict confidentiality agreements</li>
                  <li>In connection with a business transfer, merger, or acquisition</li>
                  <li>To protect our rights, property, or safety, or that of our users</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Data Retention</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We retain your information only as long as necessary to provide our services and comply 
                  with legal obligations. Video recordings are stored according to your retention settings, 
                  with automatic deletion after the specified period. Account information is retained for 
                  seven years after account closure to meet financial services regulatory requirements.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Your Rights and Choices</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Depending on your jurisdiction, you may have the following rights:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Access, update, or delete your personal information</li>
                  <li>Restrict or object to certain processing activities</li>
                  <li>Data portability and the right to receive your data</li>
                  <li>Withdraw consent where processing is based on consent</li>
                  <li>File complaints with relevant data protection authorities</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Financial Services Compliance</h3>
                <p className="text-muted-foreground leading-relaxed">
                  As a technology provider serving financial advisors, we adhere to strict privacy and 
                  security standards required by financial services regulations, including FINRA, SEC, 
                  and state regulatory requirements. Our platform is designed to support advisors in 
                  meeting their own privacy and record-keeping obligations.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about this Privacy Policy or to exercise your privacy rights, contact us at:
                </p>
                <div className="bg-muted/50 rounded-lg p-4 mt-3">
                  <p className="text-muted-foreground">
                    <strong>Privacy Officer</strong><br />
                    MoneyClip Technologies Inc.<br />
                    Email: privacy@moneyclip.io<br />
                    Phone: 1-800-MONEYCLIP
                  </p>
                </div>
              </section>
              
              <div className="pt-6 border-t">
                <Link href="/">
                  <Button data-testid="button-back-home">
                    Back to Home
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