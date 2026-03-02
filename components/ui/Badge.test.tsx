import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, StatusBadge } from './Badge';
import { Star } from 'lucide-react';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Actif</Badge>);
    expect(screen.getByText('Actif')).toBeInTheDocument();
  });

  it.each([
    ['default', 'bg-slate-700'],
    ['success', 'bg-green-500/20'],
    ['warning', 'bg-amber-500/20'],
    ['danger', 'bg-red-500/20'],
    ['info', 'bg-teal-500/20'],
  ] as const)('applies %s variant class', (variant, expectedClass) => {
    const { container } = render(<Badge variant={variant}>label</Badge>);
    expect(container.firstChild).toHaveClass(expectedClass);
  });

  it('applies outline variant border class', () => {
    const { container } = render(<Badge variant="outline">label</Badge>);
    expect(container.firstChild).toHaveClass('border', 'border-slate-600');
  });

  it('renders dot indicator when dot=true', () => {
    const { container } = render(<Badge dot>label</Badge>);
    const spans = container.querySelectorAll('span');
    // First inner span is the dot
    expect(spans[0]).toHaveClass('rounded-full');
  });

  it('does not render dot when dot=false (default)', () => {
    const { container } = render(<Badge>label</Badge>);
    // No inner spans — only the outer badge span exists
    const innerSpans = container.querySelectorAll('span span');
    expect(innerSpans.length).toBe(0);
  });

  it('renders icon when provided', () => {
    render(<Badge icon={<Star data-testid="icon" size={12} />}>label</Badge>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies sm size classes', () => {
    const { container } = render(<Badge size="sm">label</Badge>);
    expect(container.firstChild).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  it('applies md size classes (default)', () => {
    const { container } = render(<Badge>label</Badge>);
    expect(container.firstChild).toHaveClass('px-2.5', 'py-1', 'text-xs');
  });

  it('forwards custom className', () => {
    const { container } = render(<Badge className="custom-class">label</Badge>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('StatusBadge', () => {
  it.each([
    ['pending', 'En attente'],
    ['confirmed', 'Confirmé'],
    ['completed', 'Terminé'],
    ['cancelled', 'Annulé'],
    ['active', 'Actif'],
    ['inactive', 'Inactif'],
  ] as const)('renders correct label for %s status', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('renders dot for pending status', () => {
    const { container } = render(<StatusBadge status="pending" />);
    const spans = container.querySelectorAll('span');
    expect(spans[0]).toHaveClass('rounded-full');
  });

  it('does not render dot for completed status', () => {
    const { container } = render(<StatusBadge status="completed" />);
    const innerSpans = container.querySelectorAll('span span');
    expect(innerSpans.length).toBe(0);
  });
});
