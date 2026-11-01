import OBR, {
  buildCurve,
  buildText,
  isCurve,
  isImage,
  isText,
  type AttachmentBehavior,
  type Curve,
  type Image,
  type Item,
  type Text,
} from "@owlbear-rodeo/sdk";
import {
  ATTACHMENT_METADATA_KEY,
  ATTACHMENT_VERSION,
  EXTENSION_ID,
} from "../config";
import type {
  StatusAttachmentMeta,
  StatusAttachmentPart,
} from "../types/attachment";
import type { CharacterStatus } from "../types/status";
import { calcHpPercent, calcMpPercent } from "../utils/ratio";
import { getStatusBarLayout, rectPoints } from "../utils/tokenLayout";
import { readTokenStatus } from "./tokenStatus";

/** 參考圖風格：較亮的紅／青藍 */
const HP_COLOR = "#ff3b30";
const MP_COLOR = "#00e5ff";
const BAR_BG_COLOR = "#1b1b1b";
const TEXT_COLOR = "#ffffff";
const FONT_FAMILY = "Roboto, Noto Sans TC, sans-serif";

const DISABLE_ATTACHMENT_BEHAVIORS: AttachmentBehavior[] = [
  "ROTATION",
  "SCALE",
  "COPY",
];

function attachmentId(tokenId: string, part: StatusAttachmentPart): string {
  // 帶上版本，版面改版時強制新建，避免舊寬度／舊座標殘留造成 HP／MP 看起來不一樣長
  return `${EXTENSION_ID}/bar/v${ATTACHMENT_VERSION}/${tokenId}/${part}`;
}

function makeAttachmentMeta(
  tokenId: string,
  part: StatusAttachmentPart,
): StatusAttachmentMeta {
  return {
    tokenId,
    part,
    version: ATTACHMENT_VERSION,
  };
}

function isAttachmentMeta(value: unknown): value is StatusAttachmentMeta {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.tokenId === "string" &&
    typeof record.part === "string" &&
    typeof record.version === "number"
  );
}

export function isOurStatusAttachment(item: Item): boolean {
  return isAttachmentMeta(item.metadata[ATTACHMENT_METADATA_KEY]);
}

async function findAttachmentsForToken(tokenId: string): Promise<Item[]> {
  return OBR.scene.items.getItems((item) => {
    if (!isOurStatusAttachment(item)) {
      return false;
    }
    // 同時用 attachedTo 與 metadata.tokenId，複製／舊版殘留較不容易漏清
    if (item.attachedTo === tokenId) {
      return true;
    }
    const meta = item.metadata[ATTACHMENT_METADATA_KEY];
    return isAttachmentMeta(meta) && meta.tokenId === tokenId;
  });
}

function baseBarCurve(
  token: Image,
  part: StatusAttachmentPart,
  left: number,
  top: number,
  width: number,
  height: number,
  color: string,
  opacity: number,
) {
  return buildCurve()
    .id(attachmentId(token.id, part))
    .points(rectPoints(width, height))
    .fillColor(color)
    .fillOpacity(opacity)
    .strokeColor("#000000")
    .strokeOpacity(0.25)
    .strokeWidth(1)
    .tension(0)
    .closed(true)
    .position({ x: left, y: top })
    .attachedTo(token.id)
    .layer("ATTACHMENT")
    .zIndex(part.endsWith("fill") ? 20000 : 10000)
    .metadata({
      [ATTACHMENT_METADATA_KEY]: makeAttachmentMeta(token.id, part),
    })
    .locked(true)
    .disableHit(true)
    .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
    .visible(token.visible)
    .name(`${EXTENSION_ID}:${part}`);
}

