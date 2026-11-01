import OBR, { type Item } from "@owlbear-rodeo/sdk";
import { STATUS_METADATA_KEY } from "../config";
import type { CharacterStatus } from "../types/status";
import { isCharacterStatus } from "../utils/validation";

/**
 * 從 Token Metadata 讀取本 Extension 的角色狀態。
 * 若尚未設定或格式不符，回傳 null。
 */
export function readTokenStatus(item: Item): CharacterStatus | null {
  const raw = item.metadata[STATUS_METADATA_KEY];
  if (!isCharacterStatus(raw)) {
    return null;
  }
  return raw;
}

/**
 * 將角色狀態寫入指定 Token 的 Metadata。
 * 使用專屬 key，避免覆蓋其他 Extension 的資料。
 */
export async function saveTokenStatus(
  itemId: string,
  status: CharacterStatus,
): Promise<void> {
  // updateItems 接受 Item 陣列或 filter，不接受純 ID 字串陣列。
  await OBR.scene.items.updateItems(
    (item) => item.id === itemId,
    (items) => {
      for (const item of items) {
        item.metadata[STATUS_METADATA_KEY] = status;
      }
    },
  );
}

/**
 * 移除 Token 上的角色狀態 Metadata。
 * 不刪除 Token 本身；狀態條附件請另外呼叫 deleteStatusAttachments。
 */
export async function clearTokenStatus(itemId: string): Promise<void> {
  await OBR.scene.items.updateItems(
    (item) => item.id === itemId,
    (items) => {
      for (const item of items) {
        delete item.metadata[STATUS_METADATA_KEY];
      }
    },
  );
}
