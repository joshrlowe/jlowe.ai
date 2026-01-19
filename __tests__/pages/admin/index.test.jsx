import React from 'react';
import { render, waitFor } from '@testing-library/react';
import AdminDashboard from '../../../pages/admin/index';

// Mock next/router
const mockReplace = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    pathname: '/admin',
    push: jest.fn(),
  }),
}));

describe('AdminDashboard (index)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect to /admin/dashboard', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('should return null (no visible content)', () => {
    const { container } = render(<AdminDashboard />);
    expect(container.firstChild).toBeNull();
  });
});

