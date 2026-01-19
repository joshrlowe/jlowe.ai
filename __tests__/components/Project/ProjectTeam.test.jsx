/**
 * Tests for ProjectTeam component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectTeam from '../../../components/Project/ProjectTeam';

// Mock styles
jest.mock('@/styles/ProjectsPage.module.css', () => ({
  teamContainer: 'mock-team-container',
  teamHeader: 'mock-team-header',
  teamList: 'mock-team-list',
  teamMember: 'mock-team-member',
  memberName: 'mock-member-name',
  link: 'mock-link',
  redText: 'mock-red-text',
}));

describe('ProjectTeam', () => {
  describe('Empty/null team', () => {
    it('should show "Author" when team is null', () => {
      render(<ProjectTeam team={null} />);
      expect(screen.getByText('Author')).toBeInTheDocument();
    });

    it('should show "Author" when team is empty array', () => {
      render(<ProjectTeam team={[]} />);
      expect(screen.getByText('Author')).toBeInTheDocument();
    });
  });

  describe('Single member team', () => {
    it('should not show "Team" header for single member', () => {
      const team = [{ name: 'Josh Lowe', email: 'josh@example.com' }];
      render(<ProjectTeam team={team} />);
      expect(screen.queryByText('Team')).not.toBeInTheDocument();
    });

    it('should show member name', () => {
      const team = [{ name: 'Josh Lowe' }];
      render(<ProjectTeam team={team} />);
      expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
    });

    it('should show email link when email is provided', () => {
      const team = [{ name: 'Josh Lowe', email: 'josh@example.com' }];
      render(<ProjectTeam team={team} />);
      const emailLink = screen.getByText('Email');
      expect(emailLink).toHaveAttribute('href', 'mailto:josh@example.com');
    });

    it('should not show email link when email is not provided', () => {
      const team = [{ name: 'Josh Lowe' }];
      render(<ProjectTeam team={team} />);
      expect(screen.queryByText('Email')).not.toBeInTheDocument();
    });
  });

  describe('Multiple member team', () => {
    it('should show "Team" header for multiple members', () => {
      const team = [
        { name: 'Josh Lowe' },
        { name: 'Jane Doe' },
      ];
      render(<ProjectTeam team={team} />);
      expect(screen.getByText('Team')).toBeInTheDocument();
    });

    it('should show all member names', () => {
      const team = [
        { name: 'Josh Lowe', email: 'josh@example.com' },
        { name: 'Jane Doe', email: 'jane@example.com' },
        { name: 'Bob Smith' },
      ];
      render(<ProjectTeam team={team} />);
      expect(screen.getByText('Josh Lowe')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('should show email links for members with email', () => {
      const team = [
        { name: 'Josh Lowe', email: 'josh@example.com' },
        { name: 'Jane Doe', email: 'jane@example.com' },
      ];
      render(<ProjectTeam team={team} />);
      const emailLinks = screen.getAllByText('Email');
      expect(emailLinks).toHaveLength(2);
    });
  });
});

