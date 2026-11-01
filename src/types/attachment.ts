/** 狀態顯示由多個 Scene Item 組成，以此標記每一個部分。 */
export type StatusAttachmentPart =
  | "hp-label"
  | "hp-value"
  | "hp-bg"
  | "hp-fill"
  | "mp-label"
  | "mp-value"
  | "mp-bg"
  | "mp-fill";

export const STATUS_ATTACHMENT_PARTS: StatusAttachmentPart[] = [
  "hp-label",
  "hp-value",
  "hp-bg",
  "hp-fill",
  "mp-label",
  "mp-value",
  "mp-bg",
  "mp-fill",
];

/** 寫在狀態條附件 Metadata 中的識別資料。 */
export type StatusAttachmentMeta = {
  tokenId: string;
  part: string;
  version: number;
};
