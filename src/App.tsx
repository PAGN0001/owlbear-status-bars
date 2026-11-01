import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import Notice from "./components/Notice";
import StatusEditor from "./components/StatusEditor";
import { waitForObrReady } from "./obr/initialize";
import {
  subscribeSelectionChanges,
  type SelectionState,
} from "./obr/selection";
import { startSceneStatusSync } from "./obr/sync";
import { readTokenStatus } from "./obr/tokenStatus";

type ReadyState = "loading" | "ready" | "unavailable";

export default function App() {
  const [readyState, setReadyState] = useState<ReadyState>("loading");
  const [selection, setSelection] = useState<SelectionState | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribeSelection: (() => void) | undefined;
    let unsubscribeAttachments: (() => void) | undefined;

    async function boot() {
      if (!OBR.isAvailable) {
        if (!cancelled) {
          setReadyState("unavailable");
        }
        return;
      }

      await waitForObrReady();
      if (cancelled) {
        return;
      }

      setReadyState("ready");
      unsubscribeSelection = subscribeSelectionChanges((state) => {
        if (!cancelled) {
          setSelection(state);
        }
      });
      // Phase 4：多人同步／場景復原／刪除與複製調和
      unsubscribeAttachments = startSceneStatusSync();
    }

    void boot();

    return () => {
      cancelled = true;
      unsubscribeSelection?.();
      unsubscribeAttachments?.();
    };
  }, []);

  return (
    <main className="app">
      <header className="app__header">
        <h1>HP / MP Status Bars</h1>
        <p className="app__subtitle">角色狀態顯示工具</p>
      </header>

      {readyState === "loading" && (
        <p className="app__status">正在連接 Owlbear Rodeo…</p>
      )}

      {readyState === "unavailable" && (
        <Notice tone="warning">
          目前不在 Owlbear Rodeo 環境中。請透過 Owlbear 房間載入本 Extension。
        </Notice>
      )}

      {readyState === "ready" && (
        <div className="app__body">{renderSelectionPanel(selection)}</div>
      )}
    </main>
  );
}

function renderSelectionPanel(selection: SelectionState | null) {
  if (!selection) {
    return <p className="app__status">正在讀取選取狀態…</p>;
  }

  switch (selection.kind) {
    case "scene-not-ready":
      return (
        <Notice tone="info">請先開啟一個場景，再選取角色 Token。</Notice>
      );
    case "none":
      return (
        <Notice tone="info">
          請先在地圖上選取一個角色 Token，再設定 HP / MP。
        </Notice>
      );
    case "multiple":
      return (
        <Notice tone="warning">
          目前選取了 {selection.count} 個物件。請只選取一個角色 Token。
        </Notice>
      );
    case "not-character":
      return (
        <Notice tone="warning">
          已選取「{selection.item.name || "(未命名)"}」，但它不是 CHARACTER
          層的角色 Token。第一版只支援角色層 Token。
        </Notice>
      );
    case "character": {
      const existingStatus = readTokenStatus(selection.item);
      return (
        <StatusEditor
          key={selection.item.id}
          item={selection.item}
          existingStatus={existingStatus}
        />
      );
    }
  }
}
