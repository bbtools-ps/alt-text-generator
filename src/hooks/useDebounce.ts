import { useEffect, useRef } from "react";

export const useDebounce = (timeout: number = 500) => {
  const lastChange = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (lastChange.current) clearTimeout(lastChange.current);
    };
  }, []);

  const debounce = (callback: () => void) => {
    if (lastChange.current) clearTimeout(lastChange.current);

    lastChange.current = setTimeout(() => {
      lastChange.current = null;

      callback();
    }, timeout);
  };

  return debounce;
};
