import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '../../components/Layout';

// Smoke test for the app shell + router wiring (same route shape as main.tsx).
vi.mock('sonner', () => ({ Toaster: () => null, toast: { success: vi.fn(), error: vi.fn() } }));

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <p>home page</p> },
          { path: '/meetings', element: <p>meetings page</p> },
          { path: '/settings', element: <p>settings page</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

describe('Layout routing', () => {
  it('renders the page for the current route inside the layout', () => {
    renderAt('/meetings');
    expect(screen.getByText('meetings page')).toBeInTheDocument();
    expect(screen.getAllByText('MeetingScribe AI').length).toBeGreaterThan(0);
  });

  it('marks the current section active in the navigation', () => {
    renderAt('/settings');
    const settingsLink = screen.getByRole('link', { name: /Settings/ });
    const homeLink = screen.getByRole('link', { name: /New Meeting/ });
    expect(settingsLink).toHaveAttribute('aria-current', 'page');
    expect(homeLink).not.toHaveAttribute('aria-current');
  });
});
