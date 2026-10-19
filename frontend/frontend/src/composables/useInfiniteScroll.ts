import { onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Calls onIntersect when the sentinel element scrolls into view
 * (with a 400px prefetch margin). The caller guards with
 * hasNextPage / isFetching so we don't fire duplicate loads.
 */
export function useInfiniteScroll(
  target: Ref<HTMLElement | null>,
  onIntersect: () => void,
): void {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onIntersect()
      },
      { rootMargin: '400px' },
    )
    if (target.value) observer.observe(target.value)
  })

  onUnmounted(() => observer?.disconnect())
}
