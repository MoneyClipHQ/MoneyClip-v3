import { 
  type User, type InsertUser, 
  type Advisor, type InsertAdvisor, type SignupData,
  type Subscription, type InsertSubscription,
  type SignupEvent, type InsertSignupEvent,
  type AdvisorSettings, type InsertAdvisorSettings,
  type UpdateContactInfo, type UpdateCompliance, type UpdateBranding,
  type SettingsEvent, type InsertSettingsEvent,
  type Video, type InsertVideo, type UpdateVideo,
  type RecordingEvent, type InsertRecordingEvent,
  type ViewerEvent, type InsertViewerEvent,
  type ViewerCompliment, type InsertViewerCompliment,
  PLANS,
  users, advisors, subscriptions, signupEvents, advisorSettings, settingsEvents, videos, recordingEvents, viewerEvents, viewerCompliments
} from "@shared/schema";
import { randomUUID } from "crypto";
import { addDays } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "./db";
import bcrypt from "bcryptjs";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // Legacy user methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Advisor methods
  getAdvisor(id: string): Promise<Advisor | undefined>;
  getAdvisorByEmail(email: string): Promise<Advisor | undefined>;
  createAdvisor(advisor: InsertAdvisor): Promise<Advisor>;
  authenticateAdvisor(email: string, password: string): Promise<Advisor | null>;
  
  // Subscription methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionByAdvisorId(advisorId: string): Promise<Subscription | undefined>;
  
  // Event tracking methods
  logSignupEvent(event: InsertSignupEvent): Promise<SignupEvent>;
  
  // Combined signup method
  createAdvisorWithSubscription(signupData: SignupData): Promise<{
    advisor: Advisor;
    subscription: Subscription;
  }>;
  
  // Settings methods
  getAdvisorSettings(advisorId: string): Promise<AdvisorSettings | undefined>;
  createAdvisorSettings(settings: InsertAdvisorSettings): Promise<AdvisorSettings>;
  updateContactInfo(advisorId: string, data: UpdateContactInfo): Promise<void>;
  updateCompliance(advisorId: string, data: UpdateCompliance): Promise<void>;
  updateBranding(advisorId: string, data: UpdateBranding): Promise<void>;
  logSettingsEvent(event: InsertSettingsEvent): Promise<SettingsEvent>;
  
  // Video methods
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, data: UpdateVideo): Promise<Video | undefined>;
  getVideo(id: string): Promise<Video | undefined>;
  getVideoByShareLink(shareLink: string): Promise<Video | undefined>;
  getRecentVideos(advisorId: string, limit?: number): Promise<Video[]>;
  getAllVideos(advisorId: string): Promise<Video[]>;
  deleteVideo(id: string): Promise<void>;
  logRecordingEvent(event: InsertRecordingEvent): Promise<RecordingEvent>;
  
  // Viewer interaction methods
  logViewerEvent(event: InsertViewerEvent): Promise<ViewerEvent>;
  logViewerCompliment(compliment: InsertViewerCompliment): Promise<ViewerCompliment>;
  
  // Caption and transcript storage methods
  storeCaptions(videoId: string, captions: string): Promise<void>;
  getCaptions(videoId: string): Promise<string | undefined>;
  storeTranscript(videoId: string, transcript: string): Promise<void>;
  getTranscript(videoId: string): Promise<string | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private advisors: Map<string, Advisor>;
  private subscriptions: Map<string, Subscription>;
  private signupEvents: SignupEvent[];
  private advisorSettings: Map<string, AdvisorSettings>;
  private settingsEvents: SettingsEvent[];
  private videos: Map<string, Video>;
  private recordingEvents: RecordingEvent[];
  private captions: Map<string, string>;
  private transcripts: Map<string, string>;

  constructor() {
    this.users = new Map();
    this.advisors = new Map();
    this.subscriptions = new Map();
    this.signupEvents = [];
    this.advisorSettings = new Map();
    this.settingsEvents = [];
    this.videos = new Map();
    this.recordingEvents = [];
    this.captions = new Map();
    this.transcripts = new Map();
    
    // Initialize with mock advisor for demo
    this.initializeMockData();
  }
  
  private initializeMockData() {
    // Create mock advisor
    const mockAdvisor: Advisor = {
      id: "advisor-1",
      advisorName: "Sarah Chen",
      companyName: "Chen Financial Advisory",
      email: "sarah@chenfinancial.com",
      password: "hashedpassword",
      createdAt: new Date()
    };
    this.advisors.set("advisor-1", mockAdvisor);
  }

  // Legacy user methods
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

  // Advisor methods
  async getAdvisor(id: string): Promise<Advisor | undefined> {
    return this.advisors.get(id);
  }

  async getAdvisorByEmail(email: string): Promise<Advisor | undefined> {
    return Array.from(this.advisors.values()).find(
      (advisor) => advisor.email === email,
    );
  }

  async createAdvisor(insertAdvisor: InsertAdvisor): Promise<Advisor> {
    const id = randomUUID();
    const advisor: Advisor = { 
      ...insertAdvisor, 
      id, 
      createdAt: new Date() 
    };
    this.advisors.set(id, advisor);
    return advisor;
  }

  async authenticateAdvisor(email: string, password: string): Promise<Advisor | null> {
    const advisor = await this.getAdvisorByEmail(email);
    if (!advisor) {
      return null;
    }

    // For MemStorage, just do a simple comparison (not secure, for development only)
    if (advisor.password === password) {
      return advisor;
    }
    
    return null;
  }

  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = randomUUID();
    const subscription: Subscription = { 
      ...insertSubscription, 
      id,
      status: "active",
      createdAt: new Date(),
      paymentToken: insertSubscription.paymentToken || null
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async getSubscriptionByAdvisorId(advisorId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (subscription) => subscription.advisorId === advisorId,
    );
  }

  // Event tracking methods
  async logSignupEvent(insertEvent: InsertSignupEvent): Promise<SignupEvent> {
    const id = randomUUID();
    const event: SignupEvent = { 
      ...insertEvent, 
      id,
      timestamp: new Date(),
      advisorId: insertEvent.advisorId || null,
      metadata: insertEvent.metadata || null
    };
    this.signupEvents.push(event);
    return event;
  }

  // Combined signup method
  async createAdvisorWithSubscription(signupData: SignupData): Promise<{
    advisor: Advisor;
    subscription: Subscription;
  }> {
    // Check if email already exists
    const existingAdvisor = await this.getAdvisorByEmail(signupData.email);
    if (existingAdvisor) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Create advisor (excluding payment fields and plan info)
    const { cardholderName, cardNumber, expiryMonth, expiryYear, cvc, postalCode, agreeToTerms, marketingEmails, selectedPlan, ...advisorData } = signupData;
    
    const advisor = await this.createAdvisor(advisorData);

    // Get selected plan details
    const selectedPlanData = PLANS[selectedPlan];
    
    // Log signup event
    await this.logSignupEvent({
      advisorId: advisor.id,
      event: "SIGNUP_SUBMITTED",
      metadata: JSON.stringify({
        planId: selectedPlan,
        planName: selectedPlanData.name,
        amount: selectedPlanData.price.toString(),
        marketingEmails: marketingEmails
      })
    });

    // Simulate payment processing (in real app, this would call payment provider)
    const paymentToken = `tok_${randomUUID()}`;

    // Create subscription with selected plan
    const subscription = await this.createSubscription({
      advisorId: advisor.id,
      planName: selectedPlanData.name,
      amount: selectedPlanData.price.toString(),
      nextBillingDate: addDays(new Date(), 30),
      paymentToken: paymentToken
    });

    // Log subscription creation event
    await this.logSignupEvent({
      advisorId: advisor.id,
      event: "SUBSCRIPTION_CREATED",
      metadata: JSON.stringify({
        subscriptionId: subscription.id,
        planName: subscription.planName,
        amount: subscription.amount
      })
    });

    return { advisor, subscription };
  }

  // Settings methods
  async getAdvisorSettings(advisorId: string): Promise<AdvisorSettings | undefined> {
    return this.advisorSettings.get(advisorId);
  }

  async createAdvisorSettings(insertSettings: InsertAdvisorSettings): Promise<AdvisorSettings> {
    const id = randomUUID();
    const settings: AdvisorSettings = { 
      id,
      advisorId: insertSettings.advisorId,
      phone: insertSettings.phone || null,
      calendarLink: insertSettings.calendarLink || null,
      disclosureText: insertSettings.disclosureText || null,
      logoUrl: insertSettings.logoUrl || null,
      profilePictureUrl: insertSettings.profilePictureUrl || null,
      primaryColor: insertSettings.primaryColor || null,
      secondaryColor: insertSettings.secondaryColor || null,
      updatedAt: new Date()
    };
    this.advisorSettings.set(insertSettings.advisorId, settings);
    return settings;
  }

  async updateContactInfo(advisorId: string, data: UpdateContactInfo): Promise<void> {
    // Update advisor basic info
    const advisor = this.advisors.get(advisorId);
    if (advisor) {
      advisor.advisorName = data.advisorName;
      advisor.companyName = data.companyName;
      advisor.email = data.email;
      this.advisors.set(advisorId, advisor);
    }

    // Update or create settings with contact info
    let settings = this.advisorSettings.get(advisorId);
    if (!settings) {
      settings = await this.createAdvisorSettings({
        advisorId,
        phone: data.phone,
        calendarLink: data.calendarLink,
        disclosureText: "Before accessing or viewing this video, you must read and acknowledge the following disclosure. By proceeding, you confirm that you understand and accept these terms.\n\nThe information presented in this video, including any financial projections, scenarios, analyses, or recommendations, is provided for illustrative and educational purposes only. It is not intended to constitute personalized investment advice, financial planning, tax advice, legal advice, or any other professional guidance tailored to your specific circumstances.\n\nAll projections, estimates, and scenarios are based on hypothetical assumptions, such as growth rates, inflation, expenses, retirement ages, market conditions, and other variables. These assumptions are subject to change and may not reflect actual future events. Actual results may vary significantly due to factors including, but not limited to:\n\nMarket volatility, economic fluctuations, interest rate changes, and geopolitical events.\n\nUnexpected personal life events, health issues, or changes in income/expenses.\n\nChanges in tax laws, regulations, or government policies.\n\nInflation, deflation, or currency fluctuations.\n\nInvestment risks, including the potential loss of principal, liquidity risks, credit risks, and concentration risks.\n\nFees, commissions, or other costs associated with investments or financial products.\n\nNo representation or warranty is made regarding the accuracy, completeness, or reliability of the information provided. Past performance of any investment, strategy, or market is not indicative of future results, and no guarantee is made that any projected outcomes will be achieved. Investing always involves risks, including the possibility of substantial losses.\n\nThis video is not a solicitation to buy or sell any securities, insurance products, or other financial instruments. Any decisions you make based on this information are solely your responsibility.\n\nWe strongly recommend that you consult with a qualified financial advisor, tax professional, accountant, attorney, or other relevant experts before making any financial decisions or implementing any strategies discussed. Reliance on this information without professional consultation could result in adverse financial, tax, or legal consequences.\n\nThis disclosure is intended to comply with applicable regulatory requirements, including those from the Securities and Exchange Commission (SEC), Financial Industry Regulatory Authority (FINRA), and other governing bodies. If you are a client of our firm, this does not alter or supersede any existing agreements or disclosures provided to you.\n\nBy clicking \"Accept\" or proceeding to view the video, you acknowledge that you have read, understood, and agree to this disclosure, and you release the advisor, firm, and any affiliates from any liability arising from your use of this information. If you do not agree, please do not proceed.",
        logoUrl: undefined,
        profilePictureUrl: undefined,
        primaryColor: "#2563eb",
        secondaryColor: "#1e40af"
      });
    } else {
      settings.phone = data.phone || null;
      settings.calendarLink = data.calendarLink || null;
      settings.updatedAt = new Date();
      this.advisorSettings.set(advisorId, settings);
    }

    // Log event
    await this.logSettingsEvent({
      advisorId,
      event: "CONTACT_INFO_UPDATED",
      fieldName: "phone,calendarLink,advisorName,companyName,email",
      metadata: JSON.stringify({
        phone: data.phone,
        calendarLink: data.calendarLink
      })
    });
  }

  async updateCompliance(advisorId: string, data: UpdateCompliance): Promise<void> {
    let settings = this.advisorSettings.get(advisorId);
    if (!settings) {
      settings = await this.createAdvisorSettings({
        advisorId,
        phone: undefined,
        calendarLink: undefined,
        disclosureText: data.disclosureText,
        logoUrl: undefined,
        profilePictureUrl: undefined,
        primaryColor: "#2563eb",
        secondaryColor: "#1e40af"
      });
    } else {
      settings.disclosureText = data.disclosureText;
      settings.updatedAt = new Date();
      this.advisorSettings.set(advisorId, settings);
    }

    // Log event
    await this.logSettingsEvent({
      advisorId,
      event: "COMPLIANCE_UPDATED",
      fieldName: "disclosureText",
      metadata: JSON.stringify({
        disclosureTextLength: data.disclosureText.length
      })
    });
  }

  async updateBranding(advisorId: string, data: UpdateBranding): Promise<void> {
    let settings = this.advisorSettings.get(advisorId);
    if (!settings) {
      settings = await this.createAdvisorSettings({
        advisorId,
        phone: undefined,
        calendarLink: undefined,
        disclosureText: "Before accessing or viewing this video, you must read and acknowledge the following disclosure. By proceeding, you confirm that you understand and accept these terms.\n\nThe information presented in this video, including any financial projections, scenarios, analyses, or recommendations, is provided for illustrative and educational purposes only. It is not intended to constitute personalized investment advice, financial planning, tax advice, legal advice, or any other professional guidance tailored to your specific circumstances.\n\nAll projections, estimates, and scenarios are based on hypothetical assumptions, such as growth rates, inflation, expenses, retirement ages, market conditions, and other variables. These assumptions are subject to change and may not reflect actual future events. Actual results may vary significantly due to factors including, but not limited to:\n\nMarket volatility, economic fluctuations, interest rate changes, and geopolitical events.\n\nUnexpected personal life events, health issues, or changes in income/expenses.\n\nChanges in tax laws, regulations, or government policies.\n\nInflation, deflation, or currency fluctuations.\n\nInvestment risks, including the potential loss of principal, liquidity risks, credit risks, and concentration risks.\n\nFees, commissions, or other costs associated with investments or financial products.\n\nNo representation or warranty is made regarding the accuracy, completeness, or reliability of the information provided. Past performance of any investment, strategy, or market is not indicative of future results, and no guarantee is made that any projected outcomes will be achieved. Investing always involves risks, including the possibility of substantial losses.\n\nThis video is not a solicitation to buy or sell any securities, insurance products, or other financial instruments. Any decisions you make based on this information are solely your responsibility.\n\nWe strongly recommend that you consult with a qualified financial advisor, tax professional, accountant, attorney, or other relevant experts before making any financial decisions or implementing any strategies discussed. Reliance on this information without professional consultation could result in adverse financial, tax, or legal consequences.\n\nThis disclosure is intended to comply with applicable regulatory requirements, including those from the Securities and Exchange Commission (SEC), Financial Industry Regulatory Authority (FINRA), and other governing bodies. If you are a client of our firm, this does not alter or supersede any existing agreements or disclosures provided to you.\n\nBy clicking \"Accept\" or proceeding to view the video, you acknowledge that you have read, understood, and agree to this disclosure, and you release the advisor, firm, and any affiliates from any liability arising from your use of this information. If you do not agree, please do not proceed.",
        logoUrl: data.logoUrl,
        profilePictureUrl: data.profilePictureUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor
      });
    } else {
      settings.logoUrl = data.logoUrl || null;
      settings.profilePictureUrl = data.profilePictureUrl || null;
      settings.primaryColor = data.primaryColor || null;
      settings.secondaryColor = data.secondaryColor || null;
      settings.updatedAt = new Date();
      this.advisorSettings.set(advisorId, settings);
    }

    // Log event
    await this.logSettingsEvent({
      advisorId,
      event: "BRANDING_UPDATED",
      fieldName: "logoUrl,profilePictureUrl,primaryColor,secondaryColor",
      metadata: JSON.stringify({
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor
      })
    });
  }

  async logSettingsEvent(insertEvent: InsertSettingsEvent): Promise<SettingsEvent> {
    const id = randomUUID();
    const event: SettingsEvent = { 
      ...insertEvent, 
      id,
      timestamp: new Date(),
      fieldName: insertEvent.fieldName || null,
      metadata: insertEvent.metadata || null
    };
    this.settingsEvents.push(event);
    return event;
  }

  // Video methods
  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await db
      .insert(videos)
      .values({
        ...video,
        password: video.password || null,
        viewCount: "0"
      })
      .returning();
    return newVideo;
  }

  async updateVideo(id: string, data: UpdateVideo): Promise<Video | undefined> {
    const video = this.videos.get(id);
    if (!video) return undefined;
    
    const updatedVideo = { 
      ...video, 
      ...data,
      updatedAt: new Date()
    };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async getVideoByShareLink(shareLink: string): Promise<Video | undefined> {
    return Array.from(this.videos.values()).find(
      (video) => video.shareLink === shareLink
    );
  }

  async getRecentVideos(advisorId: string, limit: number = 3): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.advisorId === advisorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getAllVideos(advisorId: string): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.advisorId === advisorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteVideo(id: string): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  async logRecordingEvent(event: InsertRecordingEvent): Promise<RecordingEvent> {
    const [newEvent] = await db
      .insert(recordingEvents)
      .values({
        ...event,
        videoId: event.videoId || null,
        metadata: typeof event.metadata === 'object' ? JSON.stringify(event.metadata) : (event.metadata || null)
      })
      .returning();
    return newEvent;
  }

  // Viewer interaction methods
  async logViewerEvent(event: InsertViewerEvent): Promise<ViewerEvent> {
    const [newEvent] = await db
      .insert(viewerEvents)
      .values({
        ...event,
        metadata: typeof event.metadata === 'object' ? JSON.stringify(event.metadata) : (event.metadata || null)
      })
      .returning();
    return newEvent;
  }

  async logViewerCompliment(compliment: InsertViewerCompliment): Promise<ViewerCompliment> {
    const [newCompliment] = await db
      .insert(viewerCompliments)
      .values({
        ...compliment,
        message: compliment.message || null
      })
      .returning();
    return newCompliment;
  }

  // Caption and transcript storage methods (in-memory for MemStorage)
  async storeCaptions(videoId: string, captions: string): Promise<void> {
    this.captions.set(videoId, captions);
  }

  async getCaptions(videoId: string): Promise<string | undefined> {
    return this.captions.get(videoId);
  }

  async storeTranscript(videoId: string, transcript: string): Promise<void> {
    this.transcripts.set(videoId, transcript);
  }

  async getTranscript(videoId: string): Promise<string | undefined> {
    return this.transcripts.get(videoId);
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // Video methods
  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await db
      .insert(videos)
      .values(video)
      .returning();
    return newVideo;
  }

  async updateVideo(id: string, data: UpdateVideo): Promise<Video | undefined> {
    const [updated] = await db
      .update(videos)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(videos.id, id))
      .returning();
    return updated;
  }

  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.id, id));
    return video;
  }

  async getVideoByShareLink(shareLink: string): Promise<Video | undefined> {
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.shareLink, shareLink));
    return video;
  }

  async getRecentVideos(advisorId: string, limit: number = 3): Promise<Video[]> {
    const recentVideos = await db
      .select()
      .from(videos)
      .where(eq(videos.advisorId, advisorId))
      .orderBy(videos.createdAt)
      .limit(limit);
    return recentVideos;
  }

  async getAllVideos(advisorId: string): Promise<Video[]> {
    const allVideos = await db
      .select()
      .from(videos)
      .where(eq(videos.advisorId, advisorId))
      .orderBy(videos.createdAt);
    return allVideos;
  }

  async deleteVideo(id: string): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  async logRecordingEvent(event: InsertRecordingEvent): Promise<RecordingEvent> {
    const [newEvent] = await db
      .insert(recordingEvents)
      .values({
        ...event,
        metadata: typeof event.metadata === 'object' ? JSON.stringify(event.metadata) : event.metadata
      })
      .returning();
    return newEvent;
  }
  async getUser(id: string): Promise<User | undefined> {
    // Legacy user support - not needed for advisor authentication
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Legacy user support - not needed for advisor authentication
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error("Legacy user creation not supported");
  }

  async getAdvisor(id: string): Promise<Advisor | undefined> {
    const [advisor] = await db.select().from(advisors).where(eq(advisors.id, id));
    return advisor;
  }

  async getAdvisorByEmail(email: string): Promise<Advisor | undefined> {
    const [advisor] = await db.select().from(advisors).where(eq(advisors.email, email));
    return advisor;
  }

  async createAdvisor(insertAdvisor: InsertAdvisor): Promise<Advisor> {
    // Hash password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(insertAdvisor.password, saltRounds);
    
    const [advisor] = await db
      .insert(advisors)
      .values({
        ...insertAdvisor,
        password: hashedPassword,
      })
      .returning();
    return advisor;
  }

  async authenticateAdvisor(email: string, password: string): Promise<Advisor | null> {
    const advisor = await this.getAdvisorByEmail(email);
    if (!advisor) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, advisor.password);
    if (!isValidPassword) {
      return null;
    }

    return advisor;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async getSubscriptionByAdvisorId(advisorId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.advisorId, advisorId));
    return subscription;
  }

  async logSignupEvent(insertEvent: InsertSignupEvent): Promise<SignupEvent> {
    const [event] = await db
      .insert(signupEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async createAdvisorWithSubscription(signupData: SignupData): Promise<{
    advisor: Advisor;
    subscription: Subscription;
  }> {
    // Check if email already exists
    const existingAdvisor = await this.getAdvisorByEmail(signupData.email);
    if (existingAdvisor) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Create advisor (excluding payment fields and plan info)
    const { cardholderName, cardNumber, expiryMonth, expiryYear, cvc, postalCode, agreeToTerms, marketingEmails, selectedPlan, ...advisorData } = signupData;
    
    const advisor = await this.createAdvisor(advisorData);

    // Get selected plan details
    const selectedPlanData = PLANS[selectedPlan];
    
    // Log signup event
    await this.logSignupEvent({
      advisorId: advisor.id,
      event: "SIGNUP_SUBMITTED",
      metadata: JSON.stringify({
        planId: selectedPlan,
        planName: selectedPlanData.name,
        amount: selectedPlanData.price.toString(),
        marketingEmails: marketingEmails
      })
    });

    // Simulate payment processing (in real app, this would call payment provider)
    const paymentToken = `tok_${randomUUID()}`;

    // Create subscription with selected plan
    const subscription = await this.createSubscription({
      advisorId: advisor.id,
      planName: selectedPlanData.name,
      amount: selectedPlanData.price.toString(),
      nextBillingDate: addDays(new Date(), 30),
      paymentToken: paymentToken
    });

    // Log subscription creation event
    await this.logSignupEvent({
      advisorId: advisor.id,
      event: "SUBSCRIPTION_CREATED",
      metadata: JSON.stringify({
        subscriptionId: subscription.id,
        planName: subscription.planName,
        amount: subscription.amount
      })
    });

    return { advisor, subscription };
  }

  async getAdvisorSettings(advisorId: string): Promise<AdvisorSettings | undefined> {
    const [settings] = await db
      .select()
      .from(advisorSettings)
      .where(eq(advisorSettings.advisorId, advisorId));
    return settings;
  }

  async createAdvisorSettings(insertSettings: InsertAdvisorSettings): Promise<AdvisorSettings> {
    const [settings] = await db
      .insert(advisorSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateContactInfo(advisorId: string, data: UpdateContactInfo): Promise<void> {
    // Update advisor basic info
    await db
      .update(advisors)
      .set({
        advisorName: data.advisorName,
        companyName: data.companyName,
        email: data.email,
      })
      .where(eq(advisors.id, advisorId));

    // Update or create settings with contact info
    const existingSettings = await this.getAdvisorSettings(advisorId);
    
    if (!existingSettings) {
      await this.createAdvisorSettings({
        advisorId,
        phone: data.phone,
        calendarLink: data.calendarLink,
        disclosureText: "Before accessing or viewing this video, you must read and acknowledge the following disclosure. By proceeding, you confirm that you understand and accept these terms.\n\nThe information presented in this video, including any financial projections, scenarios, analyses, or recommendations, is provided for illustrative and educational purposes only. It is not intended to constitute personalized investment advice, financial planning, tax advice, legal advice, or any other professional guidance tailored to your specific circumstances.\n\nAll projections, estimates, and scenarios are based on hypothetical assumptions, such as growth rates, inflation, expenses, retirement ages, market conditions, and other variables. These assumptions are subject to change and may not reflect actual future events. Actual results may vary significantly due to factors including, but not limited to:\n\nMarket volatility, economic fluctuations, interest rate changes, and geopolitical events.\n\nUnexpected personal life events, health issues, or changes in income/expenses.\n\nChanges in tax laws, regulations, or government policies.\n\nInflation, deflation, or currency fluctuations.\n\nInvestment risks, including the potential loss of principal, liquidity risks, credit risks, and concentration risks.\n\nFees, commissions, or other costs associated with investments or financial products.\n\nNo representation or warranty is made regarding the accuracy, completeness, or reliability of the information provided. Past performance of any investment, strategy, or market is not indicative of future results, and no guarantee is made that any projected outcomes will be achieved. Investing always involves risks, including the possibility of substantial losses.\n\nThis video is not a solicitation to buy or sell any securities, insurance products, or other financial instruments. Any decisions you make based on this information are solely your responsibility.\n\nWe strongly recommend that you consult with a qualified financial advisor, tax professional, accountant, attorney, or other relevant experts before making any financial decisions or implementing any strategies discussed. Reliance on this information without professional consultation could result in adverse financial, tax, or legal consequences.\n\nThis disclosure is intended to comply with applicable regulatory requirements, including those from the Securities and Exchange Commission (SEC), Financial Industry Regulatory Authority (FINRA), and other governing bodies. If you are a client of our firm, this does not alter or supersede any existing agreements or disclosures provided to you.\n\nBy clicking \"Accept\" or proceeding to view the video, you acknowledge that you have read, understood, and agree to this disclosure, and you release the advisor, firm, and any affiliates from any liability arising from your use of this information. If you do not agree, please do not proceed.",
        logoUrl: undefined,
        primaryColor: "#2563eb",
        secondaryColor: "#1e40af"
      });
    } else {
      await db
        .update(advisorSettings)
        .set({
          phone: data.phone,
          calendarLink: data.calendarLink,
          updatedAt: new Date(),
        })
        .where(eq(advisorSettings.advisorId, advisorId));
    }

    // Log event
    await this.logSettingsEvent({
      advisorId,
      event: "CONTACT_INFO_UPDATED",
      fieldName: "phone,calendarLink,advisorName,companyName,email",
      metadata: JSON.stringify({
        phone: data.phone,
        calendarLink: data.calendarLink
      })
    });
  }

  async updateCompliance(advisorId: string, data: UpdateCompliance): Promise<void> {
    const existingSettings = await this.getAdvisorSettings(advisorId);
    
    if (!existingSettings) {
      await this.createAdvisorSettings({
        advisorId,
        phone: undefined,
        calendarLink: undefined,
        disclosureText: data.disclosureText,
        logoUrl: undefined,
        profilePictureUrl: undefined,
        primaryColor: "#2563eb",
        secondaryColor: "#1e40af"
      });
    } else {
      await db
        .update(advisorSettings)
        .set({
          disclosureText: data.disclosureText,
          updatedAt: new Date(),
        })
        .where(eq(advisorSettings.advisorId, advisorId));
    }

    // Log event
    await this.logSettingsEvent({
      advisorId,
      event: "COMPLIANCE_UPDATED",
      fieldName: "disclosureText",
      metadata: JSON.stringify({
        disclosureTextLength: data.disclosureText.length
      })
    });
  }

  async updateBranding(advisorId: string, data: UpdateBranding): Promise<void> {
    console.log("Updating branding for advisor:", advisorId, {
      logoUrl: data.logoUrl ? `${data.logoUrl.substring(0, 50)}...` : "null",
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor
    });
    
    const existingSettings = await this.getAdvisorSettings(advisorId);
    
    if (!existingSettings) {
      await this.createAdvisorSettings({
        advisorId,
        phone: undefined,
        calendarLink: undefined,
        disclosureText: "Before accessing or viewing this video, you must read and acknowledge the following disclosure. By proceeding, you confirm that you understand and accept these terms.\n\nThe information presented in this video, including any financial projections, scenarios, analyses, or recommendations, is provided for illustrative and educational purposes only. It is not intended to constitute personalized investment advice, financial planning, tax advice, legal advice, or any other professional guidance tailored to your specific circumstances.\n\nAll projections, estimates, and scenarios are based on hypothetical assumptions, such as growth rates, inflation, expenses, retirement ages, market conditions, and other variables. These assumptions are subject to change and may not reflect actual future events. Actual results may vary significantly due to factors including, but not limited to:\n\nMarket volatility, economic fluctuations, interest rate changes, and geopolitical events.\n\nUnexpected personal life events, health issues, or changes in income/expenses.\n\nChanges in tax laws, regulations, or government policies.\n\nInflation, deflation, or currency fluctuations.\n\nInvestment risks, including the potential loss of principal, liquidity risks, credit risks, and concentration risks.\n\nFees, commissions, or other costs associated with investments or financial products.\n\nNo representation or warranty is made regarding the accuracy, completeness, or reliability of the information provided. Past performance of any investment, strategy, or market is not indicative of future results, and no guarantee is made that any projected outcomes will be achieved. Investing always involves risks, including the possibility of substantial losses.\n\nThis video is not a solicitation to buy or sell any securities, insurance products, or other financial instruments. Any decisions you make based on this information are solely your responsibility.\n\nWe strongly recommend that you consult with a qualified financial advisor, tax professional, accountant, attorney, or other relevant experts before making any financial decisions or implementing any strategies discussed. Reliance on this information without professional consultation could result in adverse financial, tax, or legal consequences.\n\nThis disclosure is intended to comply with applicable regulatory requirements, including those from the Securities and Exchange Commission (SEC), Financial Industry Regulatory Authority (FINRA), and other governing bodies. If you are a client of our firm, this does not alter or supersede any existing agreements or disclosures provided to you.\n\nBy clicking \"Accept\" or proceeding to view the video, you acknowledge that you have read, understood, and agree to this disclosure, and you release the advisor, firm, and any affiliates from any liability arising from your use of this information. If you do not agree, please do not proceed.",
        logoUrl: data.logoUrl,
        profilePictureUrl: data.profilePictureUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor
      });
      console.log("Created new branding settings");
    } else {
      await db
        .update(advisorSettings)
        .set({
          logoUrl: data.logoUrl,
          profilePictureUrl: data.profilePictureUrl,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          updatedAt: new Date(),
        })
        .where(eq(advisorSettings.advisorId, advisorId));
      console.log("Updated existing branding settings");
    }

    // Log event
    await this.logSettingsEvent({
      advisorId,
      event: "BRANDING_UPDATED",
      fieldName: "logoUrl,profilePictureUrl,primaryColor,secondaryColor",
      metadata: JSON.stringify({
        logoUrl: data.logoUrl,
        profilePictureUrl: data.profilePictureUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor
      })
    });
  }

  async logSettingsEvent(insertEvent: InsertSettingsEvent): Promise<SettingsEvent> {
    const [event] = await db
      .insert(settingsEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  // Viewer interaction methods
  async logViewerEvent(event: InsertViewerEvent): Promise<ViewerEvent> {
    const [newEvent] = await db
      .insert(viewerEvents)
      .values({
        ...event,
        metadata: typeof event.metadata === 'object' ? JSON.stringify(event.metadata) : (event.metadata || null)
      })
      .returning();
    return newEvent;
  }

  async logViewerCompliment(compliment: InsertViewerCompliment): Promise<ViewerCompliment> {
    const [newCompliment] = await db
      .insert(viewerCompliments)
      .values({
        ...compliment,
        message: compliment.message || null
      })
      .returning();
    return newCompliment;
  }

  // Caption and transcript storage methods (using in-memory for DatabaseStorage too)
  private captions: Map<string, string> = new Map();
  private transcripts: Map<string, string> = new Map();

  async storeCaptions(videoId: string, captions: string): Promise<void> {
    this.captions.set(videoId, captions);
  }

  async getCaptions(videoId: string): Promise<string | undefined> {
    return this.captions.get(videoId);
  }

  async storeTranscript(videoId: string, transcript: string): Promise<void> {
    this.transcripts.set(videoId, transcript);
  }

  async getTranscript(videoId: string): Promise<string | undefined> {
    return this.transcripts.get(videoId);
  }
}

export const storage = new DatabaseStorage();
