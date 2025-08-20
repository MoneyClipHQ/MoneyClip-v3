import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoIcon, Search, ArrowLeft, Grid, List, Filter } from "lucide-react";
import AdvisorDropdown from "@/components/advisor-dropdown";
import VideoThumbnail from "@/components/video-thumbnail";
import type { Video } from "@shared/schema";

// Mock advisor data
const mockAdvisor = {
  id: "advisor-1",
  name: "Sarah Chen",
  company: "Chen Financial Advisory"
};

export default function VideoLibrary() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock video data - expanded for library view
  const mockVideos: Video[] = [
    {
      id: "video-1",
      advisorId: "advisor-1",
      title: "Q4 Portfolio Review",
      description: "Quarterly portfolio performance analysis and strategic adjustments for 2025",
      fileUrl: "/videos/q4-review.mp4",
      thumbnailUrl: "/thumbnails/q4-review.jpg",
      duration: "360",
      status: "published",
      viewCount: "12",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "video-2",
      advisorId: "advisor-1",
      title: "Market Update - December 2025",
      description: "Latest market trends, economic indicators, and investment outlook",
      fileUrl: "/videos/market-update.mp4",
      thumbnailUrl: null,
      duration: "240",
      status: "published",
      viewCount: "8",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: "video-3",
      advisorId: "advisor-1",
      title: "Retirement Planning Basics",
      description: "Introduction to retirement planning strategies and key considerations",
      fileUrl: "/videos/retirement-basics.mp4",
      thumbnailUrl: "/thumbnails/retirement.jpg",
      duration: "480",
      status: "draft",
      viewCount: "0",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "video-4",
      advisorId: "advisor-1",
      title: "Tax-Loss Harvesting Strategy",
      description: "How to optimize your investment portfolio for tax efficiency",
      fileUrl: "/videos/tax-loss.mp4",
      thumbnailUrl: "/thumbnails/tax-loss.jpg",
      duration: "300",
      status: "published",
      viewCount: "15",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: "video-5",
      advisorId: "advisor-1",
      title: "ESG Investing Explained",
      description: "Environmental, social, and governance considerations in modern investing",
      fileUrl: "/videos/esg-investing.mp4",
      thumbnailUrl: "/thumbnails/esg.jpg",
      duration: "420",
      status: "published",
      viewCount: "22",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ];

  const filteredVideos = mockVideos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleVideoClick = (videoId: string) => {
    console.log("Opening video:", videoId);
  };

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
          <h1 className="text-2xl font-bold text-gray-900" data-testid="title-video-library">
            Video Library
          </h1>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-videos"
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              data-testid="button-grid-view"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              data-testid="button-list-view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" data-testid="button-filter">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {/* Video Grid/List */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-200">
            <VideoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-no-videos">
              No videos found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? "Try adjusting your search terms" : "Start recording to build your video library"}
            </p>
            <Link href="/dashboard">
              <Button data-testid="button-start-recording">
                <VideoIcon className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            </Link>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1"
          }`}>
            {filteredVideos.map((video) => (
              <VideoThumbnail
                key={video.id}
                video={video}
                onClick={() => handleVideoClick(video.id)}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {filteredVideos.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600" data-testid="text-results-count">
              Showing {filteredVideos.length} of {mockVideos.length} videos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}