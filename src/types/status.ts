/** 儲存在 Token Metadata 中的角色狀態資料。 */
export type CharacterStatus = {
  characterName: string;
  currentHP: number;
  maxHP: number;
  currentMP: number;
  maxMP: number;
};

/** 表單輸入用字串狀態（尚未轉成數字）。 */
export type CharacterStatusFormValues = {
  characterName: string;
  currentHP: string;
  maxHP: string;
  currentMP: string;
  maxMP: string;
};

/** 各欄位錯誤訊息；有錯誤時對應鍵會帶提示文字。 */
export type CharacterStatusFieldErrors = Partial<
  Record<keyof CharacterStatusFormValues, string>
>;

export type ValidationResult =
  | { ok: true; value: CharacterStatus }
  | { ok: false; errors: CharacterStatusFieldErrors };
