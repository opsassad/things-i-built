import { useCallback } from 'react';

interface ScrollOptions {
  offset?: number;
  behavior?: ScrollBehavior;
  duration?: number;
}

export const useSmoothScroll = () => {
  const scrollTo = useCallback((target: HTMLElement | number | string, options: ScrollOptions = {}) => {
    const {
      offset = 0,
      behavior = 'smooth',
      duration = 1000,
    } = options;

    const getTargetPosition = (): number => {
      if (typeof target === 'number') {
        return target;
      }

      if (typeof target === 'string') {
        const element = document.querySelector(target);
        if (!element) return 0;
        return element.getBoundingClientRect().top + window.pageYOffset;
      }

      return target.getBoundingClientRect().top + window.pageYOffset;
    };

    const targetPosition = getTargetPosition() - offset;

    if (behavior === 'smooth') {
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      const startTime = performance.now();

      const easeInOutQuad = (t: number): number => {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      };

      const animateScroll = (currentTime: number) => {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        window.scrollTo(0, startPosition + distance * easeInOutQuad(progress));

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    } else {
      window.scrollTo({ top: targetPosition, behavior });
    }
  }, []);

  const scrollToTop = useCallback((options: ScrollOptions = {}) => {
    scrollTo(0, options);
  }, [scrollTo]);

  const scrollToBottom = useCallback((options: ScrollOptions = {}) => {
    const bottom = document.documentElement.scrollHeight;
    scrollTo(bottom, options);
  }, [scrollTo]);

  const scrollToElement = useCallback((element: HTMLElement | string, options: ScrollOptions = {}) => {
    scrollTo(element, options);
  }, [scrollTo]);

  return {
    scrollTo,
    scrollToTop,
    scrollToBottom,
    scrollToElement,
  };
}; 