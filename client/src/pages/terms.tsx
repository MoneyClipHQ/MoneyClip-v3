import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Terms of Service & Privacy Policy</CardTitle>
              <p className="text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">Terms of Service</h3>
                <p className="text-muted-foreground">
                  This is a placeholder for MoneyClip's Terms of Service. In a production application, 
                  this would contain the complete legal terms governing the use of the platform.
                </p>
              </section>
              
              <section>
                <h3 className="text-lg font-semibold mb-3">Privacy Policy</h3>
                <p className="text-muted-foreground">
                  This is a placeholder for MoneyClip's Privacy Policy. In a production application, 
                  this would contain details about data collection, usage, storage, and user rights.
                </p>
              </section>
              
              <section>
                <h3 className="text-lg font-semibold mb-3">Data Security</h3>
                <p className="text-muted-foreground">
                  MoneyClip takes data security seriously. All payment information is processed securely 
                  and we never store sensitive card details on our servers.
                </p>
              </section>
              
              <div className="pt-6 border-t">
                <Link href="/signup">
                  <Button data-testid="button-back-signup">
                    Back to Sign Up
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