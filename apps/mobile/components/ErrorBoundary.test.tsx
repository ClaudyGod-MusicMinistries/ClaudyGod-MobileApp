import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent, screen } from '@testing-library/react-native';

import { ErrorBoundary } from './ErrorBoundary';
import { ThemeProvider } from '../context/ThemeProvider';

function withTheme(children: React.ReactNode) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// A child that throws once, then renders normally once `defuse()` is called —
// simulates a transient error that a real "Try Again" tap would actually fix.
function makeBomb() {
  let shouldThrow = true;
  function Bomb() {
    if (shouldThrow) throw new Error('Boom');
    return <Text>Recovered</Text>;
  }
  return { Bomb, defuse: () => { shouldThrow = false; } };
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // componentDidCatch + React's own dev logging both call console.error;
    // silence it so the test output isn't dominated by the expected crash.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children normally when nothing throws', async () => {
    await render(withTheme(<ErrorBoundary><Text>All good</Text></ErrorBoundary>));
    expect(screen.getByText('All good')).toBeTruthy();
  });

  it('shows a fallback UI when a child throws, and recovers when "Try Again" is pressed after the cause is fixed', async () => {
    const { Bomb, defuse } = makeBomb();
    await render(withTheme(<ErrorBoundary context="the test screen"><Bomb /></ErrorBoundary>));

    expect(screen.getByText('Oops! Something went wrong')).toBeTruthy();
    expect(screen.getByText(/while loading the test screen/)).toBeTruthy();

    defuse();
    await fireEvent.press(screen.getByText('Try Again'));

    expect(screen.getByText('Recovered')).toBeTruthy();
    expect(screen.queryByText('Oops! Something went wrong')).toBeNull();
  });

  it('also recovers via the "Dismiss Error" action', async () => {
    const { Bomb, defuse } = makeBomb();
    await render(withTheme(<ErrorBoundary><Bomb /></ErrorBoundary>));

    defuse();
    await fireEvent.press(screen.getByText('Dismiss Error'));

    expect(screen.getByText('Recovered')).toBeTruthy();
  });
});
