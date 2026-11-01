import { useEffect, useState } from "react";
import type { Image } from "@owlbear-rodeo/sdk";
import type {
  CharacterStatus,
  CharacterStatusFieldErrors,
  CharacterStatusFormValues,
} from "../types/status";
import {
  createEmptyFormValues,
  statusToFormValues,
  validateCharacterStatus,
} from "../utils/validation";
import {
  deleteStatusAttachments,
  upsertStatusAttachments,
} from "../obr/statusAttachments";
import { clearTokenStatus, saveTokenStatus } from "../obr/tokenStatus";
import NumberField from "./NumberField";
import Notice from "./Notice";

type StatusEditorProps = {
  item: Image;
  existingStatus: CharacterStatus | null;
};

export default function StatusEditor({
  item,
  existingStatus,
}: StatusEditorProps) {
  const [values, setValues] = useState<CharacterStatusFormValues>(() =>
    existingStatus
      ? statusToFormValues(existingStatus)
      : createEmptyFormValues(item.name),
  );
  const [errors, setErrors] = useState<CharacterStatusFieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  // 以內容字串比較，避免僅因 Item 物件重抓而清空使用者正在輸入的內容。
  const existingStatusKey = existingStatus
    ? JSON.stringify(existingStatus)
    : null;

  useEffect(() => {
    const syncedStatus = existingStatusKey
      ? (JSON.parse(existingStatusKey) as CharacterStatus)
      : null;

    setValues(
      syncedStatus
        ? statusToFormValues(syncedStatus)
        : createEmptyFormValues(item.name),
    );
    setErrors({});
    setFeedback(null);
  }, [item.id, item.name, existingStatusKey]);

  const isEditing = existingStatus !== null;
  const title = isEditing
    ? `編輯角色狀態：${existingStatus.characterName}`
    : "設定角色狀態";

  function updateField<K extends keyof CharacterStatusFormValues>(
    key: K,
    value: CharacterStatusFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFeedback(null);
  }

  function handleReset() {
    setValues(
      existingStatus
        ? statusToFormValues(existingStatus)
        : createEmptyFormValues(item.name),
    );
    setErrors({});
    setFeedback(null);
  }

  async function handleSave() {
    const result = validateCharacterStatus(values);
    if (!result.ok) {
      setErrors(result.errors);
      setFeedback({
        tone: "error",
        message: "請先修正欄位錯誤後再儲存。",
      });
      return;
    }

    setBusy(true);
    setErrors({});
    try {
      await saveTokenStatus(item.id, result.value);
      // Metadata 寫入後，建立或更新場景中的共享狀態條附件。
      await upsertStatusAttachments(item, result.value);
      setFeedback({
        tone: "success",
        message: isEditing ? "已儲存變更。" : "角色狀態已設定完成。",
      });
    } catch (error) {
      console.error("儲存角色狀態失敗", error);
      setFeedback({
        tone: "error",
        message: "儲存失敗，請稍後再試。",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    const confirmed = window.confirm(
      `確定要移除「${existingStatus?.characterName ?? item.name}」的狀態顯示嗎？\n這不會刪除地圖上的 Token 本身。`,
    );
    if (!confirmed) {
      return;
    }

    setBusy(true);
    try {
      await clearTokenStatus(item.id);
      await deleteStatusAttachments(item.id);
      setFeedback({
        tone: "success",
        message: "已移除狀態資料與狀態條。",
      });
    } catch (error) {
      console.error("移除角色狀態失敗", error);
      setFeedback({
        tone: "error",
        message: "移除失敗，請稍後再試。",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="editor">
      <h2 className="editor__title">{title}</h2>
      <p className="editor__meta">正在編輯 Token：{item.name || "(未命名)"}</p>

      <label className="field" htmlFor="characterName">
        <span className="field__label">角色名稱</span>
        <input
          id="characterName"
          className={
            errors.characterName
              ? "field__input field__input--error"
              : "field__input"
          }
          type="text"
          value={values.characterName}
          onChange={(event) => updateField("characterName", event.target.value)}
        />
        {errors.characterName ? (
          <span className="field__error">{errors.characterName}</span>
        ) : null}
      </label>

      <NumberField
        id="currentHP"
        label="目前 HP"
        value={values.currentHP}
        error={errors.currentHP}
        onChange={(value) => updateField("currentHP", value)}
      />
      <NumberField
        id="maxHP"
        label="最大 HP"
        value={values.maxHP}
        error={errors.maxHP}
        onChange={(value) => updateField("maxHP", value)}
      />
      <NumberField
        id="currentMP"
        label="目前 MP"
        value={values.currentMP}
        error={errors.currentMP}
        onChange={(value) => updateField("currentMP", value)}
      />
      <NumberField
        id="maxMP"
        label="最大 MP"
        value={values.maxMP}
        error={errors.maxMP}
        onChange={(value) => updateField("maxMP", value)}
      />

      {feedback ? (
        <Notice tone={feedback.tone}>{feedback.message}</Notice>
      ) : null}

      <div className="editor__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={() => void handleSave()}
        >
          {isEditing ? "儲存變更" : "儲存"}
        </button>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={handleReset}
        >
          {isEditing ? "還原" : "清空表單"}
        </button>
        {isEditing ? (
          <button
            type="button"
            className="btn btn--danger"
            disabled={busy}
            onClick={() => void handleRemove()}
          >
            移除狀態顯示
          </button>
        ) : null}
      </div>
    </section>
  );
}
