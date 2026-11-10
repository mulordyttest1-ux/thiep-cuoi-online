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
 * sendTelegram tự nuốt mọi lỗi + timeout 5 giây, route chốt await
 * notifyOwner (vẫn trong timeout 5 giây) rồi mới trả response, để Vercel
 * serverless không cắt ngang fetch gửi tin trước khi nó xong.
 * Gửi tin lỗi thì ghi log rõ ràng (status + đoạn body) để chẩn đoán —
 * trước đây lỗi bị nuốt im lặng nên tin ngừng mà không ai biết vì sao.
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

/** Gửi 1 tin văn bản tới chat Telegram của Nancy. Chưa cấu hình thì no-op.
 *  Không bao giờ throw. Gửi lỗi thì ghi log (status + đoạn body trả về,
 *  không in token/chat id) để chẩn đoán — trước đây lỗi bị nuốt im lặng. */
export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || !text) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      let snippet = "";
      try {
        snippet = (await res.text()).slice(0, 200);
      } catch {
        snippet = "(không đọc được body)";
      }
      console.error(`[notify] Telegram sendMessage thất bại: HTTP ${res.status} ${snippet}`);
    }
  } catch (e) {
    // Gửi tin lỗi (mạng chậm, token sai, Telegram lỗi, timeout 5s) thì thôi —
    // lần chốt của khách đã thành công, không được báo lỗi ngược.
    console.error(`[notify] Telegram sendMessage lỗi: ${e instanceof Error ? e.message : "không rõ nguyên nhân"}`);
  }
}

/** Báo cho Nancy 1 thiệp vừa chốt. Không bao giờ throw. */
export async function notifyOwner(data: Partial<InvitationData>): Promise<void> {
  await sendTelegram(buildConfirmMessage(data));
}
