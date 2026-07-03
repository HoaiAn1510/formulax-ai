// Import này PHẢI đứng đầu tiên trong server.js. ES module imports được resolve/chạy
// tuần tự trước khi thân module gọi nó chạy, nên nếu dotenv.config() nằm sau các import khác
// (vd. import router có transitively import supabaseAdmin.js), các module đó đọc process.env
// TRƯỚC khi .env được nạp — luôn thấy giá trị undefined. Tách ra file riêng, import đầu tiên,
// để .env chắc chắn nạp xong trước khi bất kỳ module nào khác đọc process.env.
import dotenv from "dotenv";
dotenv.config();
