import OBR, { isImage, type Image, type Item } from "@owlbear-rodeo/sdk";

export type SelectionState =
  | { kind: "scene-not-ready" }
  | { kind: "none" }
  | { kind: "multiple"; count: number }
  | { kind: "not-character"; item: Item }
  | { kind: "character"; item: Image };

/**
 * 讀取目前玩家選取，並判斷是否為單一 CHARACTER 層角色 Token。
 * 第一版只處理 CHARACTER 層且為 Image 的物件（一般角色 Token）。
 */
export async function getSelectionState(): Promise<SelectionState> {
  const sceneReady = await OBR.scene.isReady();
  if (!sceneReady) {
    return { kind: "scene-not-ready" };
  }

  const selection = await OBR.player.getSelection();
  if (!selection || selection.length === 0) {
    return { kind: "none" };
  }

  if (selection.length > 1) {
    return { kind: "multiple", count: selection.length };
  }

  const items = await OBR.scene.items.getItems([selection[0]]);
  const item = items[0];

  if (!item) {
    return { kind: "none" };
  }

  // 官方文件範例以 CHARACTER 層 + Image 作為角色 Token。
  if (item.layer === "CHARACTER" && isImage(item)) {
    return { kind: "character", item };
  }

  return { kind: "not-character", item };
}

/**
 * 監聽選取與場景就緒狀態變化。
 * 回傳取消訂閱函式。
 */
export function subscribeSelectionChanges(
  onChange: (state: SelectionState) => void,
): () => void {
  let cancelled = false;
  let debounceTimer: number | undefined;

  const refresh = async () => {
    try {
      const state = await getSelectionState();
      if (!cancelled) {
        onChange(state);
      }
    } catch (error) {
      console.error("讀取選取狀態失敗", error);
    }
  };

  const scheduleRefresh = () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      void refresh();
    }, 50);
  };

  void refresh();

  const unsubscribePlayer = OBR.player.onChange(() => {
    scheduleRefresh();
  });

  const unsubscribeScene = OBR.scene.onReadyChange(() => {
    scheduleRefresh();
  });

  // Token Metadata 被其他玩家更新時，刷新編輯表單（防抖，避免附件更新洗版）
  const unsubscribeItems = OBR.scene.items.onChange(() => {
    scheduleRefresh();
  });

  return () => {
    cancelled = true;
    window.clearTimeout(debounceTimer);
    unsubscribePlayer();
    unsubscribeScene();
    unsubscribeItems();
  };
}
