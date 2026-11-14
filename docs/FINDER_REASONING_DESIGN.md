# Đề xuất mở rộng Finder và luyện bài cùng dạng

Ngày: 14/11/2026. Trạng thái: chờ duyệt triển khai; chưa thay đổi runtime, prompt, dữ liệu hay provider.

## Mục tiêu và giới hạn

Mở rộng số dạng THPT được hướng dẫn đúng, có nhiều bước liên kết và nguồn công thức rõ ràng. Không cam kết giải được mọi đề: chứng minh hình học, bài tham số nhiều trường hợp, tổ hợp và mô hình hóa cần cơ chế kiểm riêng. Trả `solution` không tự chứng minh hướng dẫn đúng.

Giữ ô `= ?`, không hiển thị kết quả tính trung gian hay cuối; bước sau dùng ký hiệu của ô trước. Công thức thư viện vẫn chỉ lấy từ `formulas.js`. Không tự bổ sung kiến thức nền ngoài ba điều đã duyệt. Công thức suy ra chỉ tồn tại trong lời hướng dẫn, có nguồn và điều kiện; không tự ghi vào thư viện.

Yêu cầu mới cho phép thiết kế suy luận rộng hơn. Trước khi bật cần duyệt phần thay đổi quy tắc prompt và cập nhật tài liệu tương ứng. Đề xuất bổ sung kiểm chứng chính xác vào hướng Phase 3 cũ: thử số vẫn dùng để tìm phản ví dụ, nhưng không đủ để chứng minh một đồng nhất thức.

## Đối chiếu mã hiện tại

| Thành phần | Hiện tại | Phần cần mở rộng |
|---|---|---|
| `formulaCatalog.js` | Tối đa 8 thẻ, nhóm từ khóa và xếp hạng; ghi chú tối đa 100 ký tự | Tìm theo mục tiêu và đại lượng trung gian, giữ đủ công thức phụ thuộc |
| `finderAnswer.js` | AI viết lời giải, phân tích JSON, kiểm rồi có thể hỏi lại; ngân sách tổng 40 giây | Kế hoạch có cấu trúc trước khi dựng lời hướng dẫn |
| `solutionGuard.js` | Kiểm id, dữ kiện, kiến thức nền, lộ đáp án | Kiểm tính hợp lệ của từng phép biến đổi và các điều kiện |
| `quotaFlow.js` | Giữ lượt rồi hoàn khi không giao được hướng dẫn | Một đề vẫn chỉ giữ một lượt dù có nhiều bước nội bộ |
| `quizVariant.js` | Một số dạng tự tính kiểm; dạng khác kiểm chéo bằng AI | Dùng cấu trúc bài và bộ kiểm xác định để xác nhận cùng dạng, đúng đáp án |

Điểm cụ thể cần sửa riêng khi được duyệt: regex `\blog|logarit` nhận cả từ “logo”; nhóm cực trị không bảo đảm lấy đủ quy tắc hàm hợp; tối ưu thời gian chưa đồng nghĩa với từ khóa GTNN trong mọi cách diễn đạt. Không giải quyết bằng việc gửi toàn bộ 249 thẻ cho model.

## Luồng đề xuất

1. Chạy tiền kiểm hiện có; đề vô lý rõ ràng vẫn dừng trước giữ lượt và trước AI.
2. Xác định mục tiêu, dữ kiện, đối tượng hình học, miền biến và lớp học. Chỗ chưa rõ được đánh dấu thiếu dữ kiện; không tự giả định hình vẽ.
3. Tạo kế hoạch: mỗi bước có `stepId`, `formulaIds`, đầu vào, đầu ra, điều kiện và bước phụ thuộc. Id phải có trong thư viện; không cho tham chiếu vòng hoặc biến chưa được định nghĩa.
4. Lấy thêm thẻ theo mục tiêu phụ bằng danh mục cục bộ. AI chỉ đề xuất; backend quyết định id và giới hạn. Thí điểm tối đa 2 công thức gốc cho nhánh suy ra, tối đa 6 bước; đề dài hơn chưa thuộc nhánh này.
5. Kiểm các phép biến đổi bằng biểu thức có cấu trúc (AST), phép toán cho phép và số hữu tỉ chính xác. Không chạy mã do AI sinh, không dùng `eval`. Chưa chọn hay cài thư viện đại số.
6. Backend dựng biểu thức hiển thị từ bước đã kiểm, gắn nguồn; chạy tiếp toàn bộ guard hiện tại. Không dùng văn bản AI tự do để bổ sung suy luận chưa kiểm.
7. Chỉ giao `solution` khi toàn bộ đường đi tới mục tiêu hợp lệ. Thiếu bước hoặc không kiểm được thì từ chối có lý do; không gắn nhãn thành công cho hướng dẫn dở dang.

Phiên bản đầu ưu tiên lập kế hoạch bằng các bộ xử lý dạng bài xác định và một lần AI diễn đạt. Chưa thêm vòng gọi AI riêng cho mỗi bước. Nếu sau này cần planner bằng AI, phải đo lại ngân sách chung 40 giây và tổng số lần thử của cả request, tránh nhân số lần retry của từng tầng. Hết ngân sách thì hoàn lượt theo luồng hiện có.

## Kiểm chứng và điều kiện

