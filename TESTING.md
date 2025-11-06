# Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are located next to the files they test:

```
src/
  lib/
    __tests__/
      shopify.test.ts
      trello.test.ts
  ui/
    components/
      __tests__/
        LoadingSpinner.test.tsx
```

## Writing Tests

### Unit Tests (lib/)

```typescript
import { myFunction } from '../myModule';

describe('MyModule', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### Component Tests (ui/)

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// Test API routes
describe('API Route', () => {
  it('returns correct data', async () => {
    const response = await fetch('/api/endpoint');
    const data = await response.json();
    expect(data).toMatchObject({ success: true });
  });
});
```

## Mocking

### Mock Prisma

```typescript
jest.mock('../db', () => ({
  prisma: {
    shop: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));
```

### Mock App Bridge

```typescript
jest.mock('@/lib/app-bridge-provider', () => ({
  useAppBridge: () => ({
    authenticatedFetch: jest.fn(),
    showToast: jest.fn(),
  }),
}));
```

## Coverage Goals

- **Utilities**: 80%+
- **API Routes**: 70%+
- **Components**: 60%+

## Best Practices

1. Test business logic thoroughly
2. Test error cases
3. Mock external dependencies
4. Keep tests simple and readable
5. Use descriptive test names

