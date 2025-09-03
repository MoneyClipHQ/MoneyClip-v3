import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { VideoIcon, FolderOpen, FileText, Clock } from "lucide-react";
import AdvisorDropdown from "@/components/advisor-dropdown";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoUrl from "@/assets/logos/moneyclip-logo.png";
import { usePageTitle } from "@/hooks/usePageTitle";



// Mock advisor data - in a real app, this would come from auth context
const mockAdvisor = {
  id: "advisor-1",
  name: "Sarah Chen",
  company: "Chen Financial Advisory"
};

export default function Dashboard() {
  usePageTitle("MoneyClip - Dashboard");
  
  const [activeTab, setActiveTab] = useState<"library" | "scripted" | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user from auth
  const { user } = useAuth();
  
  // Use real advisor data from auth
  const advisor = user ? {
    id: user.id,
    name: user.advisorName,
    company: user.companyName
  } : mockAdvisor;

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      // Clear all queries and redirect to home
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRecord = () => {
    navigate("/record");
  };

  const handleVideoLibrary = () => {
    setActiveTab("library");
    navigate("/video-library");
  };

  const handleScriptedContent = () => {
    setActiveTab("scripted");
    navigate("/scripted-content");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard">
                <img 
                  src={logoUrl} 
                  alt="MoneyClip" 
                  className="h-20 w-auto object-contain cursor-pointer"
                  data-testid="logo-moneyclip"
                />
              </Link>
              <nav className="hidden md:flex items-center space-x-1">
                <Button
                  variant={activeTab === "library" ? "default" : "ghost"}
                  onClick={handleVideoLibrary}
                  data-testid="button-video-library"
                  className="flex items-center gap-2 px-3 py-2"
                  size="sm"
                >
                  <FolderOpen className="h-4 w-4" />
                  Video Library
                </Button>
                <Button
                  variant={activeTab === "scripted" ? "default" : "ghost"}
                  onClick={handleScriptedContent}
                  data-testid="button-scripted-content"
                  className="flex items-center gap-2 px-3 py-2"
                  size="sm"
                >
                  <FileText className="h-4 w-4" />
                  Scripted Content
                </Button>
                <Link href="/coming-soon">
                  <Button
                    variant="ghost"
                    data-testid="button-coming-soon"
                    className="flex items-center gap-2 px-3 py-2"
                    size="sm"
                  >
                    <Clock className="h-4 w-4" />
                    Coming Soon
                  </Button>
                </Link>
              </nav>
            </div>
            <AdvisorDropdown
              advisorName={advisor.name}
              onSettings={() => navigate("/settings")}
              onSignOut={() => logoutMutation.mutate()}
            />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Navigation */}
        <div className="md:hidden mb-6">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "library" ? "default" : "outline"}
              onClick={handleVideoLibrary}
              data-testid="button-video-library-mobile"
              className="flex items-center gap-2 flex-1"
              size="sm"
            >
              <FolderOpen className="h-4 w-4" />
              Library
            </Button>
            <Button
              variant={activeTab === "scripted" ? "default" : "outline"}
              onClick={handleScriptedContent}
              data-testid="button-scripted-content-mobile"
              className="flex items-center gap-2 flex-1"
              size="sm"
            >
              <FileText className="h-4 w-4" />
              Scripts
            </Button>
            <Link href="/coming-soon">
              <Button
                variant="outline"
                data-testid="button-coming-soon-mobile"
                className="flex items-center gap-2 flex-1"
                size="sm"
              >
                <Clock className="h-4 w-4" />
                Coming Soon
              </Button>
            </Link>
          </div>
        </div>

        {/* Primary Action - Record Button */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Save Time. Build Trust.
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Record quick videos to answer questions, explain updates, and keep clients engaged—without another meeting.
          </p>
          <Button
            size="lg"
            onClick={handleRecord}
            data-testid="button-record"
            className="h-16 px-12 text-lg font-semibold bg-primary hover:bg-accent text-white hover:text-accent-foreground rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <VideoIcon className="h-6 w-6 mr-3" />
            Start Recording
          </Button>
          <p className="text-sm text-gray-500 mt-3">
            Screen + voice recording in one click
          </p>
        </div>

        {/* Quick Actions Section */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 text-left"
                onClick={handleVideoLibrary}
                data-testid="button-video-library-action"
              >
                <FolderOpen className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-medium">Video Library</div>
                  <div className="text-sm text-gray-500">View all recordings</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex items-center justify-start gap-4 text-left"
                onClick={handleScriptedContent}
                data-testid="button-scripted-content-action"
              >
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-medium">Browse Scripts</div>
                  <div className="text-sm text-gray-500">Ready-made content</div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}