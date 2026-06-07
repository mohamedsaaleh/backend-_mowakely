# Legal Services Marketplace API

A production-ready Node.js + Express + MongoDB backend for a legal services marketplace connecting lawyers and clients.

## Features

### Core Features
- **Authentication**: JWT-based authentication with refresh tokens, email verification, password reset
- **User Management**: Role-based access control (Admin, Lawyer, Client)
- **Case Management**: Create, update, search cases with categories, budgets, and priorities
- **Offer System**: Lawyers can submit offers on cases, clients can accept/reject
- **Messaging**: Real-time messaging via Socket.IO with typing indicators
- **Notifications**: Push notifications for case updates, offers, messages
- **Reviews**: Rating and review system for lawyers
- **Financial**: Invoice generation and payout management

### Technical Features
- **Security**: Helmet, CORS, rate limiting, input sanitization, CSRF protection
- **API Documentation**: Comprehensive Swagger/OpenAPI documentation
- **Database**: MongoDB with Mongoose, transaction support, indexing
- **Performance**: Redis caching, query optimization, pagination, filtering, sorting
- **Background Jobs**: BullMQ queue for emails, notifications, cleanup tasks
- **File Upload**: Multer with image compression and cloud storage ready
- **WebSocket**: Socket.IO with authentication, rooms, typing indicators
- **Testing**: Jest with unit and integration tests
- **Deployment**: PM2, Nginx configuration
- **Logging**: Winston with request IDs, audit logs, error tracking
- **Health Monitoring**: Health endpoints with readiness/liveness checks

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: MongoDB 7.x with Mongoose 8.x
- **Caching**: Redis
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Real-time**: Socket.IO
- **Documentation**: Swagger UI
- **Testing**: Jest + Supertest
- **Deployment**: PM2, Nginx

## Project Structure

```
src/
├── config/              # Configuration files
│   ├── db.js           # MongoDB connection
│   ├── env.js          # Environment variables
│   └── swagger.js      # Swagger configuration
├── constants/          # Application constants
│   └── index.js        # Roles, statuses, messages, etc.
├── middlewares/        # Express middlewares
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── role.middleware.js
│   ├── upload.middleware.js
│   └── validate.middleware.js
├── modules/            # Feature modules
│   ├── admin/          # Admin functionality
│   ├── auth/           # Authentication
│   ├── cases/          # Case management
│   ├── categories/     # Case categories
│   ├── clients/        # Client profiles
│   ├── invoices/       # Invoice management
│   ├── lawyers/        # Lawyer profiles
│   ├── messages/       # Messaging
│   ├── notifications/  # Notifications
│   ├── offers/         # Case offers
│   ├── payouts/        # Payout management
│   ├── reviews/        # Reviews
│   └── users/          # User management
├── sockets/            # Socket.IO handlers
│   ├── chat.socket.js
│   └── notification.socket.js
├── utils/              # Utility functions
│   ├── advancedValidation.js
│   ├── apiResponse.js
│   ├── cache.js
│   ├── crypto.js
│   ├── email.js
│   ├── jobQueue.js
│   ├── logger.js
│   ├── performance.js
│   ├── queryBuilder.js
│   ├── securityHelper.js
│   ├── transactionHelper.js
│   └── uploadHelper.js
├── app.js              # Express app setup
└── server.js           # Server entry point
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis (optional, for caching and jobs)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd legal-marketplace-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/legal_marketplace
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@legalservices.com

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Running Locally

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### Running Tests

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

## API Documentation

Once the server is running, access the Swagger documentation:
- **Development**: http://localhost:3000/api-docs
- **Production**: https://api.legalservices.com/api-docs

OpenAPI JSON: http://localhost:3000/api-docs.json

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | User logout |
| GET | /api/auth/verify-email/:token | Verify email |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password/:token | Reset password |
| GET | /api/auth/me | Get current user |

### Cases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/cases | List cases (paginated) |
| POST | /api/cases | Create new case |
| GET | /api/cases/:id | Get case details |
| PATCH | /api/cases/:id | Update case |
| DELETE | /api/cases/:id | Delete case |
| POST | /api/cases/:id/close | Close case |

### Offers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/offers | List offers |
| POST | /api/offers | Create offer |
| GET | /api/offers/:id | Get offer details |
| PATCH | /api/offers/:id/accept | Accept offer |
| PATCH | /api/offers/:id/reject | Reject offer |
| DELETE | /api/offers/:id | Withdraw offer |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/messages | Get messages |
| POST | /api/messages | Send message |
| PATCH | /api/messages/:id/read | Mark as read |

### Lawyers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/lawyers | List lawyers |
| GET | /api/lawyers/:id | Get lawyer profile |
| GET | /api/lawyers/me | Get own profile |
| PATCH | /api/lawyers/me | Update profile |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard | Dashboard stats |
| GET | /api/admin/users | List users |
| PATCH | /api/admin/users/:id/ban | Ban user |
| DELETE | /api/admin/users/:id | Delete user |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/legal_marketplace |
| JWT_SECRET | JWT signing secret | - |
| JWT_EXPIRES_IN | Access token expiry | 15m |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiry | 7d |
| REDIS_URL | Redis connection URL | redis://localhost:6379 |
| EMAIL_HOST | SMTP host | smtp.gmail.com |
| EMAIL_PORT | SMTP port | 587 |
| EMAIL_USER | SMTP user | - |
| EMAIL_PASSWORD | SMTP password | - |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 900000 (15 min) |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |
| LOG_LEVEL | Logging level | info |

## Production Best Practices

### Security
- Use strong JWT_SECRET (64+ characters)
- Enable HTTPS
- Configure CORS properly
- Use secure cookies
- Implement rate limiting
- Enable input sanitization

### Performance
- Use Redis caching for frequent queries
- Add database indexes
- Use connection pooling
- Enable compression
- Configure proper timeouts

### Monitoring
- Set up log rotation
- Configure health checks
- Use PM2 for process management
- Monitor memory and CPU usage

### Deployment
1. Configure environment variables
2. Set up reverse proxy (Nginx)
3. Use PM2 for process management
4. Configure SSL/TLS
5. Set up backup strategy

## License

MIT License - see LICENSE file for details

## Support

For support, please contact: support@legalservices.com