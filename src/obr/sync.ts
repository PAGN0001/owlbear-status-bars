import OBR, { isImage, type Image, type Item } from "@owlbear-rodeo/sdk";
import {
  ATTACHMENT_METADATA_KEY,
  STATUS_METADATA_KEY,
} from "../config";
import { isCharacterStatus } from "../utils/validation";
import {
  cleanupOrphanStatusAttachments,
  deleteStatusAttachments,
  isOurStatusAttachment,
  refreshAllStatusAttachments,
  upsertStatusAttachments,
} from "./statusAttachments";
import { readTokenStatus } from "./tokenStatus";

/**
 * Phase 4：場景狀態條同步與復原。
 *
 * - 狀態存在 Token Metadata（共享），所有玩家都能收到變更。
 * - 狀態條是共享 Scene Items；穩定 ID → 有則更新、無則建立。
 * - 可重複執行，降低多人同時處理時產生重複條的風險。
 * - 短防抖合併連續事件；場景切換／格線變更時全量復原。
 */

let syncing = false;
let debounceTimer: number | undefined;
let cancelled = false;

/** 上次已處理過的角色 Token 指紋（id → fingerprint） */
const lastTokenFingerprints = new Map<string, string>();

function characterFingerprint(token: Image, sceneDpi: number): string {
  return JSON.stringify({
    sceneDpi,
    scale: token.scale,
    rotation: token.rotation,
    visible: token.visible,
    grid: token.grid,
    image: {
      width: token.image.width,
      height: token.image.height,
    },
    status: token.metadata[STATUS_METADATA_KEY] ?? null,
  });
}

function listCharacterTokens(items: Item[]): Image[] {
  return items.filter(
    (item): item is Image => item.layer === "CHARACTER" && isImage(item),
  );
}

/**
 * 對目前場景做一次完整調和。
 * 場景載入、切換、格線變更、Extension 重開時呼叫。
 */
export async function reconcileAllStatusBars(): Promise<void> {
  if (cancelled || syncing) {
    return;
  }

  syncing = true;
  try {
    await refreshAllStatusAttachments();

    const sceneReady = await OBR.scene.isReady();
    if (!sceneReady) {
      lastTokenFingerprints.clear();
      return;
    }

    const sceneDpi = await OBR.scene.grid.getDpi();
    const characters = await OBR.scene.items.getItems(
      (item): item is Image => item.layer === "CHARACTER" && isImage(item),
    );

    lastTokenFingerprints.clear();
    for (const token of characters) {
      if (readTokenStatus(token)) {
        lastTokenFingerprints.set(
          token.id,
          characterFingerprint(token, sceneDpi),
        );
      }
    }
  } finally {
    window.setTimeout(() => {
      syncing = false;
    }, 40);
  }
}

/**
 * 根據 items.onChange 的完整清單做增量調和。
 * - 複製出的新 Token：若帶有狀態 Metadata，會為新 ID 建立狀態條。
 * - 刪除 Token／移除狀態：清掉對應附件。
 * - 數值／縮放變更：更新既有狀態條。
 */
export async function reconcileStatusBarsFromItems(
  items: Item[],
): Promise<void> {
  if (cancelled || syncing) {
    return;
  }

  const sceneReady = await OBR.scene.isReady();
  if (!sceneReady) {
    return;
  }

  syncing = true;
  try {
    const sceneDpi = await OBR.scene.grid.getDpi();
    const characters = listCharacterTokens(items);
    const presentIds = new Set(characters.map((token) => token.id));

    // Token 已不在場景
    for (const tokenId of [...lastTokenFingerprints.keys()]) {
      if (!presentIds.has(tokenId)) {
        await deleteStatusAttachments(tokenId);
        lastTokenFingerprints.delete(tokenId);
      }
    }

    for (const token of characters) {
      const status = readTokenStatus(token);

      if (!status) {
        if (lastTokenFingerprints.has(token.id)) {
          await deleteStatusAttachments(token.id);
          lastTokenFingerprints.delete(token.id);
        }
        continue;
      }

      const nextFp = characterFingerprint(token, sceneDpi);
      if (lastTokenFingerprints.get(token.id) === nextFp) {
        continue;
      }

      await upsertStatusAttachments(token, status);
      lastTokenFingerprints.set(token.id, nextFp);
    }

    const withStatusIds = new Set(
      characters
        .filter((token) =>
          isCharacterStatus(token.metadata[STATUS_METADATA_KEY]),
        )
        .map((token) => token.id),
    );
    await cleanupOrphanStatusAttachments(withStatusIds);
  } finally {
    window.setTimeout(() => {
      syncing = false;
    }, 40);
  }
}

function scheduleReconcile(items: Item[]) {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    void reconcileStatusBarsFromItems(items).catch((error) => {
      console.error("增量同步狀態條失敗", error);
    });
  }, 80);
}

/** 判斷這次 onChange 是否可能與角色狀態有關（略過純附件噪音）。 */
function isRelevantSceneChange(items: Item[]): boolean {
  for (const item of items) {
    if (item.layer === "CHARACTER" && isImage(item)) {
      return true;
    }
    // 附件的 tokenId 若指向仍存在的角色，也可能需要清理；全量清單時仍交由 reconcile 處理
    if (isOurStatusAttachment(item)) {
      const meta = item.metadata[ATTACHMENT_METADATA_KEY];
      if (meta && typeof meta === "object" && meta !== null) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 啟動 Phase 4 同步生命週期。
 * 回傳取消訂閱函式。
 */
export function startSceneStatusSync(): () => void {
  cancelled = false;

  void reconcileAllStatusBars().catch((error) => {
    console.error("初始同步狀態條失敗", error);
  });

  const unsubscribeReady = OBR.scene.onReadyChange((ready) => {
    if (!ready) {
      lastTokenFingerprints.clear();
      return;
    }
    void reconcileAllStatusBars().catch((error) => {
      console.error("場景就緒後同步狀態條失敗", error);
    });
  });

  const unsubscribeGrid = OBR.scene.grid.onChange(() => {
    void reconcileAllStatusBars().catch((error) => {
      console.error("格線變更後同步狀態條失敗", error);
    });
  });

  const unsubscribeItems = OBR.scene.items.onChange((items) => {
    if (cancelled || syncing) {
      return;
    }
    if (!isRelevantSceneChange(items)) {
      return;
    }
    scheduleReconcile(items);
  });

  return () => {
    cancelled = true;
    window.clearTimeout(debounceTimer);
    unsubscribeReady();
    unsubscribeGrid();
    unsubscribeItems();
    lastTokenFingerprints.clear();
  };
}
