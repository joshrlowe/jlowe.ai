/**
 * Tests for ProfessionalDevelopment component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfessionalDevelopment from '../../../components/About/ProfessionalDevelopment/ProfessionalDevelopment';

describe('ProfessionalDevelopment', () => {
  describe('Empty state', () => {
    it('should return null when development is empty array', () => {
      const { container } = render(<ProfessionalDevelopment development={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when development is null', () => {
      const { container } = render(<ProfessionalDevelopment development={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when development is undefined', () => {
      const { container } = render(<ProfessionalDevelopment />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Rendering with data', () => {
    const mockDevelopment = [
      {
        type: 'training',
        title: 'Machine Learning Workshop',
        organization: 'Tech Corp',
        description: 'Led a 3-day workshop on ML fundamentals',
        date: '2024-03',
        impact: 'Trained 50+ engineers',
      },
      {
        type: 'mentorship',
        title: 'Junior Developer Mentorship',
        organization: 'Internal Program',
        description: 'Mentored 3 junior developers',
        date: '2023-2024',
      },
      {
        type: 'speaking',
        title: 'AI Conference Talk',
        organization: 'Tech Summit 2024',
        date: '2024-06',
      },
      {
        type: 'course',
        title: 'Advanced React Patterns',
        organization: 'Online Course',
        date: '2024-01',
      },
      {
        type: 'other',
        title: 'Open Source Contribution',
        description: 'Regular contributor to popular libraries',
      },
    ];

    it('should render the section header', () => {
      render(<ProfessionalDevelopment development={mockDevelopment} />);
      // "Professional Development" appears as both section header and as "other" type label
      const headers = screen.getAllByText('Professional Development');
      expect(headers.length).toBeGreaterThanOrEqual(1);
    });

    it('should render training items', () => {
      render(<ProfessionalDevelopment development={mockDevelopment} />);
      expect(screen.getByText('Machine Learning Workshop')).toBeInTheDocument();
      expect(screen.getByText('Training Delivered')).toBeInTheDocument();
    });

    it('should render mentorship items', () => {
      render(<ProfessionalDevelopment development={mockDevelopment} />);
      expect(screen.getByText('Junior Developer Mentorship')).toBeInTheDocument();
      expect(screen.getByText('Mentorship')).toBeInTheDocument();
    });

    it('should render speaking items', () => {
      render(<ProfessionalDevelopment development={mockDevelopment} />);
      expect(screen.getByText('AI Conference Talk')).toBeInTheDocument();
      expect(screen.getByText('Speaking & Publications')).toBeInTheDocument();
    });

    it('should render course items', () => {
      render(<ProfessionalDevelopment development={mockDevelopment} />);
      expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
      expect(screen.getByText('Courses & Learning')).toBeInTheDocument();
    });

    it('should render organization names', () => {
      render(<ProfessionalDevelopment development={mockDevelopment} />);
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Internal Program')).toBeInTheDocument();
    });

    it('should render descriptions', () => {
      render(<ProfessionalDevelopment development={mockDevelopment} />);
      expect(screen.getByText('Led a 3-day workshop on ML fundamentals')).toBeInTheDocument();
    });

    it('should render dates', () => {
      render(<ProfessionalDevelopment development={mockDevelopment} />);
      expect(screen.getByText('2024-03')).toBeInTheDocument();
      expect(screen.getByText('2024-06')).toBeInTheDocument();
    });

    it('should render impact metrics when provided', () => {
      render(<ProfessionalDevelopment development={mockDevelopment} />);
      expect(screen.getByText('Trained 50+ engineers')).toBeInTheDocument();
    });

    it('should render subtitle text', () => {
      render(<ProfessionalDevelopment development={mockDevelopment} />);
      expect(screen.getByText('Continuous growth and knowledge sharing')).toBeInTheDocument();
    });
  });

  describe('Grouping by type', () => {
    it('should group items by type', () => {
      const development = [
        { type: 'training', title: 'Training 1' },
        { type: 'training', title: 'Training 2' },
        { type: 'mentorship', title: 'Mentorship 1' },
      ];
      render(<ProfessionalDevelopment development={development} />);
      
      // Should have only one "Training Delivered" header for both trainings
      const trainingHeaders = screen.getAllByText('Training Delivered');
      expect(trainingHeaders).toHaveLength(1);
    });

    it('should use "other" type for items without type', () => {
      const development = [
        { title: 'Unknown Type Item' }, // No type specified
      ];
      render(<ProfessionalDevelopment development={development} />);
      expect(screen.getByText('Unknown Type Item')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle item without organization', () => {
      const development = [{ type: 'training', title: 'Solo Training' }];
      render(<ProfessionalDevelopment development={development} />);
      expect(screen.getByText('Solo Training')).toBeInTheDocument();
    });

    it('should handle item without description', () => {
      const development = [{ type: 'training', title: 'Brief Training', organization: 'Corp' }];
      render(<ProfessionalDevelopment development={development} />);
      expect(screen.getByText('Brief Training')).toBeInTheDocument();
    });

    it('should handle item without date', () => {
      const development = [{ type: 'training', title: 'Undated Training' }];
      render(<ProfessionalDevelopment development={development} />);
      expect(screen.getByText('Undated Training')).toBeInTheDocument();
    });

    it('should handle item without impact', () => {
      const development = [{ type: 'training', title: 'No Impact Training' }];
      render(<ProfessionalDevelopment development={development} />);
      expect(screen.getByText('No Impact Training')).toBeInTheDocument();
    });
  });
});

