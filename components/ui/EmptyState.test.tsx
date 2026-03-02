import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState, NoResults } from './EmptyState';
import { FileX } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Aucun rendez-vous" />);
    expect(screen.getByText('Aucun rendez-vous')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Titre" description="Description ici" />);
    expect(screen.getByText('Description ici')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    render(<EmptyState title="Titre" />);
    expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
  });

  it('renders action slot when provided', () => {
    render(<EmptyState title="Titre" action={<button>Ajouter</button>} />);
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    const { container } = render(<EmptyState icon={FileX} title="Titre" />);
    // Icon renders inside the icon wrapper div
    const iconWrapper = container.querySelector('.w-16');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Titre" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('NoResults', () => {
  it('renders with searchTerm in description', () => {
    render(<NoResults searchTerm="aspirin" />);
    expect(screen.getByText(/aspirin/)).toBeInTheDocument();
  });

  it('renders generic message without searchTerm', () => {
    render(<NoResults />);
    expect(screen.getByText(/filtres ou critères/)).toBeInTheDocument();
  });

  it('renders clear button when onClear provided', () => {
    const onClear = vi.fn();
    render(<NoResults onClear={onClear} />);
    expect(screen.getByText('Effacer la recherche')).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<NoResults onClear={onClear} />);
    fireEvent.click(screen.getByText('Effacer la recherche'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not render clear button when onClear is not provided', () => {
    render(<NoResults />);
    expect(screen.queryByText('Effacer la recherche')).not.toBeInTheDocument();
  });
});
