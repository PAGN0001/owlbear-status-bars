import type {
  CharacterStatus,
  CharacterStatusFieldErrors,
  CharacterStatusFormValues,
  ValidationResult,
} from "../types/status";

function parseFiniteNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

/**
 * 驗證角色狀態表單。
 * 不會偷偷截斷或改寫使用者輸入；若最大值被調低導致當前值超過，會回傳錯誤請使用者自行修正。
 */
export function validateCharacterStatus(
  values: CharacterStatusFormValues,
): ValidationResult {
  const errors: CharacterStatusFieldErrors = {};

  const characterName = values.characterName.trim();
  if (characterName === "") {
    errors.characterName = "角色名稱不可空白。";
  }

  const currentHP = parseFiniteNumber(values.currentHP);
  const maxHP = parseFiniteNumber(values.maxHP);
  const currentMP = parseFiniteNumber(values.currentMP);
  const maxMP = parseFiniteNumber(values.maxMP);

  if (currentHP === null) {
    errors.currentHP = "目前 HP 必須是有效數字，不可空白。";
  } else if (currentHP < 0) {
    errors.currentHP = "目前 HP 不可小於 0。";
  }

  if (maxHP === null) {
    errors.maxHP = "最大 HP 必須是有效數字，不可空白。";
  } else if (!(maxHP > 0)) {
    errors.maxHP = "最大 HP 必須大於 0。";
  }

  if (
    currentHP !== null &&
    maxHP !== null &&
    maxHP > 0 &&
    currentHP > maxHP
  ) {
    errors.currentHP = "目前 HP 不可大於最大 HP。請先調高最大值，或降低目前值。";
  }

  if (currentMP === null) {
    errors.currentMP = "目前 MP 必須是有效數字，不可空白。";
  } else if (currentMP < 0) {
    errors.currentMP = "目前 MP 不可小於 0。";
  }

  if (maxMP === null) {
    errors.maxMP = "最大 MP 必須是有效數字，不可空白。";
  } else if (!(maxMP > 0)) {
    errors.maxMP = "最大 MP 必須大於 0。";
  }

  if (
    currentMP !== null &&
    maxMP !== null &&
    maxMP > 0 &&
    currentMP > maxMP
  ) {
    errors.currentMP = "目前 MP 不可大於最大 MP。請先調高最大值，或降低目前值。";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      characterName,
      currentHP: currentHP as number,
      maxHP: maxHP as number,
      currentMP: currentMP as number,
      maxMP: maxMP as number,
    },
  };
}

/** 判斷 Metadata 讀出的未知資料是否為合法 CharacterStatus。 */
export function isCharacterStatus(value: unknown): value is CharacterStatus {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.characterName === "string" &&
    Number.isFinite(record.currentHP) &&
    Number.isFinite(record.maxHP) &&
    Number.isFinite(record.currentMP) &&
    Number.isFinite(record.maxMP)
  );
}

export function statusToFormValues(
  status: CharacterStatus,
): CharacterStatusFormValues {
  return {
    characterName: status.characterName,
    currentHP: String(status.currentHP),
    maxHP: String(status.maxHP),
    currentMP: String(status.currentMP),
    maxMP: String(status.maxMP),
  };
}

export function createEmptyFormValues(
  characterName = "",
): CharacterStatusFormValues {
  return {
    characterName,
    currentHP: "",
    maxHP: "",
    currentMP: "",
    maxMP: "",
  };
}
