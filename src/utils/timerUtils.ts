export function calculateRemainingTime(
  startTime: string,
  timeLimitSec: number
): number {
  const elapsed = Math.floor((Date.now() - Date.parse(startTime)) / 1000);
  const remaining = Math.max(0, timeLimitSec - elapsed);
  return remaining;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