/** 狀態條上的 HP / 數值文字：粗白字 + 明顯黑邊 */
function baseBarText(
  token: Image,
  part: StatusAttachmentPart,
  plainText: string,
  left: number,
  top: number,
  width: number,
  height: number,
  fontSize: number,
  textAlign: "LEFT" | "CENTER" | "RIGHT",
) {
  return buildText()
    .id(attachmentId(token.id, part))
    .plainText(plainText)
    .textType("PLAIN")
    .fontFamily(FONT_FAMILY)
    .fontSize(fontSize)
    .fontWeight(800)
    .textAlign(textAlign)
    .textAlignVertical("MIDDLE")
    .fillColor(TEXT_COLOR)
    .fillOpacity(1)
    .strokeColor("#000000")
    .strokeOpacity(1)
    .strokeWidth(Math.max(2, fontSize * 0.12))
    .padding(2)
    .lineHeight(1)
    .width(width)
    .height(height)
    .position({ x: left, y: top })
    .attachedTo(token.id)
    .layer("TEXT")
    .metadata({
      [ATTACHMENT_METADATA_KEY]: makeAttachmentMeta(token.id, part),
    })
    .locked(true)
    .disableHit(true)
    .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
    .visible(token.visible)
    .name(`${EXTENSION_ID}:${part}`);
}

function buildStatusAttachmentItems(
  token: Image,
  status: CharacterStatus,
  sceneDpi: number,
): Item[] {
  const layout = getStatusBarLayout(token, sceneDpi);
  const hpPercent = calcHpPercent(status.currentHP, status.maxHP) / 100;
  const mpPercent = calcMpPercent(status.currentMP, status.maxMP) / 100;
  const barWidth = layout.panelWidth;
  const hpFillWidth = barWidth * hpPercent;
  const mpFillWidth = barWidth * mpPercent;
  const valueText = (current: number, max: number) => `${current}/${max}`;
  // 字級配合 0.2 格高的文字列
  const fontSize = Math.max(12, layout.textHeight * 0.85);

  const hpBg = baseBarCurve(
    token,
    "hp-bg",
    layout.panelLeft,
    layout.hpBarTop,
    barWidth,
    layout.barHeight,
    BAR_BG_COLOR,
    0.88,
  ).build();

  const hpFill = baseBarCurve(
    token,
    "hp-fill",
    layout.panelLeft,
    layout.hpBarTop,
    hpFillWidth,
    layout.barHeight,
    HP_COLOR,
    0.95,
  )
    .visible(token.visible && hpFillWidth > 0)
    .build();

  const hpLabel = baseBarText(
    token,
    "hp-label",
    "HP",
    layout.panelLeft,
    layout.hpTextTop,
    layout.labelWidth,
    layout.textHeight,
    fontSize,
    "LEFT",
  ).build();

  const hpValue = baseBarText(
    token,
    "hp-value",
    valueText(status.currentHP, status.maxHP),
    layout.panelLeft,
    layout.hpTextTop,
    layout.panelWidth,
    layout.textHeight,
    fontSize,
    "RIGHT",
  ).build();

  const mpBg = baseBarCurve(
    token,
    "mp-bg",
    layout.panelLeft,
    layout.mpBarTop,
    barWidth,
    layout.barHeight,
    BAR_BG_COLOR,
    0.88,
  ).build();

  const mpFill = baseBarCurve(
    token,
    "mp-fill",
    layout.panelLeft,
    layout.mpBarTop,
    mpFillWidth,
    layout.barHeight,
    MP_COLOR,
    0.95,
  )
    .visible(token.visible && mpFillWidth > 0)
    .build();

  const mpLabel = baseBarText(
    token,
    "mp-label",
    "MP",
    layout.panelLeft,
    layout.mpTextTop,
    layout.labelWidth,
    layout.textHeight,
    fontSize,
    "LEFT",
  ).build();

  const mpValue = baseBarText(
    token,
    "mp-value",
    valueText(status.currentMP, status.maxMP),
    layout.panelLeft,
    layout.mpTextTop,
    layout.panelWidth,
    layout.textHeight,
    fontSize,
    "RIGHT",
  ).build();

  return [hpBg, hpFill, hpLabel, hpValue, mpBg, mpFill, mpLabel, mpValue];
}

function applyCurveLayout(item: Curve, next: Curve) {
  item.points = next.points;
  item.position = next.position;
  item.visible = next.visible;
  item.style.fillColor = next.style.fillColor;
  item.style.fillOpacity = next.style.fillOpacity;
  item.style.strokeColor = next.style.strokeColor;
  item.style.strokeOpacity = next.style.strokeOpacity;
  item.style.strokeWidth = next.style.strokeWidth;
  item.style.tension = next.style.tension;
  item.style.closed = next.style.closed;
}

