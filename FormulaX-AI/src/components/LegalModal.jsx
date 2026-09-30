import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Điều khoản dịch vụ & Chính sách bảo mật.
 *
 * Trước đây hai dòng này ở màn đăng nhập chỉ là <span> có cursor-pointer, không dẫn tới đâu —
 * trong khi app thu thập email, tên, ảnh đại diện và nhận thanh toán thật. Nghị định 13/2023
 * về bảo vệ dữ liệu cá nhân yêu cầu phải công bố rõ thu thập gì, dùng làm gì, chia sẻ với ai,
 * lưu bao lâu, và người dùng yêu cầu xoá bằng cách nào.
 *
 * ⚠️ Đây là bản do nhóm phát triển soạn, KHÔNG phải tư vấn pháp lý — trước khi mở bán rộng nên
 * nhờ người có chuyên môn đọc lại. Chỉ ghi đúng những gì code thật sự làm: sửa luồng dữ liệu
 * (đăng nhập, chế độ khách, AI Finder, thanh toán) thì phải sửa văn bản này theo.
 */

const CONTACT_EMAIL = "nguyenduonghoaian7966@gmail.com";
const LAST_UPDATED = "30/09/2026";

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h3 className="text-[0.95rem] font-extrabold text-primary dark:text-[#E2E8F0] mb-2">{title}</h3>
      <div className="text-[0.83rem] leading-[1.7] text-text-muted dark:text-[#94A3B8] flex flex-col gap-2">
        {children}
      </div>
    </section>
  );
}

function Terms() {
  return (
    <>
      <Section title="1. Về dịch vụ">
        <p>
          FormulaX AI là công cụ hỗ trợ học sinh THPT tra cứu, ghi nhớ và luyện tập công thức Toán
          theo chương trình GDPT 2018. Dịch vụ gồm phần miễn phí và gói Premium trả phí.
        </p>
      </Section>

      <Section title="2. Tài khoản">
        <p>
          Bạn đăng nhập bằng tài khoản Google. Bạn chịu trách nhiệm giữ an toàn cho tài khoản của
          mình và cho mọi hoạt động diễn ra dưới tài khoản đó. Vui lòng không chia sẻ tài khoản
          Premium cho người khác dùng chung.
        </p>
        <p>
          Bạn cũng có thể <strong>dùng thử không cần đăng nhập</strong> (chế độ khách): tra cứu công
          thức và làm Quiz với số lượt giới hạn mỗi ngày. Chế độ khách không dùng được trợ lý AI,
          không lưu tiến độ học lên máy chủ và không mua được gói Premium — đăng nhập Google để dùng
          đầy đủ tính năng.
        </p>
      </Section>

      <Section title="3. Nội dung học liệu">
        <p>
          Công thức và bài tập được biên soạn dựa trên sách giáo khoa chương trình GDPT 2018 và có
          ghi nguồn tham chiếu. Chúng tôi cố gắng bảo đảm chính xác, nhưng đây là tài liệu hỗ trợ
          học tập — khi ôn thi, hãy đối chiếu với sách giáo khoa và hướng dẫn của giáo viên.
        </p>
        <p>
          Trợ lý AI chỉ giải thích và chỉ dẫn dựa trên kho công thức có sẵn. Câu trả lời của AI
          không thay thế lời giảng của giáo viên.
        </p>
      </Section>

      <Section title="4. Thanh toán, gia hạn và hoàn tiền">
        <p>
          Gói Premium được thanh toán một lần cho mỗi kỳ hạn (theo tháng hoặc 6 tháng) qua cổng
          thanh toán payOS. Dịch vụ <strong>không tự động gia hạn</strong> và không tự trừ tiền
          kỳ tiếp theo; hết hạn thì tài khoản trở về gói miễn phí.
        </p>
        <p>
          Nếu bạn đã thanh toán thành công nhưng tài khoản không được nâng cấp, hãy liên hệ{" "}
          <strong>{CONTACT_EMAIL}</strong> kèm mã đơn hàng — chúng tôi sẽ kích hoạt thủ công hoặc
          hoàn tiền đầy đủ.
        </p>
        <p>
          Với các trường hợp khác, yêu cầu hoàn tiền được xem xét trong vòng 7 ngày kể từ ngày
          thanh toán, nếu bạn chưa sử dụng đáng kể tính năng Premium.
        </p>
      </Section>

      <Section title="5. Những việc không được làm">
        <p>
          Không sao chép hàng loạt kho công thức và bài tập để phát hành lại; không dùng công cụ
          tự động để gửi lượng lớn yêu cầu tới hệ thống; không tìm cách truy cập dữ liệu của người
          dùng khác.
        </p>
      </Section>

      <Section title="6. Giới hạn trách nhiệm">
        <p>
          Dịch vụ được cung cấp "như hiện có". Chúng tôi không cam kết hệ thống chạy liên tục
          không gián đoạn, và không chịu trách nhiệm cho kết quả học tập hay kết quả thi cử của
          người dùng.
        </p>
      </Section>

      <Section title="7. Thay đổi điều khoản">
        <p>
          Khi có thay đổi quan trọng, chúng tôi sẽ thông báo trong ứng dụng trước khi áp dụng.
          Tiếp tục sử dụng dịch vụ sau đó đồng nghĩa với việc bạn chấp nhận điều khoản mới.
        </p>
      </Section>
    </>
  );
}

