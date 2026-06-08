const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MOWAKLY Services API',
      version: '1.0.0',
      description: `
## API Documentation

This is the backend API for a Legal Services Marketplace connecting lawyers and clients.

### Authentication
The API uses JWT Bearer token authentication. Include the token in the Authorization header:
\`Authorization: Bearer <your_token>\`

### Features
- User authentication (register, login, refresh token, logout)
- Email verification and password reset
- Case management with bidding
- Offer management and acceptance
- Real-time messaging system
- Reviews and ratings
- Notifications system
- Invoice and payout management
  - Admin dashboard with analytics
  - Lawyer and Client profiles
  - Category-based case organization
  - Superadmin system-level operations

### Pagination
All list endpoints support pagination with query parameters:
- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 10, max: 100)
- \`sort\`: Sort field (prefix with - for descending)
- \`search\`: Search term

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 20 requests per 15 minutes
      `,
      contact: {
        name: 'API Support',
        email: 'support@legalservices.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
servers: [
  {
    url: 'http://localhost:3000/api',
    description: 'Development server'
  },
  {
    url: `${process.env.BASE_URL || 'https://chic-encouragement-production-0618.up.railway.app'}/api`,
    description: 'Production server'
  }
],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from /auth/login or /auth/register endpoints'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for admin operations'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Data fetched successfully' },
            data: {
              type: 'object',
              properties: {
                items: { type: 'array' },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer', example: 100 },
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 10 },
                    pages: { type: 'integer', example: 10 },
                    hasNext: { type: 'boolean', example: true },
                    hasPrev: { type: 'boolean', example: false }
                  }
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            fullName: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['client', 'lawyer', 'admin', 'superadmin'] },
            profileImage: { type: 'string', nullable: true },
            emailVerified: { type: 'boolean', example: false },
            isBanned: { type: 'boolean', example: false },
            phone: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                refreshToken: { type: 'string', example: 'a1b2c3d4e5...' }
              }
            }
          }
        },
        Lawyer: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            fullName: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            phone: { type: 'string', example: '+1-555-0100' },
            city: { type: 'string', example: 'New York' },
            bio: { type: 'string', example: 'Experienced attorney with 10+ years...' },
            specializations: {
              type: 'array',
              items: { type: 'string' },
              example: ['Family Law', 'Divorce']
            },
            yearsExperience: { type: 'integer', example: 10 },
            licenseNumber: { type: 'string', example: 'LJ-2024-001' },
            hourlyRate: { type: 'number', example: 150 },
            rating: { type: 'number', example: 4.8 },
            totalCases: { type: 'integer', example: 50 },
            completedCases: { type: 'integer', example: 45 },
            profileImage: { type: 'string', nullable: true },
            isVerified: { type: 'boolean', example: true },
            isAvailable: { type: 'boolean', example: true }
          }
        },
        Client: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            fullName: { type: 'string', example: 'Jane Smith' },
            email: { type: 'string', example: 'jane@example.com' },
            phone: { type: 'string', example: '+1-555-0200' },
            city: { type: 'string', example: 'Los Angeles' },
            profileImage: { type: 'string', nullable: true },
            totalCases: { type: 'integer', example: 5 },
            activeCases: { type: 'integer', example: 2 }
          }
        },
        Case: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Family Law Case' },
            description: { type: 'string', example: 'Divorce proceedings with child custody...' },
            category: { type: 'string', example: 'Family Law' },
            categoryId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            budget: { type: 'number', example: 5000 },
            status: { type: 'string', enum: ['open', 'in_progress', 'pending_payment', 'completed', 'cancelled', 'disputed'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            client: { $ref: '#/components/schemas/Client' },
            lawyer: { $ref: '#/components/schemas/Lawyer' },
            offersCount: { type: 'integer', example: 5 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Offer: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            caseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            lawyer: { $ref: '#/components/schemas/Lawyer' },
            price: { type: 'number', example: 4500 },
            description: { type: 'string', example: 'I can handle this case...' },
            estimatedDuration: { type: 'string', example: '30 days' },
            status: { type: 'string', enum: ['pending', 'accepted', 'rejected', 'expired', 'withdrawn'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Family Law' },
            description: { type: 'string', example: 'Cases involving family matters...' },
            icon: { type: 'string', example: 'family-restaurant' },
            casesCount: { type: 'integer', example: 100 },
            isActive: { type: 'boolean', example: true }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            caseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            sender: { $ref: '#/components/schemas/User' },
            recipient: { $ref: '#/components/schemas/User' },
            content: { type: 'string', example: 'Hello, I have a question...' },
            status: { type: 'string', enum: ['sent', 'delivered', 'read'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user: { type: 'string', example: '507f1f77bcf86cd799439011' },
            type: { type: 'string', enum: ['case_update', 'new_offer', 'offer_accepted', 'new_message', 'payment_received', 'system'] },
            title: { type: 'string', example: 'New Offer Received' },
            message: { type: 'string', example: 'You have a new offer on your case' },
            data: { type: 'object' },
            read: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            lawyer: { type: 'string', example: '507f1f77bcf86cd799439011' },
            client: { $ref: '#/components/schemas/Client' },
            case: { type: 'string', example: '507f1f77bcf86cd799439011' },
            rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            comment: { type: 'string', example: 'Excellent service, very professional...' },
            status: { type: 'string', enum: ['pending', 'published', 'hidden'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            case: { type: 'string', example: '507f1f77bcf86cd799439011' },
            client: { type: 'string', example: '507f1f77bcf86cd799439011' },
            lawyer: { type: 'string', example: '507f1f77bcf86cd799439011' },
            amount: { type: 'number', example: 5000 },
            platformFee: { type: 'number', example: 500 },
            status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded'] },
            dueDate: { type: 'string', format: 'date-time' },
            paidAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Payout: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            lawyer: { type: 'string', example: '507f1f77bcf86cd799439011' },
            amount: { type: 'number', example: 4500 },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] },
            method: { type: 'string', example: 'bank_transfer' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateAdminRequest: {
          type: 'object',
          required: ['full_name', 'email', 'password', 'phone'],
          properties: {
            full_name: { type: 'string', minLength: 2, maxLength: 100, example: 'New Admin' },
            email: { type: 'string', format: 'email', example: 'newadmin@example.com' },
            password: { type: 'string', minLength: 6, maxLength: 100, example: 'Admin@123456' },
            phone: { type: 'string', example: '+1-555-0199' },
            city: { type: 'string', example: 'New York' },
            address: { type: 'string', example: '123 Admin St' },
            bio: { type: 'string', example: 'System administrator' },
            profile_photo: { type: 'string', nullable: true, example: 'https://example.com/photo.jpg' }
          }
        },
        CreateLawyerRequest: {
          type: 'object',
          required: ['full_name', 'email', 'password', 'phone', 'specialization'],
          properties: {
            full_name: { type: 'string', minLength: 2, maxLength: 100, example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'lawyer@example.com' },
            password: { type: 'string', minLength: 6, maxLength: 100, example: 'Lawyer@123' },
            phone: { type: 'string', example: '+1-555-0100' },
            role: { type: 'string', enum: ['lawyer'], example: 'lawyer' },
            specialization: { type: 'string', example: 'Family Law' },
            years_of_experience: { type: 'integer', minimum: 0, example: 10 },
            office_address: { type: 'string', example: '123 Legal St, New York' },
            city: { type: 'string', example: 'New York' },
            address: { type: 'string', example: '123 Legal St' },
            bio: { type: 'string', example: 'Experienced family law attorney' },
            profile_photo: { type: 'string', nullable: true }
          }
        },
        CreateClientRequest: {
          type: 'object',
          required: ['full_name', 'email', 'password', 'phone'],
          properties: {
            full_name: { type: 'string', minLength: 2, maxLength: 100, example: 'Jane Smith' },
            email: { type: 'string', format: 'email', example: 'client@example.com' },
            password: { type: 'string', minLength: 6, maxLength: 100, example: 'Client@123' },
            phone: { type: 'string', example: '+1-555-0200' },
            role: { type: 'string', enum: ['client'], example: 'client' },
            city: { type: 'string', example: 'Los Angeles' },
            address: { type: 'string', example: '456 Client Ave' },
            bio: { type: 'string', example: 'Looking for legal assistance' },
            profile_photo: { type: 'string', nullable: true }
          }
        },
        CreateCaseRequest: {
          type: 'object',
          required: ['title', 'description', 'category', 'budget'],
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200, example: 'Family Law Case' },
            description: { type: 'string', minLength: 10, maxLength: 5000, example: 'Divorce proceedings with child custody...' },
            category: { type: 'string', example: 'Family Law' },
            budget: { type: 'number', minimum: 0, example: 5000 },
            city: { type: 'string', example: 'New York' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'medium' }
          }
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            full_name: { type: 'string', minLength: 2, maxLength: 100, example: 'John Doe Updated' },
            phone: { type: 'string', example: '+1-555-0101' },
            city: { type: 'string', example: 'Boston' },
            address: { type: 'string', example: '789 New St' },
            bio: { type: 'string', example: 'Updated bio information' },
            profile_photo: { type: 'string', nullable: true }
          }
        },
        UpdateLawyerRequest: {
          type: 'object',
          properties: {
            specialization: { type: 'string', example: 'Corporate Law' },
            years_of_experience: { type: 'integer', minimum: 0, example: 15 },
            office_address: { type: 'string', example: '456 Corporate Blvd' },
            availability_status: { type: 'boolean', example: true },
            rate: { type: 'number', example: 200 }
          }
        },
        UpdateClientRequest: {
          type: 'object',
          properties: {
            city: { type: 'string', example: 'Chicago' },
            address: { type: 'string', example: '321 Client Lane' },
            bio: { type: 'string', example: 'Updated client information' }
          }
        },
        UpdateCaseRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 3, maxLength: 200, example: 'Updated Case Title' },
            description: { type: 'string', minLength: 10, maxLength: 5000, example: 'Updated description...' },
            status: { type: 'string', enum: ['open', 'in_progress', 'pending_payment', 'completed', 'cancelled', 'disputed'] },
            budget: { type: 'number', minimum: 0, example: 7500 },
            city: { type: 'string', example: 'Miami' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] }
          }
        },
        BanUserRequest: {
          type: 'object',
          required: ['banned'],
          properties: {
            banned: { type: 'boolean', example: true }
          }
        },
        ChangeRoleRequest: {
          type: 'object',
          required: ['newRole'],
          properties: {
            newRole: { type: 'string', enum: ['client', 'lawyer', 'admin'], example: 'admin' }
          }
        },
        DashboardStatsResponse: {
          type: 'object',
          properties: {
            users: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 150 },
                lawyers: { type: 'integer', example: 50 },
                clients: { type: 'integer', example: 100 }
              }
            },
            cases: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 300 },
                open: { type: 'integer', example: 120 },
                completed: { type: 'integer', example: 180 }
              }
            },
            revenue: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 150000 }
              }
            },
            payouts: {
              type: 'object',
              properties: {
                pending: { type: 'number', example: 25000 }
              }
            }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Authentication failed. Please log in again.'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Access denied',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Your account has been banned. Contact support.'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Validation error',
                errors: [
                  { field: 'email', message: 'Email is required' },
                  { field: 'password', message: 'Password must be at least 8 characters' }
                ]
              }
            }
          }
        },
        Conflict: {
          description: 'Resource already exists',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Resource already exists'
              }
            }
          }
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Too many requests, please try again later.'
              }
            }
          }
        }
      },
      parameters: {
        page: {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number for pagination'
        },
        limit: {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10, maximum: 100 },
          description: 'Number of items per page'
        },
        sort: {
          name: 'sort',
          in: 'query',
          schema: { type: 'string', example: '-createdAt' },
          description: 'Sort field (prefix with - for descending)'
        },
        search: {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search term'
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints - register, login, logout, token refresh, password reset' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Lawyers', description: 'Lawyer profiles, search, and management' },
      { name: 'Clients', description: 'Client profiles and management' },
      { name: 'Cases', description: 'Case management - create, update, search, manage status' },
      { name: 'Offers', description: 'Legal case offers - create, accept, reject, withdraw' },
      { name: 'Categories', description: 'Case categories and specialization areas' },
      { name: 'Messages', description: 'Real-time messaging between users' },
      { name: 'Notifications', description: 'User notifications and alerts' },
      { name: 'Reviews', description: 'Reviews and ratings for lawyers' },
      { name: 'Invoices', description: 'Invoice generation and payment tracking' },
      { name: 'Payouts', description: 'Lawyer payout and withdrawal management' },
      { name: 'Admin', description: 'Admin dashboard, user management, analytics' },
      { name: 'Superadmin', description: 'Superadmin system-level operations - highest privilege access' },
      { name: 'Payments', description: 'Payment processing and Paymob integration' }
    ]
  },
  apis: ['./src/modules/**/*.routes.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec, swaggerUi };