function applyTextLayout(item: Text, next: Text) {
  item.position = next.position;
  item.visible = next.visible;
  item.text.plainText = next.text.plainText;
  item.text.width = next.text.width;
  item.text.height = next.text.height;
  item.text.style.fontSize = next.text.style.fontSize;
  item.text.style.fontWeight = next.text.style.fontWeight;
  item.text.style.textAlign = next.text.style.textAlign;
  item.text.style.strokeWidth = next.text.style.strokeWidth;
  item.text.style.strokeOpacity = next.text.style.strokeOpacity;
  item.text.style.padding = next.text.style.padding;
}

export async function upsertStatusAttachments(
  token: Image,
  status: CharacterStatus,
): Promise<void> {
  const sceneDpi = await OBR.scene.grid.getDpi();
  const desired = buildStatusAttachmentItems(token, status, sceneDpi);
  const desiredById = new Map(desired.map((item) => [item.id, item]));

  const existingForToken = await findAttachmentsForToken(token.id);

  // 含舊版 part／錯誤型別，一併清掉
  const obsoleteIds = existingForToken
    .filter((item) => {
      const next = desiredById.get(item.id);
      return !next || item.type !== next.type;
    })
    .map((item) => item.id);

  const toUpdate = existingForToken.filter((item) => {
    const next = desiredById.get(item.id);
    return Boolean(next && item.type === next.type);
  });

  const updatableIds = new Set(toUpdate.map((item) => item.id));
  const toAdd = desired.filter((item) => !updatableIds.has(item.id));

  if (obsoleteIds.length > 0) {
    await OBR.scene.items.deleteItems(obsoleteIds);
  }

  if (toUpdate.length > 0) {
    await OBR.scene.items.updateItems(toUpdate, (items) => {
      for (const item of items) {
        const next = desiredById.get(item.id);
        if (!next) {
          continue;
        }

        if (isCurve(item) && isCurve(next)) {
          applyCurveLayout(item, next);
        } else if (isText(item) && isText(next)) {
          applyTextLayout(item, next);
        }

        item.attachedTo = token.id;
        item.visible = next.visible;
        item.metadata[ATTACHMENT_METADATA_KEY] =
          next.metadata[ATTACHMENT_METADATA_KEY];
      }
    });
  }

  if (toAdd.length > 0) {
    // 多人同時建立時可能競爭；失敗則略過，下一輪調和會再補
    try {
      await OBR.scene.items.addItems(toAdd);
    } catch (error) {
      console.warn("新增狀態條附件失敗（可能已被其他玩家建立）", error);
    }
  }
}

export async function deleteStatusAttachments(tokenId: string): Promise<void> {
  const existing = await findAttachmentsForToken(tokenId);
  if (existing.length === 0) {
    return;
  }
  await OBR.scene.items.deleteItems(existing.map((item) => item.id));
}

/** 清除 metadata／attachedTo 已無對應有效 Token 的孤兒狀態條。 */
export async function cleanupOrphanStatusAttachments(
  validTokenIds: Set<string>,
): Promise<void> {
  const orphans = await OBR.scene.items.getItems((item) => {
    if (!isOurStatusAttachment(item)) {
      return false;
    }
    const meta = item.metadata[ATTACHMENT_METADATA_KEY];
    if (!isAttachmentMeta(meta)) {
      return true;
    }
    if (!validTokenIds.has(meta.tokenId)) {
      return true;
    }
    // attachedTo 指向不存在的 Token 也視為孤兒
    if (item.attachedTo && !validTokenIds.has(item.attachedTo)) {
      return true;
    }
    return false;
  });

  if (orphans.length === 0) {
    return;
  }

  await OBR.scene.items.deleteItems(orphans.map((item) => item.id));
}

export async function refreshAllStatusAttachments(): Promise<void> {
  const sceneReady = await OBR.scene.isReady();
  if (!sceneReady) {
    return;
  }

  const characters = await OBR.scene.items.getItems(
    (item): item is Image => item.layer === "CHARACTER" && isImage(item),
  );

  const withStatus = characters.filter(
    (item) => readTokenStatus(item) !== null,
  );
  const withStatusIds = new Set(withStatus.map((item) => item.id));

  await cleanupOrphanStatusAttachments(withStatusIds);

  for (const token of withStatus) {
    const status = readTokenStatus(token);
    if (status) {
      await upsertStatusAttachments(token, status);
    }
  }
}
