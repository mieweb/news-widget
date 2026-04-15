import { useEffect, useRef, useState } from 'react';

interface UseVisibilityOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useVisibility<T extends HTMLElement>(
  options: UseVisibilityOptions = {}
): [React.RefObject<T | null>, boolean] {
  const { threshold = 0.5, rootMargin = '0px' } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return [ref, isVisible];
}
