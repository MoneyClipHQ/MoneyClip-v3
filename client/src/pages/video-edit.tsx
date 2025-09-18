import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Mail, MessageSquare, Save, Trash2, Share2, Lock, User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Video, UpdateVideo } from "@shared/schema";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function VideoEditPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  usePageTitle("MoneyClip - Edit Video");
  
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [includeProfilePicture, setIncludeProfilePicture] = useState(true);
  const [shareLink, setShareLink] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [captionBlobUrl, setCaptionBlobUrl] = useState<string | null>(null);
  
  // Clean up caption blob URL on unmount
  useEffect(() => {
    return () => {
      if (captionBlobUrl && captionBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(captionBlobUrl);
      }
    };
  }, [captionBlobUrl]);
  
  // Control caption visibility when toggled
  useEffect(() => {
    if (videoRef.current && captionBlobUrl) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].kind === 'captions' || tracks[i].kind === 'subtitles') {
          tracks[i].mode = captionsEnabled ? 'showing' : 'hidden';
        }
      }
    }
  }, [captionsEnabled, captionBlobUrl]);

  // Fetch video data
  const { data: video, isLoading, error } = useQuery<Video>({
    queryKey: ["/api/videos", id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/videos/${id}`);
      if (!response.ok) {
        throw new Error('Video not found');
      }
      return response.json();
    },
    enabled: !!id
  });

  // Load video data into form when video is loaded
  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
      setClientName(video.clientName || "");
      setPassword(video.password || "");
      setShowPassword(!!video.password);
      setCaptionsEnabled(video.captionsEnabled ?? true);
      setIncludeProfilePicture(video.includeProfilePicture ?? true);
      setShareLink(`${window.location.origin}/share/${video.shareLink}`);

      // Load captions if available
      if (video.captionsData) {
        const blob = new Blob([video.captionsData], { type: 'text/vtt' });
        const blobUrl = URL.createObjectURL(blob);
        setCaptionBlobUrl(blobUrl);
        console.log('Loaded captions from captionsData');
      } else if (video.transcriptUrl) {
        // If captionsData is not in the video object, but transcriptUrl exists, use it
        setCaptionBlobUrl(video.transcriptUrl);
        console.log('Using transcriptUrl for captions:', video.transcriptUrl);
      } else {
        console.log('No captions available for video');
      }
    }
  }, [video]);

  // Update video mutation
  const updateMutation = useMutation({
    mutationFn: async (updateData: UpdateVideo) => {
      setIsSaving(true);
      const response = await apiRequest('PATCH', `/api/videos/${id}`, updateData);
      if (!response.ok) {
        throw new Error('Failed to update video');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Video Updated",
        description: "Your video has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast({
        title: "Update Failed",
        description: "Could not update your video. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/videos/${id}`);
      if (!response.ok) {
        throw new Error('Failed to delete video');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Video Deleted",
        description: "Your video has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      navigate("/video-library");
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete your video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please add a title for your video.",
        variant: "destructive",
      });
      return;
    }
    
    if (showPassword && !password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter a password or turn off password protection.",
        variant: "destructive",
      });
      return;
    }
    
    const updateData: UpdateVideo = {
      title,
      description: description || undefined,
      clientName: clientName || undefined,
      password: (showPassword && password) ? password : undefined,
      captionsEnabled,
      includeProfilePicture,
    };
    
    updateMutation.mutate(updateData);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard.",
      });
    }
  };

  const shareViaEmail = () => {
    if (shareLink) {
      const subject = encodeURIComponent(`Video: ${title}`);
      const body = encodeURIComponent(`Hi ${clientName || "there"},\n\nI've recorded a video for you: ${shareLink}\n\nBest regards,\n${user?.advisorName}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const shareViaText = () => {
    if (shareLink) {
      toast({
        title: "Text Sharing",
        description: "Text sharing will be available soon.",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Please log in to continue</p>
            <Button 
              className="w-full mt-4"
              onClick={() => navigate("/login")}
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading video...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Video not found</p>
            <Button 
              className="w-full mt-4"
              onClick={() => navigate("/video-library")}
            >
              Back to Video Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/video-library")}
            data-testid="button-back-to-library"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Video Library
          </Button>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="title-edit-video">
            Edit Video
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Video Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    src={video.fileUrl || undefined}
                    controls
                    className="w-full rounded-lg bg-black"
                    data-testid="video-preview"
                    crossOrigin="anonymous"
                    preload="metadata"
                    onLoadedMetadata={() => {
                      // Ensure captions are visible when video loads
                      if (videoRef.current && captionsEnabled && captionBlobUrl) {
                        const tracks = videoRef.current.textTracks;
                        for (let i = 0; i < tracks.length; i++) {
                          if (tracks[i].kind === 'captions' || tracks[i].kind === 'subtitles') {
                            tracks[i].mode = captionsEnabled ? 'showing' : 'hidden';
                          }
                        }
                      }
                    }}
                  >
                    {captionsEnabled && captionBlobUrl && (
                      <track
                        kind="captions"
                        src={captionBlobUrl}
                        srcLang="en"
                        label="English"
                        default={captionsEnabled}
                      />
                    )}
                  </video>
                  
                  {/* Video Info */}
                  <div className="text-sm text-gray-600">
                    <p>Duration: {video.duration ? `${Math.floor(Number(video.duration) / 60)}:${Math.floor(Number(video.duration) % 60).toString().padStart(2, '0')}` : 'Unknown'}</p>
                    <p>Created: {new Date(video.createdAt).toLocaleDateString()}</p>
                    <p>Views: {video.viewCount || '0'}</p>
                  </div>

                  {/* Captions Toggle */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preview-captions">Show Captions</Label>
                    <Switch
                      id="preview-captions"
                      checked={captionsEnabled}
                      onCheckedChange={setCaptionsEnabled}
                      disabled={isSaving || !captionBlobUrl}
                    />
                  </div>
                  {!captionBlobUrl && (
                    <p className="text-xs text-gray-500">Captions not available for this video</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Details Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Video Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="client-name">Client Name (Optional)</Label>
                  <Input
                    id="client-name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client name for personalization"
                    disabled={isSaving}
                    data-testid="input-client-name"
                  />
                </div>

                <div>
                  <Label htmlFor="video-title">Title *</Label>
                  <Input
                    id="video-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title"
                    disabled={isSaving}
                    data-testid="input-title"
                  />
                </div>

                <div>
                  <Label htmlFor="video-description">Description</Label>
                  <Textarea
                    id="video-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your video content..."
                    className="min-h-[100px]"
                    disabled={isSaving}
                    data-testid="textarea-description"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security & Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password-protection">Password Protection</Label>
                  <Switch
                    id="password-protection"
                    checked={showPassword}
                    onCheckedChange={setShowPassword}
                    disabled={isSaving}
                  />
                </div>
                
                {showPassword && (
                  <div>
                    <Label htmlFor="video-password">Password</Label>
                    <Input
                      id="video-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={isSaving}
                      data-testid="input-password"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-profile-picture">Include Profile Picture</Label>
                  <Switch
                    id="include-profile-picture"
                    checked={includeProfilePicture}
                    onCheckedChange={setIncludeProfilePicture}
                    disabled={isSaving}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Share Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareLink}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-share-link"
                    />
                    <Button
                      onClick={copyLink}
                      variant="outline"
                      size="sm"
                      data-testid="button-copy-link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={shareViaEmail}
                    variant="outline"
                    data-testid="button-share-email"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    onClick={shareViaText}
                    variant="outline"
                    data-testid="button-share-text"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Text Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving || updateMutation.isPending}
                className="flex-1"
                data-testid="button-save"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving || updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                disabled={isSaving || deleteMutation.isPending}
                data-testid="button-delete"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}