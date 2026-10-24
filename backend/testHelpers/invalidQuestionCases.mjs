export const positiveGroups = {
  triangle: [
    ["Tam giác ABC có A = 50°, B = 60°, C = 80°. Tính góc A", "invalid_triangle_angles"],
    ["Tam giác ABC có góc A = 0°. Tính B", "invalid_triangle_angles"],
    ["Tam giác ABC có góc A = 180°. Tính B", "invalid_triangle_angles"],
    ["Tam giác ABC có cạnh AB = 0, BC = 3. Tính AC", "invalid_length"],
    ["Đường tròn có bán kính R = -2. Tính chu vi", "invalid_length"],
    ["Hình tròn có đường kính d = 0. Tính diện tích", "invalid_length"],
    ["Tam giác có ba cạnh 1, 2, 4. Tính diện tích", "invalid_triangle_sides"],
    ["Tam giác ABC vuông tại A có BC = 5, AB = 6. Tính AC", "invalid_hypotenuse"],
    ["Tam giác ABC vuông tại A có BC = 5, AB = 3, AC = 6. Tính diện tích", "invalid_hypotenuse"],
  ],
  numeric: [
    ["Cho sin α = 1,2. Tính cos α", "invalid_trig_value"],
    ["Cho cos x = -1.1. Tính sin x", "invalid_trig_value"],
    ["Biết sin x = 2. Tìm x", "invalid_trig_value"],
    ["Tìm tâm đường tròn x² + y² + 1 = 0", "invalid_circle_radius"],
    ["Tìm bán kính đường tròn x² + y² = 0", "invalid_circle_radius"],
    ["Với x = 0, tính 1/x", "zero_denominator"],
    ["Cho x = 2, tính 1/(x - 2)", "zero_denominator"],
  ],
  noMath: [
    ["Xin chào!", "no_math_problem"],
    ["hello", "no_math_problem"],
    ["ok", "no_math_problem"],
    ["Bạn khỏe không?", "no_math_problem"],
    ["Giải luôn", "missing_problem"],
    ["Làm bài này", "missing_problem"],
  ],
};

export const negativeGroups = {
  triangle: [
    "Tam giác ABC có A = 50°, B = 60°, C = 70°. Tính góc A",
    "Tam giác ABC có A = 60,1°, B = 59,9°, C = 60°. Tính góc A",
    "Tam giác ABC có góc ngoài tại A = 180°, góc B = 40°. Tính C",
    "Tam giác ABC có A = 100°. Tam giác DEF có D = 90°. Tính góc còn lại",
    "Trong mặt phẳng Oxy, tam giác ABC có A(0; 2), B(3; 4). Tính AB",
    "Đường tròn tâm I(0; 0) có bán kính R = 4. Tính diện tích",
    "Tam giác có ba cạnh 3, 4, 5. Tính diện tích",
    "Tam giác ABC vuông tại A có BC = 10, AB = 6. Tính AC",
    "Tam giác ABC có AB = x, BC = 3. Tính AC",
  ],
  numeric: [
    "Cho sin x = 1. Tính cos x",
    "Cho cos x = -1. Tính sin x",
    "Cho sin x = 0,5. Tính cos x",
    "Tìm tâm và bán kính đường tròn x² + y² - 4x + 6y - 12 = 0",
    "Tìm bán kính đường tròn x² + y² - 2x - 2y + 1 = 0",
    "Với x = 2, tính 1/(x - 3)",
    "Tính 1/x theo x",
    "Cho sinh x = 2. Tính x",
  ],
  noMath: [
    "Chào bạn, tính diện tích tam giác có đáy 3 và chiều cao 4",
    "Tính diện tích tam giác theo đáy và chiều cao",
    "Giải phương trình x² - 1 = 0",
    "Cho x = 0. Tìm giá trị biểu thức",
    "Có công thức diện tích tam giác không?",
    "Tam giác ABC có góc A. Tính góc B",
    "Hi, tính góc A?",
    "Giải tiếp", // có lịch sử: không coi là câu mở đầu thiếu đề
    "Heron?", // tên công thức ngắn vẫn là nội dung toán
  ],
};
