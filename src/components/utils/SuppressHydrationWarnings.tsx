'use client';

import { useEffect } from 'react';

// This component suppresses hydration warnings caused by browser extensions like Grammarly
// that add attributes to the DOM after React has hydrated
export default function SuppressHydrationWarnings() {
  useEffect(() => {
    // Suppress console errors for hydration warnings caused by browser extensions
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args[0] || '';
      
      // Check if this is a hydration warning related to browser extensions
      if (
        typeof errorMessage === 'string' && 
        (errorMessage.includes('Hydration failed because') || 
         errorMessage.includes('mismatched tags') ||
         errorMessage.includes('data-new-gr-c-s-check-loaded') ||
         errorMessage.includes('data-gr-ext-installed'))
      ) {
        // Silently ignore this specific hydration warning
        return;
      }
      
      // Pass through all other console errors
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      // Restore the original console.error on cleanup
      console.error = originalConsoleError;
    };
  }, []);
  
  return null;
} 