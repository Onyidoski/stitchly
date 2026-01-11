Product Requirements Document (PRD)

Project Name: Fashion Designer Client & Order Management System


Product Name: Stitchly

Version: 1.0

Author: AC CREATIVE

Date: 2025-12-23

Purpose:
Build a web-based system for fashion designers to manage clients, measurements, orders, payments, and generate branded invoices and receipts. The system will store images and PDFs in Cloudflare R2 and use Supabase for authentication and database management. The system should be mobile-first, easy to use, and scalable for future growth.

⸻

1. Objectives
	•	Centralize client information, measurements, and orders in one system
	•	Reduce manual record-keeping errors
	•	Provide a professional experience for clients through branded invoices/receipts
	•	Enable mobile-first access with a web app that feels like an app
	•	Ensure scalability for multiple designers or future white-label functionality

⸻

2. Users & Personas

Primary User (Fashion Designer)
	•	Role: Admin / Owner of the designer business
	•	Needs:
	•	Add and manage clients and measurements
	•	Track order progress
	•	Record payments
	•	Generate invoices/receipts
	•	Access from mobile and desktop

Secondary User (Client)
	•	Role: Optional future access
	•	Needs:
	•	View order status
	•	Receive invoices/receipts

⸻

3. Features

3.1 Authentication & User Management
	•	Sign-Up Page: Email, password, business name
	•	Login Page: Email + password
	•	Password reset via email
	•	User session management
	•	Supabase Auth used

⸻

3.2 Tenant / Workspace Management
	•	Each user/designer has a private workspace
	•	Data isolation per tenant
	•	Future-proof for white-labeling

⸻

3.3 Client Management
	•	Add/edit/delete client profiles
	•	Fields: Name, phone number, gender, notes
	•	Store multiple measurements per client
	•	Ability to search clients quickly

⸻

3.4 Measurements Management
	•	Standard fields: Chest, Waist, Hip, Shoulder, Sleeve, Length
	•	Notes field for custom measurements
	•	Measurements reusable across orders

⸻

3.5 Order Management
	•	Create/edit/delete orders per client
	•	Fields: Style reference image(s), fabric description, color, quantity, delivery date, order status
	•	Status workflow: Cutting → Sewing → Fitting → Ready
	•	Link orders to client and tenant
	•	Notifications/reminders (optional)

⸻

3.6 Payment Tracking
	•	Record payments per order: total, paid, balance
	•	Track payment method
	•	Display unpaid orders prominently

⸻

3.7 Invoice & Receipt Generation
	•	Generate PDF invoices & receipts automatically
	•	Include: Business name, logo, client name, order details, amount, payment status
	•	Downloadable or shareable via link
	•	Branded per designer

⸻

3.8 File Upload & Storage
	•	Upload style images and PDFs
	•	Client-side compression to reduce file size (~200–600KB)
	•	Store in Cloudflare R2
	•	Supabase stores file URLs
	•	Support signed URLs for security

⸻

3.9 Dashboard
	•	Show upcoming delivery dates
	•	Show pending orders and unpaid invoices
	•	Quick access to recent clients

⸻

3.10 Responsive & Mobile-First
	•	Optimized for mobile web
	•	Add to Home Screen functionality (PWA)
	•	Minimalistic UI for fast navigation

⸻

3.11 Push Notifications (MVP)
	•	Notify the designer for important events:
	•	New orders created
	•	Orders due soon
	•	Payment status updates (paid/unpaid)
	•	Upcoming deliveries
	•	Implemented via web push notifications using browser service workers
	•	Works on desktop and Android (iOS support limited initially)
	•	Designer must grant permission to receive notifications
	•	Optional: notifications link directly to relevant order in the app

4. Technical Requirements

4.1 Frontend
	•	Framework: Next.js
	•	Styling: Tailwind CSS
	•	Image compression: browser-image-compression or Canvas API
	•	PDF generation: jsPDF or PDFKit

4.2 Backend
	•	Supabase: Auth, Database, API endpoints
	•	Cloudflare R2: File storage

4.3 Database Schema (Supabase)
	•	Tenants Table: id, business_name, logo_url, primary_color, secondary_color, created_at
	•	Users Table: id, tenant_id, name, email, role
	•	Clients Table: id, tenant_id, name, phone, gender, notes
	•	Measurements Table: id, client_id, chest, waist, hip, shoulder, sleeve, length, notes
	•	Orders Table: id, tenant_id, client_id, style_image_url(s), fabric, color, quantity, delivery_date, status, payment_status, total_amount, paid_amount
	•	Invoices Table: id, tenant_id, order_id, pdf_url, created_at

⸻

4.4 Storage Strategy
	•	Images & PDFs stored in Cloudflare R2
	•	Signed URLs for secure access
	•	File size limits: compress client-side
	•	Max 5 images per order

⸻

4.5 Security
	•	Row-Level Security (RLS) for Supabase
	•	Tenant isolation
	•	Passwords encrypted by Supabase
	•	Signed URLs for secure file access

⸻

5. Constraints
	•	Free-tier Supabase: 500MB DB, 1GB storage → images stored in Cloudflare R2
	•	Cloudflare R2 free-tier: 10GB per month, monthly reset
	•	Mobile-first, but web browser based
	•	No social login initially

⸻

6. Success Metrics
	•	Designer can add client + measurements in <1 minute
	•	Orders created with images & payment tracking in <2 minutes
	•	PDF invoice generation <5 seconds per order
	•	App load <3 seconds on mobile devices
	•	All images compressed to ≤600KB

⸻

7. MVP Scope
	•	Sign-Up / Login / Auth
	•	Client & Measurements management
	•	Order management with status
	•	Payment tracking
	•	Invoice & receipt PDF generation
	•	Upload & compress images → Cloudflare R2
	•	Dashboard showing upcoming deliveries and unpaid orders

⸻

8. Future Enhancements (Post-MVP)
	•	Multi-designer white-label support
	•	Staff accounts & roles
	•	Inventory tracking
	•	Analytics dashboard
	•	Optional client portal

⸻

9. Wireframes / UI Flow

(High-level description — you can later add visual wireframes)
	1.	Sign-Up → Login → Dashboard
	2.	Dashboard → Quick links to Clients / Orders / Payments
	3.	Client page → Add/Edit measurements → Link to orders
	4.	Order page → Upload style images → Generate invoice/receipt
	5.	Payments → Record / View unpaid

