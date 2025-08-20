import { 
  type User, type InsertUser, 
  type Advisor, type InsertAdvisor, type SignupData,
  type Subscription, type InsertSubscription,
  type SignupEvent, type InsertSignupEvent,
  type AdvisorSettings, type InsertAdvisorSettings,
  type UpdateContactInfo, type UpdateCompliance, type UpdateBranding,
  type SettingsEvent, type InsertSettingsEvent,
  PLANS
} from "@shared/schema";
import { randomUUID } from "crypto";
import { addDays } from "date-fns";

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private advisors: Map<string, Advisor>;
  private subscriptions: Map<string, Subscription>;
  private signupEvents: SignupEvent[];
  private advisorSettings: Map<string, AdvisorSettings>;
  private settingsEvents: SettingsEvent[];

  constructor() {
    this.users = new Map();
    this.advisors = new Map();
    this.subscriptions = new Map();
    this.signupEvents = [];
    this.advisorSettings = new Map();
    this.settingsEvents = [];
    
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
        disclosureText: "By accessing this video, you acknowledge that the information provided is for educational purposes only and does not constitute financial advice. Please consult with a qualified financial professional before making any investment decisions.",
        logoUrl: undefined,
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
        disclosureText: "By accessing this video, you acknowledge that the information provided is for educational purposes only and does not constitute financial advice. Please consult with a qualified financial professional before making any investment decisions.",
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor
      });
    } else {
      settings.logoUrl = data.logoUrl || null;
      settings.primaryColor = data.primaryColor || null;
      settings.secondaryColor = data.secondaryColor || null;
      settings.updatedAt = new Date();
      this.advisorSettings.set(advisorId, settings);
    }

    // Log event
    await this.logSettingsEvent({
      advisorId,
      event: "BRANDING_UPDATED",
      fieldName: "logoUrl,primaryColor,secondaryColor",
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
}

export const storage = new MemStorage();
