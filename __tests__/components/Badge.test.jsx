/**
 * Tests for Badge Component
 */

import React from 'react';
import { screen, renderWithoutProviders } from '@/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Badge } from '@/components/ui/Badge';

expect.extend(toHaveNoViolations);

describe('Badge', () => {
    describe('rendering', () => {
        it('should render without crashing', () => {
            renderWithoutProviders(<Badge>Badge Text</Badge>);
            expect(screen.getByText('Badge Text')).toBeInTheDocument();
        });

        it('should render children correctly', () => {
            renderWithoutProviders(<Badge>Custom Content</Badge>);
            expect(screen.getByText('Custom Content')).toBeInTheDocument();
        });

        it('should forward ref to element', () => {
            const ref = React.createRef();
            renderWithoutProviders(<Badge ref={ref}>Ref Test</Badge>);
            expect(ref.current).toBeInstanceOf(HTMLSpanElement);
        });

        it('should spread additional props', () => {
            renderWithoutProviders(
                <Badge data-testid="custom-badge" aria-label="Status badge">
                    Custom
                </Badge>
            );
            expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
        });
    });

    describe('variants', () => {
        it('should render primary variant by default', () => {
            const { container } = renderWithoutProviders(<Badge>Primary</Badge>);
            expect(container.firstChild.className).toContain('text-[#E85D04]');
        });

        it('should render secondary variant', () => {
            const { container } = renderWithoutProviders(<Badge variant="secondary">Secondary</Badge>);
            expect(container.firstChild.className).toContain('text-[#DC2626]');
        });

        it('should render accent variant', () => {
            const { container } = renderWithoutProviders(<Badge variant="accent">Accent</Badge>);
            expect(container.firstChild.className).toContain('text-[#FAA307]');
        });

        it('should render cool variant', () => {
            const { container } = renderWithoutProviders(<Badge variant="cool">Cool</Badge>);
            expect(container.firstChild.className).toContain('text-[#4CC9F0]');
        });

        it('should render success variant', () => {
            const { container } = renderWithoutProviders(<Badge variant="success">Success</Badge>);
            expect(container.firstChild.className).toContain('text-[#10B981]');
        });

        it('should render warning variant', () => {
            const { container } = renderWithoutProviders(<Badge variant="warning">Warning</Badge>);
            expect(container.firstChild.className).toContain('text-[#FAA307]');
        });

        it('should render error variant', () => {
            const { container } = renderWithoutProviders(<Badge variant="error">Error</Badge>);
            expect(container.firstChild.className).toContain('text-[#EF4444]');
        });

        it('should render info variant', () => {
            const { container } = renderWithoutProviders(<Badge variant="info">Info</Badge>);
            expect(container.firstChild.className).toContain('text-[#4CC9F0]');
        });

        it('should render neutral variant', () => {
            const { container } = renderWithoutProviders(<Badge variant="neutral">Neutral</Badge>);
            expect(container.firstChild.className).toContain('text-[#A3A3A3]');
        });
    });

    describe('sizes', () => {
        it('should render md size by default', () => {
            const { container } = renderWithoutProviders(<Badge>Medium</Badge>);
            expect(container.firstChild.className).toContain('px-2.5');
        });

        it('should render sm size', () => {
            const { container } = renderWithoutProviders(<Badge size="sm">Small</Badge>);
            expect(container.firstChild.className).toContain('px-2');
        });

        it('should render lg size', () => {
            const { container } = renderWithoutProviders(<Badge size="lg">Large</Badge>);
            expect(container.firstChild.className).toContain('px-3');
        });
    });

    describe('pulse effect', () => {
        it('should not have pulse by default', () => {
            const { container } = renderWithoutProviders(<Badge>No Pulse</Badge>);
            expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
        });

        it('should have pulse when pulse prop is true', () => {
            const { container } = renderWithoutProviders(<Badge pulse>Pulse</Badge>);
            expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
        });
    });

    describe('icon support', () => {
        it('should render icon when provided', () => {
            const icon = <span data-testid="badge-icon">★</span>;
            renderWithoutProviders(<Badge icon={icon}>With Icon</Badge>);
            expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
        });
    });

    describe('custom className', () => {
        it('should apply custom className', () => {
            const { container } = renderWithoutProviders(<Badge className="my-custom-class">Custom</Badge>);
            expect(container.firstChild).toHaveClass('my-custom-class');
        });

        it('should merge with default classes', () => {
            const { container } = renderWithoutProviders(<Badge className="extra-class">Merged</Badge>);
            expect(container.firstChild.className).toContain('extra-class');
            expect(container.firstChild.className).toContain('rounded-full');
        });
    });

    describe('accessibility', () => {
        it('should have no accessibility violations', async () => {
            const { container } = renderWithoutProviders(<Badge>Accessible Badge</Badge>);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should have no violations with different variants', async () => {
            const { container } = renderWithoutProviders(
                <div>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="error">Error</Badge>
                </div>
            );
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should have no violations with pulse', async () => {
            const { container } = renderWithoutProviders(<Badge pulse>Pulsing</Badge>);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });
    });
});
