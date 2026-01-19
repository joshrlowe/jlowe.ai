/**
 * Tests for TechnicalCertifications component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import TechnicalCertifications from '../../../components/About/TechnicalCertifications/TechnicalCertifications';

// Mock CertificationCard
jest.mock('../../../components/About/CertificationCard/CertificationCard', () => {
  return function MockCertificationCard({ certification }) {
    return (
      <div data-testid="certification-card">
        <span>{certification.name}</span>
      </div>
    );
  };
});

describe('TechnicalCertifications', () => {
  describe('Empty state', () => {
    it('should return null when certifications is empty array', () => {
      const { container } = render(<TechnicalCertifications certifications={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when certifications is null', () => {
      const { container } = render(<TechnicalCertifications certifications={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should return null when certifications is undefined', () => {
      const { container } = render(<TechnicalCertifications />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Rendering with data', () => {
    const mockCertifications = [
      { name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2024-01' },
      { name: 'Google Cloud Professional', issuer: 'Google', date: '2023-06' },
      { name: 'Azure Administrator', issuer: 'Microsoft', date: '2023-03' },
    ];

    it('should render the section header', () => {
      render(<TechnicalCertifications certifications={mockCertifications} />);
      expect(screen.getByText('Technical Certifications')).toBeInTheDocument();
    });

    it('should render CertificationCard for each certification', () => {
      render(<TechnicalCertifications certifications={mockCertifications} />);
      const cards = screen.getAllByTestId('certification-card');
      expect(cards).toHaveLength(3);
    });

    it('should render certification names', () => {
      render(<TechnicalCertifications certifications={mockCertifications} />);
      expect(screen.getByText('AWS Solutions Architect')).toBeInTheDocument();
      expect(screen.getByText('Google Cloud Professional')).toBeInTheDocument();
      expect(screen.getByText('Azure Administrator')).toBeInTheDocument();
    });
  });

  describe('Grid layout', () => {
    it('should use grid layout for certifications', () => {
      const mockCertifications = [{ name: 'Cert 1' }, { name: 'Cert 2' }];
      const { container } = render(<TechnicalCertifications certifications={mockCertifications} />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });
});

