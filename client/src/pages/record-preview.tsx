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
  const [includeProfilePicture, setIncludeProfilePicture] = useState(true);
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 100 });
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [captionBlobUrl, setCaptionBlobUrl] = useState<string | null>(null);

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
        setIncludeProfilePicture(parsedSettings.includeProfilePicture || true);
      }
      
      // Generate AI title and description (mock for now)
      generateAIContent();
    } else {
      // No video found, redirect back to record
      navigate("/record");
    }
  }, [navigate]);

  // Update duration when video loads and generate preview captions
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.onloadedmetadata = () => {
        const duration = videoRef.current?.duration || 0;
        setVideoDuration(duration);
        setTrimRange({ start: 0, end: duration });
        generatePreviewCaptions(duration);
      };
    }
  }, [videoUrl]);

  // Generate preview captions for demo purposes
  const generatePreviewCaptions = (duration: number) => {
    // Create mock captions for preview
    const mockTranscript = "Welcome to your financial review. Today we'll be discussing your portfolio performance and investment strategy. Let's start by examining your current asset allocation. Your diversified portfolio shows strong growth potential. We recommend maintaining this balanced approach for long-term success.";
    
    const captions = generateCaptionsSRT(mockTranscript, duration);
    if (captions) {
      const blob = new Blob([captions], { type: 'text/vtt' });
      const blobUrl = URL.createObjectURL(blob);
      setCaptionBlobUrl(blobUrl);
    }
  };

  // Generate SRT captions from text (client-side version)
  const generateCaptionsSRT = (text: string, duration: number): string => {
    if (!text) return "";

    const words = text.split(' ');
    const wordsPerSegment = 8;
    const segmentDuration = Math.max(3, duration / Math.ceil(words.length / wordsPerSegment));
    
    let captions = "WEBVTT\n\n";
    let segmentNumber = 1;
    
    for (let i = 0; i < words.length; i += wordsPerSegment) {
      const segmentWords = words.slice(i, i + wordsPerSegment);
      const startTime = (segmentNumber - 1) * segmentDuration;
      const endTime = Math.min(segmentNumber * segmentDuration, duration);
      
      // Format time as WebVTT timestamp (HH:MM:SS.mmm)
      const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const milliseconds = Math.floor((seconds % 1) * 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
      };
      
      captions += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
      captions += `${segmentWords.join(' ')}\n\n`;
      
      segmentNumber++;
    }
    
    return captions;
  };

  const generateAIContent = async () => {
    // Set initial placeholder content while processing
    setTitle("Processing...");
    setDescription("AI is analyzing your video content...");
  };

  // Process video with OpenAI after saving
  const processVideoWithAI = async (videoId: string, videoBlob: Blob) => {
    try {
      // Convert video blob to audio buffer for transcription
      const arrayBuffer = await videoBlob.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer).toString('base64');
      
      const response = await apiRequest('POST', `/api/videos/process`, {
        videoId,
        audioBuffer,
        duration: videoDuration
      });

      const data = await response.json();
      if (data?.video) {
        setTitle(data.video.title);
        setDescription(data.video.description || "");
        
        toast({
          title: "AI Processing Complete",
          description: "Title and description generated from video content",
        });
      }
    } catch (error) {
      console.error('AI processing error:', error);
      // Keep fallback content if AI processing fails
      setTitle("Financial Advisory Video");
      setDescription("Professional financial guidance and insights.");
      
      toast({
        title: "AI Processing Failed",
        description: "Using fallback title and description",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      setIsSaving(true);
      
      // Get video blob from session storage 
      const recordedVideoData = sessionStorage.getItem("recordedVideoBlob");
      let videoBlob: Blob | null = null;
      
      if (recordedVideoData) {
        // Convert base64 back to blob for processing
        const binaryString = atob(recordedVideoData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        videoBlob = new Blob([bytes], { type: 'video/webm' });
      }
      
      const videoData: Partial<InsertVideo> = {
        advisorId: user?.id,
        clientName: clientName || undefined,
        title: title || "Processing...",
        description: description || "AI is analyzing content...",
        fileUrl: undefined, // Will be generated from videoData
        videoData: recordedVideoData || undefined, // Send base64 video data
        thumbnailUrl: null, // TODO: Generate thumbnail
        duration: videoDuration.toString(),
        status: "published", // Set to published since we have the video data
        password: (showPassword && password) ? password : undefined,
        shareLink: `moneyclip-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        captionsEnabled: true, // Always enabled
        includeProfilePicture,
      };

      const response = await apiRequest('POST', "/api/videos", videoData);
      const data = await response.json();

      // Start AI processing in background if we have video data
      if (videoBlob && data?.id) {
        // Process in background without blocking UI
        processVideoWithAI(data.id, videoBlob);
      }

      return data;
    },
    onSuccess: (data) => {
      const link = `${window.location.origin}/share/${data?.shareLink}`;
      setShareLink(link);
      
      // Log compliance event
      logEvent("SAVED", {
        videoId: data?.id,
        hasPassword: showPassword && !!password,
        hasClientName: !!clientName,
      });
      
      toast({
        title: "Video Saved",
        description: "Your recording has been saved successfully.",
      });
      
      // Clean up session storage and blob URLs
      sessionStorage.removeItem("recordedVideo");
      sessionStorage.removeItem("recordedVideoBlob");
      sessionStorage.removeItem("recordingSettings");
      
      // Clean up blob URL
      if (captionBlobUrl) {
        URL.revokeObjectURL(captionBlobUrl);
      }
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
    
    if (showPassword && !password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter a password or turn off password protection.",
        variant: "destructive",
      });
      return;
    }
    
    saveMutation.mutate();
    logEvent("PREVIEWED", { hasClientName: !!clientName, hasPassword: showPassword && !!password });
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard this recording?")) {
      sessionStorage.removeItem("recordedVideo");
      sessionStorage.removeItem("recordedVideoBlob");
      sessionStorage.removeItem("recordingSettings");
      
      // Clean up blob URL
      if (captionBlobUrl) {
        URL.revokeObjectURL(captionBlobUrl);
      }
      
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
                        crossOrigin="anonymous"
                      >
                        {captionsEnabled && captionBlobUrl && (
                          <track
                            kind="subtitles"
                            src={captionBlobUrl}
                            srcLang="en"
                            label="English"
                            default
                          />
                        )}
                      </video>
                      
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

                      {/* Profile Picture Toggle */}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="preview-profile-picture">Include Profile Picture</Label>
                        <Switch
                          id="preview-profile-picture"
                          checked={includeProfilePicture}
                          onCheckedChange={setIncludeProfilePicture}
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
                    <div className={`p-4 rounded-lg border-2 transition-colors ${
                      showPassword 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="password-toggle" className="text-base font-medium cursor-pointer">
                            Password Protection
                          </Label>
                          <p className="text-sm text-gray-600">
                            {showPassword ? 'Video will require a password to view' : 'Anyone with the link can view this video'}
                          </p>
                        </div>
                        <Switch
                          id="password-toggle"
                          checked={showPassword}
                          onCheckedChange={setShowPassword}
                          disabled={isSaving}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
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
                  {showPassword && password && (
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