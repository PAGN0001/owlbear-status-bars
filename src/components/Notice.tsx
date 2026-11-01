import type { ReactNode } from "react";

type NoticeTone = "info" | "success" | "warning" | "error";

type NoticeProps = {
  tone?: NoticeTone;
  children: ReactNode;
};

export default function Notice({ tone = "info", children }: NoticeProps) {
  return <div className={`notice notice--${tone}`}>{children}</div>;
}
