import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  signupSchema, 
  PLANS, 
  updateContactInfoSchema, 
  updateComplianceSchema, 
  updateBrandingSchema 
} from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
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
  app.get("/api/settings/:advisorId", async (req: Request, res: Response) => {
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
  app.patch("/api/settings/contact", async (req: Request, res: Response) => {
    try {
      const validatedData = updateContactInfoSchema.parse(req.body);
      
      // For demo purposes, use a mock advisor ID
      // In a real app, this would come from the authenticated session
      const advisorId = "advisor-1";
      
      await storage.updateContactInfo(advisorId, validatedData);
      
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
  app.patch("/api/settings/compliance", async (req: Request, res: Response) => {
    try {
      const validatedData = updateComplianceSchema.parse(req.body);
      
      // For demo purposes, use a mock advisor ID
      const advisorId = "advisor-1";
      
      await storage.updateCompliance(advisorId, validatedData);
      
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
  app.patch("/api/settings/branding", async (req: Request, res: Response) => {
    try {
      const validatedData = updateBrandingSchema.parse(req.body);
      
      // For demo purposes, use a mock advisor ID
      const advisorId = "advisor-1";
      
      await storage.updateBranding(advisorId, validatedData);
      
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

  const httpServer = createServer(app);

  return httpServer;
}