| Phép suy ra | Điều kiện bắt buộc | Không được làm |
|---|---|---|
| Đổi tên/thế đại lượng | Cùng đối tượng, đúng kiểu và đơn vị | Trộn cạnh hai tam giác khác nhau |
| Rút gọn đa thức | Đồng nhất thức hệ số chính xác | Coi vài mẫu số trùng nhau là chứng minh |
| Biến đổi phân thức | Lưu và kiểm điều kiện mẫu khác 0 | Khử mẫu rồi mất điểm loại |
| Đổi vế, tìm đại lượng | Kiểm hệ số chia khác 0 và các nhánh | Chia cho tham số chưa biết có bằng 0 không |
| Bình phương/căn/log | Miền xác định, chiều suy ra, nghiệm ngoại lai | Tự coi hai phương trình là tương đương |
| Đạo hàm | Quy tắc nguồn đã duyệt, miền khả vi, hàm hợp đầy đủ | Suy dấu/cực trị chỉ từ nghiệm đạo hàm |

Thí điểm chỉ nhận các phép đầu đã có bộ kiểm. Căn, log, bất phương trình tham số và chứng minh hình học không tự động được hỗ trợ vì có trong bảng thiết kế. Ví dụ `sqrt(x²)=x` không hợp lệ nếu chưa biết x không âm.

Ví dụ chuỗi hướng dẫn: ba cạnh → thẻ Hê-rông với `p = ?`, `S = ?` → thẻ bán kính với `r = S/p`, dữ kiện để riêng và `r = ?`. Bước sau dùng `S`, `p`, không điền giá trị đã tính. Tách điều kiện hình học của tam giác khỏi phép biến đổi đại số; chứng minh biểu thức đúng chưa đủ chứng minh chọn đúng mô hình.

## Các đợt nhỏ để duyệt và đo riêng

| Đợt | Phạm vi | Điều kiện hoàn thành |
|---|---|---|
| A | Sửa truy xuất nhầm “logo”; bộ ca phủ chuỗi Hê-rông–r/R, Vi-ét–biểu thức đối xứng, hàm hợp–cực trị | Đo có đủ thẻ và không làm giảm các ca cũ; chưa đổi prompt |
| B | AST, nguồn, điều kiện; suy ra đại số từ tối đa 2 thẻ trong danh sách đã đối chiếu | Kiểm chính xác, chặn biểu thức không hỗ trợ; bật thử bằng cờ mặc định tắt |
| C | Mở từng bộ xử lý đạo hàm và tọa độ, nối bước có điều kiện | Chấm riêng từng dạng; bài tham số/phân nhánh chưa hỗ trợ phải từ chối |
| D | Quiz dùng cấu trúc và điều kiện bài Finder đã hướng dẫn thành công | Đề mới đúng dạng, đổi dữ kiện và đáp số, đáp số được kiểm độc lập |
| Sau đó | Xác suất, tổ hợp, hình học chứng minh, tối ưu thực tế | Thiết kế kiểm riêng; kiến thức/định lý mới cần chủ dự án duyệt |

“Cùng dạng” cho Quiz phải giữ mục tiêu, cấu trúc quan hệ và kỹ thuật giải. Thay số không đủ: phải giữ điều kiện có nghiệm, loại cực trị, tính hợp lệ hình và mức độ khó. Bộ sinh chọn dữ kiện thỏa điều kiện; bộ kiểm tính đáp số mới và so với đáp số gốc. Nếu chưa tính kiểm được đáp số gốc thì không tuyên bố bảo đảm khác đáp số. Đáp án chỉ hiện ở luồng Quiz theo quy tắc hiện tại, không truyền ngược sang Finder.

## Kiểm thử và triển khai

- Bộ ca chia theo dạng và nguồn; tách bộ phát triển với bộ giữ lại để đánh giá. Đề web làm dữ liệu đánh giá, không có nghĩa model đã được huấn luyện hay công thức tự được phê duyệt.
- Với mỗi phép biến đổi: ca đúng, thiếu điều kiện, phản ví dụ, chia 0, căn sai nhánh, đổi dấu bất phương trình, biến chưa khai báo, id không tồn tại, vòng phụ thuộc và biểu thức quá lớn.
- Với mỗi dạng: diễn đạt tương đương, nhiều đối tượng gần giống, dữ kiện thừa/thiếu, bậc/lớp không phù hợp, số trung gian trùng số đã cho và kiểm không lộ đáp án.
- Route giả lập: tiền kiểm chặn = 0 lần AI/0 lần giữ lượt; thành công nhiều bước = 1 lượt; lỗi/timeout/không kiểm được = hoàn đúng một lần. Giới hạn kích thước AST và thời gian kiểm.
- Theo dõi riêng: chọn đủ thẻ, kế hoạch đầy đủ, suy luận đúng, lộ số, từ chối nhầm, token tổng và thời gian. Không gộp thành một tỷ lệ “giải được”.
- Trước mỗi bản: backend tests, frontend `test:data`, build, check-secrets cả phần chưa commit. Live eval chỉ bằng key eval riêng khi được phép; không gọi production để chấm.
- Chỉ mở cờ sau khi toàn bộ ca an toàn xác định đạt và chủ dự án xem kết quả AI thật. Không có cỡ mẫu nào bảo đảm “mọi dạng”; báo rõ phạm vi và mẫu đã đo. Tắt cờ trả về luồng hiện hành, không cần migration.

## Chi phí và trạng thái đo

Lượt thiết kế này không gọi AI bên ngoài, không dùng token key eval. Chưa có số đo token/độ trễ của kiến trúc mới; không lấy số đo luồng cũ làm cam kết. Số bước và số thẻ ở trên là giới hạn đề xuất, cần điều chỉnh sau benchmark. Không đổi quota, provider, dữ liệu công thức hoặc chính sách Quiz trong bản tài liệu này.

Đề nghị duyệt đợt A trước; đợt B cần duyệt danh sách phép biến đổi, schema và phần prompt thay đổi trước khi code tích hợp. Không commit/push tự động.
