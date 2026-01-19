import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HeroTab from '../../../../components/admin/home/HeroTab';

// Mock the shared components
jest.mock('../../../../components/admin/shared', () => ({
  FormField: ({ label, value, onChange, placeholder }) => (
    <div>
      <label htmlFor={label}>{label}</label>
      <input
        id={label}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        data-testid={`field-${label.toLowerCase().replace(/\s/g, '-').replace(/[()]/g, '')}`}
      />
    </div>
  ),
  adminStyles: {
    buttonPrimary: 'button-primary',
    buttonDanger: 'button-danger',
    card: 'card-class',
    label: 'label-class',
    input: 'input-class',
  },
}));

describe('HeroTab', () => {
  const mockSetHomeContent = jest.fn();
  const mockOnSave = jest.fn();
  const defaultHomeContent = {
    typingIntro: 'I build',
    heroTitle: 'intelligent AI systems',
    typingStrings: ['amazing websites', 'powerful apps'],
    primaryCta: { text: 'Start a Project', href: '/contact' },
    secondaryCta: { text: 'View My Work', href: '/projects' },
    techBadges: [
      { name: 'React', color: '#61DAFB' },
      { name: 'Node.js', color: '#339933' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the hero tab with all sections', () => {
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Typing Animation')).toBeInTheDocument();
    expect(screen.getByText('Call to Action Buttons')).toBeInTheDocument();
    expect(screen.getByText('Tech Badges')).toBeInTheDocument();
  });

  it('should render typing strings', () => {
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue('amazing websites')).toBeInTheDocument();
    expect(screen.getByDisplayValue('powerful apps')).toBeInTheDocument();
  });

  it('should add a typing string', async () => {
    const user = userEvent.setup();
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const addButton = screen.getByRole('button', { name: '+ Add String' });
    await user.click(addButton);

    expect(mockSetHomeContent).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the callback function
    const callback = mockSetHomeContent.mock.calls[0][0];
    const result = callback(defaultHomeContent);
    expect(result.typingStrings).toHaveLength(3);
    expect(result.typingStrings[2]).toBe('');
  });

  it('should update a typing string', async () => {
    const user = userEvent.setup();
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const firstInput = screen.getByDisplayValue('amazing websites');
    await user.clear(firstInput);
    await user.type(firstInput, 'new value');

    expect(mockSetHomeContent).toHaveBeenCalled();
  });

  it('should remove a typing string', async () => {
    const user = userEvent.setup();
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: '✕' });
    await user.click(removeButtons[0]); // First remove button for typing strings

    expect(mockSetHomeContent).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the callback function
    const callback = mockSetHomeContent.mock.calls[0][0];
    const result = callback(defaultHomeContent);
    expect(result.typingStrings).toHaveLength(1);
    expect(result.typingStrings[0]).toBe('powerful apps');
  });

  it('should add a tech badge', async () => {
    const user = userEvent.setup();
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const addButton = screen.getByRole('button', { name: '+ Add Badge' });
    await user.click(addButton);

    expect(mockSetHomeContent).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the callback function
    const callback = mockSetHomeContent.mock.calls[0][0];
    const result = callback(defaultHomeContent);
    expect(result.techBadges).toHaveLength(3);
    expect(result.techBadges[2]).toEqual({ name: '', color: '#E85D04' });
  });

  it('should update a tech badge name', async () => {
    const user = userEvent.setup();
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const reactInput = screen.getByDisplayValue('React');
    await user.clear(reactInput);
    await user.type(reactInput, 'Vue');

    expect(mockSetHomeContent).toHaveBeenCalled();
  });

  it('should remove a tech badge', async () => {
    const user = userEvent.setup();
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    // Get all remove buttons (2 for typing strings + 2 for tech badges)
    const removeButtons = screen.getAllByRole('button', { name: '✕' });
    // The tech badge remove buttons come after typing string ones
    await user.click(removeButtons[2]); // First tech badge remove button

    expect(mockSetHomeContent).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the callback function
    const callback = mockSetHomeContent.mock.calls[0][0];
    const result = callback(defaultHomeContent);
    expect(result.techBadges).toHaveLength(1);
    expect(result.techBadges[0].name).toBe('Node.js');
  });

  it('should call onSave when Save button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Save Hero Content' });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('should show "Saving..." when saving is true', () => {
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={true}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('should update hero title', async () => {
    const user = userEvent.setup();
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const heroTitleInput = screen.getByLabelText('Hero Title (main display)');
    await user.clear(heroTitleInput);
    await user.type(heroTitleInput, 'new hero title');

    expect(mockSetHomeContent).toHaveBeenCalled();
  });

  it('should update typing intro', async () => {
    const user = userEvent.setup();
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const typingIntroInput = screen.getByLabelText('Intro Text (before typing)');
    await user.clear(typingIntroInput);
    await user.type(typingIntroInput, 'We create');

    expect(mockSetHomeContent).toHaveBeenCalled();
  });

  it('should update primary CTA text', async () => {
    const user = userEvent.setup();
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const primaryCtaTextInput = screen.getByLabelText('Primary CTA Text');
    await user.clear(primaryCtaTextInput);
    await user.type(primaryCtaTextInput, 'Get Started');

    expect(mockSetHomeContent).toHaveBeenCalled();
  });

  it('should update secondary CTA link', async () => {
    const user = userEvent.setup();
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    const secondaryCtaLinkInput = screen.getByLabelText('Secondary CTA Link');
    await user.clear(secondaryCtaLinkInput);
    await user.type(secondaryCtaLinkInput, '/portfolio');

    expect(mockSetHomeContent).toHaveBeenCalled();
  });

  it('should render tech badge previews', () => {
    render(
      <HeroTab
        homeContent={defaultHomeContent}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    // Badge previews show the name
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });

  it('should handle empty optional CTA fields', () => {
    const contentWithEmptyCta = {
      ...defaultHomeContent,
      primaryCta: undefined,
      secondaryCta: undefined,
    };

    render(
      <HeroTab
        homeContent={contentWithEmptyCta}
        setHomeContent={mockSetHomeContent}
        saving={false}
        onSave={mockOnSave}
      />
    );

    // Should render without crashing
    expect(screen.getByLabelText('Primary CTA Text')).toHaveValue('');
    expect(screen.getByLabelText('Primary CTA Link')).toHaveValue('');
  });
});
