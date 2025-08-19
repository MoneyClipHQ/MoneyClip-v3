import { 
  type User, type InsertUser, 
  type Advisor, type InsertAdvisor, type SignupData,
  type Subscription, type InsertSubscription,
  type SignupEvent, type InsertSignupEvent
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private advisors: Map<string, Advisor>;
  private subscriptions: Map<string, Subscription>;
  private signupEvents: SignupEvent[];

  constructor() {
    this.users = new Map();
    this.advisors = new Map();
    this.subscriptions = new Map();
    this.signupEvents = [];
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

    // Create advisor (excluding payment fields)
    const { cardholderName, cardNumber, expiryMonth, expiryYear, cvc, postalCode, agreeToTerms, marketingEmails, ...advisorData } = signupData;
    
    const advisor = await this.createAdvisor(advisorData);

    // Log signup event
    await this.logSignupEvent({
      advisorId: advisor.id,
      event: "SIGNUP_SUBMITTED",
      metadata: JSON.stringify({
        planName: "MoneyClip MVP",
        amount: "20.00",
        marketingEmails: marketingEmails
      })
    });

    // Simulate payment processing (in real app, this would call payment provider)
    const paymentToken = `tok_${randomUUID()}`;

    // Create subscription
    const subscription = await this.createSubscription({
      advisorId: advisor.id,
      planName: "MoneyClip MVP",
      amount: "20.00",
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
}

export const storage = new MemStorage();
