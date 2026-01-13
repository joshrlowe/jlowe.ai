/**
 * Custom Test Utilities
 * 
 * This file provides custom render functions and utilities for testing.
 * Import these utilities in your test files instead of directly importing from @testing-library/react
 * 
 * Usage:
 *   import { render, screen, renderWithoutProviders } from '@/test-utils';
 *   // or
 *   import { render, screen, renderWithoutProviders } from '../test-utils';
 */

import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Conditionally import SessionProvider - it may not be available in all test environments
let SessionProvider;
try {
    SessionProvider = require('next-auth/react').SessionProvider;
} catch (e) {
    // next-auth not available, SessionProvider will be undefined
    SessionProvider = null;
}

/**
 * Configure userEvent with options that prevent act() warnings
 * - delay: null removes artificial delays between key presses
 * - This helps avoid React 18 concurrent mode timing issues in tests
 */
const userEventOptions = { delay: null };

/**
 * Custom render function that wraps components with common providers
 * 
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Render options
 * @param {Object} options.session - Mock session object for SessionProvider
 * @param {Object} options.renderOptions - Additional options to pass to RTL render
 * @returns {Object} - RTL render result with user utility
 */
export function render(ui, { session = null, ...renderOptions } = {}) {
    function Wrapper({ children }) {
        // Wrap with SessionProvider if session is provided and SessionProvider is available
        if (session && SessionProvider) {
            return (
                <SessionProvider session={session}>
                    {children}
                </SessionProvider>
            );
        }

        return children;
    }

    const user = userEvent.setup(userEventOptions);
    const renderResult = rtlRender(ui, { wrapper: Wrapper, ...renderOptions });

    return {
        ...renderResult,
        user,
    };
}

/**
 * Render without any providers - for simple component tests
 * This is the most commonly used render function for pure UI components
 * 
 * @param {React.ReactElement} ui - The component to render
 * @param {Object} options - Additional options to pass to RTL render
 * @returns {Object} - RTL render result with user utility
 */
export function renderWithoutProviders(ui, options = {}) {
    const user = userEvent.setup(userEventOptions);
    const renderResult = rtlRender(ui, options);

    return {
        ...renderResult,
        user,
    };
}

/**
 * Create a mock session object for testing authenticated components
 * 
 * @param {Object} overrides - Properties to override in the default session
 * @returns {Object} - Mock session object
 */
export function createMockSession(overrides = {}) {
    return {
        user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
            ...overrides.user,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        ...overrides,
    };
}

/**
 * Create a mock admin session for testing admin-only components
 * 
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Mock admin session object
 */
export function createMockAdminSession(overrides = {}) {
    return createMockSession({
        user: {
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
            ...overrides.user,
        },
        ...overrides,
    });
}

/**
 * Wait for an element to be removed from the DOM
 * This is useful for testing loading states
 * 
 * @param {Function} callback - Function that queries for the element
 * @param {Object} options - waitFor options
 */
export { waitFor, waitForElementToBeRemoved } from '@testing-library/react';

/**
 * Re-export everything from @testing-library/react
 */
export * from '@testing-library/react';

/**
 * Re-export user-event for simulating user interactions
 */
export { default as userEvent } from '@testing-library/user-event';
