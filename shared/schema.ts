import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const advisors = pgTable("advisors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorName: text("advisor_name").notNull(),
  companyName: text("company_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id),
  planName: text("plan_name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"), // active, cancelled, suspended
  nextBillingDate: timestamp("next_billing_date").notNull(),
  paymentToken: text("payment_token"), // tokenized payment method from provider
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const signupEvents = pgTable("signup_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorId: varchar("advisor_id").references(() => advisors.id),
  event: text("event").notNull(), // SIGNUP_PAGE_VIEWED, SIGNUP_SUBMITTED, etc.
  metadata: text("metadata"), // JSON string for additional event data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Advisor schemas
export const insertAdvisorSchema = createInsertSchema(advisors, {
  email: z.string().email("Please enter a valid email address"),
  advisorName: z.string().min(1, "Advisor name is required"),
  companyName: z.string().min(1, "Company name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).pick({
  advisorName: true,
  companyName: true,
  email: true,
  password: true,
});

export const signupSchema = insertAdvisorSchema.extend({
  cardholderName: z.string().min(1, "Cardholder name is required"),
  cardNumber: z.string().min(13, "Card number is invalid").max(19, "Card number is invalid"),
  expiryMonth: z.string().min(2, "Expiry month is required"),
  expiryYear: z.string().min(4, "Expiry year is required"),
  cvc: z.string().min(3, "CVC is required").max(4),
  postalCode: z.string().min(5, "Postal code is required"),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the Terms and Privacy Policy"
  }),
  marketingEmails: z.boolean().default(false),
  selectedPlan: z.enum(["starter", "professional", "premium"]).default("starter"),
});

// Plan definitions
export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 20,
    description: "Record your screen and share securely with clients.",
    features: [
      "Screen recording + secure sharing",
      "Password-protected links",
      "Basic captions",
      "Basic analytics"
    ],
    notIncluded: [
      "Advisor branding",
      "CRM integration",
      "Scripted content"
    ]
  },
  professional: {
    id: "professional", 
    name: "Professional",
    price: 45,
    description: "Add your firm's logo and colors for a branded client experience.",
    features: [
      "Screen recording + secure sharing",
      "Advisor branding (logo, colors)",
      "Custom viewer page styling",
      "Password-protected links",
      "Basic captions",
      "Basic analytics"
    ],
    notIncluded: [
      "CRM integration",
      "Scripted content"
    ]
  },
  premium: {
    id: "premium",
    name: "Premium", 
    price: 60,
    description: "Everything in Professional, plus ready-made advisor scripts to save time.",
    features: [
      "Screen recording + secure sharing",
      "Advisor branding (logo, colors)",
      "Custom viewer page styling", 
      "CRM integration",
      "Scripted content templates",
      "Password-protected links",
      "Basic captions", 
      "Basic analytics"
    ],
    notIncluded: []
  }
} as const;

export type PlanId = keyof typeof PLANS;

// Subscription schemas
export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  advisorId: true,
  planName: true,
  amount: true,
  nextBillingDate: true,
  paymentToken: true,
});

// Event schemas
export const insertSignupEventSchema = createInsertSchema(signupEvents).pick({
  advisorId: true,
  event: true,
  metadata: true,
});

export type InsertAdvisor = z.infer<typeof insertAdvisorSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type Advisor = typeof advisors.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSignupEvent = z.infer<typeof insertSignupEventSchema>;
export type SignupEvent = typeof signupEvents.$inferSelect;

// Videos table for advisor recordings
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id),
  clientName: text("client_name"), // Client name for personalization
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"), // URL to the recorded video file
  videoData: text("video_data"), // Base64 encoded video data for MVP
  thumbnailUrl: text("thumbnail_url"), // URL to the video thumbnail
  duration: numeric("duration"), // Duration in seconds
  status: text("status").notNull().default("draft"), // draft, published, archived
  viewCount: numeric("view_count").default("0"),
  password: text("password"), // Optional password protection
  shareLink: text("share_link"), // Unique shareable link
  transcriptUrl: text("transcript_url"), // URL to the transcript file
  captionsEnabled: boolean("captions_enabled").default(true), // Whether captions are enabled
  includeProfilePicture: boolean("include_profile_picture").default(true), // Whether to include profile picture
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Video schemas
export const insertVideoSchema = createInsertSchema(videos).pick({
  advisorId: true,
  clientName: true,
  title: true,
  description: true,
  fileUrl: true,
  videoData: true,
  thumbnailUrl: true,
  duration: true,
  status: true,
  password: true,
  shareLink: true,
  transcriptUrl: true,
  captionsEnabled: true,
  includeProfilePicture: true,
});

