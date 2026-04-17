import { useEffect, useRef, useState } from "react";

/**
 * Adds pull-to-refresh behaviour on mobile.
 * Returns `{ pullDistance, isRefreshing }` so the caller can render a
 * visual indicator that slides down as the user pulls.
 *
 * @param onRefresh  Called when the user pulls past the threshold.
 * @param threshold  How far (px) the user must pull before release triggers a refresh (default 70).
 */
export function usePullToRefresh(onRefresh: () => void, threshold = 70) {
    const [pullDistance,  setPullDistance]  = useState(0);
    const [isRefreshing,  setIsRefreshing]  = useState(false);

    const startYRef       = useRef(0);
    const isPullingRef    = useRef(false);
    const pullDistanceRef = useRef(0);

    useEffect(() => {
        const onTouchStart = (e: TouchEvent) => {
            // Only start tracking when we're already at the top of the page
            if (window.scrollY === 0) {
                startYRef.current    = e.touches[0].clientY;
                isPullingRef.current = true;
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!isPullingRef.current) return;
            const delta = e.touches[0].clientY - startYRef.current;
            if (delta > 0 && window.scrollY === 0) {
                // Dampen the movement so it feels springy (0.45 ratio)
                const dist = Math.min(delta * 0.45, threshold + 30);
                pullDistanceRef.current = dist;
                setPullDistance(dist);
            }
        };

        const onTouchEnd = () => {
            if (!isPullingRef.current) return;
            isPullingRef.current = false;

            if (pullDistanceRef.current >= threshold) {
                setIsRefreshing(true);
                onRefresh();
                // Auto-reset the refreshing indicator after a short delay
                setTimeout(() => setIsRefreshing(false), 1200);
            }

            pullDistanceRef.current = 0;
            setPullDistance(0);
        };

        document.addEventListener("touchstart", onTouchStart, { passive: true });
        document.addEventListener("touchmove",  onTouchMove,  { passive: true });
        document.addEventListener("touchend",   onTouchEnd,   { passive: true });

        return () => {
            document.removeEventListener("touchstart", onTouchStart);
            document.removeEventListener("touchmove",  onTouchMove);
            document.removeEventListener("touchend",   onTouchEnd);
        };
    }, [onRefresh, threshold]);

    return { pullDistance, isRefreshing };
}
