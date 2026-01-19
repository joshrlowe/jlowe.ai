/**
 * Tests for DateRangePicker component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from '../../../components/admin/DateRangePicker';

describe('DateRangePicker', () => {
  const mockOnStartDateChange = jest.fn();
  const mockOnEndDateChange = jest.fn();

  const defaultProps = {
    startDate: '',
    endDate: '',
    onStartDateChange: mockOnStartDateChange,
    onEndDateChange: mockOnEndDateChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render two date inputs', () => {
    render(<DateRangePicker {...defaultProps} />);
    expect(document.querySelectorAll('input[type="date"]')).toHaveLength(2);
  });

  it('should render "to" separator', () => {
    render(<DateRangePicker {...defaultProps} />);
    expect(screen.getByText('to')).toBeInTheDocument();
  });

  it('should display start date value', () => {
    render(<DateRangePicker {...defaultProps} startDate="2024-01-15" />);
    const inputs = document.querySelectorAll('input[type="date"]');
    expect(inputs[0]).toHaveValue('2024-01-15');
  });

  it('should display end date value', () => {
    render(<DateRangePicker {...defaultProps} endDate="2024-06-30" />);
    const inputs = document.querySelectorAll('input[type="date"]');
    expect(inputs[1]).toHaveValue('2024-06-30');
  });

  it('should call onStartDateChange when start date changes', () => {
    render(<DateRangePicker {...defaultProps} />);
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0], { target: { value: '2024-01-15' } });
    expect(mockOnStartDateChange).toHaveBeenCalledWith('2024-01-15');
  });

  it('should call onEndDateChange when end date changes', () => {
    render(<DateRangePicker {...defaultProps} />);
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[1], { target: { value: '2024-06-30' } });
    expect(mockOnEndDateChange).toHaveBeenCalledWith('2024-06-30');
  });

  it('should call with null when start date is cleared', () => {
    render(<DateRangePicker {...defaultProps} startDate="2024-01-15" />);
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[0], { target: { value: '' } });
    expect(mockOnStartDateChange).toHaveBeenCalledWith(null);
  });

  it('should call with null when end date is cleared', () => {
    render(<DateRangePicker {...defaultProps} endDate="2024-06-30" />);
    const inputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(inputs[1], { target: { value: '' } });
    expect(mockOnEndDateChange).toHaveBeenCalledWith(null);
  });

  it('should handle null start date', () => {
    render(<DateRangePicker {...defaultProps} startDate={null} />);
    const inputs = document.querySelectorAll('input[type="date"]');
    expect(inputs[0]).toHaveValue('');
  });

  it('should handle null end date', () => {
    render(<DateRangePicker {...defaultProps} endDate={null} />);
    const inputs = document.querySelectorAll('input[type="date"]');
    expect(inputs[1]).toHaveValue('');
  });
});

