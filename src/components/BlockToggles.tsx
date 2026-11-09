// Bật/tắt các khối có sẵn trên thiệp online — tiếng Việt dễ hiểu, không
// jargon. Bấm là xem trước đổi ngay (qua onPatch). Chỉ dùng ở luồng online
// (wizard demo /tao-thiep) — KHÔNG dùng ở luồng in.
"use client";

import {
  BLOCKS,
  blockAppliesTo,
  hasBlockContent,
  isBlockVisible,
  resetBlocksPatch,
  toggleBlockPatch,
  type BlockId,
} from "@/lib/blocks";
import type { InvitationData } from "@/lib/types";

/** Ghi chú khi khối đang trống nội dung (tự ẩn theo mặc định). */
const EMPTY_HINT: Record<BlockId, string> = {
  album: "Chưa có ảnh — thêm ảnh ở trên để hiện album.",
  countdown: "Chưa có ngày cưới.",
  timeline: "Chưa có lịch trình — thêm lịch trình ở trên để hiện.",
  dresscode: "Chưa có màu dress code.",
  map: "Chưa có địa chỉ — thêm địa chỉ để hiện bản đồ.",
  story: "Chưa có câu chuyện — viết câu chuyện ở trên để hiện.",
};

export default function BlockToggles({
  data,
  onPatch,
}: {
  data: InvitationData;
  onPatch: (patch: Partial<InvitationData>) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Chọn mục hiển thị trên thiệp online</legend>
      <p className="mt-1 text-sm text-[#5a4a48]">
        Khách nào không có mục nào thì tắt mục đó đi — thiệp chỉ hiện những mục đang bật.
        Mục chưa có nội dung thì tự ẩn; bật lên vẫn hiện lại được. Phần chính
        (tên, thông tin lễ, thông tin tiệc) lúc nào cũng hiện, không tắt được.
      </p>
      <ul className="mt-3 space-y-2">
        {BLOCKS.map((b) => {
          const applies = blockAppliesTo(b.id, data.templateId);
          const visible = isBlockVisible(data, b.id);
          const hasContent = hasBlockContent(data, b.id);
          return (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{b.label}</p>
                <p className="text-xs text-[#7a6a68]">
                  {!applies
                    ? "Mẫu đang chọn không có mục này."
                    : !hasContent && !visible
                      ? EMPTY_HINT[b.id]
                      : b.hint}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={visible}
                aria-label={`${visible ? "Ẩn" : "Hiện"} mục ${b.label}`}
                disabled={!applies}
                onClick={() => onPatch(toggleBlockPatch(data, b.id))}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
                  visible ? "bg-[#2e7d32] text-white" : "border bg-[#f5efe8] text-[#5a4a48]"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {visible ? "Đang hiện" : "Đang ẩn"}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => onPatch(resetBlocksPatch())}
        className="mt-2 text-sm font-semibold text-[#7a1f2b] underline"
      >
        Đặt lại như mặc định
      </button>
    </fieldset>
  );
}
