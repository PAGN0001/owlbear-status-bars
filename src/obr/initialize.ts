import OBR from "@owlbear-rodeo/sdk";

/**
 * 等待 Owlbear SDK 就緒。
 * 必須透過 OBR.onReady 再呼叫其他 SDK API，否則會拋出 not ready 錯誤。
 * 參考：https://docs.owlbear.rodeo/extensions/apis/
 */
export function waitForObrReady(): Promise<void> {
  return new Promise((resolve) => {
    if (OBR.isReady) {
      resolve();
      return;
    }

    // 目前安裝的 @owlbear-rodeo/sdk 型別定義中，onReady 回傳 void（無 unsubscribe）。
    OBR.onReady(() => {
      resolve();
    });
  });
}
