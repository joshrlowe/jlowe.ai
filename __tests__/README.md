# Unit & Integration Tests Documentation

This directory contains unit and integration tests for the jlowe.ai project using Jest and React Testing Library.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Mocking Conventions](#mocking-conventions)
- [Coverage Requirements](#coverage-requirements)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test Button.test.jsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

This will run tests in interactive watch mode, automatically re-running tests when files change.

### Coverage Report
```bash
npm run test:coverage
```

Generates an HTML coverage report in the `coverage/` directory. Open `coverage/index.html` to view.

### Specific Test File
```bash
# By file name
npm test Button.test.jsx

# By path
npm test __tests__/components/Button.test.jsx
```

### Specific Test Pattern
```bash
# Run tests with "should render" in the name
npm test -- --testNamePattern="should render"

# Run tests in specific describe block
npm test -- --testNamePattern="Button component"
```

### Debug Mode
```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome and click "inspect".

### Update Snapshots
```bash
# Update all snapshots
npm test -- -u

# Update specific file snapshots
npm test Button.test.jsx -- -u

# Interactive update
npm test -- --watch
# Then press 'u' to update snapshots
```

## Test Structure

```
__tests__/
├── api/                      # API route tests
│   ├── comments/
│   ├── playlists/
│   └── posts/
├── components/               # Component tests
│   ├── Badge.test.jsx
│   ├── Button.test.jsx
│   ├── Card.test.jsx
│   └── ...
├── integration/              # Integration tests
│   ├── api-routes.test.js
│   └── articles.test.jsx
├── lib/                      # Utility/library tests
│   └── utils/
├── unit/                     # Pure unit tests
│   ├── animationUtils.test.js
│   ├── dateUtils.test.js
│   └── hooks/
└── setup/                    # Test setup utilities
    └── api-test-utils.js
```

### Test File Naming

- Component tests: `ComponentName.test.jsx`
- Utility tests: `utilityName.test.js`
- Hook tests: `useHookName.test.js`
- API tests: `route-name.test.js`

## Writing Tests

### Component Test Template

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import MyComponent from '@/components/MyComponent';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

describe('MyComponent', () => {
  // Setup
  const defaultProps = {
    title: 'Test Title',
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Rendering tests
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<MyComponent {...defaultProps} />);
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      render(<MyComponent {...defaultProps} variant="primary" />);
      
      const element = screen.getByRole('button');
      expect(element).toHaveClass('primary');
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      render(<MyComponent {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<MyComponent {...defaultProps} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<MyComponent {...defaultProps} />);
      
      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(defaultProps.onClick).toHaveBeenCalled();
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle missing props gracefully', () => {
      render(<MyComponent title="" />);
      
      expect(screen.queryByText('')).toBeInTheDocument();
    });
  });
});
```

### Utility Test Template

```javascript
import { myUtilFunction } from '@/lib/utils/myUtil';

describe('myUtilFunction', () => {
  it('should return expected result for valid input', () => {
    const result = myUtilFunction('input');
    
    expect(result).toBe('expected output');
  });

  it('should handle edge cases', () => {
    expect(myUtilFunction(null)).toBe(null);
    expect(myUtilFunction(undefined)).toBe(undefined);
    expect(myUtilFunction('')).toBe('');
  });

  it('should throw error for invalid input', () => {
    expect(() => myUtilFunction(123)).toThrow('Invalid input');
  });
});
```

### API Route Test Template

```javascript
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/my-endpoint';

describe('/api/my-endpoint', () => {
  it('should return 200 for valid request', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '123' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      data: expect.any(Object),
    });
  });

  it('should return 400 for invalid request', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });
});
```

### Hook Test Template

```javascript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMyHook());
    
    expect(result.current.value).toBe(null);
  });

  it('should update value on action', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.setValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

## Mocking Conventions

### Module Mocks

Located in `__mocks__/` directory at the root level.

#### Next.js Image

```javascript
// __mocks__/next/image.jsx
export default function Image({ src, alt, ...props }) {
  return <img src={src} alt={alt} {...props} />;
}
```

#### Next.js Router

```javascript
// __mocks__/next/navigation.js
export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
}));

export const usePathname = jest.fn(() => '/');
export const useSearchParams = jest.fn(() => new URLSearchParams());
```

#### Three.js / React Three Fiber

```javascript
// __mocks__/@react-three/fiber.jsx
export const Canvas = ({ children }) => <div>{children}</div>;
export const useFrame = jest.fn();
export const useThree = jest.fn(() => ({
  camera: {},
  gl: {},
  scene: {},
}));
```

#### GSAP

```javascript
// __mocks__/gsap.js
export default {
  to: jest.fn(),
  from: jest.fn(),
  fromTo: jest.fn(),
  timeline: jest.fn(() => ({
    to: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
  })),
};
```

### API Mocks (MSW)

Use Mock Service Worker for API mocking:

```javascript
// __mocks__/handlers.js
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/projects', () => {
    return HttpResponse.json([
      { id: 1, title: 'Project 1' },
      { id: 2, title: 'Project 2' },
    ]);
  }),

  http.post('/api/contact', async ({ request }) => {
    const body = await request.json();
    
    if (!body.email) {
      return new HttpResponse(null, { status: 400 });
    }
    
    return HttpResponse.json({ success: true });
  }),
];
```

### Inline Mocks

For component-specific mocks:

```javascript
jest.mock('@/lib/api', () => ({
  fetchProjects: jest.fn(() => Promise.resolve([])),
  createProject: jest.fn(() => Promise.resolve({ id: 1 })),
}));
```

### Spy on Methods

```javascript
const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

