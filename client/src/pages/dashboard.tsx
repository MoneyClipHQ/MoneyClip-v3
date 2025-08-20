import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { VideoIcon, FolderOpen, FileText, Plus } from "lucide-react";
import AdvisorDropdown from "@/components/advisor-dropdown";
import VideoThumbnail from "@/components/video-thumbnail";
import type { Video } from "@shared/schema";

// Mock advisor data - in a real app, this would come from auth context
const mockAdvisor = {
  id: "advisor-1",
  name: "Sarah Chen",
  company: "Chen Financial Advisory"
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"library" | "scripted" | null>(null);
  const [, navigate] = useLocation();

  // Fetch recent videos
  const { data: recentVideos = [], isLoading } = useQuery({
    queryKey: ["/api/videos/recent"],
    enabled: false // Disabled for now since we don't have the API endpoint yet
  });

  const handleRecord = () => {
    // TODO: Navigate to recording flow
    console.log("Starting recording flow");
  };

  const handleVideoClick = (videoId: string) => {
    // TODO: Navigate to video detail page
    console.log("Opening video:", videoId);
  };

  const handleVideoLibrary = () => {
    setActiveTab("library");
    navigate("/video-library");
  };

  const handleScriptedContent = () => {
    setActiveTab("scripted");
    navigate("/scripted-content");
  };

  // Mock recent videos for demo
  const mockRecentVideos: Video[] = [
    {
      id: "video-1",
      advisorId: "advisor-1",
      title: "Q4 Portfolio Review",
      description: "Quarterly portfolio performance analysis",
      fileUrl: "/videos/q4-review.mp4",
      thumbnailUrl: "/thumbnails/q4-review.jpg",
      duration: "360",
      status: "published",
      viewCount: "12",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "video-2",
      advisorId: "advisor-1",
      title: "Market Update - December 2025",
      description: "Latest market trends and outlook",
      fileUrl: "/videos/market-update.mp4",
      thumbnailUrl: null,
      duration: "240",
      status: "published",
      viewCount: "8",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: "video-3",
      advisorId: "advisor-1",
      title: "Retirement Planning Basics",
      description: "Introduction to retirement planning strategies",
      fileUrl: "/videos/retirement-basics.mp4",
      thumbnailUrl: "/thumbnails/retirement.jpg",
      duration: "480",
      status: "draft",
      viewCount: "0",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ];

  const displayVideos = mockRecentVideos; // Use mock data for now

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard">
              <span 
                className="text-2xl font-bold text-primary cursor-pointer hover:text-blue-700 transition-colors"
                data-testid="logo-moneyclip"
              >
                MoneyClip
              </span>
            </Link>
            <AdvisorDropdown
              advisorName={mockAdvisor.name}
              onBranding={() => console.log("Branding clicked")}
              onCompliance={() => console.log("Compliance clicked")}
              onSettings={() => console.log("Settings clicked")}
              onSignOut={() => console.log("Sign out clicked")}
            />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary Navigation */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant={activeTab === "library" ? "default" : "outline"}
              onClick={handleVideoLibrary}
              data-testid="button-video-library"
              className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"
            >
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Video Library</span>
              <span className="sm:hidden">Library</span>
            </Button>
            <Button
              variant={activeTab === "scripted" ? "default" : "outline"}
              onClick={handleScriptedContent}
              data-testid="button-scripted-content"
              className="flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Scripted Content</span>
              <span className="sm:hidden">Scripts</span>
            </Button>
          </div>
        </div>

        {/* Primary Action - Record Button */}
        <div className="text-center mb-12">
          <Button
            size="lg"
            onClick={handleRecord}
            data-testid="button-record"
            className="h-16 sm:h-20 px-8 sm:px-12 text-base sm:text-lg font-semibold bg-primary hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
          >
            <VideoIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
            Record
          </Button>
          <p className="text-sm text-gray-600 mt-3 px-4">
            Record your screen with voice
          </p>
        </div>

        {/* Recent Videos Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6" data-testid="section-recent-videos">
            Recent Videos
          </h2>
          
          {displayVideos.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-200">
              <VideoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-empty-state-title">
                No videos yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto" data-testid="text-empty-state-message">
                Get started by recording your first video to share with clients
              </p>
              <Button
                onClick={handleRecord}
                data-testid="button-record-first-video"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Record your first video
              </Button>
            </div>
          ) : (
            /* Recent Videos Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayVideos.slice(0, 3).map((video) => (
                <VideoThumbnail
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoClick(video.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}