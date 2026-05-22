# Postman Testing Guide

## الملفات المضافة

- [postman/Legal_Services_Marketplace.postman_collection.json](/abs/path/c:/Users/Admin/Desktop/Backend-finall2/postman/Legal_Services_Marketplace.postman_collection.json)
- [postman/Legal_Services_Marketplace.postman_environment.json](/abs/path/c:/Users/Admin/Desktop/Backend-finall2/postman/Legal_Services_Marketplace.postman_environment.json)

---

## Structure الكوليكشن على Postman

الـ collection متقسمة بالشكل التالي:

```text
Legal Services Marketplace API
├── Health
│   ├── GET /
│   ├── GET /api/health
│   ├── GET /api/health/ready
│   ├── GET /api/health/live
│   ├── GET /api/health/detailed
│   └── GET /api-docs.json
├── Auth
│   ├── POST /api/auth/register (Admin)
│   ├── POST /api/auth/login (Admin)
│   ├── POST /api/auth/register (Client)
│   ├── POST /api/auth/login (Client)
│   ├── POST /api/auth/register (Lawyer)
│   ├── POST /api/auth/login (Lawyer)
│   ├── POST /api/auth/refresh
│   ├── GET /api/auth/me
│   ├── POST /api/auth/forgot-password
│   ├── GET /api/auth/verify-email/:token
│   ├── POST /api/auth/reset-password/:token
│   └── POST /api/auth/logout
├── Categories
│   ├── GET /api/categories
│   ├── GET /api/categories/:id
│   ├── POST /api/categories
│   ├── PATCH /api/categories/:id
│   └── DELETE /api/categories/:id
├── Cases
│   ├── GET /api/cases
│   ├── GET /api/cases?search=...
│   ├── POST /api/cases
│   ├── GET /api/cases/my-cases
│   ├── GET /api/cases/lawyer-cases
│   ├── GET /api/cases/:id
│   ├── PATCH /api/cases/:id
│   ├── PATCH /api/cases/:id/status
│   └── DELETE /api/cases/:id
├── Offers
│   ├── POST /api/offers
│   ├── GET /api/offers/my-offers
│   ├── GET /api/offers/case/:caseId
│   ├── PATCH /api/offers/:id/accept
│   ├── PATCH /api/offers/:id/reject
│   └── DELETE /api/offers/:id
├── Lawyers
│   ├── GET /api/lawyers
│   ├── GET /api/lawyers?search=...
│   ├── GET /api/lawyers/me
│   ├── PATCH /api/lawyers/me
│   └── GET /api/lawyers/:id
├── Clients
│   ├── GET /api/clients/me
│   └── PATCH /api/clients/me
├── Notifications
│   ├── GET /api/notifications
│   ├── PATCH /api/notifications/:id/read
│   ├── PATCH /api/notifications/read-all
│   └── DELETE /api/notifications/:id
├── Reviews
│   ├── POST /api/reviews
│   └── GET /api/reviews/lawyer/:lawyerId
├── Invoices
│   ├── POST /api/invoices
│   ├── GET /api/invoices/my-invoices
│   ├── GET /api/invoices/lawyer-invoices
│   ├── GET /api/invoices/:id
│   └── PATCH /api/invoices/:id/pay
├── Payouts
│   ├── POST /api/payouts
│   ├── GET /api/payouts/my-payouts
│   ├── GET /api/payouts
│   └── PATCH /api/payouts/:id/status
├── Admin
│   ├── GET /api/admin/dashboard
│   ├── GET /api/admin/users
│   ├── GET /api/admin/lawyers
│   ├── PATCH /api/admin/lawyers/:id/verify
│   └── PATCH /api/admin/users/:id/ban
├── Users
│   ├── GET /api/users
│   ├── GET /api/users/:id
│   ├── PATCH /api/users/:id
│   └── DELETE /api/users/:id
└── Messages
    ├── GET /api/messages
    ├── POST /api/messages
    └── GET /api/messages/unread
```

---

## الـ Endpoints اللي هتتعمل عليها Test

فيما يلي قائمة الـ endpoints الموجودة في الـ collection والجاهزة للاختبار:

### Health

- `GET /`
- `GET /api/health`
- `GET /api/health/ready`
- `GET /api/health/live`
- `GET /api/health/detailed`
- `GET /api-docs.json`

### Auth

- `POST /api/auth/register`
```json
{
  "full_name": "Postman User",
  "email": "user@example.com",
  "password": "Test@123456",
  "role": "client",
  "phone": "+15550000000",
  "city": "Cairo",
  "address": "Test Address"
}
```

- `POST /api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "Test@123456"
}
```

- `POST /api/auth/refresh`
```json
{
  "refreshToken": "{{clientRefreshToken}}"
}
```

- `POST /api/auth/logout`
```json
{
  "refreshToken": "{{clientRefreshToken}}"
}
```

- `GET /api/auth/verify-email/:token`
- لا يحتاج `body`