// After test
consoleSpy.mockRestore();
```

## Coverage Requirements

### Minimum Thresholds

Configure in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    statements: 70,
    branches: 60,
    functions: 70,
    lines: 70,
  },
}
```

### Coverage Goals

| Type | Current | Target | Required |
|------|---------|--------|----------|
| Statements | ~70% | 80% | 70% |
| Branches | ~60% | 70% | 60% |
| Functions | ~70% | 80% | 70% |
| Lines | ~70% | 80% | 70% |

### Excluded from Coverage

- `.next/` - Build output
- `node_modules/` - Dependencies
- `coverage/` - Coverage reports
- `*.config.js` - Configuration files
- `scripts/` - Migration scripts

### Viewing Coverage

```bash
# Generate and view coverage
npm run test:coverage

# Open HTML report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**:
```javascript
it('should set state to true', () => {
  const { result } = renderHook(() => useMyHook());
  act(() => result.current.toggle());
  expect(result.current.isActive).toBe(true);
});
```

✅ **Good**:
```javascript
it('should show active content when toggled', () => {
  render(<MyComponent />);
  fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
  expect(screen.getByText('Active Content')).toBeVisible();
});
```

### 2. Use Accessible Queries

Query priority (from most to least preferred):

1. `getByRole` - Best for accessibility
2. `getByLabelText` - Form elements
3. `getByPlaceholderText` - Forms without labels
4. `getByText` - Non-interactive elements
5. `getByTestId` - Last resort

❌ **Bad**:
```javascript
screen.getByTestId('submit-button');
```

✅ **Good**:
```javascript
screen.getByRole('button', { name: 'Submit' });
```

### 3. Test User Interactions Realistically

❌ **Bad**:
```javascript
fireEvent.click(button);
```

✅ **Good**:
```javascript
const user = userEvent.setup();
await user.click(button);
```

### 4. Wait for Asynchronous Updates

❌ **Bad**:
```javascript
fireEvent.click(button);
expect(screen.getByText('Success')).toBeInTheDocument();
```

✅ **Good**:
```javascript
await user.click(button);
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### 5. Clean Up After Tests

```javascript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
  cleanup(); // React Testing Library cleanup
});
```

### 6. Group Related Tests

```javascript
describe('Button component', () => {
  describe('Rendering', () => {
    it('should render with text', () => {});
    it('should render with icon', () => {});
  });

  describe('Interactions', () => {
    it('should handle clicks', () => {});
    it('should handle keyboard', () => {});
  });

  describe('States', () => {
    it('should show loading state', () => {});
    it('should show disabled state', () => {});
  });
});
```

### 7. Test Accessibility

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 8. Mock External Dependencies

```javascript
// Mock external API calls
jest.mock('@/lib/api');

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
```

## Troubleshooting

### Tests Not Running

1. **Check Node version**: Requires Node.js 18+
   ```bash
   node --version
   ```

2. **Clear Jest cache**:
   ```bash
   npm test -- --clearCache
   ```

3. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Import Errors

Check `jsconfig.json` for path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Module Not Found

Add to `jest.config.js`:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
  '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
},
```

### Timeout Errors

Increase timeout:

```javascript
jest.setTimeout(10000); // 10 seconds
```

Or for specific test:

```javascript
it('should do something', async () => {
  // test code
}, 10000);
```

### Snapshot Mismatch

1. Review changes:
   ```bash
   npm test -- --verbose
   ```

2. Update if intentional:
   ```bash
   npm test -- -u
   ```

### React Testing Library Warnings

**Warning: "An update to Component inside a test was not wrapped in act(...)"**

Solution:
```javascript
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### Mock Not Working

Ensure mock is defined before import:

```javascript
jest.mock('@/lib/api'); // Must be at top of file

import { fetchData } from '@/lib/api';
```

## CI Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

See `.github/workflows/test.yml` for full configuration.

### Local CI Simulation

```bash
# Run tests exactly as CI does
npm ci  # Clean install
npm run lint
npm run test:coverage
```

## Adding New Tests

1. **Create test file** in appropriate directory
2. **Follow naming convention**: `ComponentName.test.jsx`
3. **Import dependencies**:
   ```javascript
   import { render, screen } from '@testing-library/react';
   import MyComponent from '@/components/MyComponent';
   ```
4. **Write test cases** following templates above
5. **Run tests locally**: `npm test`
6. **Check coverage**: `npm run test:coverage`
7. **Commit changes** with descriptive message

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [MSW](https://mswjs.io/docs/)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Questions?

- Check existing tests for examples
- Review test setup in `jest.setup.js`
- Consult team documentation
- Ask in team chat

---

**Last Updated**: 2026-01-11
**Maintainer**: Development Team

