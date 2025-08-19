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
});

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
