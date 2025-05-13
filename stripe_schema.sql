-- Stripe-related tables for VivyStart6

-- CUSTOMERS TABLE
create table if not exists stripe_customers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  stripe_customer_id text unique,
  created_at timestamp with time zone default now()
);

-- SUBSCRIPTIONS TABLE
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  stripe_subscription_id text unique,
  status text,
  plan_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  created_at timestamp with time zone default now()
);

-- PAYMENTS TABLE
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount integer,
  currency text,
  status text,
  created_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_stripe_customers_user_id on stripe_customers(user_id);
create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
create index if not exists idx_payments_user_id on payments(user_id); 