import { act } from 'test/test-utils';

/**
 * Replaces IntersectionObserver with one that reports nothing until the test says an observed element came
 * into view. The global mock reports entries without an `intersectionRatio`, which LoadMoreHelper reads as
 * out of view, so only a mock like this one lets a test decide when the end of the list is reached.
 */
export function installControllableIntersectionObserver() {
  const original = global.IntersectionObserver;
  const observed = new Map<IntersectionObserver, { callback: IntersectionObserverCallback; elements: Set<Element> }>();

  global.IntersectionObserver = jest.fn().mockImplementation((callback: IntersectionObserverCallback) => {
    const elements = new Set<Element>();
    const observer = {
      root: null,
      rootMargin: '',
      scrollMargin: '',
      thresholds: [],
      observe: (element: Element) => elements.add(element),
      unobserve: (element: Element) => elements.delete(element),
      disconnect: () => observed.delete(observer),
      takeRecords: () => [],
    } satisfies IntersectionObserver;
    observed.set(observer, { callback, elements });
    return observer;
  }) as unknown as typeof IntersectionObserver;

  return {
    /** Reports every currently observed element as in view, as when the end of the list is scrolled to. */
    intersectObserved: () => {
      act(() => {
        for (const [observer, { callback, elements }] of observed) {
          const entries = [...elements].map((target) => {
            const rect = target.getBoundingClientRect();
            return {
              target,
              isIntersecting: true,
              intersectionRatio: 1,
              boundingClientRect: rect,
              intersectionRect: rect,
              rootBounds: null,
              time: 0,
            };
          });
          if (entries.length > 0) {
            callback(entries, observer);
          }
        }
      });
    },
    restore: () => {
      global.IntersectionObserver = original;
    },
  };
}
