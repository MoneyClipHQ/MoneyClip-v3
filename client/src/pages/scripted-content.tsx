import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowLeft, Clock, Users, TrendingUp, DollarSign, Shield, BarChart3, PieChart, LineChart, PlayCircle, ExternalLink } from "lucide-react";
import AdvisorDropdown from "@/components/advisor-dropdown";
import logoUrl from "@/assets/logos/moneyclip-logo.png";
import { usePageTitle } from "@/hooks/usePageTitle";
import { FinanceChartComponent } from "@/components/finance-charts";
import { financeChartData, chartCategories, chartTypeConfig } from "../../../shared/finance-charts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Mock advisor data
const mockAdvisor = {
  id: "advisor-1",
  name: "Sarah Chen",
  company: "Chen Financial Advisory"
};

interface ChartScript {
  id: string;
  chartId: string;
  script: string;
  estimatedDuration: number;
  keyPoints: string[];
  loading?: boolean;
}

export default function ScriptedContent() {
  usePageTitle("MoneyClip - Scripted Content");
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [chartScripts, setChartScripts] = useState<Record<string, ChartScript>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate script mutation
  const generateScriptMutation = useMutation({
    mutationFn: async (chartId: string) => {
      const chart = financeChartData.find(c => c.id === chartId);
      if (!chart) throw new Error('Chart not found');
      
      const response = await apiRequest("POST", "/api/charts/generate-script", {
        chart
      });
      return response.json();
    },
    onSuccess: (data, chartId) => {
      setChartScripts(prev => ({
        ...prev,
        [chartId]: {
          id: data.id,
          chartId,
          script: data.script,
          estimatedDuration: data.estimatedDuration,
          keyPoints: data.keyPoints,
          loading: false
        }
      }));
      toast({
        title: "Script Generated",
        description: "AI script has been generated for this chart.",
      });
    },
    onError: (error) => {
      console.error('Failed to generate script:', error);
      toast({
        title: "Error",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredCharts = selectedCategory 
    ? financeChartData.filter(chart => chart.category === selectedCategory)
    : financeChartData;

  const getChartTypeIcon = (chartType: string) => {
    switch (chartType) {
      case 'line': return LineChart;
      case 'bar': return BarChart3;
      case 'pie': return PieChart;
      case 'area': return TrendingUp;
      default: return BarChart3;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Portfolio Management": return TrendingUp;
      case "Market Commentary": return DollarSign;
      case "Retirement Planning": return Users;
      case "Tax Strategies": return Shield;
      case "Investment Strategies": return TrendingUp;
      case "Risk Management": return Shield;
      default: return FileText;
    }
  };

  const handleGenerateScript = async (chartId: string) => {
    setChartScripts(prev => ({
      ...prev,
      [chartId]: {
        ...prev[chartId],
        loading: true
      }
    }));
    
    generateScriptMutation.mutate(chartId);
  };

  const handleOpenChart = (chartId: string) => {
    // Open chart in new tab for screen recording
    const chartUrl = `/chart/${chartId}`;
    window.open(chartUrl, '_blank', 'width=1200,height=800');
  };

  const handleStartRecording = (chartId: string) => {
    // Navigate to recording flow with pre-selected chart
    const chart = financeChartData.find(c => c.id === chartId);
    const script = chartScripts[chartId];
    
    if (chart && script) {
      // Store chart and script data for recording session
      sessionStorage.setItem('recordingChart', JSON.stringify({
        chart,
        script
      }));
      window.open(`/record?chart=${chartId}`, '_blank');
    } else {
      toast({
        title: "Generate Script First",
        description: "Please generate a script before starting recording.",
        variant: "destructive",
      });
    }
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
              advisorName={mockAdvisor.name}
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
            Interactive finance charts with AI-generated scripts for professional client communications. 
            Click any chart to generate a custom 30-second script, then record your screen explanation.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              data-testid="button-all-categories"
            >
              All Categories
            </Button>
            {chartCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                data-testid={`button-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Finance Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCharts.map((chart) => {
            const IconComponent = getChartTypeIcon(chart.chartType);
            const script = chartScripts[chart.id];
            const isGeneratingScript = script?.loading || generateScriptMutation.isPending;
            
            return (
              <Card key={chart.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <IconComponent className="h-6 w-6 text-primary flex-shrink-0" />
                    <Badge variant="outline" className="text-xs">
                      {chartTypeConfig[chart.chartType]?.name || chart.chartType}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg" data-testid={`chart-title-${chart.id}`}>
                    {chart.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Chart Preview */}
                  <div className="mb-4 bg-gray-50 rounded-lg p-3 h-32">
                    <FinanceChartComponent chart={chart} height={100} />
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2" data-testid={`chart-description-${chart.id}`}>
                    {chart.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <Badge variant="outline" className="text-xs">
                      {chart.category}
                    </Badge>
                    {script && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{script.estimatedDuration}s script</span>
                      </div>
                    )}
                  </div>

                  {/* Script Status */}
                  {script && !script.loading && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium mb-1">✓ Script Ready</p>
                      <p className="text-xs text-green-600 line-clamp-2">
                        {script.script.substring(0, 100)}...
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {!script ? (
                      <Button
                        className="w-full"
                        onClick={() => handleGenerateScript(chart.id)}
                        disabled={isGeneratingScript}
                        data-testid={`button-generate-script-${chart.id}`}
                      >
                        {isGeneratingScript ? "Generating Script..." : "Generate AI Script"}
                      </Button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenChart(chart.id)}
                          data-testid={`button-open-chart-${chart.id}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open Chart
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStartRecording(chart.id)}
                          data-testid={`button-start-recording-${chart.id}`}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Record
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Results Count */}
        {filteredCharts.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600" data-testid="text-charts-count">
              Showing {filteredCharts.length} of {financeChartData.length} finance charts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}