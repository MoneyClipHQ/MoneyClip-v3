import { type User, type InsertUser, type Video, type InsertVideo } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getVideosByUserId(userId: string): Promise<Video[]>;
  getRecentVideosByUserId(userId: string, limit?: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  getVideo(id: string): Promise<Video | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private videos: Map<string, Video>;

  constructor() {
    this.users = new Map();
    this.videos = new Map();
    
    // Add sample data for development
    const sampleUserId = randomUUID();
    const sampleUser: User = {
      id: sampleUserId,
      username: "advisor1",
      password: "password123",
      name: "John Smith"
    };
    this.users.set(sampleUserId, sampleUser);
    
    // Add sample videos
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    const sampleVideos: Video[] = [
      {
        id: randomUUID(),
        title: "Q3 Portfolio Review",
        userId: sampleUserId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        title: "Market Update - Tech Sector",
        userId: sampleUserId,
        createdAt: yesterday,
        updatedAt: yesterday,
      },
      {
        id: randomUUID(),
        title: "Retirement Planning Overview",
        userId: sampleUserId,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
    ];
    
    sampleVideos.forEach(video => {
      this.videos.set(video.id, video);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getVideosByUserId(userId: string): Promise<Video[]> {
    return Array.from(this.videos.values()).filter(video => video.userId === userId);
  }

  async getRecentVideosByUserId(userId: string, limit = 3): Promise<Video[]> {
    const userVideos = await this.getVideosByUserId(userId);
    return userVideos
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const now = new Date();
    const video: Video = { 
      ...insertVideo, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.videos.set(id, video);
    return video;
  }

  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }
}

export const storage = new MemStorage();
