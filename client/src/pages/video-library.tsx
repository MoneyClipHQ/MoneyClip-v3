import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  VideoIcon, Search, ArrowLeft, Grid, List, Filter, Play, Edit3, Share2, Trash2, 
  Clock, Calendar, MoreVertical, RefreshCw, Eye, Download, Undo
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdvisorDropdown from "@/components/advisor-dropdown";
import type { Video } from "@shared/schema";
import logoUrl from "@/assets/logos/moneyclip-logo.png";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";

// Status configuration
const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Edit3 },
  in_review: { label: "In Review", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: Eye },
  expired: { label: "Expired", color: "bg-red-100 text-red-800", icon: Calendar },
  trash: { label: "Trash", color: "bg-red-100 text-red-800", icon: Trash2 },
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "expired", label: "Expired" },
  { value: "trash", label: "Trash" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title A-Z" },
];

export default function VideoLibrary() {
  usePageTitle("MoneyClip - Video Library");
  
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch videos with status filtering
  const { data: videos = [], isLoading, error } = useQuery<Video[]>({
    queryKey: ["/api/videos", statusFilter],
    queryFn: async () => {
      const endpoint = statusFilter === "all" ? "/api/videos" : `/api/videos/status/${statusFilter}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch videos');
      return response.json();
    },
    enabled: isAuthenticated
  });

  // Video management mutations
  const softDeleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`/api/videos/${videoId}/delete`, { method: "PATCH" });
      if (!response.ok) throw new Error('Failed to delete video');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/videos" || 
        (Array.isArray(query.queryKey) && query.queryKey[0] === "/api/videos")
      });
      toast({ title: "Video moved to trash", description: "You have 30 days to restore it." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete video", variant: "destructive" });
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`/api/videos/${videoId}/restore`, { method: "PATCH" });
      if (!response.ok) throw new Error('Failed to restore video');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/videos" || 
        (Array.isArray(query.queryKey) && query.queryKey[0] === "/api/videos")
      });
      toast({ title: "Video restored", description: "Video has been restored from trash." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to restore video", variant: "destructive" });
    }
  });

  const renewMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`/api/videos/${videoId}/renew`, { method: "PATCH" });
      if (!response.ok) throw new Error('Failed to renew video');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/videos" || 
        (Array.isArray(query.queryKey) && query.queryKey[0] === "/api/videos")
      });
      toast({ title: "Video renewed", description: "Video expiration extended by 30 days." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to renew video", variant: "destructive" });
    }
  });

  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {
    let filtered = videos.filter((video: Video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Sort videos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [videos, searchQuery, sortBy]);

  // Helper functions
  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-xs font-medium`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = (video: Video) => {
    return video.expiresAt && new Date(video.expiresAt) <= new Date();
  };

  const canShare = (video: Video) => {
    return video.status === "approved" && !isExpired(video);
  };

  // Video action handlers
  const handleWatch = (video: Video) => {
    if (video.status === "trash") {
      toast({ title: "Cannot watch", description: "Video is in trash", variant: "destructive" });
      return;
    }
    // For now, navigate to edit page - could be enhanced with a watch modal
    navigate(`/video/${video.id}/edit`);
  };

  const handleEdit = (video: Video) => {
    if (video.status === "trash") {
      toast({ title: "Cannot edit", description: "Video is in trash", variant: "destructive" });
      return;
    }
    navigate(`/video/${video.id}/edit`);
  };

  const handleShare = (video: Video) => {
    if (!canShare(video)) {
      toast({ 
        title: "Cannot share", 
        description: "Video must be approved and not expired to share", 
        variant: "destructive" 
      });
      return;
    }
    // Copy share link to clipboard
    const shareUrl = `${window.location.origin}/share/${video.shareLink}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Share link copied", description: "Share link has been copied to clipboard" });
  };

  const handleDelete = (video: Video) => {
    if (video.status === "trash") {
      // Permanent delete would go here - for now just show message
      toast({ title: "Permanent delete", description: "This would permanently delete the video" });
      return;
    }
    softDeleteMutation.mutate(video.id);
  };

  const handleRestore = (video: Video) => {
    restoreMutation.mutate(video.id);
  };

  const handleRenew = (video: Video) => {
    renewMutation.mutate(video.id);
  };

  // Loading skeleton
  const VideoSkeleton = () => (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-8 ml-auto" />
      </CardFooter>
    </Card>
  );

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
              advisorName={user?.advisorName || "User"}
              onSettings={() => navigate("/settings")}
              onSignOut={() => navigate("/login")}
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

        {/* Enhanced Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search Bar */}
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
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-32" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode */}
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
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1"
          }`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <VideoSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16 bg-white rounded-lg border border-red-200">
            <VideoIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              We couldn't load your library
            </h3>
            <p className="text-red-600 mb-6">
              Something went wrong. Please try again.
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/videos"] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredAndSortedVideos.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-200">
            <VideoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-no-videos">
              {searchQuery || (statusFilter !== "all") ? "No results match your filters" : "No videos yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || (statusFilter !== "all") 
                ? "Try adjusting your search terms or filters" 
                : "Create your first clip to get started"
              }
            </p>
            <Link href="/dashboard">
              <Button data-testid="button-start-recording">
                <VideoIcon className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            </Link>
          </div>
        )}

        {/* Video Grid/List */}
        {!isLoading && !error && filteredAndSortedVideos.length > 0 && (
          <>
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {filteredAndSortedVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {/* Results Count */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600" data-testid="text-results-count">
                Showing {filteredAndSortedVideos.length} of {videos.length} videos
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Enhanced Video Card Component
  function VideoCard({ video }: { video: Video }) {
    return (
      <Card className="w-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate" data-testid={`text-video-title-${video.id}`}>
                {video.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {video.clientName && `For ${video.clientName} • `}
                {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
              </p>
            </div>
            {getStatusBadge(video.status)}
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          {video.description && (
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
              {video.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {video.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(Number(video.duration))}
              </span>
            )}
            <span>Views: {video.viewCount || 0}</span>
            {video.expiresAt && (
              <span className={`flex items-center gap-1 ${isExpired(video) ? 'text-red-600' : ''}`}>
                <Calendar className="h-3 w-3" />
                {isExpired(video) ? 'Expired' : `Expires ${formatDistanceToNow(new Date(video.expiresAt))}`}
              </span>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-2">
          <div className="flex items-center gap-2 w-full">
            {/* Primary Actions */}
            {video.status !== "trash" ? (
              <>
                <Button 
                  size="sm" 
                  onClick={() => handleWatch(video)}
                  data-testid={`button-watch-${video.id}`}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Watch
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleEdit(video)}
                  data-testid={`button-edit-${video.id}`}
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                onClick={() => handleRestore(video)}
                disabled={restoreMutation.isPending}
                data-testid={`button-restore-${video.id}`}
              >
                <Undo className="h-3 w-3 mr-1" />
                Restore
              </Button>
            )}

            {/* More Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="ml-auto" data-testid={`button-actions-${video.id}`}>
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {video.status !== "trash" && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => handleShare(video)}
                      disabled={!canShare(video)}
                    >
                      <Share2 className="h-3 w-3 mr-2" />
                      Share
                    </DropdownMenuItem>
                    
                    {isExpired(video) && (
                      <DropdownMenuItem 
                        onClick={() => handleRenew(video)}
                        disabled={renewMutation.isPending}
                      >
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Renew for 30 days
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(video)}
                      disabled={softDeleteMutation.isPending}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Move to trash
                    </DropdownMenuItem>
                  </>
                )}
                
                {video.status === "trash" && (
                  <DropdownMenuItem 
                    onClick={() => handleDelete(video)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete permanently
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>
    );
  }
}