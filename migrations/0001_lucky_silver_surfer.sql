ALTER TABLE "subscriptions" ADD COLUMN "stripe_customer_id" varchar;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" varchar;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_price_id" varchar;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_payment_method_id" varchar;