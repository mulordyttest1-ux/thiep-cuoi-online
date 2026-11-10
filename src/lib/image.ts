/**
 * Nén ảnh tự động lúc tải lên (thiệp cưới ChungĐôi).
 *
 * Vấn đề: khách thường gửi ảnh gốc từ điện thoại (3–8 MB); trước đây
 * app lưu nguyên ảnh gốc thành data URL base64 (còn phình thêm ~33%),
 * khách mở thiệp phải tải nguyên cục đó về nên nặng và chậm.
 *
 * Cách làm: lúc khách chọn ảnh, thu nhỏ + nén ngay trong trình duyệt
 * trước khi lưu — khách không cần biết gì, không bấm thêm nút nào.
 * Thông số: cạnh dài nhất tối đa 1600px (ảnh nhỏ hơn thì giữ nguyên,
 * KHÔNG upscale); xuất JPEG chất lượng 0.82 (đủ đẹp trên điện thoại).
 * Ảnh PNG/WebP chỉ resize, giữ nguyên định dạng để không mất nền
 * trong suốt. Ảnh không phải JPEG/PNG/WebP thì trả về nguyên bản.
 * Hướng ảnh (EXIF orientation) được giữ đúng bằng createImageBitmap
 * với imageOrientation 'from-image', có fallback sang <img>.
 *
 * Hàm không bao giờ làm hỏng luồng tải lên vì lỗi xử lý ảnh: lỗi thì
 * fallback về data URL gốc của file. Chỉ khi bản thân file không đọc
 * được thì mới throw để chỗ gọi hiện thông báo lỗi như cũ.
 */

const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.82;

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Không đọc được file ảnh."));
    };
    reader.onerror = () => reject(new Error("Không đọc được file ảnh."));
    reader.readAsDataURL(file);
  });
}

type DecodedImage = { width: number; height: number; bitmap: ImageBitmap | null; img: HTMLImageElement | null };

async function decodeImage(file: File): Promise<DecodedImage> {
  // Đường chính: createImageBitmap tôn trọng EXIF orientation khi có
  // imageOrientation: 'from-image' — ảnh chụp dọc/ngang hiển thị đúng.
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      if (bitmap.width > 0 && bitmap.height > 0) {
        return { width: bitmap.width, height: bitmap.height, bitmap, img: null };
      }
      bitmap.close();
    }
  } catch {
    // Rơi xuống fallback bên dưới.
  }
  // Fallback: <img> (trình duyệt cũ không có createImageBitmap).
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Không giải mã được ảnh."));
      el.src = objectUrl;
    });
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      return { width: img.naturalWidth, height: img.naturalHeight, bitmap: null, img };
    }
    throw new Error("Không giải mã được ảnh.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function compressImage(file: File): Promise<string> {
  try {
    const type = (file.type || "").toLowerCase();
    const isJpeg = type === "image/jpeg" || type === "image/jpg";
    const isPng = type === "image/png";
    const isWebp = type === "image/webp";
    // Định dạng lạ (GIF, BMP, HEIC...): giữ nguyên, không vỡ.
    if (!isJpeg && !isPng && !isWebp) return readAsDataURL(file);

    const decoded = await decodeImage(file);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(decoded.width, decoded.height));
    const outWidth = Math.max(1, Math.round(decoded.width * scale));
    const outHeight = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return readAsDataURL(file);
    if (decoded.bitmap) {
      ctx.drawImage(decoded.bitmap, 0, 0, outWidth, outHeight);
      decoded.bitmap.close();
    } else if (decoded.img) {
      ctx.drawImage(decoded.img, 0, 0, outWidth, outHeight);
    }

    // PNG/WebP giữ nguyên định dạng (giữ nền trong suốt); JPEG xuất
    // lại với chất lượng 0.82.
    const outMime = isPng ? "image/png" : isWebp ? "image/webp" : "image/jpeg";
    const out = canvas.toDataURL(outMime, JPEG_QUALITY);
    return out || (await readAsDataURL(file));
  } catch {
    // Lỗi xử lý ảnh: trả về data URL gốc, luồng tải lên vẫn chạy.
    return readAsDataURL(file);
  }
}
