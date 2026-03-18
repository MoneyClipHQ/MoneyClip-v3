import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { DEFAULT_DISCLOSURE_TEXT } from "./constants";

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
  status: text("status").notNull().default("active"), // active, cancelled, suspended, paused
  nextBillingDate: timestamp("next_billing_date").notNull(),
  paymentToken: text("payment_token"), // tokenized payment method from provider
  
  // STRIPE-SPECIFIC COLUMNS
  stripeCustomerId: varchar("stripe_customer_id"), // Stripe customer ID (cus_...)
  stripeSubscriptionId: varchar("stripe_subscription_id"), // Stripe subscription ID (sub_...)
  stripePriceId: varchar("stripe_price_id"), // Stripe price ID (price_...)
  stripePaymentMethodId: varchar("stripe_payment_method_id"), // Stripe payment method ID (pm_...)
  
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

// Free signup schema for beta/MVP - no payment required
export const signupSchema = insertAdvisorSchema.extend({
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the Terms and Privacy Policy"
  }),
  marketingEmails: z.boolean().default(false),
});

// Full signup schema with payment (for future use)
export const paidSignupSchema = insertAdvisorSchema.extend({
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
  status: text("status").notNull().default("draft"), // draft, in_review, approved, expired, trash, disabled
  viewCount: numeric("view_count").default("0"),
  password: text("password"), // Optional password protection
  shareLink: text("share_link"), // Unique shareable link
  transcriptUrl: text("transcript_url"), // URL to the transcript file
  captionsData: text("captions_data"), // Actual caption data in WebVTT format
  transcriptText: text("transcript_text"), // Actual transcript text
  captionsEnabled: boolean("captions_enabled").default(true), // Whether captions are enabled
  includeProfilePicture: boolean("include_profile_picture").default(true), // Whether to include profile picture
  publishedAt: timestamp("published_at"), // When video was published/approved
  expiresAt: timestamp("expires_at"), // When video expires (7 days default from creation)
  expiryDuration: text("expiry_duration").default("7d"), // Duration preset: 24h, 7d, 30d, custom
  renewedAt: timestamp("renewed_at"), // Last renewal date
  deletedAt: timestamp("deleted_at"), // Soft delete timestamp
  // Adaptive streaming support
  hlsManifestUrl: text("hls_manifest_url"), // .m3u8 master playlist URL
  dashManifestUrl: text("dash_manifest_url"), // .mpd manifest URL  
  availableQualities: text("available_qualities").default("360p,720p"), // comma-separated quality levels
  preferredQuality: text("preferred_quality").default("auto"), // auto, 360p, 480p, 720p, 1080p
  processingStatus: text("processing_status").default("pending"), // pending, processing, completed, failed
  originalFormat: text("original_format").default("webm"), // webm, mp4
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
  captionsData: true,
  transcriptText: true,
  captionsEnabled: true,
  includeProfilePicture: true,
  publishedAt: true,
  expiresAt: true,
  expiryDuration: true,
  renewedAt: true,
  deletedAt: true,
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
  disclosureText: text("disclosure_text").default(DEFAULT_DISCLOSURE_TEXT),
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

// Chart scripts table for storing AI-generated scripts for finance charts
export const chartScripts = pgTable("chart_scripts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id),
  chartId: text("chart_id").notNull(), // Reference to chart ID from finance-charts.ts
  chartTitle: text("chart_title").notNull(),
  chartCategory: text("chart_category").notNull(),
  scriptText: text("script_text").notNull(), // AI-generated script
  estimatedDuration: numeric("estimated_duration").notNull(), // Duration in seconds
  keyPoints: text("key_points").array(), // Array of key points from script
  isCustom: boolean("is_custom").default(false), // True if advisor customized the script
  usageCount: numeric("usage_count").default("0"), // How many times script has been used
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chart recording sessions for tracking advisor usage
export const chartSessions = pgTable("chart_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id),
  chartScriptId: varchar("chart_script_id").notNull().references(() => chartScripts.id),
  videoId: varchar("video_id").references(() => videos.id), // Linked if recording was completed
  sessionType: text("session_type").notNull().default("practice"), // practice, recording, review
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  duration: numeric("duration"), // Session duration in seconds
  scriptOpened: boolean("script_opened").default(false), // Whether script popup was opened
  metadata: text("metadata"), // JSON string for additional session data
});

// Chart scripts schemas
export const insertChartScriptSchema = createInsertSchema(chartScripts, {
  chartId: z.string().min(1, "Chart ID is required"),
  chartTitle: z.string().min(1, "Chart title is required"),
  chartCategory: z.string().min(1, "Chart category is required"),
  scriptText: z.string().min(1, "Script text is required"),
  estimatedDuration: z.number().min(1).max(30, "Script duration must be 30 seconds or less"),
  keyPoints: z.array(z.string()).optional(),
}).pick({
  advisorId: true,
  chartId: true,
  chartTitle: true,
  chartCategory: true,
  scriptText: true,
  estimatedDuration: true,
  keyPoints: true,
  isCustom: true,
});

export const updateChartScriptSchema = insertChartScriptSchema.partial().extend({
  id: z.string(),
});

// Chart sessions schemas
export const insertChartSessionSchema = createInsertSchema(chartSessions).pick({
  advisorId: true,
  chartScriptId: true,
  videoId: true,
  sessionType: true,
  endedAt: true,
  duration: true,
  scriptOpened: true,
  metadata: true,
});

export type InsertChartScript = z.infer<typeof insertChartScriptSchema>;
export type UpdateChartScript = z.infer<typeof updateChartScriptSchema>;
export type ChartScript = typeof chartScripts.$inferSelect;
export type InsertChartSession = z.infer<typeof insertChartSessionSchema>;
export type ChartSession = typeof chartSessions.$inferSelect;

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
