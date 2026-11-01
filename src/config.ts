/**
 * Extension 識別設定。
 * 發布或多人長期使用前，請把 yourname 改成你的專屬名稱，
 * 只改這裡即可（Metadata key 會跟著變）。
 */
export const AUTHOR_ID = "yourname";

/** 完整 Extension ID，之後會用於 Metadata key 等命名空間。 */
export const EXTENSION_ID = `com.${AUTHOR_ID}.hp-mp-status`;

/** Token 上存放角色狀態的 Metadata key。 */
export const STATUS_METADATA_KEY = `${EXTENSION_ID}/status`;

/** 狀態條附件物件上的 Metadata key。 */
export const ATTACHMENT_METADATA_KEY = `${EXTENSION_ID}/attachment`;

/** 附件 Metadata 版本，之後若變更結構可依此辨識。 */
export const ATTACHMENT_VERSION = 12;
