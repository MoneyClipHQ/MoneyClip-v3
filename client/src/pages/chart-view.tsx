import { useState } from 'react';
import { useLocation } from 'wouter';
import { DraggableScriptPopup } from '@/components/DraggableScriptPopup';
import { Button } from '@/components/ui/button';
import { Play, FileText } from 'lucide-react';

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

// Chart view page - displays the S&P 500 chart for recording
export function ChartViewPage() {
  const [, setLocation] = useLocation();
  const [showScript, setShowScript] = useState(true); // Show script by default

  const handleStartRecording = () => {
    // Open recording page in new tab so chart remains visible
    window.open('/record', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-chart-title">
              {sampleChartScript.chartTitle}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" data-testid="text-chart-category">
              {sampleChartScript.chartCategory} • Chart View for Recording
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleStartRecording}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-start-recording"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Recording
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowScript(!showScript)}
              data-testid="button-toggle-script"
            >
              <FileText className="h-4 w-4 mr-2" />
              {showScript ? "Hide Script" : "Show Script"}
            </Button>
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <img 
            src={sp500ChartImage} 
            alt="S&P 500 Annual Returns and Intra-Year Declines Chart"
            className="w-full h-auto rounded"
            data-testid="img-sp500-chart"
          />
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-4 bg-blue-50 dark:bg-blue-950 px-6 py-3 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Recording Tip:</strong> Position the script popup anywhere on your screen for easy reading during recording
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