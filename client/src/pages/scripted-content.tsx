import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowLeft, Clock, ExternalLink, Play } from "lucide-react";
import AdvisorDropdown from "@/components/advisor-dropdown";
import logoUrl from "@/assets/logos/moneyclip-logo.png";
import { usePageTitle } from "@/hooks/usePageTitle";
import { DraggableScriptPopup } from "@/components/DraggableScriptPopup";
import { useAuth } from "@/hooks/useAuth";
import sp500ChartImage from "@assets/Slide16_1757512208143.png";

// S&P 500 example data
const sampleChartScript = {
  id: "sp500-example",
  chartTitle: "S&P 500 Annual Returns and Intra-Year Declines",
  chartCategory: "Market Analysis",
  scriptText: `What this chart shows are the returns of the S&P 500 going all the way back to 1980. Each gray bar is where the market ended for the year, and the red dots are the pullbacks that happened along the way. What's interesting is that in over 40 years, there have only been about 8 or 9 years that finished negative. But in every single year, you can see those red dots — meaning there was always a period where the market dropped, sometimes by a lot. Take 1998 for example: at one point the market was down 19%, but by the end of the year it finished up 27%. The big lesson here is that corrections and scary headlines are completely normal, but history tells us that staying invested through those ups and downs has worked out over time.`,
  estimatedDuration: "30",
  keyPoints: [
    "Only 8-9 negative years out of 40+ years",
    "Every year has intra-year pullbacks (red dots)",
    "1998: Down 19% mid-year, finished +27%",
    "Corrections are normal, staying invested pays off"
  ]
};

export default function ScriptedContent() {
  usePageTitle("MoneyClip - Scripted Content");
  
  const { user } = useAuth();
  const [showScript, setShowScript] = useState(false);

  const handleOpenChart = () => {
    // Open chart in new tab for screen recording
    const chartUrl = `/chart/sp500-example`;
    window.open(chartUrl, '_blank', 'width=1200,height=800');
  };

  const handleShowScript = () => {
    setShowScript(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard">
              <img 
                src={logoUrl} 
                alt="MoneyClip" 
                className="h-20 w-auto object-contain cursor-pointer"
                data-testid="logo-moneyclip"
              />
            </Link>
            <AdvisorDropdown
              advisorName={user?.advisorName || "Advisor"}
              onSettings={() => console.log("Settings clicked")}
              onSignOut={() => console.log("Sign out clicked")}
            />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button and Title */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" data-testid="button-back" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="title-scripted-content">
            Scripted Content
          </h1>
        </div>

        {/* Description */}
        <div className="mb-8">
          <p className="text-gray-600 max-w-2xl">
            Professional scripted content for client communications. Practice your presentation with our sample S&P 500 analysis, 
            then record your screen explanation using the provided 30-second script.
          </p>
        </div>

        {/* Single Example Chart */}
        <div className="max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mb-2">
                <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                <Badge variant="outline" className="text-xs">
                  Market Analysis
                </Badge>
              </div>
              <CardTitle className="text-xl" data-testid="chart-title-sp500">
                {sampleChartScript.chartTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chart Image */}
              <div className="mb-6 bg-white rounded-lg p-4 border">
                <img 
                  src={sp500ChartImage} 
                  alt="S&P 500 Annual Returns and Intra-Year Declines Chart"
                  className="w-full h-auto rounded"
                  data-testid="img-sp500-chart"
                />
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <Badge variant="outline" className="text-xs">
                  {sampleChartScript.chartCategory}
                </Badge>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{sampleChartScript.estimatedDuration} second script</span>
                </div>
              </div>

              {/* Script Preview */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">📝 Ready-to-Use Script</p>
                <p className="text-xs text-blue-700 leading-relaxed line-clamp-3">
                  {sampleChartScript.scriptText.substring(0, 200)}...
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleShowScript}
                  data-testid="button-view-script"
                  className="flex items-center justify-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Full Script
                </Button>
                <Button
                  onClick={handleOpenChart}
                  data-testid="button-open-chart"
                  className="flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Chart & Record
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="mt-12 max-w-2xl mx-auto text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How it Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2 font-semibold">1</div>
              <p>View the provided script and chart</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2 font-semibold">2</div>
              <p>Open chart in new tab for recording</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2 font-semibold">3</div>
              <p>Record your screen and share with clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Draggable Script Popup */}
      <DraggableScriptPopup
        script={sampleChartScript}
        isVisible={showScript}
        onClose={() => setShowScript(false)}
      />
    </div>
  );
}