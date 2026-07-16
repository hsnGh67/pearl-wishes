-- Pearl Wishes Studio Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE  categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  description TEXT
);

-- =============================================
-- SERVICES TABLE
-- =============================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_add_on BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- =============================================
-- ORDERS TABLE (Bookings/Appointments)
-- =============================================
create table orders (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  order_number text not null,
  appointment_date date not null,
  appointment_time text not null,
  address text not null,
  postcode text not null,
  city text null default 'London'::text,
  total_amount numeric(10, 2) not null,
  payment_status text not null default 'pending'::text,
  payment_intent_id text null,
  booking_status text not null default 'pending'::text,
  notes text null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint orders_pkey primary key (id),
  constraint orders_order_number_key unique (order_number),
  constraint orders_user_id_fkey foreign KEY (user_id) references users (id) on delete set null,
  constraint orders_booking_status_check check (
    (
      booking_status = any (
        array[
          'pending'::text,
          'confirmed'::text,
          'in_progress'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  ),
  constraint orders_payment_status_check check (
    (
      payment_status = any (
        array[
          'pending'::text,
          'paid'::text,
          'failed'::text,
          'refunded'::text
        ]
      )
    )
  )
) ;

-- =============================================
-- WORKSHOPS TABLE
-- =============================================
create table public.workshops (
  id uuid not null default extensions.uuid_generate_v4 (),
  title text not null,
  description text not null,
  level text not null,
  class_type text not null,
  highlights text[] not null,
  price numeric(10, 2) null,
  capacity integer not null default 1,
  session_duration_hours numeric(10, 2) not null default 1,
  session_count integer not null default 1,
  image_url text null,
  is_active boolean null default true,
  display_order integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint workshops_pkey primary key (id),
  constraint workshops_level_check1 check (
    (
      level = any (
        array[
          'beginner'::text,
          'intermediate'::text,
          'advanced'::text,
          'intermediate_to_advanced'::text,
          'all_levels'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- =============================================
-- WORKSHOP BOOKINGS TABLE
-- =============================================
create table public.workshop_bookings (
  id uuid not null default extensions.uuid_generate_v4 (),
  workshop_id uuid null,
  user_id uuid null,
  preferred_month text not null,
  participant_name text not null,
  participant_email text not null,
  participant_phone text null,
  notes text not null default ''::text,
  payment_status text not null default 'pending'::text,
  status text not null default 'pending'::text,
  payment_intent_id text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint workshop_bookings_pkey primary key (id),
  constraint workshop_bookings_user_id_fkey foreign KEY (user_id) references users (id) on delete set null,
  constraint workshop_bookings_workshop_id_fkey foreign KEY (workshop_id) references workshops (id) on delete CASCADE,
  constraint workshop_bookings_payment_status_check check (
    (
      payment_status = any (
        array[
          'pending'::text,
          'paid'::text,
          'failed'::text,
          'refunded'::text
        ]
      )
    )
  ),
  constraint workshop_bookings_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'confirmed'::text,
          'scheduled'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- =============================================
-- WORKSHOP SESSIONS TABLE
-- =============================================
create table public.workshop_sessions (
  id uuid not null default extensions.uuid_generate_v4 (),
  class_id uuid not null,
  workshop_id uuid not null,
  starts_at time without time zone not null,
  ends_at time without time zone not null,
  date date not null,
  weekdays text[] not null ,
  status text not null default 'scheduled'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint workshop_sessions_pkey primary key (id),
  constraint workshop_sessions_workshop_id_fkey foreign KEY (workshop_id) references workshops (id) on delete CASCADE,
  constraint workshop_sessions_status_check check (
    (
      status = any (
        array[
          'scheduled'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- =============================================
-- WORKSHOP SESSION PARTICIPANTS TABLE
-- =============================================
create table public.workshop_session_participants (
  id uuid not null default extensions.uuid_generate_v4 (),
  workshop_id uuid not null,
  workshop_class_id uuid not null,
  workshop_session_id uuid not null,
  user_id uuid not null,
  name text not null,
  email text not null,
  phone text not null,
  created_at timestamp with time zone null default now(),
  constraint workshop_session_participants_pkey primary key (id),
  constraint workshop_session_participants_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint workshop_session_participants_workshop_id_fkey foreign KEY (workshop_id) references workshops (id) on delete CASCADE,
  constraint workshop_session_participants_workshop_session_id_fkey foreign KEY (workshop_session_id) references workshop_sessions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_workshop_session_participants_workshop_session_id on public.workshop_session_participants using btree (workshop_session_id) TABLESPACE pg_default;

create index IF not exists idx_workshop_session_participants_user_id on public.workshop_session_participants using btree (user_id) TABLESPACE pg_default;

-- =============================================
-- ORDER ITEMS TABLE (Services within an order)
-- =============================================
create table order_items (
  id uuid not null default extensions.uuid_generate_v4 (),
  order_id uuid null,
  service_id uuid null,
  person_name text not null,
  service_name text not null,
  quantity integer null default 1,
  price numeric(10, 2) not null,
  duration integer not null,
  created_at timestamp with time zone null default now(),
  constraint order_items_pkey primary key (id),
  constraint order_items_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint order_items_service_id_fkey foreign KEY (service_id) references services (id) on delete set null
);


-- =============================================
-- DISTRICTS TABLE
-- =============================================
create table districts (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  is_active boolean default true,
  is_coming_soon boolean default false,
  created_at timestamp with time zone null default now(),
  constraint districts_pkey primary key (id)
);


-- =============================================
-- BOOKINGS TABLE
-- =============================================
create table bookings (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  service_id uuid not null,
  appointment_date date not null,
  appointment_time character varying(5) not null,
  address text not null,
  postcode character varying(10) not null,
  district character varying(100) not null,
  status character varying(20) not null default 'pending'::character varying,
  payment_status character varying(20) not null default 'pending'::character varying,
  total_price numeric(10, 2) not null,
  notes text null,
  stripe_payment_intent_id character varying(255) null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint bookings_pkey primary key (id),
  constraint bookings_service_id_fkey foreign KEY (service_id) references services (id) on delete CASCADE,
  constraint bookings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint bookings_payment_status_check check (
    (
      (payment_status)::text = any (
        (
          array[
            'pending'::character varying,
            'paid'::character varying,
            'failed'::character varying,
            'refunded'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint bookings_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'confirmed'::character varying,
            'in_progress'::character varying,
            'completed'::character varying,
            'cancelled'::character varying,
            'no_show'::character varying
          ]
        )::text[]
      )
    )
  )
) ;

create index IF not exists idx_bookings_user_id on bookings using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_service_id on bookings using btree (service_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_appointment_date on bookings using btree (appointment_date) TABLESPACE pg_default;

create index IF not exists idx_bookings_status on bookings using btree (status) TABLESPACE pg_default;

create index IF not exists idx_bookings_payment_status on bookings using btree (payment_status) TABLESPACE pg_default;

create trigger update_bookings_updated_at BEFORE
update on bookings for EACH row
execute FUNCTION update_updated_at_column ();

-- =============================================
-- BOOKING TREATMENTS TABLE
-- =============================================
create table booking_treatments (
  id uuid not null default gen_random_uuid (),
  booking_id uuid not null,
  service_id uuid not null,
  person_name character varying(100) not null,
  service_name text not null,
  price numeric(10, 2) not null,
  duration integer not null,
  status character varying(20) not null default 'active'::character varying,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint booking_treatments_pkey primary key (id),
  constraint booking_treatments_booking_id_fkey foreign KEY (booking_id) references bookings (id) on delete CASCADE,
  constraint booking_treatments_service_id_fkey foreign KEY (service_id) references services (id) on delete CASCADE,
  constraint booking_treatments_status_check check (
    (
      (status)::text = any (
        (
          array[
            'active'::character varying,
            'cancelled'::character varying
          ]
        )::text[]
      )
    )
  )
);

create index IF not exists idx_booking_treatments_booking_id on booking_treatments using btree (booking_id) TABLESPACE pg_default;

create index IF not exists idx_booking_treatments_service_id on booking_treatments using btree (service_id) TABLESPACE pg_default;

create index IF not exists idx_booking_treatments_status on booking_treatments using btree (status) TABLESPACE pg_default;

-- =============================================
-- BOOKINGS TREATMENT ADDONS TABLE
-- =============================================
create table booking_treatment_addons (
  id uuid not null default extensions.uuid_generate_v4 (),
  booking_treatment_id uuid not null,
  name text not null,
  price numeric(10, 2) not null,
  duration integer not null default 0,
  created_at timestamp with time zone null default now(),
  constraint booking_treatment_addons_pkey primary key (id),
  constraint booking_treatment_addons_booking_treatment_id_fkey foreign KEY (booking_treatment_id) references booking_treatments (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_booking_treatment_addons_booking_treatment_id on public.booking_treatment_addons using btree (booking_treatment_id) TABLESPACE pg_default;
-- =============================================
-- WORKSHOP BOOKINGS TABLE
-- =============================================
CREATE TABLE workshop_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  preferred_month TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  participant_phone TEXT,
  notes TEXT NOT NULL DEFAULT '',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'scheduled', 'completed', 'cancelled')),
  payment_intent_id TEXT,
  booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TESTIMONIALS TABLE
-- =============================================
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  service_type TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- LOOKBOOK IMAGES TABLE
-- =============================================
CREATE TABLE lookbook_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  aspect_ratio TEXT DEFAULT '1:1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CONTENT SECTIONS TABLE (For CMS)
-- =============================================
CREATE TABLE content_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_name TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  content_url TEXT NOT NULL,
  content_type TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_appointment_date ON orders(appointment_date);
CREATE INDEX idx_orders_booking_status ON orders(booking_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_service_id ON order_items(service_id);
CREATE INDEX idx_workshop_bookings_workshop_id ON workshop_bookings(workshop_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_workshops_is_active ON workshops(is_active);
CREATE INDEX idx_testimonials_published ON testimonials(is_published);
CREATE INDEX idx_lookbook_position ON lookbook_images(position);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workshops_updated_at BEFORE UPDATE ON workshops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lookbook_updated_at BEFORE UPDATE ON lookbook_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_sections_updated_at BEFORE UPDATE ON content_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workshop_bookings_updated_at BEFORE UPDATE ON workshop_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'PWS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE lookbook_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;

-- Public read access for active services
CREATE POLICY "Public can view active services" ON services
  FOR SELECT USING (is_active = true);

-- Public read access for active workshops
CREATE POLICY "Public can view active workshops" ON workshops
  FOR SELECT USING (is_active = true);

-- Public read access for published testimonials
CREATE POLICY "Public can view published testimonials" ON testimonials
  FOR SELECT USING (is_published = true);

-- Public read access for active lookbook images
CREATE POLICY "Public can view active lookbook images" ON lookbook_images
  FOR SELECT USING (is_active = true);

-- Public read access for active content sections
CREATE POLICY "Public can view active content sections" ON content_sections
  FOR SELECT USING (is_active = true);

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own orders
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Users can view order items for their orders
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id::text = auth.uid()::text
    )
  );

-- Admin policies (You'll need to set up auth.users() properly)
-- For now, allowing service worker/anon key to do admin operations
-- You should restrict this in production with proper authentication

CREATE POLICY "Service role can do anything on users" ON users
  FOR ALL USING (true);

CREATE POLICY "Service role can do anything on services" ON services
  FOR ALL USING (true);

CREATE POLICY "Service role can do anything on workshops" ON workshops
  FOR ALL USING (true);

CREATE POLICY "Service role can do anything on orders" ON orders
  FOR ALL USING (true);

CREATE POLICY "Service role can do anything on order_items" ON order_items
  FOR ALL USING (true);

CREATE POLICY "Service role can do anything on workshop_bookings" ON workshop_bookings
  FOR ALL USING (true);

CREATE POLICY "Service role can do anything on testimonials" ON testimonials
  FOR ALL USING (true);

CREATE POLICY "Service role can do anything on lookbook_images" ON lookbook_images
  FOR ALL USING (true);

CREATE POLICY "Service role can do anything on content_sections" ON content_sections
  FOR ALL USING (true);

-- =============================================
-- SEED DATA
-- =============================================

-- Insert sample services
INSERT INTO services (name, description, duration, price, category_id, is_active, display_order) VALUES
('Classic Manicure', 'Shaping, detailed cuticle care and hydration, finished with a smooth, glossy polish.', 60, 40.00, '<category_id>', true, 1),
('Biab Fresh Set', 'Builder gel strengthens and protects nails before colour.', 90, 60.00, '<category_id>', true, 2),
('Luxury Manicure-gel', 'Shaping, cuticle care, massage and hot cream, finished with long-lasting gel.', 90, 55.00, '<category_id>', true, 3),
('Full Set Gel Extensions', 'Premium gel extensions add natural length and strength, finished with your chosen polish or gel.', 120, 70.00, '<category_id>', true, 4),
('Biab Infill', 'Builder gel is rebalanced and refreshed to maintain strength and growth.', 60, 50.00, '<category_id>', true, 5),
('Gel Manicure', 'Shaping, cuticle care and hydration, finished with long-lasting gel.', 75, 45.00, '<category_id>', true, 6),
('French Finish', 'Classic French tip styling', 15, 10.00, '<category_id>', true, 7),
('Chrome Finish', 'Sleek metallic chrome effect', 15, 10.00, '<category_id>', true, 8),
('Gel Removal (Soak Off)', 'Safe removal of existing gel polish', 20, 10.00, '<category_id>', true, 9);

-- Insert sample admin user
INSERT INTO users (email, full_name, role, phone) VALUES
('admin@pearlwishes.com', 'Pearl Wishes Admin', 'admin', '+44 20 1234 5678');

-- Insert sample workshops
INSERT INTO workshops (title, description, duration, level, class_type, highlights, is_active, display_order) VALUES
(
  'Advanced Refresh Course',
  'For experienced nail artists looking to update their skills and refine modern techniques.',
  '3 sessions · 4 hours each',
  'intermediate_to_advanced',
  'Private or small group (max 3 students)',
  ARRAY['Skill refinement', 'Modern techniques', 'Industry updates', 'Hands-on practice'],
  true,
  1
),
(
  'Complete Nail Course',
  'A full programme for beginners, covering everything from foundation to professional-level skills.',
  '5 sessions · 5 hours each',
  'beginner',
  'Private or small group (max 3 students)',
  ARRAY['Foundation techniques', 'Professional skills', 'Comprehensive training', 'Hands-on practice'],
  true,
  2
);

-- Insert sample testimonials
INSERT INTO testimonials (client_name, rating, comment, service_type, is_featured, is_published) VALUES
('Sophie M.', 5, 'Absolutely wonderful service! The nail technician came right to my home and did an amazing gel manicure. So convenient and professional.', 'Gel Manicure', true, true),
('Emma L.', 5, 'I love Pearl Wishes! The quality is salon-level but in the comfort of my own home. My nails have never looked better.', 'Luxury Spa Manicure', true, true),
('Charlotte B.', 5, 'The attention to detail is incredible. Beautiful nail art and such a relaxing experience. Highly recommend!', 'Nail Art', true, true);

-- Insert sample content sections
INSERT INTO content_sections (section_name, title, subtitle, description) VALUES
('hero', 'Luxury Nail Care at Your Doorstep', 'London''s Premier Mobile Nail Service', 'Experience salon-quality treatments in the comfort of your home'),
('about', 'About Pearl Wishes Studio', 'Bringing Beauty to You', 'We are London''s leading mobile nail care service, offering luxury treatments at your convenience.'),
('booking', 'Book Your Appointment', 'Reserve Your Pampering Session', 'Choose your services and preferred time - we''ll come to you');

-- Success message
SELECT 'Pearl Wishes Studio database setup complete!' AS message;