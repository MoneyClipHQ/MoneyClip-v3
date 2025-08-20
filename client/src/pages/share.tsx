import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lock, Play, Eye, EyeOff } from "lucide-react";
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
  createdAt: string;
  passwordProtected: boolean;
}

export default function SharePage() {
  const [match, params] = useRoute("/share/:shareLink");
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  const shareLink = params?.shareLink;

  // Fetch video by share link
  const { data: video, isLoading, error } = useQuery({
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

  // Password verification mutation
  const verifyPasswordMutation = useMutation({
    mutationFn: async (inputPassword: string) => {
      const response = await fetch(`/api/share/${shareLink}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: inputPassword }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Password verification failed");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsVerified(true);
      setShowPasswordDialog(false);
      toast({
        title: "Access Granted",
        description: "You can now view the video.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Incorrect Password",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Show password dialog if video is password protected
  useEffect(() => {
    if (video && video.passwordProtected && !isVerified) {
      setShowPasswordDialog(true);
    } else if (video && !video.passwordProtected) {
      setIsVerified(true);
    }
  }, [video, isVerified]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      verifyPasswordMutation.mutate(password);
    }
  };

  const formatDuration = (seconds: string | null): string => {
    if (!seconds) return "0:00";
    const totalSeconds = parseInt(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Invalid share link</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading video...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              Video not found or link has expired
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Password Protection Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Required
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Enter password to view this video:</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  data-testid="input-share-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!password.trim() || verifyPasswordMutation.isPending}
              data-testid="button-verify-password"
            >
              {verifyPasswordMutation.isPending ? "Verifying..." : "Access Video"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video Player (shown only after verification) */}
      {isVerified && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <div className="space-y-2">
                {video.clientName && (
                  <p className="text-sm text-gray-600" data-testid="video-client-name">
                    For: <span className="font-medium">{video.clientName}</span>
                  </p>
                )}
                <CardTitle className="text-2xl" data-testid="video-title">
                  {video.title}
                </CardTitle>
                {video.description && (
                  <p className="text-gray-600" data-testid="video-description">
                    {video.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span data-testid="video-duration">
                    Duration: {formatDuration(video.duration)}
                  </span>
                  <span data-testid="video-date">
                    Created: {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Video Player */}
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  {video.fileUrl ? (
                    <video
                      src={video.fileUrl}
                      controls
                      className="w-full h-full rounded-lg"
                      data-testid="shared-video-player"
                    >
                      {video.captionsEnabled && (
                        <track
                          kind="captions"
                          src={video.transcriptUrl || ""}
                          srcLang="en"
                          label="English"
                          default
                        />
                      )}
                    </video>
                  ) : (
                    <div className="text-white text-center">
                      <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Video not available</p>
                    </div>
                  )}
                </div>

                {/* Video Controls/Info */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    {video.captionsEnabled && (
                      <span className="flex items-center gap-1">
                        CC Available
                      </span>
                    )}
                    {video.showWebcam && (
                      <span>Webcam included</span>
                    )}
                  </div>
                  <div>
                    <span>MoneyClip</span>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
                  <p>
                    <strong>Disclaimer:</strong> This video contains financial information for educational purposes only. 
                    Please consult with a qualified financial advisor before making any investment decisions. 
                    The content of this video is confidential and intended solely for the named recipient.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}