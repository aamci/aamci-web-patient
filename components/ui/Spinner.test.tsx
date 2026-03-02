import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner, Loading, PageLoader } from './Spinner';

describe('Spinner', () => {
  it('renders with default md size', () => {
    const { container } = render(<Spinner />);
    const icon = container.firstChild as HTMLElement;
    expect(icon).toHaveClass('w-6', 'h-6', 'animate-spin');
  });

  it('renders with sm size', () => {
    const { container } = render(<Spinner size="sm" />);
    const icon = container.firstChild as HTMLElement;
    expect(icon).toHaveClass('w-4', 'h-4');
  });

  it('renders with lg size', () => {
    const { container } = render(<Spinner size="lg" />);
    const icon = container.firstChild as HTMLElement;
    expect(icon).toHaveClass('w-8', 'h-8');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="text-red-500" />);
    expect(container.firstChild).toHaveClass('text-red-500');
  });
});

describe('Loading', () => {
  it('renders with default text', () => {
    render(<Loading />);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<Loading text="Veuillez patienter" />);
    expect(screen.getByText('Veuillez patienter')).toBeInTheDocument();
  });

  it('renders without text when text is empty string', () => {
    const { container } = render(<Loading text="" />);
    expect(container.querySelector('p')).not.toBeInTheDocument();
  });

  it('renders fullScreen wrapper with fixed positioning', () => {
    const { container } = render(<Loading fullScreen />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('fixed', 'inset-0');
  });

  it('renders inline (non-fullScreen) without fixed positioning', () => {
    const { container } = render(<Loading />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toHaveClass('fixed');
  });
});

describe('PageLoader', () => {
  it('renders with default text', () => {
    render(<PageLoader />);
    expect(screen.getByText('Chargement de la page...')).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<PageLoader text="Initialisation..." />);
    expect(screen.getByText('Initialisation...')).toBeInTheDocument();
  });
});
