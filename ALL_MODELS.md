# All Models — Legal Services Marketplace

## Tech Stack
- **Runtime:** Node.js (Express.js)
- **Database:** MongoDB (Mongoose ODM)

---

## 1. User — `users.model.js`

**Collection:** `users`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `email` | String | required, unique, lowercase, trim | — |
| `password` | String | required, minlength 6, select:false | — |
| `role` | String | enum: client/lawyer/admin | `'client'` |
| `full_name` | String | required, trim, maxlength 100 | — |
| `phone` | String | required, unique, trim | — |
| `city` | String | trim | — |
| `address` | String | trim | — |
| `bio` | String | trim, maxlength 1000 | — |
| `profile_photo` | String | — | `null` |
| `is_verified` | Boolean | — | `false` |
| `is_banned` | Boolean | — | `false` |
| `emailVerificationToken` | String | select:false | — |
| `emailVerificationExpires` | Date | select:false | — |
| `passwordResetToken` | String | select:false | — |
| `passwordResetExpires` | Date | select:false | — |
| `lastLogin` | Date | — | `null` |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

**Indexes:**
- `{ role: 1 }`
- `{ is_banned: 1 }`
- `{ created_at: -1 }`

**Methods:**
- `comparePassword(candidatePassword)` — bcrypt compare
- `toJSON()` — removes password, tokens, `__v`

---

## 2. Lawyer — `lawyers.model.js`

**Collection:** `lawyers`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `user` | ObjectId | ref: User, required, unique | — |
| `specialization` | String | required, trim | — |
| `years_of_experience` | Number | min 0 | `0` |
| `office_address` | String | trim | — |
| `availability_status` | Boolean | — | `true` |
| `rate` | Number | min 0 | `0` |
| `total_reviews` | Number | min 0 | `0` |
| `offers_count` | Number | min 0 | `0` |
| `subscription_id` | ObjectId | ref: Subscription | `null` |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

**Indexes:**
- `{ availability_status: 1 }`
- `{ specialization: 1 }`
- `{ rate: -1 }`
- `{ total_reviews: -1 }`

---

## 3. Client — `clients.model.js`

**Collection:** `clients`

| Field | Type | Constraints |
|-------|------|-------------|
| `user` | ObjectId | ref: User, required, unique |
| `created_at` | Date | auto (timestamps) |
| `updated_at` | Date | auto (timestamps) |

---

## 4. Case — `cases.model.js`

**Collection:** `cases`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `client` | ObjectId | ref: Client, required | — |
| `lawyer` | ObjectId | ref: Lawyer | `null` |
| `accepted_offer_id` | ObjectId | ref: Offer | `null` |
| `category` | ObjectId | ref: Category, required | — |
| `title` | String | required, trim, maxlength 200 | — |
| `description` | String | required, maxlength 5000 | — |
| `city` | String | required, trim | — |
| `status` | String | enum: open/in_progress/completed/cancelled | `'open'` |
| `budget` | Number | min 2000 | — |
| `offers_count` | Number | min 0 | `0` |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

**Indexes:**
- `{ status: 1 }`
- `{ category: 1 }`
- `{ client: 1 }`
- `{ lawyer: 1 }`
- `{ created_at: -1 }`
- Text index: `{ title: 'text', description: 'text' }`

---

## 5. Offer — `offers.model.js`

**Collection:** `offers`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `lawyer` | ObjectId | ref: Lawyer, required | — |
| `case` | ObjectId | ref: Case, required | — |
| `price` | Number | required, min 0 | — |
| `delivery_time` | Number | min 1 | — |
| `message` | String | required, trim, maxlength 1000 | — |
| `status` | String | enum: pending/accepted/rejected | `'pending'` |
| `applied_at` | Date | — | `Date.now` |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

**Indexes:**
- `{ case: 1 }`
- `{ lawyer: 1 }`
- `{ status: 1 }`
- `{ applied_at: -1 }`
- **Unique compound:** `{ case: 1, lawyer: 1 }`

