import confetti from 'canvas-confetti';

// A short, tasteful celebration burst fired from the two lower corners toward the
// centre. Centralized so any "moment of delight" (e.g. the post-onboarding welcome)
// uses the same motion. No-op during SSR.
export function celebrate(): void {
  if (typeof window === 'undefined') return;
  // Respect users who opt out of motion — skip the burst entirely.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const duration = 1200;
  const end = Date.now() + duration;
  const colors = ['#10b981', '#34d399', '#a7f3d0', '#ffffff'];

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      startVelocity: 45,
      origin: { x: 0, y: 0.9 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      startVelocity: 45,
      origin: { x: 1, y: 0.9 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();
}
