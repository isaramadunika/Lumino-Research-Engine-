/**
 * Hook for using Gemini API in React components
 */

'use client';

import { useState, useCallback } from 'react';
import { sendToGemini } from '@/lib/gemini';

interface UseGeminiOptions {
  onError?: (error: Error) => void;
}

export function useGemini(options?: UseGeminiOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const send = useCallback(
    async (message: string): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendToGemini(message);
        setIsLoading(false);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        setIsLoading(false);
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { send, isLoading, error };
}
