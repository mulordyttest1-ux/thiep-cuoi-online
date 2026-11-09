import type { InvitationData } from "./types";

/**
 * Thông báo cho Nancy khi khách chốt thiệp — kênh Telegram (bot).
 *
 * Chỉ hoạt động khi đã cấu hình đủ 2 biến môi trường Vercel Production
 * (Secret, không ghi vào repo):
 *   TELEGRAM_BOT_TOKEN — token bot lấy từ @BotFather
 *   TELEGRAM_CHAT_ID   — chat id của Nancy (nhắn /start cho bot rồi lấy
 *                          qua getUpdates hoặc @userinfobot)
 * Chưa cấu hình thì mọi hàm là no-op im lặng — khách chốt vẫn chạy
 * bình thường, không báo lỗi gì.
 *
 * Nguyên tắc: thông báo KHÔNG BAO GIỜ được làm hỏng lần chốt của khách —
 * sendTelegram tự nuốt mọi lỗi + timeout 5 giây, route chốt gọi
 * notifyOwner fire-and-forget (không await).
 */

const BOARD_URL = "https://chung-doi.vercel.app/quan-ly";

function formatDateDMY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : (iso || "").trim();
}

/** Nội dung tin báo chốt (tiếng Việt). Thiếu trường nào thì bỏ phần đó, không crash. */
export function buildConfirmMessage(data: Partial<InvitationData>): string {
  const lines: string[] = ["🔔 Khách vừa chốt thiệp!"];
  const names = [data.brideName?.trim(), data.groomName?.trim()].filter(Boolean).join(" & ");
  const head = [data.ceremonyType?.trim(), names].filter(Boolean).join(" — ");
  if (head) lines.push(head);
  const party = [formatDateDMY(data.date || ""), data.venue?.trim()].filter(Boolean).join(", ");
  if (party) lines.push(`Tiệc: ${party}`);
  lines.push(`Xem: ${BOARD_URL}`);
  return lines.join("\n");
}

/** Gửi 1 tin văn bản tới chat Telegram của Nancy. Chưa cấu hình thì no-op. Không bao giờ throw. */
export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || !text) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Gửi tin lỗi (mạng chậm, token sai, Telegram lỗi) thì thôi —
    // lần chốt của khách đã thành công, không được báo lỗi ngược.
  }
}

/** Báo cho Nancy 1 thiệp vừa chốt. Không bao giờ throw. */
export async function notifyOwner(data: Partial<InvitationData>): Promise<void> {
  await sendTelegram(buildConfirmMessage(data));
}
