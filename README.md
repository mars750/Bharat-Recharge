# BharatRecharge - Jio & Airtel Instant Mobile Recharge Engine

A production-grade Indian mobile recharge platform for **Reliance Jio** and **Bharti Airtel** built with React 19, TypeScript, Tailwind CSS, Express, and dynamic NPCI UPI 2.0 QR payments with cryptographic server-side verification.

---

## 🚀 Key Highlights & Architectural Guarantees

1. **User Flow**:
   `Home → Select Jio/Airtel → Select Plan (from DB) → Enter 10-Digit Mobile → Order Summary → ₹5 Backend Discount → Dynamic UPI QR Payment → Server-side HMAC Verification → Telecom Gateway Recharge → Success Receipt / Refund Queue`
2. **Server-Side Price & Discount Enforcement**:
   - The ₹5 discount is calculated strictly on the backend. The frontend price is never trusted.
   - Example: **₹299 Plan** → **₹5 Instant Discount** → **Customer Pays ₹294.00**.
   - The telecom operator API is sent the full **₹299** recharge plan value.
3. **Dynamic UPI QR & Direct Intent with Custom Payee UPI ID**:
   - Generates exact-amount dynamic UPI QR codes (`upi://pay?pa=YOUR_UPI_ID&am=294.00&tr=...`) with 10-minute expiry countdown.
   - Configure or change your receiving UPI ID directly in the **Navbar**, on the **Mobile Number / Order Summary step**, or directly on the **Payment Screen** with 1-click dynamic QR regeneration.
   - 1-click UPI Intent deep links for Google Pay, PhonePe, Paytm, CRED, and BHIM all pre-filled with the exact Final Payable Amount and your UPI ID.
4. **Zero-Trust Server-Side Payment Verification**:
   - Never marks payment successful from client state, screenshots, or unverified inputs.
   - Webhook pipeline (`POST /api/payments/webhook`):
     - **HMAC-SHA256 Signature Verification** (`x-webhook-signature`)
     - **Idempotency Check** to prevent double charges and duplicate recharges
     - **Order Existence & State Check**
     - **Strict Amount Verification** (received amount must strictly equal `payable_amount` ₹294)
5. **UTR Submission & Duplicate Prevention**:
   - Users can submit 12-digit UPI Bank Reference Numbers (UTR / RRN).
   - Submissions remain `PENDING` until verified via merchant bank statement or admin approval.
   - Prevents duplicate UTR submissions across orders.
6. **RechargeProvider Interface & Pluggability**:
   - `RechargeProvider` interface with `getPlans()`, `createRecharge()`, `checkRechargeStatus()`.
   - `MockRechargeProvider` for sandbox telecom switch simulation.
   - `AuthorizedApiRechargeProvider` for real carrier APIs (RoundPay, CyberPlate, Lapu).
   - Only recharges after verified payment. If recharge fails: transitions to `RECHARGE_FAILED` → `REFUND_PENDING`.
7. **Comprehensive Admin Dashboard**:
   - Live metrics: Revenue, Discounts Given, Recharges Delivered, Pending UTRs.
   - Orders list with search and operator filters.
   - One-Click UTR Verification queue (approves UTR and triggers payment success + recharge).
   - Plans Management: Add, edit, or disable Jio and Airtel plans.
   - System Settings: Configure discount amount (default ₹5), toggle mock payment/recharge modes, and set simulated failure rate.
   - Audit Logs: Tamper-evident security trail.
8. **Automated E2E Test Suite**:
   - Built-in visual test runner with 7 automated tests covering all edge cases (Jio flow, Airtel UTR flow, Duplicate UTR rejection, Webhook idempotency, Wrong amount rejection, Failed payment, Telecom failure & refund queue).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express, TSX
- **Database**: ACID-like transactional atomic JSON engine with relational tables and disk persistence
- **Security**: HMAC-SHA256 cryptographic signatures, constant-time buffer comparison, Indian mobile regex validation (`^[6-9]\d{9}$`), rate-limiting, and audit logs
- **QR Generation**: High-resolution NPCI dynamic QR code generator

---

## 🗄️ Database Tables Schema

