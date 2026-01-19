/**
 * Tests for AdminSidebar component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminSidebar from '../../../components/admin/AdminSidebar';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/admin',
  }),
}));

describe('AdminSidebar', () => {
  it('should render navigation links', () => {
    render(<AdminSidebar />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should render Dashboard link', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render Settings link', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render Articles link', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('Articles')).toBeInTheDocument();
  });

  it('should render mobile toggle button', () => {
    render(<AdminSidebar />);
    expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
  });
});

