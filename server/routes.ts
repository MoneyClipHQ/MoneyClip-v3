import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  signupSchema, 
  loginSchema,
  PLANS, 
  updateContactInfoSchema, 
  updateComplianceSchema, 
  updateBrandingSchema,
  insertVideoSchema,
  updateVideoSchema,
  insertRecordingEventSchema
} from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { transcribeAndGenerateContent, generateCaptions } from "./openai-service";

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.advisorId) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Please log in to access this resource"
    });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Login route
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const advisor = await storage.authenticateAdvisor(validatedData.email, validatedData.password);
      
      if (!advisor) {
        return res.status(401).json({
          success: false,
          error: "INVALID_CREDENTIALS",
          message: "Invalid email or password"
        });
      }

      // Set session
      req.session.advisorId = advisor.id;
      req.session.advisor = {
        id: advisor.id,
        advisorName: advisor.advisorName,
        companyName: advisor.companyName,
        email: advisor.email
      };

      res.json({
        success: true,
        advisor: {
          id: advisor.id,
          advisorName: advisor.advisorName,
          companyName: advisor.companyName,
          email: advisor.email
        }
      });

    } catch (error) {
      console.error("Login error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Please check your form data.",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        error: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again."
      });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
          success: false,
          error: "LOGOUT_ERROR",
          message: "Failed to log out"
        });
      }
      
      res.json({
        success: true,
        message: "Logged out successfully"
      });
    });
  });

  // Get current user
  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.session?.advisorId) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Not logged in"
      });
    }

    res.json({
      advisor: req.session.advisor
    });
  });

  // Signup route
  app.post("/api/signup", async (req: Request, res: Response) => {
    try {
      console.log("Signup request received:", req.body);
      
      // Log page view event (if not already logged)
      await storage.logSignupEvent({
        event: "SIGNUP_PAGE_VIEWED",
        metadata: JSON.stringify({ 
          userAgent: req.get("User-Agent"),
          timestamp: new Date().toISOString()
        })
      });

      // Validate request body
      const validatedData = signupSchema.parse(req.body);
      
      // Create advisor with subscription
      const result = await storage.createAdvisorWithSubscription(validatedData);
      
      // Send success response with confirmation data
      res.json({
        success: true,
        advisor: {
          id: result.advisor.id,
          advisorName: result.advisor.advisorName,
          companyName: result.advisor.companyName,
          email: result.advisor.email
        },
        subscription: {
          id: result.subscription.id,
          planName: result.subscription.planName,
          amount: result.subscription.amount,
          status: result.subscription.status,
          nextBillingDate: format(result.subscription.nextBillingDate, "MMMM d, yyyy")
        }
      });

    } catch (error) {
      console.error("Signup error:", error);
      
      if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
        // Log failed signup attempt
        await storage.logSignupEvent({
          event: "SIGNUP_FAILED",
          metadata: JSON.stringify({ 
            reason: "EMAIL_ALREADY_EXISTS",
            email: req.body.email 
          })
        });
        
        return res.status(400).json({
          success: false,
          error: "EMAIL_ALREADY_EXISTS",
          message: "An account with this email already exists."
        });
      }
      
      if (error instanceof z.ZodError) {
        // Log validation error
        await storage.logSignupEvent({
          event: "SIGNUP_FAILED",
          metadata: JSON.stringify({ 
            reason: "VALIDATION_ERROR",
            errors: error.errors 
          })
        });
        
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Please check your form data.",
          errors: error.errors
        });
      }
      
      // Log generic error
      await storage.logSignupEvent({
        event: "SIGNUP_FAILED",
        metadata: JSON.stringify({ 
          reason: "UNKNOWN_ERROR",
          error: error instanceof Error ? error.message : "Unknown error"
        })
      });
      
      res.status(500).json({
        success: false,
        error: "INTERNAL_ERROR",
        message: "Something went wrong. Please try again."
      });
    }
  });

  // Check if email exists endpoint
  app.get("/api/check-email/:email", async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      const existingAdvisor = await storage.getAdvisorByEmail(email);
      
      res.json({
        exists: !!existingAdvisor
      });
    } catch (error) {
      console.error("Email check error:", error);
      res.status(500).json({
        error: "Failed to check email"
      });
    }
  });

  // Pricing page view event
  app.post("/api/pricing/view", async (req: Request, res: Response) => {
    try {
      await storage.logSignupEvent({
        event: "PRICING_PAGE_VIEWED",
        metadata: JSON.stringify({
          userAgent: req.get("User-Agent"),
          timestamp: new Date().toISOString()
        })
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Pricing view logging error:", error);
      res.status(500).json({
        error: "Failed to log pricing view"
      });
    }
  });

  // Plan selection event
  app.post("/api/pricing/select", async (req: Request, res: Response) => {
    try {
      const { planId } = req.body;
      
      if (!planId || !PLANS[planId as keyof typeof PLANS]) {
        return res.status(400).json({
          error: "Invalid plan ID"
        });
      }

      await storage.logSignupEvent({
        event: "PLAN_SELECTED",
        metadata: JSON.stringify({
          planId,
          planName: PLANS[planId as keyof typeof PLANS].name,
          price: PLANS[planId as keyof typeof PLANS].price,
          timestamp: new Date().toISOString()
        })
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Plan selection logging error:", error);
      res.status(500).json({
        error: "Failed to log plan selection"
      });
    }
  });

  // Navigation to signup from pricing
  app.post("/api/pricing/navigate-signup", async (req: Request, res: Response) => {
    try {
      const { planId } = req.body;
      
      await storage.logSignupEvent({
        event: "PRICING_NAVIGATE_TO_SIGNUP",
        metadata: JSON.stringify({
          planId,
          timestamp: new Date().toISOString()
        })
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Pricing navigation logging error:", error);
      res.status(500).json({
        error: "Failed to log pricing navigation"
      });
    }
  });

  // Settings API Routes
  // Get advisor settings
  app.get("/api/settings/:advisorId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { advisorId } = req.params;
      
      // Get advisor info
      const advisor = await storage.getAdvisor(advisorId);
      if (!advisor) {
        return res.status(404).json({
          error: "Advisor not found"
        });
      }

      // Get advisor settings
      const settings = await storage.getAdvisorSettings(advisorId);
      
      // Log access event
      await storage.logSettingsEvent({
        advisorId,
        event: "SETTINGS_OPENED",
        metadata: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      });

      res.json({
        advisor: {
          advisorName: advisor.advisorName,
          companyName: advisor.companyName,
          email: advisor.email
        },
        settings: settings || {
          phone: null,
          calendarLink: null,
          disclosureText: "By accessing this video, you acknowledge that the information provided is for educational purposes only and does not constitute financial advice. Please consult with a qualified financial professional before making any investment decisions.",
          logoUrl: null,
          primaryColor: "#2563eb",
          secondaryColor: "#1e40af",
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({
        error: "Failed to retrieve settings"
      });
    }
  });

  // Update contact info
  app.patch("/api/settings/contact", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("Contact update request:", {
        advisorId: req.session.advisorId,
        phone: req.body.phone,
        calendarLink: req.body.calendarLink
      });
      
      const validatedData = updateContactInfoSchema.parse(req.body);
      
      // Get advisor ID from session
      const advisorId = req.session.advisorId!;
      
      await storage.updateContactInfo(advisorId, validatedData);
      
      console.log("Contact info updated successfully for advisor:", advisorId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Update contact info error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Please check your form data.",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        error: "Failed to update contact info"
      });
    }
  });

  // Update compliance
  app.patch("/api/settings/compliance", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("Compliance update request:", {
        advisorId: req.session.advisorId,
        disclosureTextLength: req.body.disclosureText ? req.body.disclosureText.length : 0
      });
      
      const validatedData = updateComplianceSchema.parse(req.body);
      
      // Get advisor ID from session
      const advisorId = req.session.advisorId!;
      
      await storage.updateCompliance(advisorId, validatedData);
      
      console.log("Compliance updated successfully for advisor:", advisorId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Update compliance error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Please check your form data.",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        error: "Failed to update compliance"
      });
    }
  });

  // Update branding
  app.patch("/api/settings/branding", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("Branding update request:", {
        advisorId: req.session.advisorId,
        bodySize: JSON.stringify(req.body).length,
        hasLogoUrl: !!req.body.logoUrl,
        logoUrlLength: req.body.logoUrl ? req.body.logoUrl.length : 0
      });
      
      const validatedData = updateBrandingSchema.parse(req.body);
      
      // Get advisor ID from session
      const advisorId = req.session.advisorId!;
      
      await storage.updateBranding(advisorId, validatedData);
      
      console.log("Branding updated successfully for advisor:", advisorId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Update branding error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Please check your form data.",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        error: "Failed to update branding"
      });
    }
  });

  // Video API Routes
  
  // Create a new video
  app.post("/api/videos", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const videoData = {
        ...req.body,
        advisorId,
        shareLink: req.body.shareLink || `moneyclip-${Date.now()}-${Math.random().toString(36).substring(7)}`
      };
      
      // If videoData is provided, generate a data URL for fileUrl
      if (videoData.videoData) {
        videoData.fileUrl = `data:video/webm;base64,${videoData.videoData}`;
      }
      
      const validatedData = insertVideoSchema.parse(videoData);
      const video = await storage.createVideo(validatedData);
      
      // Log event
      await storage.logRecordingEvent({
        advisorId,
        videoId: video.id,
        event: "VIDEO_SAVED",
        metadata: JSON.stringify({
          hasPassword: !!video.password,
          hasClientName: !!video.clientName,
          captionsEnabled: video.captionsEnabled
        })
      });
      
      res.json(video);
    } catch (error) {
      console.error("Create video error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Invalid video data",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        error: "Failed to create video"
      });
    }
  });

  // Process video with OpenAI transcription and AI-generated content
  app.post("/api/videos/process", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const { videoId, audioBuffer, duration } = req.body;

      if (!videoId || !audioBuffer) {
        return res.status(400).json({
          error: "MISSING_DATA",
          message: "Video ID and audio data are required"
        });
      }

      // Log processing start
      await storage.logRecordingEvent({
        advisorId,
        videoId,
        event: "PROCESSING_STARTED",
        metadata: JSON.stringify({
          audioDuration: duration,
          timestamp: new Date().toISOString()
        })
      });

      console.log(`Starting AI processing for video ${videoId}...`);

      try {
        // Convert base64 audio to buffer
        const buffer = Buffer.from(audioBuffer, 'base64');
        
        // Process with OpenAI
        const result = await transcribeAndGenerateContent(buffer, `video-${videoId}.webm`);
        
        // Generate captions if transcription successful
        const captions = result.text !== "Transcription unavailable" 
          ? generateCaptions(result.text, duration || 300)
          : "";

        // Update video with AI-generated content
        const updatedVideo = await storage.updateVideo(videoId, {
          title: result.title,
          description: result.description,
          transcriptUrl: result.text !== "Transcription unavailable" ? `/transcripts/${videoId}.txt` : null,
          captionsEnabled: true
        });

        // Log processing success
        await storage.logRecordingEvent({
          advisorId,
          videoId,
          event: "PROCESSING_COMPLETED",
          metadata: JSON.stringify({
            transcriptionLength: result.text.length,
            titleGenerated: result.title,
            descriptionGenerated: result.description,
            captionsGenerated: captions.length > 0
          })
        });

        console.log(`AI processing completed for video ${videoId}`);

        res.json({
          success: true,
          video: updatedVideo,
          transcription: result.text,
          captions: captions
        });

      } catch (openaiError) {
        console.error("OpenAI processing error:", openaiError);
        
        // Log processing failure
        await storage.logRecordingEvent({
          advisorId,
          videoId,
          event: "PROCESSING_FAILED",
          metadata: JSON.stringify({
            error: openaiError instanceof Error ? openaiError.message : "Unknown error",
            timestamp: new Date().toISOString()
          })
        });

        // Update video with fallback content
        const fallbackVideo = await storage.updateVideo(videoId, {
          title: "Financial Advisory Video",
          description: "Professional financial guidance and insights.",
          captionsEnabled: false
        });

        res.json({
          success: true,
          video: fallbackVideo,
          transcription: "Transcription unavailable",
          captions: "",
          warning: "AI processing failed, using fallback content"
        });
      }

    } catch (error) {
      console.error("Video processing error:", error);
      res.status(500).json({
        error: "Failed to process video"
      });
    }
  });
  
  // Get recent videos for the logged-in advisor
  app.get("/api/videos/recent", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const videos = await storage.getRecentVideos(advisorId, limit);
      res.json(videos);
    } catch (error) {
      console.error("Get recent videos error:", error);
      res.status(500).json({
        error: "Failed to retrieve recent videos"
      });
    }
  });
  
  // Get all videos for the logged-in advisor
  app.get("/api/videos", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const videos = await storage.getAllVideos(advisorId);
      res.json(videos);
    } catch (error) {
      console.error("Get all videos error:", error);
      res.status(500).json({
        error: "Failed to retrieve videos"
      });
    }
  });
  
  // Get a specific video
  app.get("/api/videos/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const video = await storage.getVideo(req.params.id);
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found"
        });
      }
      
      // Check if the advisor owns this video
      if (video.advisorId !== req.session.advisorId) {
        return res.status(403).json({
          error: "FORBIDDEN",
          message: "You don't have permission to view this video"
        });
      }
      
      res.json(video);
    } catch (error) {
      console.error("Get video error:", error);
      res.status(500).json({
        error: "Failed to retrieve video"
      });
    }
  });
  
  // Update a video
  app.patch("/api/videos/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const video = await storage.getVideo(req.params.id);
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found"
        });
      }
      
      // Check if the advisor owns this video
      if (video.advisorId !== req.session.advisorId) {
        return res.status(403).json({
          error: "FORBIDDEN",
          message: "You don't have permission to update this video"
        });
      }
      
      const validatedData = updateVideoSchema.parse(req.body);
      const updatedVideo = await storage.updateVideo(req.params.id, validatedData);
      
      res.json(updatedVideo);
    } catch (error) {
      console.error("Update video error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Invalid video data",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        error: "Failed to update video"
      });
    }
  });
  
  // Delete a video
  app.delete("/api/videos/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const video = await storage.getVideo(req.params.id);
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found"
        });
      }
      
      // Check if the advisor owns this video
      if (video.advisorId !== req.session.advisorId) {
        return res.status(403).json({
          error: "FORBIDDEN",
          message: "You don't have permission to delete this video"
        });
      }
      
      await storage.deleteVideo(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete video error:", error);
      res.status(500).json({
        error: "Failed to delete video"
      });
    }
  });
  
  // Public route to get video by share link (for sharing with clients)
  app.get("/api/share/:shareLink", async (req: Request, res: Response) => {
    try {
      const video = await storage.getVideoByShareLink(req.params.shareLink);
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found or link has expired"
        });
      }
      
      // Get advisor branding data
      const advisorSettings = await storage.getAdvisorSettings(video.advisorId);
      const advisor = await storage.getAdvisor(video.advisorId);
      
      if (!advisor) {
        return res.status(404).json({
          error: "ADVISOR_NOT_FOUND",
          message: "Advisor not found"
        });
      }
      
      // Don't send the password itself, just indicate if it's protected
      // For password-protected videos, don't expose the fileUrl until verification
      let fileUrl = video.fileUrl;
      
      // Generate data URL from stored video data if no fileUrl exists
      if (!fileUrl && video.videoData) {
        fileUrl = `data:video/webm;base64,${video.videoData}`;
      }
      
      const publicVideo = {
        ...video,
        password: undefined,
        videoData: undefined, // Never expose raw video data
        passwordProtected: !!video.password,
        fileUrl: video.password ? null : fileUrl // Hide fileUrl for password-protected videos
      };
      
      // Prepare branding data
      const branding = {
        logoUrl: advisorSettings?.logoUrl || null,
        profilePictureUrl: advisorSettings?.profilePictureUrl || null,
        primaryColor: advisorSettings?.primaryColor || "#2563eb",
        secondaryColor: advisorSettings?.secondaryColor || "#1e40af",
        phone: advisorSettings?.phone || null,
        calendarLink: advisorSettings?.calendarLink || null,
        disclosureText: advisorSettings?.disclosureText || "Please read and accept the terms to view this video.",
        advisorName: advisor.advisorName,
        companyName: advisor.companyName
      };
      
      res.json({ video: publicVideo, branding });
    } catch (error) {
      console.error("Get shared video error:", error);
      res.status(500).json({
        error: "Failed to retrieve video"
      });
    }
  });
  
  // Verify password for password-protected videos
  app.post("/api/share/:shareLink/verify", async (req: Request, res: Response) => {
    try {
      const video = await storage.getVideoByShareLink(req.params.shareLink);
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found"
        });
      }
      
      if (!video.password) {
        // Generate data URL from stored video data if no fileUrl exists
        let fileUrl = video.fileUrl;
        if (!fileUrl && video.videoData) {
          fileUrl = `data:video/webm;base64,${video.videoData}`;
        }
        return res.json({ 
          success: true,
          fileUrl: fileUrl 
        });
      }
      
      if (req.body.password !== video.password) {
        return res.status(401).json({
          error: "INVALID_PASSWORD",
          message: "Incorrect password"
        });
      }
      
      // Generate data URL from stored video data for password-protected videos
      let fileUrl = video.fileUrl;
      if (video.videoData && !fileUrl) {
        fileUrl = `data:video/webm;base64,${video.videoData}`;
      }
      
      res.json({ 
        success: true,
        fileUrl: fileUrl 
      });
    } catch (error) {
      console.error("Verify video password error:", error);
      res.status(500).json({
        error: "Failed to verify password"
      });
    }
  });
  
  // Log viewer events (public endpoint for shared videos)
  app.post("/api/share/:shareLink/events", async (req: Request, res: Response) => {
    try {
      const video = await storage.getVideoByShareLink(req.params.shareLink);
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found"
        });
      }
      
      const eventData = {
        ...req.body,
        videoId: video.id
      };
      
      const newEvent = await storage.logViewerEvent(eventData);
      res.json(newEvent);
    } catch (error) {
      console.error("Log viewer event error:", error);
      res.status(500).json({
        error: "Failed to log viewer event"
      });
    }
  });
  
  // Log viewer compliments (public endpoint for shared videos)
  app.post("/api/share/:shareLink/compliments", async (req: Request, res: Response) => {
    try {
      const video = await storage.getVideoByShareLink(req.params.shareLink);
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found"
        });
      }
      
      const complimentData = {
        ...req.body,
        videoId: video.id
      };
      
      const newCompliment = await storage.logViewerCompliment(complimentData);
      res.json(newCompliment);
    } catch (error) {
      console.error("Log viewer compliment error:", error);
      res.status(500).json({
        error: "Failed to log viewer compliment"
      });
    }
  });
  
  // Log recording events
  app.post("/api/recording-events", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const eventData = {
        ...req.body,
        advisorId
      };
      
      const validatedData = insertRecordingEventSchema.parse(eventData);
      const event = await storage.logRecordingEvent(validatedData);
      
      res.json(event);
    } catch (error) {
      console.error("Log recording event error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: "Invalid event data",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        error: "Failed to log event"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