| Table Name | Description |
|---|---|
| `operators` | Jio and Airtel brand assets, colors, and availability |
| `recharge_plans` | Plans with category, price, validity, data, voice, SMS, and benefits |
| `orders` | `order_id`, `mobile_number`, `operator`, `plan_id`, `plan_price`, `discount`, `payable_amount`, `payment_status`, `recharge_status` |
| `payments` | Dynamic payment attempts, UPI VPAs, QR data, intent URLs, and verification timestamps |
| `recharge_transactions` | Telecom switch transactions with operator reference IDs and response messages |
| `utr_submissions` | Customer submitted 12-digit UTRs with status (`PENDING`, `VERIFIED`, `REJECTED`) |
| `webhook_events` | Raw and verified webhook payloads with HMAC signatures and idempotency keys |
| `audit_logs` | Audit trail of all orders, payments, admin actions, and plan updates |
| `admins` | Administrative users with hashed credentials |
| `users` | User registry tracked by verified mobile numbers |
| `settings` | Global system settings (discount amount, mock modes, failure simulation rate) |

---

## 📡 API Endpoints

### Public Endpoints
- `GET /api/operators` - List active telecom operators (Jio & Airtel)
- `GET /api/plans/:operator` - Get database plans with current active backend discount
- `POST /api/orders` - Validate Indian mobile & plan, compute backend ₹5 discount, create order
- `POST /api/payments/create` - Generate dynamic UPI QR code & intent URI for exact payable amount
- `GET /api/payments/status/:orderId` - Real-time polling endpoint for payment & recharge status
- `POST /api/payments/webhook` - HMAC-SHA256 verified payment gateway webhook with idempotency
- `POST /api/utr/submit` - Submit 12-digit UTR (sets status to PENDING; prevents duplicate UTR)
- `GET /api/orders` - Filter orders by mobile number or view recent orders
- `GET /api/orders/:id` - Full breakdown of an order, payment, and carrier reference
- `GET /api/recharge/status/:id` - Check telecom carrier status

### Admin Endpoints (Protected by Bearer Token)
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/dashboard-stats` - Revenue, orders, discounts, and pending UTR counts
- `GET /api/admin/orders` - Search and filter all customer orders
- `GET /api/admin/payments` - Gateway transactions log
- `GET /api/admin/utr-submissions` - Customer UTR queue
- `POST /api/admin/utr/verify` - Manually verify UTR; marks payment SUCCESS & triggers recharge
- `POST /api/admin/utr/reject` - Reject UTR with reason
- `GET /api/admin/plans` - List all plans
- `POST /api/admin/plans` - Create new recharge plan
- `PUT /api/admin/plans/:id` - Update existing plan
- `DELETE /api/admin/plans/:id` - Soft-delete / deactivate plan
- `GET /api/admin/settings` - Read discount amount & mock configuration
- `POST /api/admin/settings` - Update discount amount & mock configuration
- `GET /api/admin/audit-logs` - Retrieve security audit trail

### Sandbox Simulator Endpoint
- `POST /api/simulate/payment-webhook` - Simulates webhook scenarios (`SUCCESS`, `FAILED`, `DUPLICATE`, `WRONG_AMOUNT`) for instant testing.

---

## 🔐 Admin Credentials

- **Email**: `admin@recharge.in`
- **Password**: `Admin@123`
*(Pre-filled in the Admin sign-in screen for convenient evaluation)*

---

## 💻 Setup & Development Instructions

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Start Development Server
```bash
npm run dev
```
The full-stack application will launch on **http://localhost:3000** with Express API routes mounted under `/api` and Vite frontend middlewares serving the client.

### 3. Production Build
```bash
npm run build
npm start
```

### 4. Running the E2E Test Runner
Click the **"E2E Test Runner"** button in the top navigation bar or the footer link, then click **"Run All 7 Tests"** to automatically execute:
1. Complete Jio ₹299 flow (checks ₹294 payable, dynamic QR, webhook verification, and ₹299 recharge)
2. Airtel ₹349 flow with UTR submission and Admin verification
3. Duplicate UTR prevention check (409 Conflict)
4. Duplicate webhook idempotency check
5. Wrong amount webhook rejection (tampered ₹200 for ₹294 order rejected)
6. Failed bank payment handling
7. Telecom gateway timeout handling & refund queueing
