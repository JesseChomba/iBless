import confetti from 'canvas-confetti';

export function fireBlessingConfetti(intensity: 'gentle' | 'celebrate' = 'gentle'): void {
  if (typeof window === 'undefined') return;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  try {
    if (intensity === 'celebrate') {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#EA580C', '#F59E0B', '#10B981', '#0EA5E9', '#F43F5E'],
      });
    } else {
      confetti({
        particleCount: 36,
        spread: 52,
        origin: { y: 0.7 },
        colors: ['#EA580C', '#F59E0B', '#10B981'],
      });
    }
  } catch {
    // Non-critical visual effect
  }
}
