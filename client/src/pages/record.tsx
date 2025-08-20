import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Camera, CameraOff, Pause, Play, StopCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type CaptureMode = "screen" | "window" | "tab";
type RecordingState = "idle" | "setup" | "countdown" | "recording" | "paused" | "stopped";

interface RecordingSettings {
  microphone: string | null;
  showWebcam: boolean;
  countdown: boolean;
  captionsEnabled: boolean;
}

export default function RecordPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [recordingState, setRecordingState] = useState<RecordingState>("setup");
  const [showCaptureModal, setShowCaptureModal] = useState(true);
  const [countdownValue, setCountdownValue] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  
  const [settings, setSettings] = useState<RecordingSettings>({
    microphone: "default",
    showWebcam: true,
    countdown: true,
    captionsEnabled: true,
  });

  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  // Load available microphones
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const mics = devices.filter(device => device.kind === "audioinput");
      setAvailableMicrophones(mics);
    });
  }, []);

  // Timer for recording duration
  useEffect(() => {
    if (recordingState === "recording" && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (recordingState !== "recording" && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [recordingState]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startCountdown = async () => {
    setRecordingState("countdown");
    setShowCaptureModal(false);
    
    if (settings.countdown) {
      for (let i = 3; i > 0; i--) {
        setCountdownValue(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    startRecording();
  };

  const startRecording = async () => {
    try {
      // Get display stream based on capture mode
      const displayConstraints: DisplayMediaStreamOptions = {
        video: true,
        audio: false,
      };

      const displayStream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);
      
      // Get audio stream if microphone is selected
      let audioStream: MediaStream | null = null;
      if (settings.microphone) {
        const audioConstraints: MediaStreamConstraints = {
          audio: settings.microphone === "default" ? true : { deviceId: settings.microphone },
        };
        audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      }

      // Get webcam stream if enabled
      if (settings.showWebcam) {
        const webcamConstraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: "user"
          },
          audio: false, // Audio already handled above
        };
        webcamStreamRef.current = await navigator.mediaDevices.getUserMedia(webcamConstraints);
        
        // Show webcam preview
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = webcamStreamRef.current;
          videoPreviewRef.current.play();
        }
      }

      // Combine streams
      const combinedStream = new MediaStream();
      displayStream.getTracks().forEach(track => combinedStream.addTrack(track));
      if (audioStream) {
        audioStream.getTracks().forEach(track => combinedStream.addTrack(track));
      }

      streamRef.current = combinedStream;

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") 
        ? "video/webm;codecs=vp9" 
        : "video/webm";
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Navigate to preview with the recorded video
        sessionStorage.setItem("recordedVideo", url);
        sessionStorage.setItem("recordingSettings", JSON.stringify(settings));
        navigate("/record/preview");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Collect data every second

      setRecordingState("recording");
      
      // Log compliance event
      logRecordingEvent("RECORDING_STARTED", {
        captureMode: "screen", // Will be chosen in overlay
        hasAudio: !!audioStream,
        hasWebcam: settings.showWebcam,
        captionsEnabled: settings.captionsEnabled,
      });

    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Recording Failed",
        description: "Could not start recording. Please check permissions and try again.",
        variant: "destructive",
      });
      setRecordingState("idle");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      logRecordingEvent("PAUSED", { time: recordingTime });
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      logRecordingEvent("RESUMED", { time: recordingTime });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Clear webcam preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
      
      setRecordingState("stopped");
      logRecordingEvent("STOPPED", { duration: recordingTime });
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (webcamStreamRef.current) {
      const videoTracks = webcamStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
      
      // Also update the preview video element
      if (videoPreviewRef.current) {
        if (!isCameraOn) {
          // Re-enable and show preview
          videoPreviewRef.current.srcObject = webcamStreamRef.current;
          videoPreviewRef.current.play();
        }
      }
    }
  };

  const toggleCaptions = () => {
    setCaptionsOn(!captionsOn);
    logRecordingEvent(captionsOn ? "CAPTIONS_DISABLED" : "CAPTIONS_ENABLED", { time: recordingTime });
  };

  const logRecordingEvent = async (event: string, metadata: any) => {
    // TODO: Send to backend API
    console.log("Recording event:", event, metadata);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Please log in to start recording</p>
            <Button 
              className="w-full mt-4"
              onClick={() => navigate("/login")}
              data-testid="button-login"
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Capture Setup Modal */}
      <Dialog open={showCaptureModal && recordingState === "setup"} onOpenChange={setShowCaptureModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Set Up Your Recording</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">

            {/* Microphone Selection */}
            <div>
              <Label htmlFor="microphone" className="text-base font-medium mb-2 block">Microphone</Label>
              <Select value={settings.microphone || ""} onValueChange={(value) => setSettings({...settings, microphone: value})}>
                <SelectTrigger id="microphone">
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No microphone</SelectItem>
                  <SelectItem value="default">Default microphone</SelectItem>
                  {availableMicrophones.map(mic => (
                    <SelectItem key={mic.deviceId} value={mic.deviceId}>
                      {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recording Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="webcam" className="text-sm font-medium">Show webcam</Label>
                <Switch
                  id="webcam"
                  checked={settings.showWebcam}
                  onCheckedChange={(checked) => setSettings({...settings, showWebcam: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="countdown" className="text-sm font-medium">3-second countdown</Label>
                <Switch
                  id="countdown"
                  checked={settings.countdown}
                  onCheckedChange={(checked) => setSettings({...settings, countdown: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="captions" className="text-sm font-medium">Enable captions</Label>
                <Switch
                  id="captions"
                  checked={settings.captionsEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, captionsEnabled: checked})}
                />
              </div>
            </div>

            {/* Compliance Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Do not include confidential client information unless you have consent.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Cancel
            </Button>
            <Button onClick={startCountdown} data-testid="button-start-recording">
              Start Recording
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Countdown Overlay */}
      {recordingState === "countdown" && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="text-white text-9xl font-bold animate-pulse">
            {countdownValue}
          </div>
        </div>
      )}

      {/* Recording Controls Overlay */}
      {(recordingState === "recording" || recordingState === "paused") && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-4">
            {/* Timer */}
            <div className="text-red-600 font-mono font-semibold text-lg">
              {formatTime(recordingTime)}
            </div>

            <div className="w-px h-8 bg-gray-300" />

            {/* Controls */}
            <div className="flex items-center gap-2">
              {recordingState === "paused" ? (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={resumeRecording}
                  className="hover:bg-gray-100"
                  data-testid="button-resume"
                >
                  <Play className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={pauseRecording}
                  className="hover:bg-gray-100"
                  data-testid="button-pause"
                >
                  <Pause className="h-5 w-5" />
                </Button>
              )}

              <Button
                size="icon"
                variant="ghost"
                onClick={stopRecording}
                className="hover:bg-red-50 text-red-600"
                data-testid="button-stop"
              >
                <StopCircle className="h-5 w-5" />
              </Button>

              <div className="w-px h-8 bg-gray-300" />

              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="hover:bg-gray-100"
                data-testid="button-toggle-mute"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              {settings.showWebcam && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleCamera}
                  className="hover:bg-gray-100"
                  data-testid="button-toggle-camera"
                >
                  {isCameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                </Button>
              )}

              <Button
                size="icon"
                variant={captionsOn ? "default" : "ghost"}
                onClick={toggleCaptions}
                className={captionsOn ? "" : "hover:bg-gray-100"}
                data-testid="button-toggle-captions"
              >
                CC
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Webcam Preview Window */}
      {recordingState === "recording" && settings.showWebcam && isCameraOn && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200">
            <div className="bg-gray-100 px-3 py-1 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">You</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleCamera}
                className="h-6 w-6 hover:bg-gray-200"
                data-testid="button-webcam-toggle"
              >
                <CameraOff className="h-3 w-3" />
              </Button>
            </div>
            <div className="relative">
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="w-48 h-36 object-cover"
                data-testid="webcam-preview"
                style={{ transform: 'scaleX(-1)' }} // Mirror the video
              />
              {!isCameraOn && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <CameraOff className="h-8 w-8 text-white opacity-50" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recording indicator */}
      {recordingState === "recording" && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-sm font-medium">Recording</span>
          </div>
        </div>
      )}
    </div>
  );
}