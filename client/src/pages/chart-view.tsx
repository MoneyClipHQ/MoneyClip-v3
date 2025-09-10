import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { FinanceChartComponent } from '@/components/finance-charts';
import { DraggableScriptPopup } from '@/components/DraggableScriptPopup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Play, FileText, RotateCcw } from 'lucide-react';
import { financeChartData } from '@shared/finance-charts';
import type { FinanceChart } from '../../../server/openai-service';
import type { ChartScript } from '@shared/schema';

// Chart view page - displays a single chart in full-screen for recording
export function ChartViewPage() {
  const [match, params] = useRoute('/chart/:chartId');
  const [, setLocation] = useLocation();
  const [showScript, setShowScript] = useState(false);
  const [currentScript, setCurrentScript] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const chartId = params?.chartId;
  const chart = chartId ? financeChartData.find((c: FinanceChart) => c.id === chartId) : null;

  // Fetch existing script for this chart
  const { data: existingScripts = [] } = useQuery<ChartScript[]>({
    queryKey: ['/api/chart-scripts', chartId],
    enabled: !!chartId
  });

  // Generate new script mutation
  const generateScriptMutation = useMutation({
    mutationFn: async () => {
      if (!chart) throw new Error('Chart not found');
      
      const response = await apiRequest('POST', '/api/chart-scripts/generate', {
        chartId: chart.id,
        chartTitle: chart.title,
        chartCategory: chart.category
      });
      return response as unknown as ChartScript;
    },
    onSuccess: (script) => {
      setCurrentScript(script);
      setShowScript(true);
      queryClient.invalidateQueries({ queryKey: ['/api/chart-scripts'] });
      toast({
        title: "Script Generated",
        description: `Created a ${script.estimatedDuration} second script for ${chart?.title}`
      });
    },
    onError: () => {
      toast({
        title: "Script Generation Failed",
        description: "Unable to generate script. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create chart session for tracking
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!currentScript) throw new Error('No script available');
      
      return await apiRequest('/api/chart-sessions', 'POST', {
        chartScriptId: currentScript.id,
        sessionType: 'recording'
      });
    }
  });

  const handleScriptOpened = () => {
    if (currentScript) {
      createSessionMutation.mutate();
    }
  };

  const handleGenerateScript = () => {
    generateScriptMutation.mutate();
  };

  const handleUseExistingScript = (script: any) => {
    setCurrentScript(script);
    setShowScript(true);
  };

  const handleStartRecording = () => {
    // Navigate to recording page with chart context
    setLocation('/record?source=chart&chartId=' + chartId + '&scriptId=' + currentScript?.id);
  };

  // Redirect if chart not found
  useEffect(() => {
    if (!chart && chartId) {
      toast({
        title: "Chart Not Found",
        description: "The requested chart could not be found.",
        variant: "destructive"
      });
      setLocation('/scripted-content');
    }
  }, [chart, chartId, setLocation, toast]);

  if (!chart) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-chart-title">
              {chart.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" data-testid="text-chart-category">
              {chart.category} • Chart View for Recording
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {!showScript && (
              <>
                {/* Generate new script */}
                <Button
                  onClick={handleGenerateScript}
                  disabled={generateScriptMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-generate-script"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {generateScriptMutation.isPending ? "Generating..." : "Generate Script"}
                </Button>

                {/* Use existing script */}
                {existingScripts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">or use:</span>
                    {existingScripts.slice(0, 2).map((script: any) => (
                      <Button
                        key={script.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleUseExistingScript(script)}
                        data-testid={`button-use-script-${script.id}`}
                      >
                        Latest ({script.estimatedDuration}s)
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}

            {showScript && currentScript && (
              <Button
                onClick={handleStartRecording}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-start-recording"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            )}

            {showScript && (
              <Button
                variant="outline"
                onClick={() => setShowScript(false)}
                data-testid="button-hide-script"
              >
                Hide Script
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <FinanceChartComponent 
            chart={chart} 
            height={600}
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
        script={currentScript}
        isVisible={showScript && !!currentScript}
        onClose={() => setShowScript(false)}
        onScriptOpened={handleScriptOpened}
      />
    </div>
  );
}