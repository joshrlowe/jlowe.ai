import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServicesTab from '../../../../components/admin/home/ServicesTab';

// Mock the shared components
jest.mock('../../../../components/admin/shared', () => ({
  FormField: ({ label, value, onChange, placeholder, rows, options }) => (
    <div>
      <label htmlFor={label}>{label}</label>
      {options ? (
        <select
          id={label}
          value={value}
          onChange={onChange}
          data-testid={`field-${label.toLowerCase()}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : rows ? (
        <textarea
          id={label}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          data-testid={`field-${label.toLowerCase()}`}
        />
      ) : (
        <input
          id={label}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          data-testid={`field-${label.toLowerCase()}`}
        />
      )}
    </div>
  ),
  adminStyles: {
    buttonPrimary: 'button-primary',
    card: 'card-class',
  },
  ICON_OPTIONS: [
    { value: 'computer', label: 'Computer' },
    { value: 'cloud', label: 'Cloud' },
  ],
  VARIANT_OPTIONS: [
    { value: 'primary', label: 'Primary' },
    { value: 'secondary', label: 'Secondary' },
  ],
}));

describe('ServicesTab', () => {
  const mockSetHomeContent = jest.fn();
  const mockOnSave = jest.fn();
  const defaultHomeContent = {
    servicesTitle: 'My Services',
    servicesSubtitle: 'What I offer',
    services: [
      {
        iconKey: 'computer',
        title: 'Web Development',
        description: 'Build awesome websites.',
        variant: 'primary',
      },
      {
        iconKey: 'cloud',
        title: 'Cloud Solutions',
        description: 'Scalable cloud infrastructure.',
        variant: 'secondary',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the services tab with header fields', () => {
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Section Header')).toBeInTheDocument();
    expect(screen.getByLabelText('Section Title')).toHaveValue('My Services');
    expect(screen.getByLabelText('Section Subtitle')).toHaveValue('What I offer');
  });

  it('should display the count of services', () => {
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Services (2)')).toBeInTheDocument();
  });

  it('should render each service card', () => {
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Service #1')).toBeInTheDocument();
    expect(screen.getByText('Service #2')).toBeInTheDocument();
  });

  it('should add a new service when Add Service is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const addButton = screen.getByRole('button', { name: '+ Add Service' });
    await user.click(addButton);

    expect(mockSetHomeContent).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the callback function
    const callback = mockSetHomeContent.mock.calls[0][0];
    const result = callback(defaultHomeContent);
    expect(result.services).toHaveLength(3);
    expect(result.services[2]).toEqual({
      iconKey: 'computer',
      title: '',
      description: '',
      variant: 'primary',
    });
  });

  it('should remove a service when Delete is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    expect(mockSetHomeContent).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the callback function
    const callback = mockSetHomeContent.mock.calls[0][0];
    const result = callback(defaultHomeContent);
    expect(result.services).toHaveLength(1);
    expect(result.services[0].title).toBe('Cloud Solutions');
  });

  it('should move a service up when ↑ is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    // The second service's up button
    const upButtons = screen.getAllByRole('button', { name: '↑' });
    await user.click(upButtons[1]); // Second service's up button

    expect(mockSetHomeContent).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the callback function
    const callback = mockSetHomeContent.mock.calls[0][0];
    const result = callback(defaultHomeContent);
    expect(result.services[0].title).toBe('Cloud Solutions');
    expect(result.services[1].title).toBe('Web Development');
  });

  it('should move a service down when ↓ is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    // The first service's down button
    const downButtons = screen.getAllByRole('button', { name: '↓' });
    await user.click(downButtons[0]); // First service's down button

    expect(mockSetHomeContent).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the callback function
    const callback = mockSetHomeContent.mock.calls[0][0];
    const result = callback(defaultHomeContent);
    expect(result.services[0].title).toBe('Cloud Solutions');
    expect(result.services[1].title).toBe('Web Development');
  });

  it('should disable ↑ button for first service', () => {
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const upButtons = screen.getAllByRole('button', { name: '↑' });
    expect(upButtons[0]).toBeDisabled();
  });

  it('should disable ↓ button for last service', () => {
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const downButtons = screen.getAllByRole('button', { name: '↓' });
    expect(downButtons[downButtons.length - 1]).toBeDisabled();
  });

  it('should call onSave when Save Services is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Save Services' });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('should show "Saving..." when saving is true', () => {
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={true}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('should update service title when changed', async () => {
    const user = userEvent.setup();
    render(
      <ServicesTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    // Get all Title inputs (one for section title, one for each service)
    const titleInputs = screen.getAllByLabelText('Title');
    await user.clear(titleInputs[0]);
    await user.type(titleInputs[0], 'Updated Service');

    expect(mockSetHomeContent).toHaveBeenCalled();
  });

  it('should not move service when at boundary', async () => {
    const user = userEvent.setup();
    const singleServiceContent = {
      ...defaultHomeContent,
      services: [defaultHomeContent.services[0]],
    };
    
    render(
      <ServicesTab
        homeContent={singleServiceContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const upButton = screen.getByRole('button', { name: '↑' });
    const downButton = screen.getByRole('button', { name: '↓' });
    
    expect(upButton).toBeDisabled();
    expect(downButton).toBeDisabled();
  });
});