export const updateVideoSchema = insertVideoSchema.partial();

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type UpdateVideo = z.infer<typeof updateVideoSchema>;
export type Video = typeof videos.$inferSelect;

// Settings tables for advisor configuration
export const advisorSettings = pgTable("advisor_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id).unique(),
  // Contact Info
  phone: text("phone"),
  calendarLink: text("calendar_link"),
  // Compliance
  disclosureText: text("disclosure_text").default("Before accessing or viewing this video, you must read and acknowledge the following disclosure. By proceeding, you confirm that you understand and accept these terms.\n\nThe information presented in this video, including any financial projections, scenarios, analyses, or recommendations, is provided for illustrative and educational purposes only. It is not intended to constitute personalized investment advice, financial planning, tax advice, legal advice, or any other professional guidance tailored to your specific circumstances.\n\nAll projections, estimates, and scenarios are based on hypothetical assumptions, such as growth rates, inflation, expenses, retirement ages, market conditions, and other variables. These assumptions are subject to change and may not reflect actual future events. Actual results may vary significantly due to factors including, but not limited to:\n\nMarket volatility, economic fluctuations, interest rate changes, and geopolitical events.\n\nUnexpected personal life events, health issues, or changes in income/expenses.\n\nChanges in tax laws, regulations, or government policies.\n\nInflation, deflation, or currency fluctuations.\n\nInvestment risks, including the potential loss of principal, liquidity risks, credit risks, and concentration risks.\n\nFees, commissions, or other costs associated with investments or financial products.\n\nNo representation or warranty is made regarding the accuracy, completeness, or reliability of the information provided. Past performance of any investment, strategy, or market is not indicative of future results, and no guarantee is made that any projected outcomes will be achieved. Investing always involves risks, including the possibility of substantial losses.\n\nThis video is not a solicitation to buy or sell any securities, insurance products, or other financial instruments. Any decisions you make based on this information are solely your responsibility.\n\nWe strongly recommend that you consult with a qualified financial advisor, tax professional, accountant, attorney, or other relevant experts before making any financial decisions or implementing any strategies discussed. Reliance on this information without professional consultation could result in adverse financial, tax, or legal consequences.\n\nThis disclosure is intended to comply with applicable regulatory requirements, including those from the Securities and Exchange Commission (SEC), Financial Industry Regulatory Authority (FINRA), and other governing bodies. If you are a client of our firm, this does not alter or supersede any existing agreements or disclosures provided to you.\n\nBy clicking \"Accept\" or proceeding to view the video, you acknowledge that you have read, understood, and agree to this disclosure, and you release the advisor, firm, and any affiliates from any liability arising from your use of this information. If you do not agree, please do not proceed."),
  // Branding
  logoUrl: text("logo_url"),
  profilePictureUrl: text("profile_picture_url"),
  primaryColor: text("primary_color").default("#2563eb"), // Default blue
  secondaryColor: text("secondary_color").default("#1e40af"), // Default darker blue
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Settings event logging for compliance
export const settingsEvents = pgTable("settings_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id),
  event: text("event").notNull(), // SETTINGS_OPENED, CONTACT_INFO_UPDATED, etc.
  fieldName: text("field_name"), // Which field was updated
  metadata: text("metadata"), // JSON string for additional event data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Recording event logging for compliance
export const recordingEvents = pgTable("recording_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id),
  videoId: varchar("video_id").references(() => videos.id),
  event: text("event").notNull(), // RECORDING_STARTED, CAPTIONS_ENABLED, PAUSED, RESUMED, STOPPED, etc.
  metadata: text("metadata"), // JSON string for additional event data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Settings schemas
export const insertAdvisorSettingsSchema = createInsertSchema(advisorSettings, {
  phone: z.string().optional().refine((val) => {
    if (!val) return true;
    // Basic phone validation (can be enhanced)
    return /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, ''));
  }, "Please enter a valid phone number"),
  calendarLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color (e.g., #2563eb)"),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color (e.g., #1e40af)"),
  disclosureText: z.string().min(1, "Disclosure text is required").max(5000, "Disclosure text must be under 5000 characters"),
}).pick({
  advisorId: true,
  phone: true,
  calendarLink: true,
  disclosureText: true,
  logoUrl: true,
  profilePictureUrl: true,
  primaryColor: true,
  secondaryColor: true,
});

export const updateContactInfoSchema = insertAdvisorSettingsSchema.pick({
  phone: true,
  calendarLink: true,
}).extend({
  advisorName: z.string().min(1, "Advisor name is required"),
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Please enter a valid email address"),
});

export const updateComplianceSchema = insertAdvisorSettingsSchema.pick({
  disclosureText: true,
});

export const updateBrandingSchema = insertAdvisorSettingsSchema.pick({
  logoUrl: true,
  profilePictureUrl: true,
  primaryColor: true,
  secondaryColor: true,
});

export const insertSettingsEventSchema = createInsertSchema(settingsEvents).pick({
  advisorId: true,
  event: true,
  fieldName: true,
  metadata: true,
});

export type InsertAdvisorSettings = z.infer<typeof insertAdvisorSettingsSchema>;
export type AdvisorSettings = typeof advisorSettings.$inferSelect;
export type UpdateContactInfo = z.infer<typeof updateContactInfoSchema>;
export type UpdateCompliance = z.infer<typeof updateComplianceSchema>;
export type UpdateBranding = z.infer<typeof updateBrandingSchema>;
export type InsertSettingsEvent = z.infer<typeof insertSettingsEventSchema>;
export type SettingsEvent = typeof settingsEvents.$inferSelect;

// Recording event schemas
export const insertRecordingEventSchema = createInsertSchema(recordingEvents).pick({
  advisorId: true,
  videoId: true,
  event: true,
  metadata: true,
});

export type InsertRecordingEvent = z.infer<typeof insertRecordingEventSchema>;
export type RecordingEvent = typeof recordingEvents.$inferSelect;

// Viewer event logging for compliance
export const viewerEvents = pgTable("viewer_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  sessionId: varchar("session_id").notNull(), // Anonymous session tracking
  event: text("event").notNull(), // VIEWER_ACCEPTED_TERMS, VIDEO_PLAYED, VIDEO_PAUSED, VIDEO_COMPLETED, CAPTIONS_ON/OFF, SPEED_CHANGED, COMPLIMENT_SENT
  metadata: text("metadata"), // JSON string for additional event data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Viewer compliments/feedback
export const viewerCompliments = pgTable("viewer_compliments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  sessionId: varchar("session_id").notNull(), // Anonymous session tracking
  type: text("type").notNull(), // "thumbs_up", "clap", "heart", "helpful", "thanks"
  message: text("message"), // For text compliments
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Viewer event schemas
export const insertViewerEventSchema = createInsertSchema(viewerEvents).pick({
  videoId: true,
  sessionId: true,
  event: true,
  metadata: true,
});

export const insertViewerComplimentSchema = createInsertSchema(viewerCompliments).pick({
  videoId: true,
  sessionId: true,
  type: true,
  message: true,
});

export type InsertViewerEvent = z.infer<typeof insertViewerEventSchema>;
export type ViewerEvent = typeof viewerEvents.$inferSelect;
export type InsertViewerCompliment = z.infer<typeof insertViewerComplimentSchema>;
export type ViewerCompliment = typeof viewerCompliments.$inferSelect;

// Legacy user table (keeping for backward compatibility)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id),
  token: varchar("token", { length: 6 }).notNull(), // 6-digit code
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  token: z.string().length(6, "Please enter the 6-digit code"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).pick({
  advisorId: true,
  token: true,
  expiresAt: true,
});

export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Login schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Session type extensions
declare module "express-session" {
  interface SessionData {
    advisorId?: string;
    advisor?: {
      id: string;
      advisorName: string;
      companyName: string;
      email: string;
    };
  }
}
