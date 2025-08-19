import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { signupSchema } from "@shared/schema";
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

  const httpServer = createServer(app);

  return httpServer;
}
