import { useEffect } from 'react';

/**
 * Custom hook to dynamically update the page title
 * @param title - The page title to set
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    
    // Cleanup function to restore previous title on unmount
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}