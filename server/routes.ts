import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  signupSchema, 
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
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
import { transcribeAndGenerateContent, generateCaptions, generateChartScript } from "./openai-service";
import { Resend } from 'resend';
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { calculateExpiryDate } from "../shared/expiry-utils";

// Global type declarations for upload sessions
declare global {
  var uploadSessions: Map<string, any> | undefined;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

  // Forgot password route
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      
      // Check if advisor exists
      const advisor = await storage.getAdvisorByEmail(validatedData.email);
      
      if (!advisor) {
        // Don't reveal that the email doesn't exist for security
        return res.json({
          success: true,
          message: "If an account with this email exists, you will receive a reset code."
        });
      }

      // Generate reset token
      const { token, expiresAt } = await storage.createPasswordResetToken(advisor.id);
      
      // Send reset code via email
      try {
        if (resend) {
          await resend.emails.send({
            from: 'MoneyClip <noreply@yourdomain.com>',
            to: validatedData.email,
            subject: 'Your MoneyClip Password Reset Code',
            html: `
              <h2>Password Reset Request</h2>
              <p>Your 6-digit reset code is: <strong>${token}</strong></p>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this reset, please ignore this email.</p>
            `
          });
        } else {
          console.log('Resend API key not configured - would send reset code via email:', token);
        }
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        // Continue with success response for security (don't reveal email send failures)
      }

      res.json({
        success: true,
        message: "If an account with this email exists, you will receive a reset code."
      });

    } catch (error) {
      console.error("Forgot password error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Please check your email format.",
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

  // Reset password route
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      
      // Validate token and get advisor ID
      const tokenResult = await storage.getPasswordResetToken(validatedData.email, validatedData.token);
      
      if (!tokenResult) {
        return res.status(400).json({
          success: false,
          error: "INVALID_TOKEN",
          message: "Invalid or expired reset code. Please request a new one."
        });
      }

      // Update password
      await storage.updateAdvisorPassword(tokenResult.advisorId, validatedData.newPassword);
      
      // Clean up the used token
      await storage.deletePasswordResetToken(tokenResult.advisorId);
      
      // Log the password reset event
      await storage.logPasswordResetEvent(tokenResult.advisorId);

      res.json({
        success: true,
        message: "Password reset successful. You can now log in with your new password."
      });

    } catch (error) {
      console.error("Reset password error:", error);
      
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

  // === CHART ROUTES ===
  
  // Generate AI script for finance chart
  app.post("/api/charts/generate-script", requireAuth, async (req: Request, res: Response) => {
    try {
      const { chart } = req.body;
      
      // Validate chart data
      if (!chart || !chart.id || !chart.title || !chart.category) {
        return res.status(400).json({
          error: "INVALID_CHART_DATA",
          message: "Chart data is required with id, title, and category"
        });
      }

      // Generate AI script using OpenAI
      const scriptResult = await generateChartScript(chart);
      
      // Store script in database for future use
      try {
        const chartScript = await storage.createChartScript({
          advisorId: req.session.advisorId!,
          chartId: chart.id,
          chartTitle: chart.title,
          chartCategory: chart.category,
          scriptText: scriptResult.script,
          estimatedDuration: scriptResult.estimatedDuration,
          keyPoints: scriptResult.keyPoints,
          isCustom: false
        });

        res.json({
          id: chartScript.id,
          script: scriptResult.script,
          estimatedDuration: scriptResult.estimatedDuration,
          keyPoints: scriptResult.keyPoints
        });
      } catch (dbError) {
        console.error("Failed to save chart script to database:", dbError);
        // Still return the generated script even if DB save fails
        res.json({
          id: `temp-${Date.now()}`,
          script: scriptResult.script,
          estimatedDuration: scriptResult.estimatedDuration,
          keyPoints: scriptResult.keyPoints
        });
      }

    } catch (error) {
      console.error("Error generating chart script:", error);
      res.status(500).json({
        error: "SCRIPT_GENERATION_ERROR",
        message: "Failed to generate script. Please try again."
      });
    }
  });

  // Get saved chart scripts for advisor
  app.get("/api/charts/scripts", requireAuth, async (req: Request, res: Response) => {
    try {
      const scripts = await storage.getChartScripts(req.session.advisorId!);
      res.json(scripts);
    } catch (error) {
      console.error("Error fetching chart scripts:", error);
      res.status(500).json({
        error: "FETCH_ERROR",
        message: "Failed to fetch chart scripts"
      });
    }
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
      
      // Create advisor only (no subscription for beta)
      const advisor = await storage.createAdvisor(validatedData);
      
      // Send success response with confirmation data
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
      
      // Set default expiry duration if not provided (7 days default)
      const expiryDuration = req.body.expiryDuration || "7d";
      const expiresAt = req.body.customExpiryDate 
        ? new Date(req.body.customExpiryDate)
        : calculateExpiryDate(expiryDuration);
      
      const videoData = {
        ...req.body,
        advisorId,
        shareLink: req.body.shareLink || `moneyclip-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        expiryDuration,
        expiresAt,
        // Set transcriptUrl to null initially, will be updated after processing
        transcriptUrl: null
      };
      
      // If videoData is provided, generate a data URL for fileUrl
      if (videoData.videoData) {
        videoData.fileUrl = `data:video/mp4;base64,${videoData.videoData}`;
      }
      
      const validatedData = insertVideoSchema.parse(videoData);
      const video = await storage.createVideo(validatedData);
      
      // If captions data was provided, set the transcript URL
      if (video.captionsData) {
        await storage.updateVideo(video.id, {
          transcriptUrl: `/api/videos/${video.id}/captions`
        });
      }
      
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

  // Process video with manual title and description (AI disabled for MVP)
  app.post("/api/videos/process", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const { videoId, title, description } = req.body;

      if (!videoId) {
        return res.status(400).json({
          error: "MISSING_DATA",
          message: "Video ID is required"
        });
      }

      // Log processing start
      await storage.logRecordingEvent({
        advisorId,
        videoId,
        event: "PROCESSING_STARTED",
        metadata: JSON.stringify({
          manualProcessing: true,
          timestamp: new Date().toISOString()
        })
      });

      console.log(`Processing video ${videoId} with manual content...`);

      // Update video with manually provided content
      const updatedVideo = await storage.updateVideo(videoId, {
        title: title || "Financial Advisory Video",
        description: description || "Professional financial guidance and insights.",
        // AI features disabled for MVP
        transcriptUrl: null,
        captionsData: null,
        transcriptText: null,
        captionsEnabled: false
      });
      
      console.log(`Video ${videoId} updated with manual content:`, {
        title: updatedVideo.title,
        description: updatedVideo.description
      });

      // Log processing success
      await storage.logRecordingEvent({
        advisorId,
        videoId,
        event: "PROCESSING_COMPLETED",
        metadata: JSON.stringify({
          manualProcessing: true,
          titleProvided: !!title,
          descriptionProvided: !!description
        })
      });

      console.log(`Manual processing completed for video ${videoId}`);

      res.json({
        success: true,
        video: updatedVideo,
        // AI features disabled - no transcription or captions
        transcription: null,
        captions: null
      });

    } catch (error) {
      console.error("Video processing error:", error);
      res.status(500).json({
        error: "Failed to process video"
      });
    }
  });

  // Process video for preview (AI disabled for MVP)
  app.post("/api/videos/process-preview", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("Skipping AI processing for preview (MVP mode)...");

      // AI disabled for MVP - return placeholder suggestions
      res.json({
        success: true,
        title: "Financial Advisory Video",
        description: "Professional financial guidance and insights.",
        // AI features disabled for MVP
        transcription: null,
        captions: null
      });

    } catch (error) {
      console.error("Video preview processing error:", error);
      res.status(500).json({
        error: "Failed to process video for preview"
      });
    }
  });

  // Serve video captions/subtitles
  app.get("/api/videos/:id/captions", async (req: Request, res: Response) => {
    try {
      const videoId = req.params.id;
      
      // First try to get from new database field
      const video = await storage.getVideo(videoId);
      const captions = video?.captionsData || await storage.getCaptions(videoId);
      
      console.log(`Serving captions for video ${videoId}:`, {
        hasCaptionsData: !!video?.captionsData,
        captionsLength: captions?.length || 0
      });
      
      if (!captions) {
        return res.status(404).json({
          error: "CAPTIONS_NOT_FOUND",
          message: "Captions not found for this video"
        });
      }
      
      res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(captions);
    } catch (error) {
      console.error("Get captions error:", error);
      res.status(500).json({
        error: "Failed to retrieve captions"
      });
    }
  });

  // Serve video transcript
  app.get("/api/videos/:id/transcript", async (req: Request, res: Response) => {
    try {
      const videoId = req.params.id;
      const transcript = await storage.getTranscript(videoId);
      
      if (!transcript) {
        return res.status(404).json({
          error: "TRANSCRIPT_NOT_FOUND",
          message: "Transcript not found for this video"
        });
      }
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(transcript);
    } catch (error) {
      console.error("Get transcript error:", error);
      res.status(500).json({
        error: "Failed to retrieve transcript"
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

  // Get videos by status with filtering
  app.get("/api/videos/status/:status?", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const status = req.params.status;
      const videos = await storage.getVideosByStatus(advisorId, status);
      res.json(videos);
    } catch (error) {
      console.error("Get videos by status error:", error);
      res.status(500).json({
        error: "Failed to retrieve videos by status"
      });
    }
  });

  // Soft delete a video (move to trash)
  app.patch("/api/videos/:id/delete", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const video = await storage.softDeleteVideo(req.params.id, advisorId);
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found or you don't have permission to delete it"
        });
      }
      
      // Log event
      await storage.logRecordingEvent({
        advisorId,
        videoId: video.id,
        event: "VIDEO_DELETED",
        metadata: JSON.stringify({
          method: "soft_delete",
          title: video.title
        })
      });
      
      res.json({ success: true, video });
    } catch (error) {
      console.error("Soft delete video error:", error);
      res.status(500).json({
        error: "Failed to delete video"
      });
    }
  });

  // Restore a video from trash
  app.patch("/api/videos/:id/restore", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const video = await storage.restoreVideo(req.params.id, advisorId);
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found or you don't have permission to restore it"
        });
      }
      
      // Log event
      await storage.logRecordingEvent({
        advisorId,
        videoId: video.id,
        event: "VIDEO_RESTORED",
        metadata: JSON.stringify({
          title: video.title
        })
      });
      
      res.json({ success: true, video });
    } catch (error) {
      console.error("Restore video error:", error);
      res.status(500).json({
        error: "Failed to restore video"
      });
    }
  });

  // Update video status
  app.patch("/api/videos/:id/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const { status } = req.body;
      
      if (!status || !["draft", "in_review", "approved", "expired", "disabled"].includes(status)) {
        return res.status(400).json({
          error: "INVALID_STATUS",
          message: "Status must be one of: draft, in_review, approved, expired, disabled"
        });
      }
      
      const video = await storage.updateVideoStatus(req.params.id, advisorId, status);
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found or you don't have permission to update it"
        });
      }
      
      // Log event
      await storage.logRecordingEvent({
        advisorId,
        videoId: video.id,
        event: "STATUS_UPDATED",
        metadata: JSON.stringify({
          newStatus: status,
          title: video.title
        })
      });
      
      res.json({ success: true, video });
    } catch (error) {
      console.error("Update video status error:", error);
      res.status(500).json({
        error: "Failed to update video status"
      });
    }
  });

  // Renew video (extend expiration by 30 days)
  app.patch("/api/videos/:id/renew", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const video = await storage.renewVideo(req.params.id, advisorId);
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found or you don't have permission to renew it"
        });
      }
      
      // Log event
      await storage.logRecordingEvent({
        advisorId,
        videoId: video.id,
        event: "VIDEO_RENEWED",
        metadata: JSON.stringify({
          newExpiresAt: video.expiresAt,
          title: video.title
        })
      });
      
      res.json({ success: true, video });
    } catch (error) {
      console.error("Renew video error:", error);
      res.status(500).json({
        error: "Failed to renew video"
      });
    }
  });

  // Enable/disable video link
  app.patch("/api/videos/:id/toggle", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const { enabled } = req.body;
      
      if (typeof enabled !== "boolean") {
        return res.status(400).json({
          error: "INVALID_DATA",
          message: "enabled field must be a boolean"
        });
      }
      
      const video = await storage.updateVideoStatus(
        req.params.id, 
        advisorId, 
        enabled ? "approved" : "disabled"
      );
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found or you don't have permission to update it"
        });
      }
      
      // Log event
      await storage.logRecordingEvent({
        advisorId,
        videoId: video.id,
        event: enabled ? "LINK_ENABLED" : "LINK_DISABLED",
        metadata: JSON.stringify({
          title: video.title,
          enabled
        })
      });
      
      res.json({ success: true, video, enabled });
    } catch (error) {
      console.error("Toggle video link error:", error);
      res.status(500).json({
        error: "Failed to toggle video link"
      });
    }
  });

  // Update video expiry duration
  app.patch("/api/videos/:id/expiry", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const { expiryDuration, customExpiryDate } = req.body;
      
      if (!expiryDuration || !["24h", "7d", "30d", "custom"].includes(expiryDuration)) {
        return res.status(400).json({
          error: "INVALID_DURATION",
          message: "expiryDuration must be one of: 24h, 7d, 30d, custom"
        });
      }
      
      const expiresAt = customExpiryDate && expiryDuration === "custom"
        ? new Date(customExpiryDate)
        : calculateExpiryDate(expiryDuration);
      
      const video = await storage.updateVideo(req.params.id, {
        expiryDuration,
        expiresAt,
        renewedAt: new Date()
      });
      
      if (!video) {
        return res.status(404).json({
          error: "VIDEO_NOT_FOUND",
          message: "Video not found or you don't have permission to update it"
        });
      }
      
      // Log event
      await storage.logRecordingEvent({
        advisorId,
        videoId: video.id,
        event: "EXPIRY_UPDATED",
        metadata: JSON.stringify({
          title: video.title,
          expiryDuration,
          newExpiresAt: video.expiresAt
        })
      });
      
      res.json({ success: true, video });
    } catch (error) {
      console.error("Update video expiry error:", error);
      res.status(500).json({
        error: "Failed to update video expiry"
      });
    }
  });

  // Admin endpoint to expire videos (for scheduled job)
  app.post("/api/videos/expire", requireAuth, async (req: Request, res: Response) => {
    try {
      // This endpoint should be called by a scheduler/cron job
      // Now protected with authentication to prevent unauthorized access
      const expiredCount = await storage.expireVideos();
      
      res.json({ 
        success: true, 
        expiredCount,
        message: `${expiredCount} videos expired`
      });
    } catch (error) {
      console.error("Expire videos error:", error);
      res.status(500).json({
        error: "Failed to expire videos"
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
      
      // Check if link is disabled
      if (video.status === "disabled") {
        return res.status(403).json({
          error: "LINK_DISABLED",
          message: "This video link has been disabled by the advisor",
          linkDisabled: true
        });
      }
      
      // Check if link has expired
      if (video.expiresAt && new Date(video.expiresAt) <= new Date()) {
        return res.status(410).json({
          error: "LINK_EXPIRED",
          message: "This video link has expired",
          linkExpired: true,
          expiresAt: video.expiresAt
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
        fileUrl = `data:video/mp4;base64,${video.videoData}`;
      }
      
      // Ensure transcriptUrl is set if captions exist but URL is missing
      let transcriptUrl = video.transcriptUrl;
      if (!transcriptUrl && video.captionsEnabled && video.captionsData) {
        transcriptUrl = `/api/videos/${video.id}/captions`;
      }

      const publicVideo = {
        ...video,
        password: undefined,
        videoData: undefined, // Never expose raw video data
        passwordProtected: !!video.password,
        fileUrl: video.password ? null : fileUrl, // Hide fileUrl for password-protected videos
        transcriptUrl: transcriptUrl
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
          fileUrl = `data:video/mp4;base64,${video.videoData}`;
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
        fileUrl = `data:video/mp4;base64,${video.videoData}`;
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

  // === OBJECT STORAGE VIDEO ROUTES ===

  // Get upload URL for video
  app.post("/api/videos/upload-url", requireAuth, async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const videoId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const uploadURL = await objectStorageService.getVideoUploadURL(`${videoId}.mp4`);
      
      res.json({ 
        uploadURL,
        videoPath: `${videoId}.mp4`
      });
    } catch (error) {
      console.error("Error getting video upload URL:", error);
      res.status(500).json({ 
        error: "Failed to get upload URL" 
      });
    }
  });

  // Chunked upload initialization for large videos
  app.post("/api/videos/chunked-upload/init", requireAuth, async (req: Request, res: Response) => {
    try {
      const { fileSize, fileName } = req.body;
      
      if (!fileSize || !fileName) {
        return res.status(400).json({ error: "Missing fileSize or fileName" });
      }
      
      const sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const filename = `${sessionId}.mp4`;
      
      // Store upload session info (in production, use Redis or database)
      const uploadSession = {
        sessionId,
        fileName,
        fileSize,
        videoPath: filename,
        chunks: [] as number[],
        createdAt: new Date(),
      };
      
      // For now, store in memory (should be Redis in production)
      if (!(global as any).uploadSessions) {
        (global as any).uploadSessions = new Map();
      }
      (global as any).uploadSessions.set(sessionId, uploadSession);
      
      res.json({
        sessionId,
        videoPath: filename,
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
      });
    } catch (error) {
      console.error("Error initializing chunked upload:", error);
      res.status(500).json({ error: "Failed to initialize chunked upload" });
    }
  });

  // Upload chunk for large videos
  app.post("/api/videos/chunked-upload/chunk", requireAuth, async (req: Request, res: Response) => {
    try {
      const { sessionId, chunkIndex } = req.body;
      
      if (!sessionId || chunkIndex === undefined) {
        return res.status(400).json({ error: "Missing sessionId or chunkIndex" });
      }
      
      const uploadSession = (global as any).uploadSessions?.get(sessionId);
      if (!uploadSession) {
        return res.status(404).json({ error: "Upload session not found" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const chunkPath = `${uploadSession.videoPath}.chunk.${chunkIndex}`;
      const uploadURL = await objectStorageService.getVideoUploadURL(chunkPath);
      
      res.json({ uploadURL, chunkPath });
    } catch (error) {
      console.error("Error getting chunk upload URL:", error);
      res.status(500).json({ error: "Failed to get chunk upload URL" });
    }
  });

  // Complete chunked upload for large videos
  app.post("/api/videos/chunked-upload/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const { sessionId, totalChunks } = req.body;
      
      if (!sessionId || !totalChunks) {
        return res.status(400).json({ error: "Missing sessionId or totalChunks" });
      }
      
      const uploadSession = (global as any).uploadSessions?.get(sessionId);
      if (!uploadSession) {
        return res.status(404).json({ error: "Upload session not found" });
      }
      
      // In a real implementation, we'd concatenate chunks in object storage
      // For now, we assume single upload worked and return the video path
      const videoPath = uploadSession.videoPath;
      
      // Clean up session
      (global as any).uploadSessions?.delete(sessionId);
      
      res.json({
        videoPath,
        message: "Upload completed successfully"
      });
    } catch (error) {
      console.error("Error completing chunked upload:", error);
      res.status(500).json({ error: "Failed to complete chunked upload" });
    }
  });

  // Create video with object storage URL
  app.post("/api/videos/object-storage", requireAuth, async (req: Request, res: Response) => {
    try {
      const advisorId = req.session.advisorId!;
      const videoData = {
        ...req.body,
        advisorId,
        shareLink: req.body.shareLink || `moneyclip-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        transcriptUrl: null,
        videoData: null // Don't store base64 data for object storage videos
      };
      
      // Set fileUrl to object storage path instead of data URL
      if (req.body.videoPath) {
        videoData.fileUrl = `/objects/videos/${req.body.videoPath}`;
      }
      
      const validatedData = insertVideoSchema.parse(videoData);
      const video = await storage.createVideo(validatedData);
      
      // If captions data was provided, set the transcript URL
      if (video.captionsData) {
        await storage.updateVideo(video.id, {
          transcriptUrl: `/api/videos/${video.id}/captions`
        });
      }
      
      // Log event
      await storage.logRecordingEvent({
        advisorId,
        videoId: video.id,
        event: "VIDEO_SAVED",
        metadata: JSON.stringify({
          hasPassword: !!video.password,
          hasClientName: !!video.clientName,
          captionsEnabled: video.captionsEnabled,
          storageType: "object_storage"
        })
      });
      
      res.json(video);
    } catch (error) {
      console.error("Create object storage video error:", error);
      
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

  // Serve videos from object storage with access control
  app.get("/objects/videos/:videoPath(*)", async (req: Request, res: Response) => {
    const objectStorageService = new ObjectStorageService();
    try {
      // Extract video path (format: timestamp-random.webm)
      const videoPath = req.params.videoPath;
      
      // Construct the file URL exactly as it's stored in the database
      const fullFileUrl = `/objects/videos/${videoPath}`;
      
      // Find video in database efficiently using file URL
      const video = await storage.getVideoByFileUrl(fullFileUrl);
      
      if (!video) {
        return res.sendStatus(404);
      }
      
      // Check access: either owner or valid share token/session
      const isOwner = req.session?.advisorId === video.advisorId;
      const shareToken = req.query.share;
      const isValidShare = shareToken && shareToken === video.shareLink?.split('-').pop();
      
      if (!isOwner && !isValidShare) {
        // For share links, also check if this is a public share (no password)
        const isPublicShare = !video.password;
        if (!isPublicShare) {
          return res.status(401).json({
            error: "UNAUTHORIZED",
            message: "Access denied to this video"
          });
        }
      }
      
      const videoFile = await objectStorageService.getVideoFile(req.params.videoPath);
      objectStorageService.downloadObject(videoFile, res, 86400); // Cache videos for 24 hours
    } catch (error) {
      console.error("Error serving video from object storage:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // === SECURE VIDEO STREAMING ENDPOINTS ===
  
  // Stream video manifest files (HLS/DASH) with authentication
  app.get("/api/videos/stream/:manifestPath(*)", requireAuth, async (req: Request, res: Response) => {
    try {
      const manifestPath = req.params.manifestPath;
      const { videoId } = req.query;
      
      if (!manifestPath) {
        return res.status(400).json({ error: "Manifest path required" });
      }
      
      console.log('Streaming request:', {
        manifestPath,
        videoId,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      
      const objectStorageService = new ObjectStorageService();
      
      // Construct the full path to the manifest file in object storage
      const fullManifestPath = videoId 
        ? `videos/${videoId}/streaming/${manifestPath}`
        : `streaming/${manifestPath}`;
      
      try {
        // Try to get the manifest file from object storage
        const manifestFile = await objectStorageService.getVideoFile(fullManifestPath);
        
        // Set appropriate content-type based on file extension
        if (manifestPath.endsWith('.m3u8')) {
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        } else if (manifestPath.endsWith('.mpd')) {
          res.setHeader('Content-Type', 'application/dash+xml');
        } else if (manifestPath.endsWith('.mp4') || manifestPath.endsWith('.m4s')) {
          res.setHeader('Content-Type', 'video/mp4');
        } else {
          res.setHeader('Content-Type', 'application/octet-stream');
        }
        
        // Set mobile-friendly headers
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Range');
        
        // Stream the file
        await objectStorageService.downloadObject(manifestFile, res, 3600);
        
      } catch (storageError) {
        console.log(`Manifest file not found in object storage: ${fullManifestPath}`);
        
        // Fallback: try to serve from the main video file if it's a direct .mp4 request
        if (manifestPath.endsWith('.mp4') && videoId) {
          try {
            const videoFile = await objectStorageService.getVideoFile(`${videoId}.mp4`);
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache videos for 24 hours
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Access-Control-Allow-Origin', '*');
            await objectStorageService.downloadObject(videoFile, res, 86400);
            return;
          } catch (videoError) {
            console.error('Video file not found:', videoError);
          }
        }
        
        if (storageError instanceof ObjectNotFoundError) {
          return res.status(404).json({ error: "Manifest not found" });
        }
        throw storageError;
      }
      
    } catch (error) {
      console.error("Error serving video stream:", error);
      res.status(500).json({ error: "Failed to serve video stream" });
    }
  });
  
  // Generate secure streaming URLs for video manifests
  app.get("/api/videos/:videoId/streaming-url", requireAuth, async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;
      const { format = 'mp4' } = req.query;
      
      if (!videoId) {
        return res.status(400).json({ error: "Video ID required" });
      }
      
      const objectStorageService = new ObjectStorageService();
      
      // Generate secure URLs based on requested format
      let streamingUrls: any = {};
      
      if (format === 'hls' || format === 'all') {
        // Generate HLS streaming URL
        streamingUrls.hls = {
          masterPlaylist: `/api/videos/stream/master.m3u8?videoId=${videoId}`,
          type: 'hls'
        };
      }
      
      if (format === 'dash' || format === 'all') {
        // Generate DASH streaming URL
        streamingUrls.dash = {
          manifest: `/api/videos/stream/manifest.mpd?videoId=${videoId}`,
          type: 'dash'
        };
      }
      
      if (format === 'mp4' || format === 'all') {
        // Generate direct MP4 streaming URL
        streamingUrls.mp4 = {
          url: `/api/videos/stream/${videoId}.mp4?videoId=${videoId}`,
          type: 'mp4'
        };
      }
      
      res.json({
        videoId,
        streamingUrls,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });
      
    } catch (error) {
      console.error("Error generating streaming URLs:", error);
      res.status(500).json({ error: "Failed to generate streaming URLs" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
