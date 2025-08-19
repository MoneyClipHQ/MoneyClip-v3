import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/by-username/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Video routes
  app.get("/api/users/:userId/videos", async (req, res) => {
    try {
      const videos = await storage.getVideosByUserId(req.params.userId);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:userId/videos/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const videos = await storage.getRecentVideosByUserId(req.params.userId, limit);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/videos", async (req, res) => {
    try {
      const validatedData = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo(validatedData);
      res.status(201).json(video);
    } catch (error) {
      res.status(400).json({ error: "Invalid video data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
