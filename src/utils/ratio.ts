/**
 * 將當前／最大值轉成 0～1 的比例。
 * max 為 0 或無效時回傳 0，避免除以零。
 */
export function calcRatio(current: number, max: number): number {
  if (!(max > 0)) {
    return 0;
  }
  return current / max;
}

/**
 * 將比例限制在 0%～100%，供狀態條寬度使用。
 */
export function ratioToPercent(ratio: number): number {
  return Math.max(0, Math.min(1, ratio)) * 100;
}

export function calcHpPercent(currentHP: number, maxHP: number): number {
  return ratioToPercent(calcRatio(currentHP, maxHP));
}

export function calcMpPercent(currentMP: number, maxMP: number): number {
  return ratioToPercent(calcRatio(currentMP, maxMP));
}
