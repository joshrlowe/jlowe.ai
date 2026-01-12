/**
 * Tests for Button Component
 */

import React from 'react';
import { screen, renderWithoutProviders } from '@/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@/components/ui/Button';

expect.extend(toHaveNoViolations);

describe('Button', () => {
    describe('rendering', () => {
        it('should render without crashing', () => {
            renderWithoutProviders(<Button>Click me</Button>);
            expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
        });

        it('should render children correctly', () => {
            renderWithoutProviders(<Button>Button Text</Button>);
            expect(screen.getByText('Button Text')).toBeInTheDocument();
        });

        it('should forward ref to button element', () => {
            const ref = React.createRef();
            renderWithoutProviders(<Button ref={ref}>Ref Test</Button>);
            expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        });

        it('should spread additional props', () => {
            renderWithoutProviders(
                <Button data-testid="custom-button" aria-label="Custom button">
                    Custom
                </Button>
            );
            expect(screen.getByTestId('custom-button')).toBeInTheDocument();
        });
    });

    describe('variants', () => {
        it('should render primary variant by default', () => {
            renderWithoutProviders(<Button>Primary</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('from-[#E85D04]');
        });

        it('should render secondary variant', () => {
            renderWithoutProviders(<Button variant="secondary">Secondary</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('bg-transparent');
        });

        it('should render cool variant', () => {
            renderWithoutProviders(<Button variant="cool">Cool</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('from-[#4CC9F0]');
        });

        it('should render ghost variant', () => {
            renderWithoutProviders(<Button variant="ghost">Ghost</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('bg-transparent');
        });
    });

    describe('sizes', () => {
        it('should render md size by default', () => {
            renderWithoutProviders(<Button>Medium</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('px-4');
        });

        it('should render sm size', () => {
            renderWithoutProviders(<Button size="sm">Small</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('px-3');
        });

        it('should render lg size', () => {
            renderWithoutProviders(<Button size="lg">Large</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('px-6');
        });

        it('should render xl size', () => {
            renderWithoutProviders(<Button size="xl">Extra Large</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('px-8');
        });
    });

    describe('states', () => {
        it('should be disabled when disabled prop is true', () => {
            renderWithoutProviders(<Button disabled>Disabled</Button>);
            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });

        it('should show loading state', () => {
            renderWithoutProviders(<Button loading>Loading</Button>);
            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
            expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
        });

        it('should be disabled when loading', () => {
            renderWithoutProviders(<Button loading>Loading</Button>);
            expect(screen.getByRole('button')).toBeDisabled();
        });
    });

    describe('link behavior', () => {
        it('should render as link when href is provided', () => {
            renderWithoutProviders(<Button href="/test">Link Button</Button>);
            const link = screen.getByRole('link', { name: 'Link Button' });
            expect(link).toHaveAttribute('href', '/test');
        });
    });

    describe('icon support', () => {
        it('should render icon on right by default', () => {
            const icon = <span data-testid="icon">→</span>;
            renderWithoutProviders(<Button icon={icon}>With Icon</Button>);
            expect(screen.getByTestId('icon')).toBeInTheDocument();
        });

        it('should render icon on left when iconPosition is left', () => {
            const icon = <span data-testid="left-icon">←</span>;
            renderWithoutProviders(<Button icon={icon} iconPosition="left">With Icon</Button>);
            expect(screen.getByTestId('left-icon')).toBeInTheDocument();
        });
    });

    describe('custom className', () => {
        it('should apply custom className', () => {
            renderWithoutProviders(<Button className="my-custom-class">Custom</Button>);
            const button = screen.getByRole('button');
            expect(button).toHaveClass('my-custom-class');
        });
    });

    describe('accessibility', () => {
        it('should have no accessibility violations', async () => {
            const { container } = renderWithoutProviders(<Button>Accessible Button</Button>);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should have no violations when disabled', async () => {
            const { container } = renderWithoutProviders(<Button disabled>Disabled Button</Button>);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should have no violations with different variants', async () => {
            const { container } = renderWithoutProviders(
                <div>
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="cool">Cool</Button>
                    <Button variant="ghost">Ghost</Button>
                </div>
            );
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });
    });

    describe('interactions', () => {
        it('should call onClick when clicked', async () => {
            const onClick = jest.fn();
            const { user } = renderWithoutProviders(<Button onClick={onClick}>Click me</Button>);

            await user.click(screen.getByRole('button'));

            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('should not call onClick when disabled', async () => {
            const onClick = jest.fn();
            const { user } = renderWithoutProviders(<Button onClick={onClick} disabled>Click me</Button>);

            await user.click(screen.getByRole('button'));

            expect(onClick).not.toHaveBeenCalled();
        });
    });
});
