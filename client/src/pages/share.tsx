import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Pause, 
  Volume2, 
  Maximize, 
  ThumbsUp, 
  Heart, 
  Smile,
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  Settings2,
  Captions,
  CaptionsOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SharedVideo {
  id: string;
  advisorId: string;
  clientName: string | null;
  title: string;
  description: string | null;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  captionsEnabled: boolean;
  showWebcam: boolean;
  includeProfilePicture: boolean;
  transcriptUrl: string | null;
  createdAt: string;
  passwordProtected: boolean;
}

interface AdvisorBranding {
  logoUrl: string | null;
  profilePictureUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  phone: string | null;
  calendarLink: string | null;
  disclosureText: string;
  advisorName: string;
  companyName: string;
}

export default function SharePage() {
  const [match, params] = useRoute("/share/:shareLink");
  const { toast } = useToast();
  
  // Terms gate state
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  
  // Password protection state
  const [hasEnteredPassword, setHasEnteredPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifiedVideoUrl, setVerifiedVideoUrl] = useState<string | null>(null);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showCaptions, setShowCaptions] = useState(true);
  const [volume, setVolume] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Generate session ID for tracking (anonymous)
  const sessionId = useRef(crypto.randomUUID());
  
  const shareLink = params?.shareLink;

  // Fetch video and advisor branding by share link
  const { data: videoData, isLoading, error } = useQuery({
    queryKey: ["/api/share", shareLink],
    queryFn: async () => {
      const response = await fetch(`/api/share/${shareLink}`);
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!shareLink,
  });
  
  const video: SharedVideo | undefined = videoData?.video;
  const branding: AdvisorBranding | undefined = videoData?.branding;

  // Log viewer event mutation
  const logViewerEventMutation = useMutation({
    mutationFn: async (eventData: { event: string; metadata?: any }) => {
      const response = await apiRequest("POST", `/api/share/${shareLink}/events`, {
        sessionId: sessionId.current,
        event: eventData.event,
        metadata: eventData.metadata ? JSON.stringify(eventData.metadata) : null,
      });
      return response.json();
    },
  });
  
  // Send compliment mutation
  const sendComplimentMutation = useMutation({
    mutationFn: async (complimentData: { type: string; message?: string }) => {
      const response = await apiRequest("POST", `/api/share/${shareLink}/compliments`, {
        sessionId: sessionId.current,
        type: complimentData.type,
        message: complimentData.message,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "Your feedback has been sent to the advisor.",
      });
    },
  });
  
  // Password verification mutation
  const verifyPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest("POST", `/api/share/${shareLink}/verify`, {
        password,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setHasEnteredPassword(true);
      setShowPasswordDialog(false);
      setPasswordError("");
      setPasswordInput("");
      
      // Store the verified video URL
      if (data.fileUrl) {
        setVerifiedVideoUrl(data.fileUrl);
      }
      
      // Store password verification in session storage
      if (video) {
        sessionStorage.setItem(`password-verified-${video.id}`, 'true');
        // Also store the fileUrl in session storage
        if (data.fileUrl) {
          sessionStorage.setItem(`video-url-${video.id}`, data.fileUrl);
        }
      }
      
      toast({
        title: "Access Granted",
        description: "You can now view the video.",
      });
      
      // Log password verification event
      logViewerEventMutation.mutate({
        event: 'PASSWORD_VERIFIED',
        metadata: { timestamp: new Date().toISOString() }
      });
    },
    onError: (error: any) => {
      if (error.message.includes("401")) {
        setPasswordError("Incorrect password. Please try again.");
      } else {
        setPasswordError("Failed to verify password. Please try again.");
      }
    },
  });

  // Show terms dialog on first visit
  useEffect(() => {
    if (video && !hasAcceptedTerms) {
      // Check if terms already accepted in session storage
      const termsAccepted = sessionStorage.getItem(`terms-accepted-${video.id}`);
      if (termsAccepted) {
        setHasAcceptedTerms(true);
      } else {
        setShowTermsDialog(true);
      }
    }
  }, [video, hasAcceptedTerms]);
  
  // Show password dialog for protected videos
  useEffect(() => {
    if (video && hasAcceptedTerms && video.passwordProtected && !hasEnteredPassword) {
      // Check if password already verified in session storage
      const passwordVerified = sessionStorage.getItem(`password-verified-${video.id}`);
      const storedVideoUrl = sessionStorage.getItem(`video-url-${video.id}`);
      if (passwordVerified && storedVideoUrl) {
        setHasEnteredPassword(true);
        setVerifiedVideoUrl(storedVideoUrl);
      } else {
        setShowPasswordDialog(true);
      }
    }
  }, [video, hasAcceptedTerms, hasEnteredPassword]);

  // Handle terms acceptance
  const handleAcceptTerms = () => {
    if (video) {
      setHasAcceptedTerms(true);
      setShowTermsDialog(false);
      sessionStorage.setItem(`terms-accepted-${video.id}`, 'true');
      
      // Log terms acceptance event
      logViewerEventMutation.mutate({
        event: 'VIEWER_ACCEPTED_TERMS',
        metadata: { timestamp: new Date().toISOString() }
      });
      
      toast({
        title: "Terms Accepted",
        description: "You can now view the video.",
      });
    }
  };
  
  // Handle password verification
  const handleVerifyPassword = () => {
    if (!passwordInput.trim()) {
      setPasswordError("Please enter a password.");
      return;
    }
    
    setPasswordError("");
    verifyPasswordMutation.mutate(passwordInput);
  };
  
  // Check if video content should be shown
  const shouldShowVideo = hasAcceptedTerms && (!video?.passwordProtected || hasEnteredPassword);
  
  // Video player controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        logViewerEventMutation.mutate({ event: 'VIDEO_PAUSED' });
      } else {
        videoRef.current.play();
        logViewerEventMutation.mutate({ event: 'VIDEO_PLAYED' });
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    logViewerEventMutation.mutate({
      event: 'SPEED_CHANGED',
      metadata: { speed }
    });
  };
  
  const toggleCaptions = () => {
    setShowCaptions(!showCaptions);
    logViewerEventMutation.mutate({
      event: showCaptions ? 'CAPTIONS_OFF' : 'CAPTIONS_ON'
    });
  };
  
  const handleCompliment = (type: string, message?: string) => {
    sendComplimentMutation.mutate({ type, message });
    logViewerEventMutation.mutate({
      event: 'COMPLIMENT_SENT',
      metadata: { type, message }
    });
  };

  const formatDuration = (seconds: string | null): string => {
    if (!seconds) return "0:00";
    const totalSeconds = parseInt(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  // Compliment options
  const complimentOptions = [
    { type: 'thumbs_up', icon: ThumbsUp, label: '👍', message: 'This was helpful' },
    { type: 'heart', icon: Heart, label: '❤️', message: 'Thank you' },
    { type: 'clap', icon: Smile, label: '👏', message: 'Great explanation' },
    { type: 'helpful', icon: MessageCircle, label: '💡', message: 'Very informative' },
  ];

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600" data-testid="error-invalid-link">
              Invalid share link
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600" data-testid="loading-video">Loading video...</div>
      </div>
    );
  }

  if (error || !video || !branding) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600" data-testid="error-video-not-found">
              Video not found or link has expired
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: branding.primaryColor || '#2563eb' }}
    >
      {/* Terms Gate Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Terms & Disclosure
            </DialogTitle>
            <DialogDescription>
              Please read and accept the following terms to view this video.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-h-96 overflow-y-auto whitespace-pre-wrap">
              {branding.disclosureText}
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                data-testid="button-decline-terms"
              >
                Decline
              </Button>
              <Button
                onClick={handleAcceptTerms}
                data-testid="button-accept-terms"
              >
                Accept & View Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Password Gate Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Password Required
            </DialogTitle>
            <DialogDescription>
              This video is password-protected. Please enter the password to continue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-password">Password</Label>
              <Input
                id="video-password"
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleVerifyPassword();
                  }
                }}
                disabled={verifyPasswordMutation.isPending}
                data-testid="input-video-password"
              />
              {passwordError && (
                <p className="text-sm text-red-600" data-testid="password-error">
                  {passwordError}
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                data-testid="button-cancel-password"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyPassword}
                disabled={verifyPasswordMutation.isPending}
                data-testid="button-verify-password"
              >
                {verifyPasswordMutation.isPending ? "Verifying..." : "Enter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Advisor Logo */}
            <div className="flex items-center" data-testid="header-advisor-logo">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={`${branding.companyName} logo`}
                  className="h-12 w-auto max-w-64 object-contain"
                />
              ) : (
                <div className="text-xl font-semibold text-gray-900">
                  {branding.companyName}
                </div>
              )}
            </div>
            
            {/* Client Name */}
            {video.clientName && (
              <div className="text-right" data-testid="header-client-name">
                <p className="text-sm text-gray-600">For:</p>
                <p 
                  className="font-semibold text-lg"
                  style={{ color: branding.primaryColor || '#2563eb' }}
                >
                  {video.clientName}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content (shown only after terms acceptance and password verification) */}
      {shouldShowVideo && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Video Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="relative">
              {/* Video Player */}
              <div className="aspect-video bg-black relative">
                {(video.fileUrl || verifiedVideoUrl) ? (
                  <video
                    ref={videoRef}
                    src={verifiedVideoUrl || video.fileUrl || undefined}
                    className="w-full h-full"
                    data-testid="public-video-player"
                    controls
                    onPlay={() => {
                      setIsPlaying(true);
                      logViewerEventMutation.mutate({ event: 'VIDEO_PLAYED' });
                    }}
                    onPause={() => {
                      setIsPlaying(false);
                      logViewerEventMutation.mutate({ event: 'VIDEO_PAUSED' });
                    }}
                    onEnded={() => {
                      logViewerEventMutation.mutate({ event: 'VIDEO_COMPLETED' });
                    }}
                  >
                    {video.captionsEnabled && video.transcriptUrl && (
                      <track
                        kind="captions"
                        src={video.transcriptUrl}
                        srcLang="en"
                        label="English"
                        default={showCaptions}
                      />
                    )}
                  </video>
                ) : (
                  <div className="text-white text-center flex items-center justify-center h-full">
                    <div>
                      <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Video not available</p>
                    </div>
                  </div>
                )}
                
                {/* Profile Picture Overlay */}
                {video.includeProfilePicture && branding.profilePictureUrl && (
                  <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                    <img
                      src={branding.profilePictureUrl}
                      alt={branding.advisorName}
                      className="w-full h-full object-cover"
                      data-testid="video-profile-overlay"
                    />
                  </div>
                )}
              </div>
              
              {/* Custom Video Controls */}
              <div className="bg-gray-900 text-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Speed Control */}
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    <select
                      value={playbackSpeed}
                      onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                      className="bg-gray-800 text-white text-sm rounded px-2 py-1"
                      data-testid="speed-control"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>
                  </div>
                  
                  {/* Captions Toggle */}
                  {video.captionsEnabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleCaptions}
                      className="text-white hover:bg-gray-800"
                      data-testid="captions-toggle"
                    >
                      {showCaptions ? <Captions className="h-4 w-4" /> : <CaptionsOff className="h-4 w-4" />}
                      <span className="ml-1 text-xs">CC</span>
                    </Button>
                  )}
                </div>
                
                <div className="text-xs text-gray-300" data-testid="video-duration-display">
                  Duration: {formatDuration(video.duration)}
                </div>
              </div>
            </div>
            
            {/* Video Info */}
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="video-title">
                {video.title}
              </h1>
              {video.description && (
                <p className="text-gray-600 mb-4" data-testid="video-description">
                  {video.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Compliments Section */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              How did we do?
            </h3>
            <div className="flex flex-wrap gap-3" data-testid="compliments-section">
              {complimentOptions.map((option) => (
                <Button
                  key={option.type}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompliment(option.type, option.message)}
                  disabled={sendComplimentMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid={`compliment-${option.type}`}
                >
                  <span>{option.label}</span>
                  <span className="text-sm">{option.message}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* CTAs Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Get in touch
            </h3>
            <div className="flex flex-col sm:flex-row gap-4" data-testid="cta-section">
              {/* Email CTA */}
              <Button
                variant="default"
                size="lg"
                asChild
                className="flex items-center gap-2"
                data-testid="cta-email"
              >
                <a href={`mailto:${branding.advisorName} <support@example.com>`}>
                  <Mail className="h-4 w-4" />
                  Email {branding.advisorName}
                </a>
              </Button>
              
              {/* Phone CTA */}
              {branding.phone && (
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="flex items-center gap-2"
                  data-testid="cta-call"
                >
                  <a href={`tel:${branding.phone}`}>
                    <Phone className="h-4 w-4" />
                    Call {branding.phone}
                  </a>
                </Button>
              )}
              
              {/* Calendar CTA */}
              {branding.calendarLink && (
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="flex items-center gap-2"
                  data-testid="cta-schedule"
                >
                  <a href={branding.calendarLink} target="_blank" rel="noopener noreferrer">
                    <Calendar className="h-4 w-4" />
                    Schedule Follow-Up
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          Powered by MoneyClip
        </div>
      </div>
    </div>
  );
}