import { Math2, type Image, type Vector2 } from "@owlbear-rodeo/sdk";

export type TokenBounds = {
  width: number;
  height: number;
};

/**
 * 計算角色 Token 在場景中的實際寬高（含 DPI 與縮放）。
 */
export function getTokenBounds(image: Image, sceneDpi: number): TokenBounds {
  const dpiScale = sceneDpi / image.grid.dpi;
  return {
    width: Math.abs(image.image.width * dpiScale * image.scale.x),
    height: Math.abs(image.image.height * dpiScale * image.scale.y),
  };
}

/**
 * 計算角色 Token 的視覺中心點（世界座標）。
 */
export function getTokenCenter(image: Image, sceneDpi: number): Vector2 {
  let center: Vector2 = { x: 0, y: 0 };

  center = Math2.add(
    center,
    Math2.multiply({ x: image.image.width, y: image.image.height }, 0.5),
  );

  center = Math2.subtract(center, image.grid.offset);
  center = Math2.multiply(center, sceneDpi / image.grid.dpi);
  center = Math2.multiply(center, image.scale);
  center = Math2.rotate(center, { x: 0, y: 0 }, image.rotation);
  center = Math2.add(center, image.position);

  return center;
}

/**
 * 貼齊 Token 右側（不吸格線），垂直對齊 Token 中心。
 *
 * HP 文字 0.2 格
 * HP 長條 0.35 格（向上重疊文字 0.05 格）
 * MP 文字 0.2 格
 * MP 長條 0.35 格（向上重疊文字 0.05 格）
 *
 * 每組淨高 = 0.2 + 0.35 - 0.05 = 0.5 格；兩組合計約 1 格高。
 * 寬度 = 2 格；右側數值（如 10/20）靠整列最右。
 */
export type StatusBarLayout = {
  panelLeft: number;
  panelWidth: number;
  hpBarTop: number;
  mpBarTop: number;
  hpTextTop: number;
  mpTextTop: number;
  textHeight: number;
  barHeight: number;
  labelWidth: number;
};

/** 長條與數值列寬度：兩格 */
const WIDTH_IN_CELLS = 2;
const TEXT_IN_CELLS = 0.3;
const BAR_IN_CELLS = 0.35;
const OVERLAP_IN_CELLS = 0.15;
/** 與 Token 右緣的微小間距，避免完全貼死圖片邊緣 */
const TOKEN_EDGE_GAP_IN_CELLS = 0;

export function getStatusBarLayout(
  image: Image,
  sceneDpi: number,
): StatusBarLayout {
  const center = getTokenCenter(image, sceneDpi);
  const bounds = getTokenBounds(image, sceneDpi);
  const dpi = sceneDpi;

  const panelWidth = dpi * WIDTH_IN_CELLS;
  const textHeight = dpi * TEXT_IN_CELLS;
  const barHeight = dpi * BAR_IN_CELLS;
  const overlap = dpi * OVERLAP_IN_CELLS;
  const labelWidth = Math.max(panelWidth * 0.4, dpi * 0.35);

  // 每組淨高 0.5 格；兩組共 1 格
  const blockNetHeight = textHeight + barHeight - overlap;
  const stackHeight = blockNetHeight * 2;

  // 水平：切齊 Token 右側（不再吸格線）
  const panelLeft =
    center.x + bounds.width / 2 + dpi * TOKEN_EDGE_GAP_IN_CELLS;

  // 垂直：整組對齊 Token 中心
  const stackTop = center.y - stackHeight / 2;

  const hpTextTop = stackTop;
  const hpBarTop = hpTextTop + textHeight - overlap;

  const mpTextTop = hpBarTop + barHeight;
  const mpBarTop = mpTextTop + textHeight - overlap;

  return {
    panelLeft,
    panelWidth,
    hpBarTop,
    mpBarTop,
    hpTextTop,
    mpTextTop,
    textHeight,
    barHeight,
    labelWidth,
  };
}

/** 建立矩形 Curve 的相對點（相對於 position 左上角）。 */
export function rectPoints(width: number, height: number): Vector2[] {
  const w = Math.max(width, 0);
  const h = Math.max(height, 0);
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
}
