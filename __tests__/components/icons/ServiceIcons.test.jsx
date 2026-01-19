/**
 * Tests for ServiceIcons component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { getServiceIcon, ServiceIcon, ICON_KEYS } from '../../../components/icons/ServiceIcons';

describe('ServiceIcons', () => {
  describe('getServiceIcon', () => {
    it('should return an SVG element', () => {
      const icon = getServiceIcon('computer');
      const { container } = render(icon);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render computer icon', () => {
      const { container } = render(getServiceIcon('computer'));
      expect(container.querySelector('svg')).toHaveClass('w-7', 'h-7');
    });

    it('should render database icon', () => {
      const { container } = render(getServiceIcon('database'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render code icon', () => {
      const { container } = render(getServiceIcon('code'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render cloud icon', () => {
      const { container } = render(getServiceIcon('cloud'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render chart icon', () => {
      const { container } = render(getServiceIcon('chart'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render book icon', () => {
      const { container } = render(getServiceIcon('book'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render brain icon', () => {
      const { container } = render(getServiceIcon('brain'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render rocket icon', () => {
      const { container } = render(getServiceIcon('rocket'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render cog icon', () => {
      const { container } = render(getServiceIcon('cog'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render shield icon', () => {
      const { container } = render(getServiceIcon('shield'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render arrow icon', () => {
      const { container } = render(getServiceIcon('arrow'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render close icon', () => {
      const { container } = render(getServiceIcon('close'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render check icon', () => {
      const { container } = render(getServiceIcon('check'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render plus icon', () => {
      const { container } = render(getServiceIcon('plus'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render minus icon', () => {
      const { container } = render(getServiceIcon('minus'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render github icon', () => {
      const { container } = render(getServiceIcon('github'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should fall back to computer icon for unknown keys', () => {
      const { container } = render(getServiceIcon('unknown-icon'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      const { container } = render(getServiceIcon('computer', 'w-10 h-10'));
      expect(container.querySelector('svg')).toHaveClass('w-10', 'h-10');
    });
  });

  describe('ServiceIcon component', () => {
    it('should render with name prop', () => {
      const { container } = render(<ServiceIcon name="database" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should accept className prop', () => {
      const { container } = render(<ServiceIcon name="code" className="w-8 h-8" />);
      expect(container.querySelector('svg')).toHaveClass('w-8', 'h-8');
    });

    it('should use default className when not provided', () => {
      const { container } = render(<ServiceIcon name="cloud" />);
      expect(container.querySelector('svg')).toHaveClass('w-7', 'h-7');
    });
  });

  describe('ICON_KEYS', () => {
    it('should export array of icon keys', () => {
      expect(Array.isArray(ICON_KEYS)).toBe(true);
      expect(ICON_KEYS.length).toBeGreaterThan(0);
    });

    it('should include common icons', () => {
      expect(ICON_KEYS).toContain('computer');
      expect(ICON_KEYS).toContain('database');
      expect(ICON_KEYS).toContain('code');
      expect(ICON_KEYS).toContain('cloud');
    });

    it('should include all defined icons', () => {
      expect(ICON_KEYS).toContain('chart');
      expect(ICON_KEYS).toContain('book');
      expect(ICON_KEYS).toContain('brain');
      expect(ICON_KEYS).toContain('rocket');
      expect(ICON_KEYS).toContain('cog');
      expect(ICON_KEYS).toContain('shield');
      expect(ICON_KEYS).toContain('arrow');
      expect(ICON_KEYS).toContain('close');
      expect(ICON_KEYS).toContain('check');
      expect(ICON_KEYS).toContain('plus');
      expect(ICON_KEYS).toContain('minus');
      expect(ICON_KEYS).toContain('github');
    });
  });
});

