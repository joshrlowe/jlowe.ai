/**
 * Tests for AdminLayout component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminLayout from '../../../components/admin/AdminLayout';

// Mock AdminSidebar
jest.mock('../../../components/admin/AdminSidebar', () => {
  return function MockAdminSidebar() {
    return <aside data-testid="admin-sidebar">Sidebar</aside>;
  };
});

describe('AdminLayout', () => {
  it('should render children', () => {
    render(
      <AdminLayout>
        <div data-testid="child-content">Content</div>
      </AdminLayout>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should render sidebar', () => {
    render(<AdminLayout>Content</AdminLayout>);
    expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
  });

  it('should render default title "Admin"', () => {
    render(<AdminLayout>Content</AdminLayout>);
    expect(screen.getByRole('heading', { name: 'Admin' })).toBeInTheDocument();
  });

  it('should render custom title', () => {
    render(<AdminLayout title="Dashboard">Content</AdminLayout>);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('should not render title when title is empty string', () => {
    render(<AdminLayout title="">Content</AdminLayout>);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should use flex layout', () => {
    const { container } = render(<AdminLayout>Content</AdminLayout>);
    expect(container.firstChild).toHaveClass('flex');
  });
});

