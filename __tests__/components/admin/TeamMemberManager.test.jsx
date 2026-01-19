import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamMemberManager from '../../../components/admin/TeamMemberManager';

describe('TeamMemberManager', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component with empty team members', () => {
    render(<TeamMemberManager teamMembers={[]} onChange={mockOnChange} />);
    
    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email (optional)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('should render existing team members', () => {
    const teamMembers = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: null },
    ];
    render(<TeamMemberManager teamMembers={teamMembers} onChange={mockOnChange} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should add a new member with name only', async () => {
    const user = userEvent.setup();
    render(<TeamMemberManager teamMembers={[]} onChange={mockOnChange} />);
    
    const nameInput = screen.getByPlaceholderText('Name');
    await user.type(nameInput, 'Alice Johnson');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { name: 'Alice Johnson', email: null },
    ]);
  });

  it('should add a new member with name and email', async () => {
    const user = userEvent.setup();
    render(<TeamMemberManager teamMembers={[]} onChange={mockOnChange} />);
    
    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email (optional)');
    
    await user.type(nameInput, 'Bob Wilson');
    await user.type(emailInput, 'bob@example.com');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { name: 'Bob Wilson', email: 'bob@example.com' },
    ]);
  });

  it('should not add a member with empty name', async () => {
    const user = userEvent.setup();
    render(<TeamMemberManager teamMembers={[]} onChange={mockOnChange} />);
    
    const addButton = screen.getByRole('button', { name: 'Add' });
    expect(addButton).toBeDisabled();
    
    await user.click(addButton);
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should disable add button when name is only whitespace', async () => {
    const user = userEvent.setup();
    render(<TeamMemberManager teamMembers={[]} onChange={mockOnChange} />);
    
    const nameInput = screen.getByPlaceholderText('Name');
    await user.type(nameInput, '   ');
    
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('should remove a team member', async () => {
    const user = userEvent.setup();
    const teamMembers = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: null },
    ];
    render(<TeamMemberManager teamMembers={teamMembers} onChange={mockOnChange} />);
    
    const removeButtons = screen.getAllByRole('button', { name: '×' });
    await user.click(removeButtons[0]);
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { name: 'Jane Smith', email: null },
    ]);
  });

  it('should clear input fields after adding a member', async () => {
    const user = userEvent.setup();
    render(<TeamMemberManager teamMembers={[]} onChange={mockOnChange} />);
    
    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email (optional)');
    
    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    
    expect(nameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');
  });

  it('should trim whitespace from name and email', async () => {
    const user = userEvent.setup();
    render(<TeamMemberManager teamMembers={[]} onChange={mockOnChange} />);
    
    const nameInput = screen.getByPlaceholderText('Name');
    const emailInput = screen.getByPlaceholderText('Email (optional)');
    
    await user.type(nameInput, '  Trimmed Name  ');
    await user.type(emailInput, '  trimmed@email.com  ');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    
    expect(mockOnChange).toHaveBeenCalledWith([
      { name: 'Trimmed Name', email: 'trimmed@email.com' },
    ]);
  });

  it('should not display email if it is null', () => {
    const teamMembers = [{ name: 'No Email User', email: null }];
    render(<TeamMemberManager teamMembers={teamMembers} onChange={mockOnChange} />);
    
    expect(screen.getByText('No Email User')).toBeInTheDocument();
    expect(screen.queryByText('null')).not.toBeInTheDocument();
  });

  it('should handle undefined teamMembers prop', () => {
    render(<TeamMemberManager onChange={mockOnChange} />);
    
    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '×' })).not.toBeInTheDocument();
  });
});

