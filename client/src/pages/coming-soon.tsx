import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Brain, Video, Database, FileText, User } from "lucide-react";
import logoUrl from "@/assets/logos/moneyclip-logo.png";

const upcomingFeatures = [
  {
    icon: Brain,
    title: "AI Video Summaries",
    description: "Transform your recordings into actionable insights with AI-powered summaries that capture key points and client takeaways automatically."
  },
  {
    icon: Video,
    title: "Dual Recording Mode",
    description: "Record your face and screen simultaneously with seamless picture-in-picture functionality for more engaging client presentations."
  },
  {
    icon: Database,
    title: "CRM Integration",
    description: "Send video summaries and links directly to your client's profile in Wealthbox, Redtail, or Salesforce with one-click integration."
  },
  {
    icon: FileText,
    title: "Market Script Library",
    description: "Access professionally scripted content with real-time market charts and industry data for compelling 30-second video clips."
  },
  {
    icon: User,
    title: "AI Avatar Assistant",
    description: "Create professional videos without ever recording your voice—let your AI avatar deliver scripted content in your own voice."
  }
];

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <img 
                  src={logoUrl} 
                  alt="MoneyClip" 
                  className="h-16 w-auto object-contain cursor-pointer"
                  data-testid="logo-moneyclip"
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  data-testid="button-dashboard"
                  className="text-secondary hover:text-primary transition-colors duration-200 font-medium px-4 py-2"
                >
                  Dashboard
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="ghost"
                  data-testid="button-login"
                  className="text-secondary hover:text-primary transition-colors duration-200 font-medium px-4 py-2"
                >
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Link href="/">
            <Button
              variant="ghost"
              data-testid="button-back-home"
              className="mb-6 text-primary hover:text-blue-700 inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Exciting Features Coming Soon
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're constantly innovating to bring you the most powerful tools for financial advisor video communication. 
            Here's what's on the horizon.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {upcomingFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Client Communication?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Don't wait for these features to launch. Start creating professional video content today 
            and be first to access these powerful new capabilities when they're released.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                data-testid="button-get-started"
                className="bg-primary hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Get Started Today
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                data-testid="button-view-dashboard"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-8 py-3 rounded-lg transition-all duration-200"
              >
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}