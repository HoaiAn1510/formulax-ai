import { Camera, Image as ImageIcon, X, ShieldAlert } from "lucide-react";
import { OCR_PRIVACY_NOTICE } from "../config/features";

/**
 * Bảng chọn nguồn ảnh đề: "Chụp ảnh" (mở thẳng camera sau) và "Chọn ảnh" (thư viện ảnh / tệp).
 * Hai ô <input type="file"> riêng: trên Android, `capture` buộc mở camera và không cho chọn ảnh có
 * sẵn, nên nút "Chọn ảnh" KHÔNG được có `capture`. Input nằm trong <label> để bấm trên iPhone
 * Safari mở được trình chọn (Safari chặn click() bằng code ở một số trường hợp).
 * Thông báo quyền riêng tư hiện TRƯỚC khi học sinh chọn ảnh.
 */
export default function ImageScanSheet({ onPick, onClose }) {
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // chọn lại đúng ảnh vừa chọn vẫn kích hoạt onChange
    if (file) onPick(file);
  };

  const optionClass =
    "flex-1 flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl border cursor-pointer transition duration-200 text-[0.85rem] font-bold";

  return (
    <div className="fixed inset-0 z-[1000] bg-[rgba(15,23,42,0.55)] flex items-end sm:items-center justify-center p-0 sm:p-5" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Gửi ảnh đề bài"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[420px] bg-white dark:bg-[#1E293B] rounded-t-2xl sm:rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_10px_25px_rgba(0,0,0,0.15)] flex flex-col gap-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[1.05rem] font-extrabold text-primary dark:text-[#E2E8F0] m-0">Gửi ảnh đề bài</h3>
            <p className="text-[0.78rem] text-text-muted dark:text-[#94A3B8] mt-1 mb-0">
              AI đọc tất cả các bài trong ảnh, bạn chọn bài cần hướng dẫn.
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="bg-[#F1F5F9] dark:bg-[#334155] border-none w-8 h-8 rounded-full cursor-pointer flex items-center justify-center text-primary dark:text-[#E2E8F0] shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2.5 items-start text-[0.78rem] leading-[1.5] text-[#92400E] dark:text-[#FCD34D] bg-accent-light/70 dark:bg-accent/10 border border-[rgba(217,119,6,0.25)] rounded-lg px-3 py-2.5">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span>{OCR_PRIVACY_NOTICE}</span>
        </div>

        <div className="flex gap-3">
          <label className={`${optionClass} bg-accent hover:bg-accent-hover text-white border-accent`}>
            <Camera size={22} />
            Chụp ảnh
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
          </label>
          <label className={`${optionClass} bg-white dark:bg-[#0F172A] hover:bg-[#F8FAFC] dark:hover:bg-[#334155] text-primary dark:text-[#E2E8F0] border-[#E2E8F0] dark:border-[#334155]`}>
            <ImageIcon size={22} />
            Chọn ảnh
            <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
          </label>
        </div>
      </div>
    </div>
  );
}
