import { useCallback, useRef } from "react";

export default function useDebounce() {
  let timeout = useRef<ReturnType<typeof setTimeout>>(null);

  const setDebounce = useCallback(
    (callback: () => void, debounceTime: number) => {
      if (!!timeout.current) {
        clearTimeout(timeout.current);
      }

      timeout.current = setTimeout(() => {
        callback();
      }, debounceTime);
    },
    [],
  );

  return { setDebounce };
}