---

## 6. Message — `messages.model.js`

**Collection:** `messages`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `sender_id` | ObjectId | ref: User, required | — |
| `receiver_id` | ObjectId | ref: User, required | — |
| `case_id` | ObjectId | ref: Case, required | — |
| `message` | String | required, trim, maxlength 5000 | — |
| `is_read` | Boolean | — | `false` |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

**Indexes:**
- `{ case_id: 1, created_at: -1 }`
- `{ sender_id: 1 }`
- `{ receiver_id: 1 }`
- `{ sender_id: 1, receiver_id: 1 }`

---

## 7. Review — `reviews.model.js`

**Collection:** `reviews`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `reviewer` | ObjectId | ref: Client, required | — |
| `lawyer_reviewed` | ObjectId | ref: Lawyer, required | — |
| `case` | ObjectId | ref: Case, required | — |
| `rating` | Number | required, min 1, max 5 | — |
| `comment` | String | required, trim, maxlength 1000 | — |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

**Indexes:**
- **Unique compound:** `{ reviewer: 1, case: 1 }`
- `{ lawyer_reviewed: 1 }`
- `{ case: 1 }`

---

## 8. Invoice — `invoices.model.js`

**Collection:** `invoices`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `lawyer` | ObjectId | ref: Lawyer, required | — |
| `case` | ObjectId | ref: Case, required | — |
| `status` | String | enum: pending/paid/cancelled | `'pending'` |
| `value` | Number | required, min 0 | — |
| `paid_at` | Date | — | `null` |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

**Indexes:**
- `{ lawyer: 1 }`
- `{ case: 1 }`
- `{ status: 1 }`

---

## 9. Notification — `notifications.model.js`

**Collection:** `notifications`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `user` | ObjectId | ref: User, required | — |
| `type` | String | enum: offer_received/offer_accepted/new_message/review_added, required | — |
| `content` | String | required | — |
| `is_read` | Boolean | — | `false` |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

**Indexes:**
- `{ user: 1, is_read: 1 }`
- `{ created_at: -1 }`

---

## 10. Category — `categories.model.js`

**Collection:** `categories`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `name` | String | required, unique, trim | — |
| `description` | String | trim | `''` |
| `icon` | String | trim | `''` |
| `is_active` | Boolean | — | `true` |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

---

## 11. Payout — `payouts.model.js`

**Collection:** `payouts`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `invoice` | ObjectId | ref: Invoice, required | — |
| `lawyer` | ObjectId | ref: Lawyer, required | — |
| `amount` | Number | required | — |
| `currency` | String | — | `'USD'` |
| `method` | String | enum: paypal/bank_transfer/stripe, required | — |
| `status` | String | enum: pending/processing/completed/failed | `'pending'` |
| `providerRef` | String | — | — |
| `requestedAt` | Date | — | `Date.now` |
| `settledAt` | Date | — | — |
| `failureReason` | String | — | — |
| `createdAt` | Date | auto (timestamps) | — |
| `updatedAt` | Date | auto (timestamps) | — |

**Indexes:**
- `{ lawyer: 1 }`
- `{ invoice: 1 }`
- `{ status: 1 }`

---

## 12. Subscription — `subscriptions.model.js`

**Collection:** `subscriptions`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `lawyer` | ObjectId | ref: Lawyer, required | — |
| `amount` | Number | required, min 0 | — |
| `subscription_status` | String | enum: subscribed/expired/cancelled | `'subscribed'` |
| `subscription_expires_at` | Date | — | `null` |
| `paid_at` | Date | — | `Date.now` |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

**Indexes:**
- `{ lawyer: 1 }`
- `{ subscription_status: 1 }`

---

## 13. File — `files.model.js`

