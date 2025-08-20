import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Copy, Mail, MessageSquare, Save, Trash2, Share2, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { InsertVideo } from "@shared/schema";

interface TrimRange {
  start: number;
  end: number;
}

export default function RecordPreviewPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [showWebcam, setShowWebcam] = useState(true);
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 100 });
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load recorded video from session storage
  useEffect(() => {
    const recordedVideoUrl = sessionStorage.getItem("recordedVideo");
    const settings = sessionStorage.getItem("recordingSettings");
    
    if (recordedVideoUrl) {
      setVideoUrl(recordedVideoUrl);
      
      // Parse settings if available
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setCaptionsEnabled(parsedSettings.captionsEnabled || true);
        setShowWebcam(parsedSettings.showWebcam || true);
      }
      
      // Generate AI title and description (mock for now)
      generateAIContent();
    } else {
      // No video found, redirect back to record
      navigate("/record");
    }
  }, [navigate]);

  // Update duration when video loads
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.onloadedmetadata = () => {
        const duration = videoRef.current?.duration || 0;
        setVideoDuration(duration);
        setTrimRange({ start: 0, end: duration });
      };
    }
  }, [videoUrl]);

  const generateAIContent = async () => {
    // Mock AI-generated content
    // In production, this would call an AI service to transcribe and generate
    setTimeout(() => {
      setTitle("Portfolio Review - Q4 2024");
      setDescription("Reviewed quarterly performance, discussed rebalancing strategy, and outlined tax-loss harvesting opportunities for year-end planning.");
    }, 1000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setIsSaving(true);
      
      // TODO: Upload video to storage
      // For now, we'll use a placeholder URL
      const videoData: Partial<InsertVideo> = {
        advisorId: user?.id,
        clientName: clientName || undefined,
        title: title || "Untitled Recording",
        description: description || undefined,
        fileUrl: "placeholder-video-url", // TODO: Upload actual video
        thumbnailUrl: "placeholder-thumbnail-url", // TODO: Generate thumbnail
        duration: videoDuration.toString(),
        status: "published",
        password: password || undefined,
        shareLink: `moneyclip-${Date.now()}`, // Generate unique share ID
        captionsEnabled,
        showWebcam,
      };

      const response = await apiRequest("POST", "/api/videos", videoData);
      return response.json();
    },
    onSuccess: (data) => {
      const link = `${window.location.origin}/share/${data.shareLink}`;
      setShareLink(link);
      
      // Log compliance event
      logEvent("SAVED", {
        videoId: data.id,
        hasPassword: !!password,
        hasClientName: !!clientName,
      });
      
      toast({
        title: "Video Saved",
        description: "Your recording has been saved successfully.",
      });
      
      // Clean up session storage
      sessionStorage.removeItem("recordedVideo");
      sessionStorage.removeItem("recordingSettings");
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast({
        title: "Save Failed",
        description: "Could not save your recording. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please add a title for your recording.",
        variant: "destructive",
      });
      return;
    }
    
    saveMutation.mutate();
    logEvent("PREVIEWED", { hasClientName: !!clientName });
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard this recording?")) {
      sessionStorage.removeItem("recordedVideo");
      sessionStorage.removeItem("recordingSettings");
      navigate("/dashboard");
    }
  };

  const copyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard.",
      });
      logEvent("SHARE_LINK_CREATED", { method: "copy" });
    }
  };

  const shareViaEmail = () => {
    if (shareLink) {
      const subject = encodeURIComponent(`Video: ${title}`);
      const body = encodeURIComponent(`Hi ${clientName || "there"},\n\nI've recorded a video for you: ${shareLink}\n\nBest regards,\n${user?.advisorName}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      logEvent("SHARE_LINK_CREATED", { method: "email" });
    }
  };

  const shareViaText = () => {
    if (shareLink) {
      // This would integrate with a texting service
      toast({
        title: "Text Sharing",
        description: "Text sharing will be available soon.",
      });
      logEvent("SHARE_LINK_CREATED", { method: "text" });
    }
  };

  const logEvent = async (event: string, metadata: any) => {
    // TODO: Send to backend API
    console.log("Recording event:", event, metadata);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!shareLink ? (
          /* Preview and Edit Mode */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Preview */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {videoUrl && (
                    <div className="space-y-4">
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        className="w-full rounded-lg bg-black"
                        data-testid="video-preview"
                      />
                      
                      {/* Trim Controls */}
                      <div className="space-y-2">
                        <Label>Trim Video</Label>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{formatTime(trimRange.start)}</span>
                          <Slider
                            min={0}
                            max={videoDuration}
                            step={0.1}
                            value={[trimRange.start, trimRange.end]}
                            onValueChange={([start, end]) => setTrimRange({ start, end })}
                            className="flex-1"
                            disabled={isSaving}
                          />
                          <span>{formatTime(trimRange.end)}</span>
                        </div>
                      </div>

                      {/* Captions Toggle */}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="preview-captions">Show Captions</Label>
                        <Switch
                          id="preview-captions"
                          checked={captionsEnabled}
                          onCheckedChange={setCaptionsEnabled}
                          disabled={isSaving}
                        />
                      </div>

                      {/* Webcam Toggle */}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="preview-webcam">Show Webcam/Photo</Label>
                        <Switch
                          id="preview-webcam"
                          checked={showWebcam}
                          onCheckedChange={setShowWebcam}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Edit Details */}
            <div className="space-y-6">
              {/* Client Name */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Client Name (Optional)</Label>
                    <Input
                      id="client-name"
                      placeholder="Enter client name for personalization"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      disabled={isSaving}
                      data-testid="input-client-name"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Video Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter video title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isSaving}
                      data-testid="input-title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Add a description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      disabled={isSaving}
                      data-testid="textarea-description"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-toggle">Password Protection</Label>
                      <Switch
                        id="password-toggle"
                        checked={showPassword}
                        onCheckedChange={setShowPassword}
                        disabled={isSaving}
                      />
                    </div>
                    
                    {showPassword && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isSaving}
                          data-testid="input-password"
                        />
                        <p className="text-xs text-gray-500">
                          Viewers will need this password to watch the video
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="flex-1"
                  data-testid="button-discard"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Discard
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                  data-testid="button-save"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Video"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Share Mode */
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  <Share2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  Video Saved Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Share Link */}
                <div className="space-y-2">
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
                      data-testid="button-copy-link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  {password && (
                    <p className="text-sm text-amber-600">
                      🔒 Password protected - Share the password separately: <strong>{password}</strong>
                    </p>
                  )}
                </div>

                {/* Share Options */}
                <div className="space-y-2">
                  <Label>Share via</Label>
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
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-go-dashboard"
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate("/record")}
                    className="flex-1"
                    data-testid="button-record-another"
                  >
                    Record Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}