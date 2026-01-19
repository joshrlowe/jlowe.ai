/**
 * Tests for ProjectTechStack component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ProjectTechStack from '../../../components/Project/ProjectTechStack';

// Mock styles
jest.mock('@/styles/ProjectsPage.module.css', () => ({
  paragraphText: 'mock-paragraph-text',
  emphasisText: 'mock-emphasis-text',
  link: 'mock-link',
  redText: 'mock-red-text',
}));

describe('ProjectTechStack', () => {
  describe('High-level tech stack', () => {
    it('should render full stack framework', () => {
      const techStack = { fullStackFramework: 'Next.js' };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('Technology Stack:')).toBeInTheDocument();
      expect(screen.getByText('Next.js')).toBeInTheDocument();
    });

    it('should render backend framework', () => {
      const techStack = { backendFramework: 'Express' };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('Express')).toBeInTheDocument();
    });

    it('should render frontend framework', () => {
      const techStack = { frontendFramework: 'React' };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('should render database', () => {
      const techStack = { database: 'PostgreSQL' };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    });

    it('should combine multiple stack items', () => {
      const techStack = {
        fullStackFramework: 'Next.js',
        database: 'PostgreSQL',
      };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText(/Next\.js, PostgreSQL/)).toBeInTheDocument();
    });
  });

  describe('Languages', () => {
    it('should render single language', () => {
      const techStack = { languages: ['JavaScript'] };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('Language:')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });

    it('should render multiple languages with plural', () => {
      const techStack = { languages: ['JavaScript', 'TypeScript', 'Python'] };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('Languages:')).toBeInTheDocument();
    });

    it('should not render languages section when empty', () => {
      const techStack = { languages: [] };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.queryByText('Language')).not.toBeInTheDocument();
    });
  });

  describe('API Integrations', () => {
    it('should render API integrations with links', () => {
      const techStack = {
        apiIntegrations: [
          { name: 'Stripe', url: 'https://stripe.com' },
        ],
      };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('API Integration:')).toBeInTheDocument();
      const link = screen.getByText('Stripe');
      expect(link).toHaveAttribute('href', 'https://stripe.com');
    });

    it('should render multiple API integrations with plural', () => {
      const techStack = {
        apiIntegrations: [
          { name: 'Stripe', url: 'https://stripe.com' },
          { name: 'Twilio', url: 'https://twilio.com' },
        ],
      };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('API Integrations:')).toBeInTheDocument();
    });
  });

  describe('Web Servers', () => {
    it('should render single web server', () => {
      const techStack = { webServers: ['nginx'] };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('Web Server:')).toBeInTheDocument();
      expect(screen.getByText('nginx')).toBeInTheDocument();
    });

    it('should render multiple web servers', () => {
      const techStack = { webServers: ['nginx', 'Apache'] };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('Web Servers:')).toBeInTheDocument();
    });
  });

  describe('Deployment Tools', () => {
    it('should render deployment tools', () => {
      const techStack = {
        deploymentTools: [{ name: 'Docker' }, { name: 'Kubernetes' }],
      };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('Deployment Tools:')).toBeInTheDocument();
      expect(screen.getByText('Docker, Kubernetes')).toBeInTheDocument();
    });
  });

  describe('Additional Tools', () => {
    it('should render additional tools', () => {
      const techStack = {
        additionalTools: [{ name: 'ESLint' }, { name: 'Prettier' }],
      };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('Additional Tools:')).toBeInTheDocument();
      expect(screen.getByText('ESLint, Prettier')).toBeInTheDocument();
    });
  });

  describe('Operating System', () => {
    it('should render operating system', () => {
      const techStack = { operatingSystem: 'Ubuntu 22.04' };
      render(<ProjectTechStack techStack={techStack} />);
      expect(screen.getByText('Operating System:')).toBeInTheDocument();
      expect(screen.getByText('Ubuntu 22.04')).toBeInTheDocument();
    });
  });

  describe('Empty tech stack', () => {
    it('should render nothing for empty tech stack', () => {
      const techStack = {};
      const { container } = render(<ProjectTechStack techStack={techStack} />);
      expect(container.textContent).toBe('');
    });
  });
});

