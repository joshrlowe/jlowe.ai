/**
 * Tests for Modal Component
 * 
 * Tests the modal dialog with open/close behavior,
 * accessibility, keyboard interactions, and styling.
 */

import React from 'react';
import { screen, renderWithoutProviders } from '@/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import Modal from '@/components/admin/shared/Modal';

expect.extend(toHaveNoViolations);

describe('Modal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        title: 'Test Modal',
        children: <p>Modal content</p>,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render when isOpen is true', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should not render when isOpen is false', () => {
            renderWithoutProviders(<Modal {...defaultProps} isOpen={false} />);
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('should render title correctly', () => {
            renderWithoutProviders(<Modal {...defaultProps} title="Custom Title" />);
            expect(screen.getByRole('heading', { name: 'Custom Title' })).toBeInTheDocument();
        });

        it('should render children correctly', () => {
            renderWithoutProviders(
                <Modal {...defaultProps}>
                    <p>Custom content</p>
                </Modal>
            );
            expect(screen.getByText('Custom content')).toBeInTheDocument();
        });

        it('should render close button', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
        });
    });

    describe('close behavior', () => {
        it('should call onClose when close button is clicked', async () => {
            const onClose = jest.fn();
            const { user } = renderWithoutProviders(
                <Modal {...defaultProps} onClose={onClose} />
            );

            await user.click(screen.getByRole('button', { name: /close modal/i }));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('should call onClose when backdrop is clicked', async () => {
            const onClose = jest.fn();
            const { user } = renderWithoutProviders(
                <Modal {...defaultProps} onClose={onClose} />
            );

            // Click on backdrop (the element with bg-black/70)
            const backdrop = document.querySelector('.bg-black\\/70');
            await user.click(backdrop);
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('should not call onClose when modal content is clicked', async () => {
            const onClose = jest.fn();
            const { user } = renderWithoutProviders(
                <Modal {...defaultProps} onClose={onClose} />
            );

            await user.click(screen.getByText('Modal content'));
            expect(onClose).not.toHaveBeenCalled();
        });
    });

    describe('maxWidth prop', () => {
        it('should apply default maxWidth', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveClass('max-w-4xl');
        });

        it('should apply custom maxWidth', () => {
            renderWithoutProviders(<Modal {...defaultProps} maxWidth="max-w-2xl" />);
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveClass('max-w-2xl');
        });

        it('should apply maxWidth for large modals', () => {
            renderWithoutProviders(<Modal {...defaultProps} maxWidth="max-w-6xl" />);
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveClass('max-w-6xl');
        });
    });

    describe('custom className', () => {
        it('should apply custom className to modal', () => {
            renderWithoutProviders(
                <Modal {...defaultProps} className="custom-modal-class" />
            );
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveClass('custom-modal-class');
        });
    });

    describe('styling', () => {
        it('should have fixed positioning', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const container = document.querySelector('.fixed.inset-0');
            expect(container).toBeInTheDocument();
        });

        it('should have high z-index', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const container = document.querySelector('.z-50');
            expect(container).toBeInTheDocument();
        });

        it('should center the modal', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const container = document.querySelector('.flex.items-center.justify-center');
            expect(container).toBeInTheDocument();
        });

        it('should have scrollable content area', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveClass('overflow-y-auto');
        });

        it('should have max height for viewport', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveClass('max-h-[90vh]');
        });
    });

    describe('backdrop', () => {
        it('should render backdrop', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const backdrop = document.querySelector('.bg-black\\/70');
            expect(backdrop).toBeInTheDocument();
        });

        it('should have aria-hidden on backdrop', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const backdrop = document.querySelector('.bg-black\\/70');
            expect(backdrop).toHaveAttribute('aria-hidden', 'true');
        });
    });

    describe('accessibility', () => {
        it('should have dialog role', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should have aria-modal attribute', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-modal', 'true');
        });

        it('should have aria-labelledby pointing to title', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
        });

        it('should have id on title matching aria-labelledby', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const title = screen.getByRole('heading');
            expect(title).toHaveAttribute('id', 'modal-title');
        });

        it('should have close button with aria-label', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const closeButton = screen.getByRole('button', { name: /close modal/i });
            expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
        });

        it('should have no accessibility violations', async () => {
            const { container } = renderWithoutProviders(<Modal {...defaultProps} />);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('should have no violations with different content', async () => {
            const { container } = renderWithoutProviders(
                <Modal {...defaultProps} title="Form Modal">
                    <form>
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" />
                        <button type="submit">Submit</button>
                    </form>
                </Modal>
            );
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });
    });

    describe('close button', () => {
        it('should have visual close icon', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const closeButton = screen.getByRole('button', { name: /close modal/i });
            const svg = closeButton.querySelector('svg');
            expect(svg).toBeInTheDocument();
        });

        it('should have hover styles', () => {
            renderWithoutProviders(<Modal {...defaultProps} />);
            const closeButton = screen.getByRole('button', { name: /close modal/i });
            expect(closeButton.className).toContain('hover:');
        });
    });
});




