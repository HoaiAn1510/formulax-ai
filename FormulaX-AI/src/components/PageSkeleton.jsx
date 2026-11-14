// Khung xương lúc chờ chunk của view (React.lazy) hoặc dữ liệu công thức — thay cho vòng xoay "Đang tải…".
// Bố cục gần giống trang thật (tiêu đề + lưới thẻ / khung chat) để lúc nội dung về không bị "nhảy".
// variant: "grid" (Thư viện, Flashcard, Quiz, Premium), "chat" (Trợ lý hướng dẫn), "stats" (Tiến độ), "narrow" (Cài đặt)

const BONE = "rounded-xl bg-[#E9EDF3] dark:bg-night-card animate-pulse";
const CARD = "rounded-2xl border border-line dark:border-night-line bg-white dark:bg-night-card";

function Header() {
  return (
    <div className="mb-5 md:mb-7">
      <div className={`${BONE} h-3 w-24 mb-4`} />
      <div className={`${BONE} h-8 md:h-9 w-56 md:w-72 mb-2.5`} />
      <div className={`${BONE} h-3.5 w-72 max-w-full`} />
    </div>
  );
}

function CardBones({ lines = 2 }) {
  return (
    <div className={`${CARD} p-4 md:p-5`}>
      <div className={`${BONE} h-9 w-9 mb-3.5`} />
      <div className={`${BONE} h-4 w-3/4 mb-2.5`} />
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={`${BONE} h-3 mb-2 ${i === lines - 1 ? "w-1/2" : "w-full"}`} />
      ))}
    </div>
  );
}

export default function PageSkeleton({ variant = "grid" }) {
  if (variant === "chat") {
    return (
      <div className="view-container" aria-busy="true" aria-label="Đang tải trang">
        <div className="h-full grid grid-cols-1 md:grid-cols-[1fr_300px] gap-3">
          <div className={`${CARD} p-5 flex flex-col gap-4 min-h-[60vh]`}>
            <div className={`${BONE} h-14 w-2/3`} />
            <div className={`${BONE} h-10 w-1/2 self-end`} />
            <div className={`${BONE} h-24 w-4/5`} />
            <div className={`${BONE} h-12 w-full mt-auto`} />
          </div>
          <div className={`${CARD} p-4 hidden md:flex flex-col gap-3`}>
            <div className={`${BONE} h-10 w-full`} />
            {Array.from({ length: 4 }, (_, i) => <div key={i} className={`${BONE} h-12 w-full`} />)}
          </div>
        </div>
      </div>
    );
  }

  const width = variant === "narrow" ? "max-w-[760px]" : "max-w-[1440px]";
  return (
    <div className="view-container bg-page dark:bg-night-page" aria-busy="true" aria-label="Đang tải trang">
      <div className={`w-full mx-auto ${width}`}>
        <Header />
        {variant === "stats" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={`${CARD} p-4`}>
                <div className={`${BONE} h-3 w-16 mb-3`} />
                <div className={`${BONE} h-7 w-12`} />
              </div>
            ))}
          </div>
        )}
        {variant === "narrow" ? (
          <div className="flex flex-col gap-4">
            <div className={`${BONE} h-20 w-full rounded-2xl`} />
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={`${CARD} p-4 flex flex-col gap-3`}>
                <div className={`${BONE} h-3 w-20`} />
                <div className={`${BONE} h-10 w-full`} />
                <div className={`${BONE} h-10 w-full`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {Array.from({ length: variant === "stats" ? 3 : 6 }, (_, i) => <CardBones key={i} lines={variant === "stats" ? 3 : 2} />)}
          </div>
        )}
      </div>
    </div>
  );
}
