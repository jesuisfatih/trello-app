import { render, screen } from '@testing-library/react';
import { LoadingSpinner, LoadingPage } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders spinner', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { container: small } = render(<LoadingSpinner size="sm" />);
    expect(small.querySelector('.w-4')).toBeInTheDocument();

    const { container: large } = render(<LoadingSpinner size="lg" />);
    expect(large.querySelector('.w-12')).toBeInTheDocument();
  });
});

describe('LoadingPage', () => {
  it('renders loading page', () => {
    render(<LoadingPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

