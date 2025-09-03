import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Pause, Play, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AdvisorDropdown from "@/components/advisor-dropdown";
import logoUrl from "@/assets/logos/moneyclip-logo.png";
import { usePageTitle } from "@/hooks/usePageTitle";

type CaptureMode = "screen" | "window" | "tab";
type RecordingState = "idle" | "setup" | "countdown" | "recording" | "paused" | "stopped";

interface RecordingSettings {
  microphone: string | null;
  includeProfilePicture: boolean;
}

export default function RecordPage() {
  usePageTitle("MoneyClip - Record");
  
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [recordingState, setRecordingState] = useState<RecordingState>("setup");
  const [showCaptureModal, setShowCaptureModal] = useState(true);
  const [countdownValue, setCountdownValue] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  
  const [settings, setSettings] = useState<RecordingSettings>({
    microphone: "default",
    includeProfilePicture: true,
  });

  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const initiateRecordingFlow = async () => {
    setShowCaptureModal(false);
    setRecordingState("setup");
    
    try {
      // First get display media (user selects screen/window/tab)
      const displayConstraints: DisplayMediaStreamOptions = {
        video: true,
        audio: false,
      };

      const displayStream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);
      
      
      // Now that screen is selected, start countdown
      setRecordingState("countdown");
      
      // Show 3-second countdown
      for (let i = 3; i > 0; i--) {
        setCountdownValue(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Start recording with the selected screen
      await startRecordingWithStream(displayStream);
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Recording Failed",
        description: "Could not start recording. Please check permissions and try again.",
        variant: "destructive",
      });
      setRecordingState("setup");
      setShowCaptureModal(true);
    }
  };

  const startRecordingWithStream = async (displayStream: MediaStream) => {
    try {
      
      // Get audio stream if microphone is selected
      let audioStream: MediaStream | null = null;
      if (settings.microphone && settings.microphone !== "none") {
        const audioConstraints: MediaStreamConstraints = {
          audio: settings.microphone === "default" ? true : { deviceId: settings.microphone },
        };
        try {
          audioStream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        } catch (audioError) {
          console.warn("Could not access microphone:", audioError);
          toast({
            title: "Microphone Access Failed",
            description: "Recording will continue without audio.",
            variant: "destructive",
          });
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
        videoBitsPerSecond: 1500000, // Reduced from 2.5Mbps to 1.5Mbps to help with storage limits
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Convert blob to base64 for storage and later AI processing
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const base64Data = (reader.result as string).split(',')[1]; // Remove data URL prefix
            
            // Try to store in sessionStorage, fallback to IndexedDB if quota exceeded
            try {
              sessionStorage.setItem("recordedVideoBlob", base64Data);
              sessionStorage.setItem("recordedVideo", url);
              sessionStorage.setItem("recordingSettings", JSON.stringify(settings));
              navigate("/record/preview");
            } catch (storageError) {
              console.warn("SessionStorage quota exceeded, using IndexedDB fallback:", storageError);
              
              // Fallback: Store directly as blob without base64 conversion
              storeVideoInIndexedDB(blob, url, settings)
                .then(() => {
                  navigate("/record/preview");
                })
                .catch((indexedDBError) => {
                  console.error("IndexedDB storage failed:", indexedDBError);
                  toast({
                    title: "Storage Error",
                    description: "Video too large for browser storage. Please record shorter videos or try again.",
                    variant: "destructive",
                  });
                  setRecordingState("idle");
                });
            }
          } catch (conversionError) {
            console.error("Error processing recorded video:", conversionError);
            toast({
              title: "Processing Error", 
              description: "Failed to process recorded video. Please try again.",
              variant: "destructive",
            });
            setRecordingState("idle");
          }
        };
        
        reader.onerror = () => {
          console.error("FileReader error");
          toast({
            title: "Processing Error",
            description: "Failed to process recorded video. Please try again.",
            variant: "destructive", 
          });
          setRecordingState("idle");
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Collect data every second

      setRecordingState("recording");
      
      // Log compliance event
      logRecordingEvent("RECORDING_STARTED", {
        captureMode: "screen", // Will be chosen in overlay
        hasAudio: !!audioStream,
        hasProfilePicture: settings.includeProfilePicture,
        captionsEnabled: true, // Always enabled, can be disabled in preview
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



  const logRecordingEvent = async (event: string, metadata: any) => {
    // TODO: Send to backend API
    console.log("Recording event:", event, metadata);
  };

  // IndexedDB fallback for large videos
  const storeVideoInIndexedDB = async (videoBlob: Blob, videoUrl: string, settings: RecordingSettings): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MoneyClipVideos', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['recordings'], 'readwrite');
        const store = transaction.objectStore('recordings');
        
        const recordingData = {
          id: 'current',
          videoBlob,
          videoUrl,
          settings: JSON.stringify(settings),
          duration: recordingTime, // Store the actual recording duration
          timestamp: Date.now()
        };
        
        const storeRequest = store.put(recordingData);
        
        storeRequest.onsuccess = () => {
          // Store flag in sessionStorage to indicate using IndexedDB
          sessionStorage.setItem("usingIndexedDB", "true");
          resolve();
        };
        
        storeRequest.onerror = () => reject(storeRequest.error);
      };
    });
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
      {/* Header - only show when not in setup mode */}
      {recordingState !== "setup" && (
        <header className="bg-white border-b border-gray-200 relative z-40">
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
              {user && (
                <AdvisorDropdown
                  advisorName={user.advisorName}
                  onSettings={() => navigate("/settings")}
                  onSignOut={() => {
                    // Handle logout logic if needed
                    navigate("/");
                  }}
                />
              )}
            </div>
          </div>
        </header>
      )}
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
                <Label htmlFor="profile-picture" className="text-sm font-medium">Include profile picture</Label>
                <Switch
                  id="profile-picture"
                  checked={settings.includeProfilePicture}
                  onCheckedChange={(checked) => setSettings({...settings, includeProfilePicture: checked})}
                />
              </div>
              
              <div className="text-sm text-gray-500 space-y-1">
                <p>• You'll select your screen, then see a 3-second countdown before recording starts</p>
                <p>• Your profile picture can be shown in the corner of the video if enabled</p>
                <p>• AI captions will be automatically generated (can be disabled in preview)</p>
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
            <Button onClick={initiateRecordingFlow} data-testid="button-start-recording">
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