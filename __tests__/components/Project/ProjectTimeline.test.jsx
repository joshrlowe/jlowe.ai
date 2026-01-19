/**
 * Tests for ProjectTimeline component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectTimeline from '../../../components/Project/ProjectTimeline';

// Mock styles
jest.mock('@/styles/ProjectsPage.module.css', () => ({
  paragraphText: 'mock-paragraph-text',
  emphasisText: 'mock-emphasis-text',
}));

// Mock dateUtils
jest.mock('@/lib/utils/dateUtils', () => ({
  formatDateUTC: jest.fn((date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }),
}));

describe('ProjectTimeline', () => {
  it('should render start date', () => {
    render(<ProjectTimeline startDate="2024-01-15" releaseDate="2024-06-01" status="Completed" />);
    expect(screen.getByText('Start Date:')).toBeInTheDocument();
  });

  it('should render release date', () => {
    render(<ProjectTimeline startDate="2024-01-15" releaseDate="2024-06-01" status="Completed" />);
    expect(screen.getByText('Release Date:')).toBeInTheDocument();
  });

  it('should render status', () => {
    render(<ProjectTimeline startDate="2024-01-15" releaseDate="2024-06-01" status="Completed" />);
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should show N/A for missing release date', () => {
    render(<ProjectTimeline startDate="2024-01-15" releaseDate={null} status="In Progress" />);
    const naText = screen.getAllByText('N/A');
    expect(naText.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle different status values', () => {
    render(<ProjectTimeline startDate="2024-01-15" status="In Progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should handle different date formats', () => {
    render(<ProjectTimeline startDate="2023-06-20" releaseDate="2024-01-15" status="Published" />);
    expect(screen.getByText('Published')).toBeInTheDocument();
  });
});

