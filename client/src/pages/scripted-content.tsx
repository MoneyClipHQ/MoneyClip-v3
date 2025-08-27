import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowLeft, Clock, Users, TrendingUp, DollarSign, Shield } from "lucide-react";
import AdvisorDropdown from "@/components/advisor-dropdown";
import logoUrl from "@/assets/logos/moneyclip-logo.png";

// Mock advisor data
const mockAdvisor = {
  id: "advisor-1",
  name: "Sarah Chen",
  company: "Chen Financial Advisory"
};

interface ScriptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  tags: string[];
  content?: string;
}

export default function ScriptedContent() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const scriptTemplates: ScriptTemplate[] = [
    {
      id: "script-1",
      title: "Quarterly Portfolio Review",
      description: "A comprehensive script for reviewing client portfolios, including performance analysis, rebalancing recommendations, and market outlook.",
      category: "Portfolio Management",
      estimatedTime: "5-8 minutes",
      difficulty: "Intermediate",
      tags: ["Portfolio", "Performance", "Rebalancing", "Analysis"]
    },
    {
      id: "script-2",
      title: "Market Update Briefing",
      description: "Keep clients informed with regular market updates covering recent developments, economic indicators, and investment implications.",
      category: "Market Commentary",
      estimatedTime: "3-5 minutes",
      difficulty: "Beginner",
      tags: ["Market Trends", "Economic News", "Investment Outlook"]
    },
    {
      id: "script-3",
      title: "Retirement Planning Basics",
      description: "An introductory script covering retirement planning fundamentals, including 401(k) strategies, IRA options, and timing considerations.",
      category: "Retirement Planning",
      estimatedTime: "8-12 minutes",
      difficulty: "Beginner",
      tags: ["Retirement", "401k", "IRA", "Planning"]
    },
    {
      id: "script-4",
      title: "Tax-Loss Harvesting Explanation",
      description: "Explain tax-loss harvesting strategies to clients, including benefits, timing, and potential pitfalls to avoid.",
      category: "Tax Strategies",
      estimatedTime: "6-10 minutes",
      difficulty: "Advanced",
      tags: ["Tax Planning", "Harvesting", "Optimization"]
    },
    {
      id: "script-5",
      title: "ESG Investment Overview",
      description: "Introduce clients to ESG investing principles, impact measurement, and how it fits into their overall investment strategy.",
      category: "Investment Strategies",
      estimatedTime: "7-10 minutes",
      difficulty: "Intermediate",
      tags: ["ESG", "Sustainable", "Impact Investing"]
    },
    {
      id: "script-6",
      title: "Risk Tolerance Assessment",
      description: "Guide clients through understanding their risk tolerance and how it affects their investment portfolio allocation.",
      category: "Risk Management",
      estimatedTime: "5-7 minutes",
      difficulty: "Beginner",
      tags: ["Risk Assessment", "Portfolio Allocation", "Client Education"]
    }
  ];

  const categories = Array.from(new Set(scriptTemplates.map(script => script.category)));

  const filteredScripts = selectedCategory 
    ? scriptTemplates.filter(script => script.category === selectedCategory)
    : scriptTemplates;

  const getDifficultyColor = (difficulty: ScriptTemplate["difficulty"]) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
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

  const handleUseScript = (scriptId: string) => {
    console.log("Using script:", scriptId);
    // TODO: Navigate to recording flow with pre-selected script
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
            Ready-made scripts to help you create professional, compliant recordings. 
            Each template includes talking points, key information, and suggested flow.
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
            {categories.map((category) => (
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

        {/* Script Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredScripts.map((script) => {
            const IconComponent = getCategoryIcon(script.category);
            
            return (
              <Card key={script.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-2">
                    <IconComponent className="h-6 w-6 text-primary flex-shrink-0" />
                    <Badge
                      className={getDifficultyColor(script.difficulty)}
                      data-testid={`badge-difficulty-${script.id}`}
                    >
                      {script.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg" data-testid={`script-title-${script.id}`}>
                    {script.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3" data-testid={`script-description-${script.id}`}>
                    {script.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span data-testid={`script-time-${script.id}`}>{script.estimatedTime}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {script.category}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {script.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                        data-testid={`script-tag-${script.id}-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {script.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{script.tags.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleUseScript(script.id)}
                    data-testid={`button-use-script-${script.id}`}
                  >
                    Use This Script
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Results Count */}
        {filteredScripts.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600" data-testid="text-scripts-count">
              Showing {filteredScripts.length} of {scriptTemplates.length} script templates
            </p>
          </div>
        )}
      </div>
    </div>
  );
}