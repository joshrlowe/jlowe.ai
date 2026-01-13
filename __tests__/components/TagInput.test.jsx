/**
 * Tests for TagInput Component
 * 
 * Tests the tag input with add/remove functionality,
 * keyboard interactions, and accessibility.
 */

import React from 'react';
import { screen, renderWithoutProviders, waitFor } from '@/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import TagInput from '@/components/admin/shared/TagInput';

expect.extend(toHaveNoViolations);

describe('TagInput', () => {
  const defaultProps = {
    tags: [],
    onAdd: jest.fn(),
    onRemove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithoutProviders(<TagInput {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      renderWithoutProviders(<TagInput {...defaultProps} label="Tags" />);
      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('should not render label when not provided', () => {
      renderWithoutProviders(<TagInput {...defaultProps} />);
      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });

    it('should render input field', () => {
      renderWithoutProviders(<TagInput {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render Add button', () => {
      renderWithoutProviders(<TagInput {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    });

    it('should use default placeholder', () => {
      renderWithoutProviders(<TagInput {...defaultProps} />);
      expect(screen.getByPlaceholderText('Add item')).toBeInTheDocument();
    });

    it('should use custom placeholder', () => {
      renderWithoutProviders(
        <TagInput {...defaultProps} placeholder="Add a tag" />
      );
      expect(screen.getByPlaceholderText('Add a tag')).toBeInTheDocument();
    });
  });

  describe('displaying tags', () => {
    it('should display existing tags', () => {
      renderWithoutProviders(
        <TagInput {...defaultProps} tags={['React', 'JavaScript', 'Next.js']} />
      );
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('Next.js')).toBeInTheDocument();
    });

    it('should not render tags container when tags array is empty', () => {
      const { container } = renderWithoutProviders(<TagInput {...defaultProps} tags={[]} />);
      const tagsContainer = container.querySelector('.flex.flex-wrap.gap-2');
      expect(tagsContainer).not.toBeInTheDocument();
    });

    it('should render remove button for each tag', () => {
      renderWithoutProviders(<TagInput {...defaultProps} tags={['Tag1', 'Tag2']} />);
      const removeButtons = screen.getAllByRole('button', { name: '×' });
      expect(removeButtons).toHaveLength(2);
    });
  });

  describe('adding tags', () => {
    it('should call onAdd when Add button is clicked with value', async () => {
      const onAdd = jest.fn();
      const { user } = renderWithoutProviders(
        <TagInput {...defaultProps} onAdd={onAdd} />
      );
      
      await user.type(screen.getByRole('textbox'), 'NewTag');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      
      expect(onAdd).toHaveBeenCalledWith('NewTag');
    });

    it('should clear input after adding tag', async () => {
      const onAdd = jest.fn();
      const { user } = renderWithoutProviders(
        <TagInput {...defaultProps} onAdd={onAdd} />
      );
      
      await user.type(screen.getByRole('textbox'), 'NewTag');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('');
      });
    });

    it('should not add empty tag', async () => {
      const onAdd = jest.fn();
      const { user } = renderWithoutProviders(
        <TagInput {...defaultProps} onAdd={onAdd} />
      );
      
      await user.click(screen.getByRole('button', { name: 'Add' }));
      
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('should not add whitespace-only tag', async () => {
      const onAdd = jest.fn();
      const { user } = renderWithoutProviders(
        <TagInput {...defaultProps} onAdd={onAdd} />
      );
      
      await user.type(screen.getByRole('textbox'), '   ');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      
      expect(onAdd).not.toHaveBeenCalled();
    });

    it('should trim whitespace from tag', async () => {
      const onAdd = jest.fn();
      const { user } = renderWithoutProviders(
        <TagInput {...defaultProps} onAdd={onAdd} />
      );
      
      await user.type(screen.getByRole('textbox'), '  Trimmed Tag  ');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      
      expect(onAdd).toHaveBeenCalledWith('Trimmed Tag');
    });

    it('should not add duplicate tag', async () => {
      const onAdd = jest.fn();
      const { user } = renderWithoutProviders(
        <TagInput {...defaultProps} tags={['Existing']} onAdd={onAdd} />
      );
      
      await user.type(screen.getByRole('textbox'), 'Existing');
      await user.click(screen.getByRole('button', { name: 'Add' }));
      
      expect(onAdd).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interactions', () => {
    it('should add tag on Enter key', async () => {
      const onAdd = jest.fn();
      const { user } = renderWithoutProviders(
        <TagInput {...defaultProps} onAdd={onAdd} />
      );
      
      await user.type(screen.getByRole('textbox'), 'EnterTag');
      await user.keyboard('{Enter}');
      
      expect(onAdd).toHaveBeenCalledWith('EnterTag');
    });

    it('should prevent form submission on Enter', async () => {
      const onSubmit = jest.fn((e) => e.preventDefault());
      const { user } = renderWithoutProviders(
        <form onSubmit={onSubmit}>
          <TagInput {...defaultProps} />
        </form>
      );
      
      await user.type(screen.getByRole('textbox'), 'Tag');
      await user.keyboard('{Enter}');
      
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should clear input after Enter adds tag', async () => {
      const onAdd = jest.fn();
      const { user } = renderWithoutProviders(
        <TagInput {...defaultProps} onAdd={onAdd} />
      );
      
      await user.type(screen.getByRole('textbox'), 'EnterTag');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('');
      });
    });
  });

  describe('removing tags', () => {
    it('should call onRemove with index when remove button is clicked', async () => {
      const onRemove = jest.fn();
      const { user } = renderWithoutProviders(
        <TagInput {...defaultProps} tags={['Tag1', 'Tag2', 'Tag3']} onRemove={onRemove} />
      );
      
      const removeButtons = screen.getAllByRole('button', { name: '×' });
      await user.click(removeButtons[1]); // Remove second tag
      
      expect(onRemove).toHaveBeenCalledWith(1);
    });

    it('should call onRemove for first tag', async () => {
      const onRemove = jest.fn();
      const { user } = renderWithoutProviders(
        <TagInput {...defaultProps} tags={['First', 'Second']} onRemove={onRemove} />
      );
      
      const removeButtons = screen.getAllByRole('button', { name: '×' });
      await user.click(removeButtons[0]);
      
      expect(onRemove).toHaveBeenCalledWith(0);
    });
  });

  describe('custom className', () => {
    it('should apply className to container', () => {
      const { container } = renderWithoutProviders(
        <TagInput {...defaultProps} className="custom-container" />
      );
      expect(container.firstChild).toHaveClass('custom-container');
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithoutProviders(
        <TagInput {...defaultProps} label="Tags" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with tags', async () => {
      const { container } = renderWithoutProviders(
        <TagInput {...defaultProps} label="Tags" tags={['React', 'Next.js']} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have button type on Add button', () => {
      renderWithoutProviders(<TagInput {...defaultProps} />);
      const addButton = screen.getByRole('button', { name: 'Add' });
      expect(addButton).toHaveAttribute('type', 'button');
    });

    it('should have button type on remove buttons', () => {
      renderWithoutProviders(<TagInput {...defaultProps} tags={['Tag1']} />);
      const removeButton = screen.getByRole('button', { name: '×' });
      expect(removeButton).toHaveAttribute('type', 'button');
    });
  });
});



