import { render, RenderOptions } from '@testing-library/react-native';
import { ReactElement } from 'react';

/**
 * Custom render function that wraps components with necessary providers
 * @param ui - React element to render
 * @param options - Additional render options
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    // Add your providers here as they are implemented
    // Example:
    // return (
    //   <ThemeProvider>
    //     <AuthProvider>
    //       {children}
    //     </AuthProvider>
    //   </ThemeProvider>
    // );

    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react-native';
