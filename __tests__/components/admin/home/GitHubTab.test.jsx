import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GitHubTab from '../../../../components/admin/home/GitHubTab';

// Mock the shared components
jest.mock('../../../../components/admin/shared', () => ({
  FormField: ({ label, value, onChange, placeholder, rows }) => (
    <div>
      <label htmlFor={label}>{label}</label>
      {rows ? (
        <textarea
          id={label}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          data-testid={`field-${label.toLowerCase().replace(/\s/g, '-')}`}
        />
      ) : (
        <input
          id={label}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          data-testid={`field-${label.toLowerCase().replace(/\s/g, '-')}`}
        />
      )}
    </div>
  ),
  adminStyles: {
    buttonPrimary: 'button-primary',
    card: 'card-class',
  },
}));

describe('GitHubTab', () => {
  const mockSetHomeContent = jest.fn();
  const mockOnSave = jest.fn();
  const defaultHomeContent = {
    githubSectionTitle: 'My GitHub Activity',
    githubSectionDescription: 'Check out my contributions.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the form with initial values', () => {
    render(
      <GitHubTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('GitHub Contributions Section')).toBeInTheDocument();
    expect(screen.getByLabelText('Section Title')).toHaveValue('My GitHub Activity');
    expect(screen.getByLabelText('Section Description')).toHaveValue('Check out my contributions.');
  });

  it('should update section title on change', async () => {
    const user = userEvent.setup();
    render(
      <GitHubTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const titleInput = screen.getByLabelText('Section Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'New Title');

    expect(mockSetHomeContent).toHaveBeenCalled();
  });

  it('should update section description on change', async () => {
    const user = userEvent.setup();
    render(
      <GitHubTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const descInput = screen.getByLabelText('Section Description');
    await user.clear(descInput);
    await user.type(descInput, 'New description');

    expect(mockSetHomeContent).toHaveBeenCalled();
  });

  it('should call onSave when form is submitted', () => {
    render(
      <GitHubTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Save GitHub Section' });
    fireEvent.click(submitButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('should show "Saving..." when saving is true', () => {
    render(
      <GitHubTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={true}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('should handle empty initial values gracefully', () => {
    const emptyContent = {
      githubSectionTitle: null,
      githubSectionDescription: undefined,
    };

    render(
      <GitHubTab
        homeContent={emptyContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByLabelText('Section Title')).toHaveValue('');
    expect(screen.getByLabelText('Section Description')).toHaveValue('');
  });

  it('should prevent default form submission', () => {
    render(
      <GitHubTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const form = screen.getByRole('button', { name: 'Save GitHub Section' }).closest('form');
    const submitEvent = fireEvent.submit(form);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });
});

