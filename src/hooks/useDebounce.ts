import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a function that delays invoking the latest callback until no new call
 * has been made within the configured timeout window.
 *
 * When `executeOnUnmount` is enabled, a pending callback is executed during
 * cleanup instead of being discarded.
 *
 * @param timeout Delay in milliseconds before the callback runs.
 * @param executeOnUnmount Whether to run a pending callback when the component unmounts.
 * @returns A debounced function that schedules the provided callback.
 */
export const useDebounce = ({
  timeout = 500,
  executeOnUnmount = false,
}: { timeout?: number; executeOnUnmount?: boolean } = {}) => {
  const lastChange = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<() => void | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (lastChange.current) {
        clearTimeout(lastChange.current);

        if (!executeOnUnmount) return;

        callbackRef.current?.();
      }
    };
  }, [executeOnUnmount]);

  const debounce = useCallback(
    (callback: () => void) => {
      if (lastChange.current) clearTimeout(lastChange.current);

      callbackRef.current = callback;

      lastChange.current = setTimeout(() => {
        lastChange.current = null;
        callbackRef.current = undefined;
        callback();
      }, timeout);
    },
    [timeout],
  );

  return debounce;
};
