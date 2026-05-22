# Legal Services Marketplace - Testing Documentation

## Overview

This document describes the comprehensive testing infrastructure for the Legal Services Marketplace backend.

## Test Stack

- **Test Runner**: Jest 29.x
- **HTTP Client**: Supertest
- **Database**: MongoDB Memory Server (mongodb-memory-server)
- **Cache**: Redis Mock (ioredis-mock)
- **Additional**: Sinon, Nock, Faker, Jest Extended

## Project Structure

```
tests/
├── README.md
├── utils/
│   ├── setup.js           # Global test environment setup
│   ├── helpers.js         # Test helpers and fixtures
│   ├── fixtures.js        # Database fixtures
│   ├── mocks.js           # Service mocks
│   └── testApp.js         # Test app wrapper
├── unit/
│   ├── models/            # Model unit tests
│   ├── middlewares/       # Middleware unit tests
│   └── validation/        # Validation schema tests
├── integration/
│   ├── auth.integration.test.js
│   ├── cases.integration.test.js
│   └── offers.integration.test.js
├── api/
│   ├── auth.api.test.js
│   ├── cases.api.test.js
│   ├── categories.api.test.js
│   └── offers.api.test.js
├── e2e/
│   ├── client-journey.test.js
│   ├── lawyer-journey.test.js
│   └── admin-journey.test.js
└── sockets/
    └── chat.socket.test.js
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test Suite
```bash
npm test -- --testPathPattern="unit"
npm test -- --testPathPattern="integration"
npm test -- --testPathPattern="api"
npm test -- --testPathPattern="e2e"
npm test -- --testPathPattern="sockets"
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Specific Test File
```bash
npm test -- tests/unit/models/user.model.test.js
```

## Test Configuration

### Jest Configuration (jest.config.js)
- Environment: Node.js
- Coverage threshold: 70% lines, 60% branches
- Test patterns: `**/*.test.js`
- Ignore patterns: `node_modules/`, `coverage/`

### Environment Variables (setup.js)
```javascript
NODE_ENV: 'test'
MONGODB_URI: 'mongodb://localhost:27017/test'
JWT_SECRET: process.env.JWT_SECRET || 'test-secret-key'
PORT: 3001
```

## Test Utilities

### DatabaseFixtures
Provides methods to create test data:
- `createClient()` - Creates client user with profile
- `createLawyer()` - Creates lawyer user with profile
- `createAdmin()` - Creates admin user
- `createCase(data, options)` - Creates case
- `createOffer(data, user, case)` - Creates offer
- `createCategory(data)` - Creates category
- `createCategories()` - Creates default categories

### TestAuthHelper
- `generateAccessToken(userId, role)` - Generates access JWT
- `generateRefreshToken(userId)` - Generates refresh JWT
- `extractToken(bearerString)` - Extracts token from header

### TestResponseHelper
- `expectSuccess(response)` - Asserts success response
- `expectError(response)` - Asserts error response
- `expectValidationError(response)` - Asserts validation error

## Writing Tests

### Unit Test Pattern
```javascript
describe('Model/Function Name', () => {
  beforeEach(() => { /* setup */ });
  afterEach(() => { /* cleanup */ });

  it('should do something', async () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = await method(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### API Test Pattern
```javascript
describe('Endpoint', () => {
  let token;
  
  beforeEach(async () => {
    const user = await DatabaseFixtures.createClient();
    token = TestAuthHelper.generateAccessToken(user.user._id, 'client');
  });

  it('should return 200', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
  });
});
```

### E2E Test Pattern
```javascript
describe('User Journey', () => {
  it('Complete workflow', async () => {
    // Register
    const register = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    // Login
    const login = await request(app)
      .post('/api/auth/login')
      .send(credentials);
    
    // Perform actions
    const token = login.body.data.tokens.accessToken;
    // ... more steps
  });
});
```

## Test Categories

### 1. Unit Tests (`tests/unit/`)
- Model methods and schemas
- Middleware logic
- Validation schemas
- Pure utility functions

### 2. Integration Tests (`tests/integration/`)
- Database operations
- Service integration
- Multi-endpoint workflows

### 3. API Tests (`tests/api/`)
- HTTP endpoints
- Request/response format
- Error handling

### 4. E2E Tests (`tests/e2e/`)
- Complete user journeys
- Role-based workflows
- Cross-feature interactions

### 5. Socket.IO Tests (`tests/sockets/`)
- Real-time communication
- Room management
- Message delivery

## Coverage Reports

Coverage is automatically generated in `coverage/` directory:
- `lcov.info` - For CI/CD integration
- `coverage/` - HTML report

View HTML report:
```bash
npm run test -- --coverage && npx serve coverage/lcov-report
```

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs:
1. Linting (`npm run lint`)
2. Tests (`npm test`)
3. Coverage upload to Codecov

## Troubleshooting

### MongoDB Memory Server Issues
- Ensure no other MongoDB instance on port 27017
- Check system memory availability
- Use `MONGODB_MEMORY_SERVER=false` to use external MongoDB

### Redis Mock Issues
- Verify ioredis-mock is properly installed
- Check for conflicting Redis connections

### Socket.IO Test Issues
- Ensure server is running before tests
- Use correct socket URL and port
- Check authentication token format

## Best Practices

1. **AAA Pattern**: Always use Arrange-Act-Assert
2. **Isolation**: Each test should be independent
3. **Cleanup**: Clear database before each test
4. **Descriptive**: Use clear test names
5. **Coverage**: Aim for 70%+ code coverage
6. **Mock External**: Always mock email, queues, external APIs

## Common Issues

| Issue | Solution |
|-------|----------|
| ECONNREFUSED | Start MongoDB or check connection |
| Token expired | Regenerate token in beforeEach |
| Unique constraint | Clean database in beforeEach |
| Timeout | Increase jest timeout |
| Memory | Run tests in smaller batches |

## Scripts

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:api          # API tests only
npm run test:e2e          # E2E tests only
npm run lint              # Run linter
```