- `POST /api/auth/forgot-password`
```json
{
  "email": "user@example.com"
}
```

- `POST /api/auth/reset-password/:token`
```json
{
  "password": "Test@123456"
}
```

- `GET /api/auth/me`
- لا يحتاج `body`

### Categories

- `GET /api/categories`
- لا يحتاج `body`

- `GET /api/categories/:id`
- لا يحتاج `body`

- `POST /api/categories`
```json
{
  "name": "FAMILY_LAW",
  "description": "Family law category",
  "icon": "gavel"
}
```

- `PATCH /api/categories/:id`
```json
{
  "name": "FAMILY_LAW_UPDATED",
  "description": "Updated family law category",
  "icon": "balance"
}
```

- `DELETE /api/categories/:id`
- لا يحتاج `body`

### Cases

- `POST /api/cases`
```json
{
  "title": "Need family law consultation",
  "description": "Detailed case description for postman testing.",
  "category": "{{categoryId}}",
  "city": "Cairo",
  "budget": 5000,
  "priority": "medium"
}
```

- `GET /api/cases`
- لا يحتاج `body`

- `GET /api/cases/my-cases`
- لا يحتاج `body`

- `GET /api/cases/lawyer-cases`
- لا يحتاج `body`

- `GET /api/cases/:id`
- لا يحتاج `body`

- `PATCH /api/cases/:id`
```json
{
  "title": "Updated case title",
  "description": "Updated description",
  "budget": 6500
}
```

- `DELETE /api/cases/:id`
- لا يحتاج `body`

- `PATCH /api/cases/:id/status`
```json
{
  "status": "open"
}
```

### Offers

- `POST /api/offers`
```json
{
  "case": "{{caseId}}",
  "price": 4500,
  "message": "I can help you with this case.",
  "delivery_time": 30
}
```

- `GET /api/offers/my-offers`
- لا يحتاج `body`

- `GET /api/offers/case/:caseId`
- لا يحتاج `body`

- `PATCH /api/offers/:id/accept`
- لا يحتاج `body`

- `PATCH /api/offers/:id/reject`
- لا يحتاج `body`

- `DELETE /api/offers/:id`
- لا يحتاج `body`

### Lawyers

- `GET /api/lawyers`
- لا يحتاج `body`

- `GET /api/lawyers/me`
- لا يحتاج `body`

- `PATCH /api/lawyers/me`
```json
{
  "specialization": "Family Law",
  "years_of_experience": 7,
  "office_address": "Downtown Office",
  "availability_status": true,
  "rate": 300,
  "full_name": "Updated Lawyer",
  "city": "Cairo",
  "bio": "Experienced lawyer"
}
```

- `GET /api/lawyers/:id`
- لا يحتاج `body`

### Clients

- `GET /api/clients/me`
- لا يحتاج `body`

- `PATCH /api/clients/me`
```json
{
  "full_name": "Updated Client",
  "city": "Giza",
  "address": "Updated Address"
}
```

### Notifications

- `GET /api/notifications`
- لا يحتاج `body`

- `PATCH /api/notifications/:id/read`
- لا يحتاج `body`

- `PATCH /api/notifications/read-all`
- لا يحتاج `body`

- `DELETE /api/notifications/:id`
- لا يحتاج `body`

### Reviews

- `POST /api/reviews`
```json
{
  "reviewedLawyer": "{{lawyerProfileId}}",
  "case": "{{caseId}}",
  "rating": 5,
  "comment": "Excellent service"
}
```

- `GET /api/reviews/lawyer/:lawyerId`
- لا يحتاج `body`

### Invoices

- `POST /api/invoices`
```json
{
  "case": "{{caseId}}",
  "client": "{{clientUserId}}",
  "lawyer": "{{lawyerUserId}}",
  "amount": 5000,
  "dueDate": "2026-12-31T00:00:00.000Z"
}
```

- `GET /api/invoices/my-invoices`
- لا يحتاج `body`

- `GET /api/invoices/lawyer-invoices`
- لا يحتاج `body`

- `GET /api/invoices/:id`
- لا يحتاج `body`

- `PATCH /api/invoices/:id/pay`
- لا يحتاج `body`

### Payouts

- `POST /api/payouts`
```json
{
  "amount": 1000,
  "method": "bank_transfer"
}
```

- `GET /api/payouts/my-payouts`
- لا يحتاج `body`

- `GET /api/payouts`
- لا يحتاج `body`

- `PATCH /api/payouts/:id/status`
```json
{
  "status": "processing"
}
```

### Admin

- `GET /api/admin/dashboard`
- لا يحتاج `body`

- `GET /api/admin/users`
- لا يحتاج `body`

- `GET /api/admin/lawyers`
- لا يحتاج `body`

- `PATCH /api/admin/lawyers/:id/verify`
```json
{
  "status": true
}
```

- `PATCH /api/admin/users/:id/ban`
```json
{
  "isBanned": true
}
```

