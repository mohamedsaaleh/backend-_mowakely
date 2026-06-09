# Mowakely API - Postman Collection

## Overview

This Postman collection contains all **150+ API endpoints** for the Mowakely legal marketplace platform, generated directly from the source code.

## Setup

1. **Import** both `collection.json` and `environment.json` into Postman
2. **Select** the "Mowakely - Local" environment from the dropdown
3. **Update** `baseUrl` in the environment if your server runs on a different port/host:
   - Default: `http://localhost:3000/api`
   - The server port defaults to `3000` unless `PORT` env var is set

## Authentication Flow

### For regular users (client, lawyer):
1. Send **Register** or **Login** request
2. The test script auto-saves the JWT to `{{token}}`
3. All protected routes use `{{token}}` in the `Authorization: Bearer` header

### For admin routes:
- Log in with admin credentials
- Manually copy the token to the `adminToken` environment variable

### For superadmin routes:
- Log in with superadmin credentials
- Manually copy the token to the `superadminToken` environment variable

> **Note:** The `superadmin` role bypasses ALL role checks.

## Roles & Access

| Role | Access |
|------|--------|
| **client** | Create/manage own cases, review lawyers, send messages, accept/reject offers |
| **lawyer** | Browse cases, make offers, manage profile, request payouts, send messages |
| **admin** | Full admin dashboard, manage users/lawyers/cases/categories, manage invoices/payouts |
| **superadmin** | Full system access, manage admins, change roles, ban/unban, manage reviews/offers/categories |

## Collection Variables

| Variable | Auto-Populated? | Description |
|----------|----------------|-------------|
| `token` | Yes (login/register) | Regular user JWT |
| `adminToken` | No (manual) | Admin JWT |
| `superadminToken` | No (manual) | Superadmin JWT |
| `userId` | Partial | User document ID |
| `caseId` | Partial | Case document ID |
| `offerId` | No | Offer document ID |
| `categoryId` | No | Category document ID |
| `lawyerId` | No | Lawyer profile ID |
| `clientId` | No | Client profile ID |
| `invoiceId` | No | Invoice document ID |
| `messageId` | No | Message/Notification ID |
| `payoutId` | No | Payout document ID |
| `reviewId` | No | Review document ID |
| `transactionId` | No | Payment transaction ID |

## Endpoint Modules

| Module | Endpoints | Auth Required |
|--------|-----------|--------------|
| Auth | 8 | Mixed (register/login = public) |
| Categories | 5 | Mixed (GET = public, POST/PATCH/DELETE = admin) |
| Cases | 8 | Mixed (GET = public, POST/PATCH/DELETE = varies) |
| Offers | 7 | Mixed (public GET, create = lawyer, etc.) |
| Messages | 3 | Yes (client/lawyer/admin) |
| Reviews | 4 | Mixed (public GET by lawyer, POST = client, admin = admin) |
| Invoices | 5 | Yes (varies by role) |
| Lawyers | 7 | Mixed (GET = public, PATCH = lawyer, admin = admin) |
| Clients | 7 | Mixed (me = client, admin = admin) |
| Users | 4 | Yes (varies by role) |
| Payments | 4 | Mixed (create = client, webhook = public) |
| Payouts | 4 | Mixed (lawyer = create/my, admin = get/update) |
| Notifications | 5 | Yes (client/lawyer/admin) |
| Admin | 26 | Yes (admin/superadmin) |
| Superadmin | 47 | Yes (superadmin only) |
| Health | 5 | No (public) |
| **Total** | **149** | |

## Response Format

All responses follow a consistent format:

```json
// Success (single entity)
{ "success": true, "data": { ... } }

// Success (collection with pagination)
{ "success": true, "results": [...], "pagination": { "page": 1, "limit": 20, "total": 100 } }

// Validation Error
{ "success": false, "message": "Validation error", "errors": [{ "field": "email", "message": "Email is required" }] }

// Auth Error
{ "success": false, "message": "You are not logged in" }

// Server Error
{ "success": false, "message": "..." }
```

## Environment Variables (Server)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/legal_marketplace` | Database connection |
| `JWT_SECRET` | (fallback) | JWT signing key |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `UPLOAD_PATH` | `./uploads` | File upload directory |
| `MAX_FILE_SIZE` | `10485760` | 10 MB upload limit |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP server |
| `EMAIL_USER` | (empty) | SMTP username |
| `EMAIL_PASS` | (empty) | SMTP password |
| `PAYMOB_API_KEY` | (empty) | Paymob payment API key |
| `PAYMOB_INTEGRATION_ID` | (empty) | Paymob integration ID |
| `PAYMOB_IFRAME_ID` | (empty) | Paymob iframe ID |
| `PAYMOB_HMAC_SECRET` | (empty) | Paymob HMAC secret |

## Known Inconsistencies

1. **Profile module does not exist** - `src/modules/profile/` is absent. Profile functionality is handled via `GET /api/auth/me` instead.

2. **Missing validation files (7 modules)** - These modules have no `*.validation.js` file:
   - Messages, Reviews, Invoices, Lawyers, Clients, Payouts, Users
   - Messages, Reviews, and Clients define Joi schemas inline in their route files
   - Invoices, Lawyers, Payouts, Users have **no Joi validation at all**

3. **Case validation differences**:
   - Public `cases.validation.js`: `title` min 5, `description` min 20, `budget` min 2000
   - Admin `admin.validation.js`: `title` min 3, `description` min 10, `budget` min 0
   - Superadmin `superadmin.validation.js`: `title` min 3, `description` min 10, `budget` min 0, plus `priority` and extended `status`

4. **Category field naming inconsistency**: Admin uses `is_active` (snake_case) while Superadmin uses `isActive` (camelCase) for the same field.

5. **Response helper inconsistency**: The `users` module uses `successResponse()`/`errorResponse()` helpers from `utils/apiResponse`, while all other modules return `{ success, data }` directly.

6. **Admin create-admin route**: Requires `superadmin` authorization (via a second `authorize('superadmin')` call) despite being mounted under admin routes.

7. **Message routes use `mergeParams: true`**: The message router is mounted with `mergeParams`, allowing route handlers to read `caseId` from `req.params` or `req.query` interchangeably.

8. **Webhook returns raw result**: `payments.webhook` is the only handler that returns the service result unwrapped (`res.json(result)` instead of `{ success, data }`).

## Rate Limiting

- General API: **100 requests per 15 minutes**
- Auth routes: **20 requests per 15 minutes**