function Privacy() {
  return (
    <>
      <Section title="1. Chúng tôi thu thập gì">
        <p>
          <strong>Khi đăng nhập bằng Google:</strong> Google cung cấp cho chúng tôi họ tên, địa chỉ
          email và ảnh đại diện của bạn. Các thông tin này được lưu trong hệ thống xác thực
          (Supabase) để nhận diện tài khoản và hiển thị trong ứng dụng. Chúng tôi không bao giờ nhận
          được mật khẩu Google của bạn.
        </p>
        <p>
          <strong>Khi dùng thử không cần đăng nhập (chế độ khách):</strong> hệ thống tạo một phiên ẩn
          danh với mã ngẫu nhiên, không gắn với tên hay email. Ở chế độ này, dữ liệu học tập không
          được lưu lên máy chủ; số lượt làm Quiz trong ngày và câu Thử thách hôm nay chỉ lưu trên
          trình duyệt của thiết bị bạn đang dùng. Chế độ khách không dùng được trợ lý AI.
        </p>
        <p>
          <strong>Từ quá trình học (tài khoản Google):</strong> công thức bạn đánh dấu, ghi chú cá
          nhân, bộ thẻ ghi nhớ và tiến độ ôn tập, kết quả bài kiểm tra, lịch sử tìm kiếm, lịch sử hỏi
          trợ lý AI và số lượt hỏi AI mỗi ngày.
        </p>
        <p>
          <strong>Khi thanh toán:</strong> mã đơn hàng, gói đã mua, số tiền, trạng thái và mã tham
          chiếu giao dịch. Việc thanh toán do cổng <strong>payOS</strong> xử lý — FormulaX{" "}
          <strong>không lưu và không nhìn thấy</strong> thông tin thẻ hay tài khoản ngân hàng của bạn.
        </p>
      </Section>

      <Section title="2. Dùng để làm gì">
        <p>
          Để đăng nhập và nhận diện tài khoản; để lưu tiến độ học và gợi ý nội dung ôn tập phù hợp;
          để xử lý thanh toán và xác định trạng thái Premium; để phát hiện lạm dụng hệ thống.
        </p>
        <p>
          Chúng tôi <strong>không bán dữ liệu cá nhân</strong> và không dùng dữ liệu học tập của
          bạn cho quảng cáo.
        </p>
      </Section>

      <Section title="3. Chia sẻ với ai">
        <p>Dữ liệu chỉ đi qua các nhà cung cấp cần thiết để dịch vụ chạy được:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li><strong>Google</strong> — đăng nhập</li>
          <li><strong>Supabase</strong> — lưu trữ cơ sở dữ liệu</li>
          <li><strong>payOS</strong> — xử lý thanh toán</li>
          <li><strong>Groq</strong> — xử lý câu hỏi gửi tới trợ lý AI</li>
          <li><strong>Vercel, Render</strong> — vận hành ứng dụng và máy chủ</li>
        </ul>
        <p>
          <strong>Trợ lý AI:</strong> câu hỏi bạn gửi, kèm tối đa 10 tin nhắn gần nhất trong cuộc
          trò chuyện, được chuyển tới Groq để tạo câu trả lời. Nội dung gửi đi{" "}
          <strong>không kèm tên, email hay mã tài khoản</strong> của bạn. Một số câu hỏi (tối đa
          150 ký tự đầu) được ghi vào nhật ký máy chủ để cải thiện chất lượng trả lời, không kèm
          thông tin định danh. Vì vậy, đừng nhập thông tin cá nhân vào khung chat.
        </p>
      </Section>

      <Section title="4. Lưu trong bao lâu">
        <p>
          Dữ liệu học tập được giữ trong suốt thời gian tài khoản còn hoạt động. Khi nhận được yêu
          cầu xoá, chúng tôi xoá dữ liệu học tập của bạn trong vòng 30 ngày kể từ ngày nhận yêu
          cầu. Riêng bản ghi giao dịch thanh toán được giữ lại trong thời gian cần thiết để đối
          soát giao dịch và giải quyết khiếu nại.
        </p>
      </Section>

      <Section title="5. Quyền của bạn">
        <p>
          Theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, bạn có quyền: biết dữ liệu nào
          đang được xử lý; yêu cầu bản sao dữ liệu của mình; yêu cầu chỉnh sửa nếu sai; yêu cầu
          xoá dữ liệu; rút lại sự đồng ý; và khiếu nại tới cơ quan có thẩm quyền.
        </p>
        <p>
          Để yêu cầu xem, sửa hoặc xoá dữ liệu, hay xoá toàn bộ tài khoản, hãy gửi email tới{" "}
          <strong>{CONTACT_EMAIL}</strong> từ địa chỉ email của tài khoản cần xử lý.
        </p>
      </Section>

      <Section title="6. Bảo mật">
        <p>
          Kết nối tới ứng dụng được mã hoá bằng HTTPS. Dữ liệu trong cơ sở dữ liệu được bảo vệ
          bằng cơ chế phân quyền theo dòng, mỗi tài khoản chỉ truy cập được dữ liệu của chính
          mình. Dù vậy, không hệ thống nào an toàn tuyệt đối — nếu phát hiện sự cố ảnh hưởng tới
          dữ liệu của bạn, chúng tôi sẽ thông báo.
        </p>
      </Section>

      <Section title="7. Học sinh dưới 16 tuổi">
        <p>
          FormulaX dành cho học sinh THPT. Chúng tôi khuyến nghị học sinh dưới 16 tuổi chỉ sử dụng
          khi đã có sự đồng ý của cha mẹ hoặc người giám hộ.
        </p>
      </Section>

      <Section title="8. Liên hệ">
        <p>
          Mọi câu hỏi và yêu cầu về dữ liệu cá nhân, vui lòng gửi tới{" "}
          <strong>{CONTACT_EMAIL}</strong>.
        </p>
      </Section>
    </>
  );
}

/**
 * @param {"terms"|"privacy"} doc  Văn bản cần hiển thị
 * @param {() => void} onClose
 */
export default function LegalModal({ doc = "terms", onClose }) {
  // Đóng bằng phím Esc và khoá cuộn nền — modal dài, không có hai thứ này rất khó dùng.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const title = doc === "privacy" ? "Chính sách bảo mật" : "Điều khoản dịch vụ";

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="bg-white dark:bg-[#1E293B] w-full sm:max-w-[560px] max-h-[88vh] rounded-t-2xl sm:rounded-2xl border border-[#E5E7EB] dark:border-[#334155] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] dark:border-[#334155] shrink-0">
          <div>
            <h2 className="text-[1.05rem] font-extrabold text-primary dark:text-[#E2E8F0] m-0">{title}</h2>
            <p className="text-[0.7rem] text-text-muted dark:text-[#94A3B8] mt-0.5">
              Cập nhật lần cuối: {LAST_UPDATED}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="bg-transparent border-none cursor-pointer text-text-muted dark:text-[#94A3B8] p-1 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-[#334155]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {doc === "privacy" ? <Privacy /> : <Terms />}
        </div>
      </div>
    </div>
  );
}
