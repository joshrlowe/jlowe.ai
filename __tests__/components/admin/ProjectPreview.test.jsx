import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectPreview from '../../../components/admin/ProjectPreview';

describe('ProjectPreview', () => {
  const mockOnHide = jest.fn();
  const mockProject = {
    title: 'Test Project',
    status: 'Published',
    featured: true,
    shortDescription: 'A short description of the project.',
    longDescription: 'A much longer description of the project.',
    tags: ['AI', 'Machine Learning'],
    techStack: ['Python', 'TensorFlow'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when show is false', () => {
    const { container } = render(
      <ProjectPreview project={mockProject} show={false} onHide={mockOnHide} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should return null when project is null', () => {
    const { container } = render(
      <ProjectPreview project={null} show={true} onHide={mockOnHide} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render the preview modal when show is true', () => {
    render(
      <ProjectPreview project={mockProject} show={true} onHide={mockOnHide} />
    );
    
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('should display short description', () => {
    render(
      <ProjectPreview project={mockProject} show={true} onHide={mockOnHide} />
    );
    
    expect(screen.getByText('A short description of the project.')).toBeInTheDocument();
  });

  it('should display long description', () => {
    render(
      <ProjectPreview project={mockProject} show={true} onHide={mockOnHide} />
    );
    
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('A much longer description of the project.')).toBeInTheDocument();
  });

  it('should display tech stack', () => {
    render(
      <ProjectPreview project={mockProject} show={true} onHide={mockOnHide} />
    );
    
    expect(screen.getByText('Tech Stack')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('TensorFlow')).toBeInTheDocument();
  });

  it('should display tags', () => {
    render(
      <ProjectPreview project={mockProject} show={true} onHide={mockOnHide} />
    );
    
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
  });

  it('should call onHide when close button is clicked', () => {
    render(
      <ProjectPreview project={mockProject} show={true} onHide={mockOnHide} />
    );
    
    const closeButton = screen.getByLabelText('Close preview');
    fireEvent.click(closeButton);
    
    expect(mockOnHide).toHaveBeenCalledTimes(1);
  });

  it('should call onHide when Close Preview button is clicked', () => {
    render(
      <ProjectPreview project={mockProject} show={true} onHide={mockOnHide} />
    );
    
    const closePreviewButton = screen.getByText('Close Preview');
    fireEvent.click(closePreviewButton);
    
    expect(mockOnHide).toHaveBeenCalledTimes(1);
  });

  it('should call onHide when backdrop is clicked', () => {
    render(
      <ProjectPreview project={mockProject} show={true} onHide={mockOnHide} />
    );
    
    // The backdrop is the div with bg-black/70
    const backdrop = document.querySelector('.bg-black\\/70');
    fireEvent.click(backdrop);
    
    expect(mockOnHide).toHaveBeenCalledTimes(1);
  });

  it('should show Untitled when title is missing', () => {
    const projectWithoutTitle = { ...mockProject, title: undefined };
    render(
      <ProjectPreview project={projectWithoutTitle} show={true} onHide={mockOnHide} />
    );
    
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('should show Draft status with yellow styling', () => {
    const draftProject = { ...mockProject, status: 'Draft' };
    render(
      <ProjectPreview project={draftProject} show={true} onHide={mockOnHide} />
    );
    
    const statusBadge = screen.getByText('Draft');
    expect(statusBadge).toHaveClass('bg-yellow-500/10');
    expect(statusBadge).toHaveClass('text-yellow-400');
  });

  it('should not show Featured badge when project is not featured', () => {
    const nonFeaturedProject = { ...mockProject, featured: false };
    render(
      <ProjectPreview project={nonFeaturedProject} show={true} onHide={mockOnHide} />
    );
    
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('should not show Tech Stack section when techStack is empty', () => {
    const projectWithoutTechStack = { ...mockProject, techStack: [] };
    render(
      <ProjectPreview project={projectWithoutTechStack} show={true} onHide={mockOnHide} />
    );
    
    expect(screen.queryByText('Tech Stack')).not.toBeInTheDocument();
  });

  it('should not show Tags section when tags is empty', () => {
    const projectWithoutTags = { ...mockProject, tags: [] };
    render(
      <ProjectPreview project={projectWithoutTags} show={true} onHide={mockOnHide} />
    );
    
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });

  it('should handle tags as JSON string', () => {
    const projectWithJsonTags = { 
      ...mockProject, 
      tags: JSON.stringify(['Tag1', 'Tag2']) 
    };
    render(
      <ProjectPreview project={projectWithJsonTags} show={true} onHide={mockOnHide} />
    );
    
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Tag1')).toBeInTheDocument();
    expect(screen.getByText('Tag2')).toBeInTheDocument();
  });

  it('should handle techStack as JSON string', () => {
    const projectWithJsonTechStack = { 
      ...mockProject, 
      techStack: JSON.stringify(['React', 'Node.js']) 
    };
    render(
      <ProjectPreview project={projectWithJsonTechStack} show={true} onHide={mockOnHide} />
    );
    
    expect(screen.getByText('Tech Stack')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });
});

