import { render, screen } from '@testing-library/react';
import BudgetPieChart from './BudgetPieChart';

const mockData = [
  { category: 'Food', limit: 300 },
  { category: 'Transport', limit: 100 },
  { category: 'Entertainment', limit: 150 },
];

describe('BudgetPieChart', () => {
  it('renders legend and labels for categories', () => {
    render(<BudgetPieChart data={mockData} />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Entertainment')).toBeInTheDocument();
  });

  it('shows message when no data', () => {
    render(<BudgetPieChart data={[]} />);
    expect(screen.getByText(/no budget data/i)).toBeInTheDocument();
  });
}); 