**Collection:** `files`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `uploaded_by` | ObjectId | ref: User, required | — |
| `case` | ObjectId | ref: Case | `null` |
| `file_url` | String | required | — |
| `file_type` | String | required | — |
| `related_type` | String | enum: case/verification/profile, required | — |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

**Indexes:**
- `{ uploaded_by: 1 }`
- `{ case: 1 }`
- `{ related_type: 1 }`

---

## 14. FavoriteLawyer — `favorite_lawyers.model.js`

**Collection:** `favorite_lawyers`

| Field | Type | Constraints |
|-------|------|-------------|
| `client` | ObjectId | ref: Client, required |
| `lawyer` | ObjectId | ref: Lawyer, required |
| `created_at` | Date | auto (timestamps) |
| `updated_at` | Date | auto (timestamps) |

**Indexes:**
- `{ client: 1 }`
- `{ lawyer: 1 }`
- **Unique compound:** `{ client: 1, lawyer: 1 }`

---

## 15. LawyerVerification — `lawyers_verifications.model.js`

**Collection:** `lawyers_verifications`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `lawyer` | ObjectId | ref: Lawyer, required, unique | — |
| `national_id_photo` | String | required | — |
| `lawyer_license_photo` | String | required | — |
| `status` | String | enum: pending/accepted/rejected | `'pending'` |
| `reviewed_by` | ObjectId | ref: User | `null` |
| `created_at` | Date | auto (timestamps) | — |
| `updated_at` | Date | auto (timestamps) | — |

**Indexes:**
- `{ lawyer: 1 }` (unique)
- `{ status: 1 }`

---

## 16. RefreshToken — `refresh-tokens.model.js`

**Collection:** `refreshtokens`

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `user` | ObjectId | ref: User, required | — |
| `token` | String | required, unique | — |
| `expiresAt` | Date | required | — |
| `isRevoked` | Boolean | — | `false` |
| `userAgent` | String | — | `'unknown'` |
| `ipAddress` | String | — | `'unknown'` |
| `createdAt` | Date | auto (timestamps) | — |
| `updatedAt` | Date | auto (timestamps) | — |

**Indexes:**
- `{ user: 1 }`
- `{ expiresAt: 1 }` (TTL index — auto-deletes expired tokens)

---

## Entity Relationships

```
User (1) ── (1) Lawyer                  [1:1 via user field]
User (1) ── (1) Client                  [1:1 via user field]
User (1) ── (*) Message (sender)        [1:N via sender_id]
User (1) ── (*) Message (receiver)      [1:N via receiver_id]
User (1) ── (*) Notification            [1:N via user field]
User (1) ── (*) RefreshToken            [1:N via user field]
User (1) ── (*) File                    [1:N via uploaded_by]

Lawyer (1) ── (*) Case                  [1:N via lawyer field]
Lawyer (1) ── (*) Offer                 [1:N via lawyer field]
Lawyer (1) ── (*) Review                [1:N via lawyer_reviewed]
Lawyer (1) ── (*) Invoice               [1:N via lawyer field]
Lawyer (1) ── (*) Payout                [1:N via lawyer field]
Lawyer (1) ── (1) Subscription          [1:1 via subscription_id]
Lawyer (1) ── (1) LawyerVerification    [1:1 via lawyer field]
Lawyer (1) ── (*) FavoriteLawyer        [1:N via lawyer field]

Client (1) ── (*) Case                  [1:N via client field]
Client (1) ── (*) Review                [1:N via reviewer field]
Client (1) ── (*) FavoriteLawyer        [1:N via client field]

Case (1) ── (1) Category                [N:1 via category field]
Case (1) ── (*) Offer                   [1:N via case field]
Case (1) ── (*) Message                 [1:N via case_id]
Case (1) ── (*) Review                  [1:N via case field]
Case (1) ── (*) Invoice                 [1:N via case field]
Case (1) ── (*) File                    [1:N via case field]

Invoice (1) ── (0..1) Payout            [1:1 via invoice field]
```
