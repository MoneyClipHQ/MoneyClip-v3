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
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"), // URL to the recorded video file
  thumbnailUrl: text("thumbnail_url"), // URL to the video thumbnail
  duration: numeric("duration"), // Duration in seconds
  status: text("status").notNull().default("draft"), // draft, published, archived
  viewCount: numeric("view_count").default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Video schemas
export const insertVideoSchema = createInsertSchema(videos).pick({
  advisorId: true,
  title: true,
  description: true,
  fileUrl: true,
  thumbnailUrl: true,
  duration: true,
  status: true,
});

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

// Settings tables for advisor configuration
export const advisorSettings = pgTable("advisor_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advisorId: varchar("advisor_id").notNull().references(() => advisors.id).unique(),
  // Contact Info
  phone: text("phone"),
  calendarLink: text("calendar_link"),
  // Compliance
  disclosureText: text("disclosure_text").default("By accessing this video, you acknowledge that the information provided is for educational purposes only and does not constitute financial advice. Please consult with a qualified financial professional before making any investment decisions."),
  // Branding
  logoUrl: text("logo_url"),
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