### Users

- `GET /api/users`
- لا يحتاج `body`

- `GET /api/users/:id`
- لا يحتاج `body`

- `PATCH /api/users/:id`
```json
{
  "full_name": "Client Updated From Users Route",
  "city": "Alexandria",
  "bio": "Updated bio"
}
```

- `DELETE /api/users/:id`
- لا يحتاج `body`

### Messages

- `GET /api/messages`
- لا يحتاج `body`

- `POST /api/messages`
```json
{
  "message": "Hello from Postman"
}
```

- `GET /api/messages/unread`
- لا يحتاج `body`

---

## طريقة الاستخدام

1. افتح `Postman`
2. اعمل `Import`
3. استورد ملف الـ collection
4. استورد ملف الـ environment
5. اختر Environment باسم `Legal Services Marketplace Local`
6. تأكد أن `legalBaseUrl` يساوي:

```text
http://localhost:3000
```

أو غيّره إذا السيرفر يعمل على بورت مختلف.

---

## المتغيرات المهمة

الـ environment يحتوي متغيرات جاهزة مثل:

- `legalBaseUrl`
- `adminEmail`
- `clientEmail`
- `lawyerEmail`
- `password`
- `adminAccessToken`
- `clientAccessToken`
- `lawyerAccessToken`
- `categoryId`
- `caseId`
- `offerId`
- `invoiceId`
- `payoutId`

بعض هذه القيم يتم تخزينها تلقائيًا من خلال `Tests` داخل Requests مثل:

- تسجيل أو Login الأدمن
- تسجيل أو Login العميل
- تسجيل أو Login المحامي
- Create Category
- Create Case
- Create Offer
- Create Invoice
- Request Payout
- Get My Lawyer Profile
- Get My Client Profile

---

## ترتيب الاختبار المقترح

### 1. Auth

شغّل بالترتيب:

1. `Register Admin`
2. `Login Admin`
3. `Register Client`
4. `Login Client`
5. `Register Lawyer`
6. `Login Lawyer`

بعدها ستكون التوكنات محفوظة تلقائيًا.

### 2. Categories

1. `Create Category`
2. `Get Categories`
3. `Get Category By ID`
4. `Update Category`

### 3. Profiles

1. `Get My Lawyer Profile`
2. `Get My Client Profile`
3. `Update My Lawyer Profile`
4. `Update My Client Profile`

### 4. Cases

1. `Create Case`
2. `List Cases`
3. `Get My Cases`
4. `Get Case By ID`
5. `Update Case`
6. `Update Case Status`

### 5. Offers

1. `Create Offer`
2. `Get My Offers`
3. `Get Offers By Case`
4. `Accept Offer` أو `Reject Offer`

### 6. Reviews

بعد وجود `lawyerProfileId` و `caseId`:

1. `Create Review`
2. `Get Reviews By Lawyer`

### 7. Invoices

1. `Create Invoice`
2. `Get My Invoices`
3. `Get Lawyer Invoices`
4. `Get Invoice By ID`
5. `Mark Invoice Paid`

### 8. Payouts

1. `Request Payout`
2. `Get My Payouts`
3. `Get All Payouts`
4. `Update Payout Status`

### 9. Admin

1. `Dashboard`
2. `Get All Users`
3. `Get All Admin Lawyers`
4. `Verify Lawyer`
5. `Ban User`

### 10. Users

1. `List Users`
2. `Get User By ID`
3. `Update User By ID`
4. `Delete User`

---

## ملاحظات مهمة

### 1. رسائل البريد

Endpoints مثل:

- `verify-email`
- `reset-password`

تحتاج Token حقيقي من الإيميل.
إذا لم يكن لديك Mailer شغال، ضع القيمة يدويًا في:

- `messageToken`

### 2. Messages endpoints

يوجد ملاحظة مهمة في الكود الحالي:

- الـ routes الخاصة بـ `messages` مركبة على `/api/messages`
- لكن الـ controller/service يتوقعان `caseId` كـ route param داخليًا

لذلك أضفت Requests الرسائل داخل الـ collection، لكن قد تحتاج تعديل route لاحقًا حتى تعمل بالكامل.

### 3. بعض الـ IDs تعتمد على التشغيل السابق

لو شغلت `Delete User` أو `Delete Case` ثم حاولت استخدام نفس الـ ID لاحقًا، ستحتاج إعادة تشغيل Requests الإنشاء مرة ثانية.

---

## لو تريد نسخة أقوى

أقدر في الخطوة التالية أعمل لك أيضًا:

- Collection فيها `Pre-request scripts` تولد Emails عشوائية تلقائيًا
- Collection فيها `Tests` أكثر تحفظ `notificationId` و `invoiceId` من list responses
- ملف `Newman` لتشغيل كل الـ API tests من التيرمنال
- نسخة منظمة أكثر حسب `Client Flow` و `Lawyer Flow` و `Admin Flow`
