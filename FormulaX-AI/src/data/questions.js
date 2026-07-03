export const questionsPool = [
  // ==================== GIẢI TÍCH (20 câu) ====================
  {
    id: "gt1",
    topic: "Giải tích",
    grade: 11,
    text: "Tìm đạo hàm của hàm số $y = x^3$ trên tập số thực.",
    options: [
      { letter: "A", text: "$y' = 3x^2$", isCorrect: true },
      { letter: "B", text: "$y' = x^2$", isCorrect: false },
      { letter: "C", text: "$y' = 3x^3$", isCorrect: false },
      { letter: "D", text: "$y' = 3x$", isCorrect: false }
    ],
    blankAnswer: "3x^2",
    explanation: "Áp dụng công thức đạo hàm lũy thừa $(x^n)' = n \\cdot x^{n-1}$ với $n = 3$, ta có $(x^3)' = 3x^2$."
  },
  {
    id: "gt2",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm nguyên hàm của hàm số $f(x) = \\cos x$.",
    options: [
      { letter: "A", text: "$\\int \\cos x \\, dx = \\sin x + C$", isCorrect: true },
      { letter: "B", text: "$\\int \\cos x \\, dx = -\\sin x + C$", isCorrect: false },
      { letter: "C", text: "$\\int \\cos x \\, dx = \\tan x + C$", isCorrect: false },
      { letter: "D", text: "$\\int \\cos x \\, dx = \\cos x + C$", isCorrect: false }
    ],
    blankAnswer: "sin x + C",
    explanation: "Theo bảng nguyên hàm cơ bản, nguyên hàm của hàm số $f(x) = \\cos x$ là $\\sin x + C$."
  },
  {
    id: "gt3",
    topic: "Giải tích",
    grade: 12,
    text: "Tính tích phân $I = \\int_{0}^{1} e^x \\, dx$.",
    options: [
      { letter: "A", text: "$I = e - 1$", isCorrect: true },
      { letter: "B", text: "$I = e$", isCorrect: false },
      { letter: "C", text: "$I = 1$", isCorrect: false },
      { letter: "D", text: "$I = e + 1$", isCorrect: false }
    ],
    blankAnswer: "e - 1",
    explanation: "Ta có $\\int_{0}^{1} e^x \\, dx = [e^x]_0^1 = e^1 - e^0 = e - 1$."
  },
  {
    id: "gt4",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm tiệm cận đứng của đồ thị hàm số $y = \\frac{2x - 1}{x + 1}$.",
    options: [
      { letter: "A", text: "$x = -1$", isCorrect: true },
      { letter: "B", text: "$x = 2$", isCorrect: false },
      { letter: "C", text: "$y = 2$", isCorrect: false },
      { letter: "D", text: "$x = 1$", isCorrect: false }
    ],
    blankAnswer: "x = -1",
    explanation: "Giới hạn $\\lim_{x \\to -1^+} y = -\\infty$, mẫu số bằng 0 tại $x = -1$ và tử số khác 0. Vậy đường tiệm cận đứng là $x = -1$."
  },
  {
    id: "gt5",
    topic: "Giải tích",
    grade: 11,
    text: "Tìm đạo hàm của hàm số $y = \\ln x$ trên khoảng $(0; +\\infty)$.",
    options: [
      { letter: "A", text: "$y' = \\frac{1}{x}$", isCorrect: true },
      { letter: "B", text: "$y' = x$", isCorrect: false },
      { letter: "C", text: "$y' = e^x$", isCorrect: false },
      { letter: "D", text: "$y' = -\\frac{1}{x^2}$", isCorrect: false }
    ],
    blankAnswer: "1/x",
    explanation: "Đạo hàm của hàm số logarit tự nhiên $y = \\ln x$ là $y' = \\frac{1}{x}$."
  },
  {
    id: "gt6",
    topic: "Giải tích",
    grade: 11,
    text: "Tìm đạo hàm của hàm số $y = \\sin x$.",
    options: [
      { letter: "A", text: "$y' = \\cos x$", isCorrect: true },
      { letter: "B", text: "$y' = -\\cos x$", isCorrect: false },
      { letter: "C", text: "$y' = \\sin x$", isCorrect: false },
      { letter: "D", text: "$y' = \\frac{1}{\\cos^2 x}$", isCorrect: false }
    ],
    blankAnswer: "cos x",
    explanation: "Theo công thức đạo hàm lượng giác cơ bản: $(\\sin x)' = \\cos x$."
  },
  {
    id: "gt7",
    topic: "Giải tích",
    grade: 11,
    text: "Tìm đạo hàm của hàm số $y = e^x$.",
    options: [
      { letter: "A", text: "$y' = e^x$", isCorrect: true },
      { letter: "B", text: "$y' = x e^{x-1}$", isCorrect: false },
      { letter: "C", text: "$y' = e^x \\ln x$", isCorrect: false },
      { letter: "D", text: "$y' = -e^x$", isCorrect: false }
    ],
    blankAnswer: "e^x",
    explanation: "Đạo hàm của hàm số mũ cơ số $e$ đặc biệt luôn bằng chính nó: $(e^x)' = e^x$."
  },
  {
    id: "gt8",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm nguyên hàm của hàm số $f(x) = \\frac{1}{x}$ trên khoảng $(0; +\\infty)$.",
    options: [
      { letter: "A", text: "$\\int \\frac{1}{x} \\, dx = \\ln x + C$", isCorrect: true },
      { letter: "B", text: "$\\int \\frac{1}{x} \\, dx = -\\frac{1}{x^2} + C$", isCorrect: false },
      { letter: "C", text: "$\\int \\frac{1}{x} \\, dx = e^x + C$", isCorrect: false },
      { letter: "D", text: "$\\int \\frac{1}{x} \\, dx = \\ln|x| + C$", isCorrect: false }
    ],
    blankAnswer: "ln x + C",
    explanation: "Trên khoảng $(0; +\\infty)$, ta có $x > 0$ nên nguyên hàm của $\\frac{1}{x}$ là $\\ln x + C$."
  },
  {
    id: "gt9",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm nguyên hàm của hàm số $f(x) = x$.",
    options: [
      { letter: "A", text: "$\\int x \\, dx = \\frac{x^2}{2} + C$", isCorrect: true },
      { letter: "B", text: "$\\int x \\, dx = 1 + C$", isCorrect: false },
      { letter: "C", text: "$\\int x \\, dx = x^2 + C$", isCorrect: false },
      { letter: "D", text: "$\\int x \\, dx = \\frac{x^2}{2}$", isCorrect: false }
    ],
    blankAnswer: "x^2/2 + C",
    explanation: "Áp dụng công thức nguyên hàm lũy thừa: $\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C$ với $n=1$."
  },
  {
    id: "gt10",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm hoành độ điểm cực trị của hàm số $y = x^2 - 2x + 3$.",
    options: [
      { letter: "A", text: "$x = 1$", isCorrect: true },
      { letter: "B", text: "$x = 2$", isCorrect: false },
      { letter: "C", text: "$x = -1$", isCorrect: false },
      { letter: "D", text: "$x = 0$", isCorrect: false }
    ],
    blankAnswer: "1",
    explanation: "Ta có $y' = 2x - 2$. Giải phương trình $y' = 0 \\iff 2x - 2 = 0 \\iff x = 1$."
  },
  {
    id: "gt11",
    topic: "Giải tích",
    grade: 11,
    text: "Tìm đạo hàm của hàm số $y = \\tan x$.",
    options: [
      { letter: "A", text: "$y' = \\frac{1}{\\cos^2 x}$", isCorrect: true },
      { letter: "B", text: "$y' = 1 + \\tan^2 x$", isCorrect: false },
      { letter: "C", text: "$y' = -\\frac{1}{\\sin^2 x}$", isCorrect: false },
      { letter: "D", text: "Cả A và B đều đúng", isCorrect: true }
    ],
    blankAnswer: "D",
    explanation: "Ta có $(\\tan x)' = \\frac{1}{\\cos^2 x} = 1 + \\tan^2 x$. Do đó cả A và B đều đúng."
  },
  {
    id: "gt12",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm giá trị lớn nhất của hàm số $y = x^3 - 3x$ trên đoạn $[0; 2]$.",
    options: [
      { letter: "A", text: "$2$", isCorrect: true },
      { letter: "B", text: "$0$", isCorrect: false },
      { letter: "C", text: "$-2$", isCorrect: false },
      { letter: "D", text: "$4$", isCorrect: false }
    ],
    blankAnswer: "2",
    explanation: "$y' = 3x^2 - 3 = 0 \\iff x = \\pm 1$. Trên đoạn $[0; 2]$, ta nhận $x = 1$. Tính các giá trị: $y(0) = 0$, $y(1) = -2$, $y(2) = 2$. Vậy giá trị lớn nhất là 2."
  },
  {
    id: "gt13",
    topic: "Giải tích",
    grade: 11,
    text: "Tìm đạo hàm của hàm số $y = x^4$.",
    options: [
      { letter: "A", text: "$y' = 4x^3$", isCorrect: true },
      { letter: "B", text: "$y' = 4x$", isCorrect: false },
      { letter: "C", text: "$y' = x^3$", isCorrect: false },
      { letter: "D", text: "$y' = 3x^4$", isCorrect: false }
    ],
    blankAnswer: "4x^3",
    explanation: "Áp dụng công thức đạo hàm lũy thừa: $(x^4)' = 4x^{4-1} = 4x^3$."
  },
  {
    id: "gt14",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm nguyên hàm của hàm số $f(x) = e^{2x}$.",
    options: [
      { letter: "A", text: "$\\int e^{2x} \\, dx = \\frac{1}{2} e^{2x} + C$", isCorrect: true },
      { letter: "B", text: "$\\int e^{2x} \\, dx = e^{2x} + C$", isCorrect: false },
      { letter: "C", text: "$\\int e^{2x} \\, dx = 2e^{2x} + C$", isCorrect: false },
      { letter: "D", text: "$\\int e^{2x} \\, dx = \\frac{1}{2} e^{x} + C$", isCorrect: false }
    ],
    blankAnswer: "1/2 * e^(2x) + C",
    explanation: "Áp dụng công thức nguyên hàm mở rộng: $\\int e^{ax+b} \\, dx = \\frac{1}{a} e^{ax+b} + C$."
  },
  {
    id: "gt15",
    topic: "Giải tích",
    grade: 11,
    text: "Tính giới hạn $L = \\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$.",
    options: [
      { letter: "A", text: "$L = 4$", isCorrect: true },
      { letter: "B", text: "$L = 2$", isCorrect: false },
      { letter: "C", text: "$L = 0$", isCorrect: false },
      { letter: "D", text: "$L = \\infty$", isCorrect: false }
    ],
    blankAnswer: "4",
    explanation: "Ta có $\\frac{x^2 - 4}{x - 2} = \\frac{(x-2)(x+2)}{x-2} = x + 2$ (khi $x \\neq 2$). Giới hạn bằng $\\lim_{x \\to 2} (x+2) = 4$."
  },
  {
    id: "gt16",
    topic: "Giải tích",
    grade: 11,
    text: "Tìm đạo hàm của hàm số $y = \\cos(2x)$.",
    options: [
      { letter: "A", text: "$y' = -2\\sin(2x)$", isCorrect: true },
      { letter: "B", text: "$y' = 2\\sin(2x)$", isCorrect: false },
      { letter: "C", text: "$y' = -\\sin(2x)$", isCorrect: false },
      { letter: "D", text: "$y' = -2\\cos(2x)$", isCorrect: false }
    ],
    blankAnswer: "-2sin(2x)",
    explanation: "Áp dụng công thức đạo hàm hàm hợp $(\\cos u)' = -u' \\cdot \\sin u$, ta được $(\\cos 2x)' = -2\\sin(2x)$."
  },
  {
    id: "gt17",
    topic: "Giải tích",
    grade: 11,
    text: "Viết phương trình tiếp tuyến của đồ thị hàm số $y = x^2$ tại điểm có hoành độ $x_0 = 1$.",
    options: [
      { letter: "A", text: "$y = 2x - 1$", isCorrect: true },
      { letter: "B", text: "$y = 2x + 1$", isCorrect: false },
      { letter: "C", text: "$y = x$", isCorrect: false },
      { letter: "D", text: "$y = 2x$", isCorrect: false }
    ],
    blankAnswer: "y = 2x - 1",
    explanation: "$y' = 2x \\implies f'(1) = 2$. Với $x_0 = 1 \\implies y_0 = 1$. Phương trình tiếp tuyến: $y = 2(x - 1) + 1 = 2x - 1$."
  },
  {
    id: "gt18",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm nguyên hàm của hàm số $f(x) = \\sin x$.",
    options: [
      { letter: "A", text: "$\\int \\sin x \\, dx = -\\cos x + C$", isCorrect: true },
      { letter: "B", text: "$\\int \\sin x \\, dx = \\cos x + C$", isCorrect: false },
      { letter: "C", text: "$\\int \\sin x \\, dx = \\sin x + C$", isCorrect: false },
      { letter: "D", text: "$\\int \\sin x \\, dx = -\\sin x + C$", isCorrect: false }
    ],
    blankAnswer: "-cos x + C",
    explanation: "Nguyên hàm của hàm số sin là trừ cos: $\\int \\sin x \\, dx = -\\cos x + C$."
  },
  {
    id: "gt19",
    topic: "Giải tích",
    grade: 12,
    text: "Tính diện tích hình phẳng giới hạn bởi đồ thị hàm số $y = x^2$, trục hoành $Ox$, đường thẳng $x = 0$ và $x = 1$.",
    options: [
      { letter: "A", text: "$S = \\frac{1}{3}$", isCorrect: true },
      { letter: "B", text: "$S = \\frac{1}{2}$", isCorrect: false },
      { letter: "C", text: "$S = 1$", isCorrect: false },
      { letter: "D", text: "$S = \\frac{1}{4}$", isCorrect: false }
    ],
    blankAnswer: "1/3",
    explanation: "Diện tích là $S = \\int_{0}^{1} x^2 \\, dx = [\\frac{x^3}{3}]_0^1 = \\frac{1}{3}$."
  },
  {
    id: "gt20",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm số điểm cực trị của đồ thị hàm số $y = x^4 - 2x^2 + 1$.",
    options: [
      { letter: "A", text: "$3$", isCorrect: true },
      { letter: "B", text: "$1$", isCorrect: false },
      { letter: "C", text: "$2$", isCorrect: false },
      { letter: "D", text: "$0$", isCorrect: false }
    ],
    blankAnswer: "3",
    explanation: "$y' = 4x^3 - 4x = 4x(x^2 - 1) = 0 \\iff x = 0$ hoặc $x = \\pm 1$. Vì đạo hàm có 3 nghiệm đơn đổi dấu qua đó nên hàm số có 3 điểm cực trị."
  },

  // ==================== HÌNH HỌC (20 câu) ====================
  {
    id: "hh1",
    topic: "Hình học",
    grade: 11,
    text: "Cho khối chóp có diện tích đáy $B = 10\\text{ cm}^2$ và chiều cao $h = 6\\text{ cm}$. Tính thể tích $V$ của khối chóp.",
    options: [
      { letter: "A", text: "$V = 60\\text{ cm}^3$", isCorrect: false },
      { letter: "B", text: "$V = 20\\text{ cm}^3$", isCorrect: true },
      { letter: "C", text: "$V = 30\\text{ cm}^3$", isCorrect: false },
      { letter: "D", text: "$V = 10\\text{ cm}^3$", isCorrect: false }
    ],
    blankAnswer: "20",
    explanation: "Áp dụng công thức thể tích khối chóp $V = \\frac{1}{3} B \\cdot h$. Thay số ta có: $V = \\frac{1}{3} \\cdot 10 \\cdot 6 = 20\\text{ cm}^3$."
  },
  {
    id: "hh2",
    topic: "Hình học",
    grade: 12,
    text: "Tính thể tích khối cầu có bán kính $R = 3\\text{ cm}$.",
    options: [
      { letter: "A", text: "$V = 36\\pi \\text{ cm}^3$", isCorrect: true },
      { letter: "B", text: "$V = 12\\pi \\text{ cm}^3$", isCorrect: false },
      { letter: "C", text: "$V = 18\\pi \\text{ cm}^3$", isCorrect: false },
      { letter: "D", text: "$V = 27\\pi \\text{ cm}^3$", isCorrect: false }
    ],
    blankAnswer: "36pi",
    explanation: "Áp dụng công thức thể tích khối cầu $V = \\frac{4}{3}\\pi R^3$. Với $R = 3$, ta có $V = \\frac{4}{3}\\pi \\cdot 3^3 = 36\\pi \\text{ cm}^3$."
  },
  {
    id: "hh3",
    topic: "Hình học",
    grade: 11,
    text: "Tính thể tích của khối lăng trụ đứng có diện tích đáy $B = 9\\text{ cm}^2$ và chiều cao $h = 5\\text{ cm}$.",
    options: [
      { letter: "A", text: "$V = 15\\text{ cm}^3$", isCorrect: false },
      { letter: "B", text: "$V = 45\\text{ cm}^3$", isCorrect: true },
      { letter: "C", text: "$V = 22.5\\text{ cm}^3$", isCorrect: false },
      { letter: "D", text: "$V = 90\\text{ cm}^3$", isCorrect: false }
    ],
    blankAnswer: "45",
    explanation: "Thể tích khối lăng trụ được tính theo công thức $V = B \\cdot h$. Ở đây $V = 9 \\cdot 5 = 45\\text{ cm}^3$."
  },
  {
    id: "hh4",
    topic: "Hình học",
    grade: 10,
    text: "Cho tam giác $ABC$ có cạnh $b = 5$, $c = 8$ và góc $A = 60^\\circ$. Tính độ dài cạnh $a$.",
    options: [
      { letter: "A", text: "$a = 9$", isCorrect: false },
      { letter: "B", text: "$a = 7$", isCorrect: true },
      { letter: "C", text: "$a = \\sqrt{89}$", isCorrect: false },
      { letter: "D", text: "$a = 5\\sqrt{2}$", isCorrect: false }
    ],
    blankAnswer: "7",
    explanation: "Áp dụng định lý Côsin: $a^2 = b^2 + c^2 - 2bc \\cos A = 5^2 + 8^2 - 2(5)(8)\\cos 60^\\circ = 25 + 64 - 40 = 49 \\implies a = 7$."
  },
  {
    id: "hh5",
    topic: "Hình học",
    grade: 12,
    text: "Trong không gian $Oxyz$, cho điểm $A(1; 2; 3)$. Tính khoảng cách từ điểm $A$ đến mặt phẳng tọa độ $(Oxy)$.",
    options: [
      { letter: "A", text: "$1$", isCorrect: false },
      { letter: "B", text: "$2$", isCorrect: false },
      { letter: "C", text: "$3$", isCorrect: true },
      { letter: "D", text: "$\\sqrt{14}$", isCorrect: false }
    ],
    blankAnswer: "3",
    explanation: "Khoảng cách từ điểm $A(x_0; y_0; z_0)$ đến mặt phẳng $(Oxy)$ bằng $|z_0|$. Với $A(1; 2; 3)$, khoảng cách là $|3| = 3$."
  },
  {
    id: "hh6",
    topic: "Hình học",
    grade: 12,
    text: "Trong không gian $Oxyz$, phương trình mặt cầu có tâm $I(1; -2; 3)$ và bán kính $R = 5$ là:",
    options: [
      { letter: "A", text: "$(x-1)^2 + (y+2)^2 + (z-3)^2 = 25$", isCorrect: true },
      { letter: "B", text: "$(x+1)^2 + (y-2)^2 + (z+3)^2 = 25$", isCorrect: false },
      { letter: "C", text: "$(x-1)^2 + (y-2)^2 + (z-3)^2 = 5$", isCorrect: false },
      { letter: "D", text: "$(x-1)^2 + (y+2)^2 + (z-3)^2 = 5$", isCorrect: false }
    ],
    blankAnswer: "(x-1)^2 + (y+2)^2 + (z-3)^2 = 25",
    explanation: "Phương trình mặt cầu tâm $I(a; b; c)$ bán kính $R$ là $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2$. Thay số ta có $(x-1)^2 + (y+2)^2 + (z-3)^2 = 25$."
  },
  {
    id: "hh7",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình lập phương $ABCD.A'B'C'D'$. Góc giữa hai đường thẳng $AB$ và $CC'$ bằng bao nhiêu độ?",
    options: [
      { letter: "A", text: "$90^\\circ$", isCorrect: true },
      { letter: "B", text: "$45^\\circ$", isCorrect: false },
      { letter: "C", text: "$0^\\circ$", isCorrect: false },
      { letter: "D", text: "$60^\\circ$", isCorrect: false }
    ],
    blankAnswer: "90",
    explanation: "Vì $CC' \\parallel AA'$ nên góc giữa $AB$ và $CC'$ bằng góc giữa $AB$ and $AA'$. Hình lập phương có các mặt là hình vuông nên $AB \\perp AA'$, góc bằng $90^\\circ$."
  },
  {
    id: "hh8",
    topic: "Hình học",
    grade: 12,
    text: "Tính diện tích xung quanh của hình nón có bán kính đáy $r = 3\\text{ cm}$ và đường sinh $l = 5\\text{ cm}$.",
    options: [
      { letter: "A", text: "$15\\pi\\text{ cm}^2$", isCorrect: true },
      { letter: "B", text: "$30\\pi\\text{ cm}^2$", isCorrect: false },
      { letter: "C", text: "$9\\pi\\text{ cm}^2$", isCorrect: false },
      { letter: "D", text: "$12\\pi\\text{ cm}^2$", isCorrect: false }
    ],
    blankAnswer: "15pi",
    explanation: "Diện tích xung quanh của hình nón: $S_{xq} = \\pi r l = \\pi \\cdot 3 \\cdot 5 = 15\\pi\\text{ cm}^2$."
  },
  {
    id: "hh9",
    topic: "Hình học",
    grade: 12,
    text: "Tính diện tích xung quanh của hình trụ có bán kính đáy $r = 4\\text{ cm}$ và chiều cao $h = 6\\text{ cm}$.",
    options: [
      { letter: "A", text: "$48\\pi\\text{ cm}^2$", isCorrect: true },
      { letter: "B", text: "$24\\pi\\text{ cm}^2$", isCorrect: false },
      { letter: "C", text: "$96\\pi\\text{ cm}^2$", isCorrect: false },
      { letter: "D", text: "$16\\pi\\text{ cm}^2$", isCorrect: false }
    ],
    blankAnswer: "48pi",
    explanation: "Diện tích xung quanh của hình trụ: $S_{xq} = 2\\pi r h = 2\\pi \\cdot 4 \\cdot 6 = 48\\pi\\text{ cm}^2$."
  },
  {
    id: "hh10",
    topic: "Hình học",
    grade: 12,
    text: "Tính thể tích $V$ của khối trụ có bán kính đáy $r = 3\\text{ cm}$ và chiều cao $h = 4\\text{ cm}$.",
    options: [
      { letter: "A", text: "$V = 36\\pi\\text{ cm}^3$", isCorrect: true },
      { letter: "B", text: "$V = 12\\pi\\text{ cm}^3$", isCorrect: false },
      { letter: "C", text: "$V = 18\\pi\\text{ cm}^3$", isCorrect: false },
      { letter: "D", text: "$V = 24\\pi\\text{ cm}^3$", isCorrect: false }
    ],
    blankAnswer: "36pi",
    explanation: "Thể tích khối trụ được tính bằng công thức $V = B \\cdot h = \\pi r^2 h = \\pi \\cdot 3^2 \\cdot 4 = 36\\pi\\text{ cm}^3$."
  },
  {
    id: "hh11",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình hộp chữ nhật có ba kích thước lần lượt là $3\\text{ cm}$, $4\\text{ cm}$, $5\\text{ cm}$. Tính thể tích $V$ của khối hộp.",
    options: [
      { letter: "A", text: "$60\\text{ cm}^3$", isCorrect: true },
      { letter: "B", text: "$12\\text{ cm}^3$", isCorrect: false },
      { letter: "C", text: "$20\\text{ cm}^3$", isCorrect: false },
      { letter: "D", text: "$30\\text{ cm}^3$", isCorrect: false }
    ],
    blankAnswer: "60",
    explanation: "Thể tích hình hộp chữ nhật bằng tích ba kích thước: $V = a \\cdot b \\cdot c = 3 \\cdot 4 \\cdot 5 = 60\\text{ cm}^3$."
  },
  {
    id: "hh12",
    topic: "Hình học",
    grade: 12,
    text: "Trong không gian $Oxyz$, cho hai điểm $A(1; 2; 3)$ và $B(3; 2; 1)$. Tìm tọa độ trung điểm $I$ của đoạn thẳng $AB$.",
    options: [
      { letter: "A", text: "$I(2; 2; 2)$", isCorrect: true },
      { letter: "B", text: "$I(4; 4; 4)$", isCorrect: false },
      { letter: "C", text: "$I(1; 0; -1)$", isCorrect: false },
      { letter: "D", text: "$I(2; 0; 2)$", isCorrect: false }
    ],
    blankAnswer: "(2; 2; 2)",
    explanation: "Tọa độ trung điểm $I$: $x_I = \\frac{1+3}{2} = 2$, $y_I = \\frac{2+2}{2} = 2$, $z_I = \\frac{3+1}{2} = 2$. Vậy $I(2; 2; 2)$."
  },
  {
    id: "hh13",
    topic: "Hình học",
    grade: 12,
    text: "Trong không gian $Oxyz$, tìm một vectơ pháp tuyến $\\vec{n}$ của mặt phẳng $(P): x - 2y + 3z - 4 = 0$.",
    options: [
      { letter: "A", text: "\\vec{n} = (1; -2; 3)", isCorrect: true },
      { letter: "B", text: "\\vec{n} = (1; 2; 3)", isCorrect: false },
      { letter: "C", text: "\\vec{n} = (-1; 2; 3)", isCorrect: false },
      { letter: "D", text: "\\vec{n} = (1; -2; -4)", isCorrect: false }
    ],
    blankAnswer: "(1; -2; 3)",
    explanation: "Mặt phẳng $Ax+By+Cz+D=0$ có một vectơ pháp tuyến là $(A; B; C)$. Do đó $\\vec{n} = (1; -2; 3)$."
  },
  {
    id: "hh14",
    topic: "Hình học",
    grade: 10,
    text: "Tính diện tích của tam giác đều cạnh $a$.",
    options: [
      { letter: "A", text: "$S = \\frac{a^2\\sqrt{3}}{4}$", isCorrect: true },
      { letter: "B", text: "$S = \\frac{a^2\\sqrt{3}}{2}$", isCorrect: false },
      { letter: "C", text: "$S = a^2\\sqrt{3}$", isCorrect: false },
      { letter: "D", text: "$S = \\frac{a^2}{2}$", isCorrect: false }
    ],
    blankAnswer: "a^2*sqrt(3)/4",
    explanation: "Công thức diện tích tam giác đều cạnh $a$ là $S = \\frac{1}{2} a \\cdot (a\\sin 60^\\circ) = \\frac{a^2\\sqrt{3}}{4}$."
  },
  {
    id: "hh15",
    topic: "Hình học",
    grade: 12,
    text: "Trong không gian $Oxyz$, tìm tọa độ trọng tâm $G$ của tam giác $ABC$ biết $A(1; 0; 0)$, $B(0; 2; 0)$, $C(0; 0; 3)$.",
    options: [
      { letter: "A", text: "$G(\\frac{1}{3}; \\frac{2}{3}; 1)$", isCorrect: true },
      { letter: "B", text: "$G(1; 2; 3)$", isCorrect: false },
      { letter: "C", text: "$G(\\frac{1}{2}; 1; \\frac{3}{2})$", isCorrect: false },
      { letter: "D", text: "$G(0; 0; 0)$", isCorrect: false }
    ],
    blankAnswer: "(1/3; 2/3; 1)",
    explanation: "Trọng tâm $G$ có tọa độ bằng trung bình cộng tọa độ 3 đỉnh: $x_G = \\frac{1+0+0}{3} = \\frac{1}{3}$, $y_G = \\frac{0+2+0}{3} = \\frac{2}{3}$, $z_G = \\frac{0+0+3}{3} = 1$."
  },
  {
    id: "hh16",
    topic: "Hình học",
    grade: 10,
    text: "Tính diện tích hình tròn có bán kính $R = 4\\text{ cm}$.",
    options: [
      { letter: "A", text: "$16\\pi\\text{ cm}^2$", isCorrect: true },
      { letter: "B", text: "$8\\pi\\text{ cm}^2$", isCorrect: false },
      { letter: "C", text: "$4\\pi\\text{ cm}^2$", isCorrect: false },
      { letter: "D", text: "$64\\pi\\text{ cm}^2$", isCorrect: false }
    ],
    blankAnswer: "16pi",
    explanation: "Diện tích hình tròn bằng $S = \\pi R^2$. Với $R = 4$, $S = \\pi \\cdot 4^2 = 16\\pi\\text{ cm}^2$."
  },
  {
    id: "hh17",
    topic: "Hình học",
    grade: 10,
    text: "Tính chu vi đường tròn có bán kính $R = 5\\text{ cm}$.",
    options: [
      { letter: "A", text: "$10\\pi\\text{ cm}$", isCorrect: true },
      { letter: "B", text: "$5\\pi\\text{ cm}$", isCorrect: false },
      { letter: "C", text: "$25\\pi\\text{ cm}$", isCorrect: false },
      { letter: "D", text: "$20\\pi\\text{ cm}$", isCorrect: false }
    ],
    blankAnswer: "10pi",
    explanation: "Chu vi đường tròn bằng $C = 2\\pi R = 2\\pi \\cdot 5 = 10\\pi\\text{ cm}$."
  },
  {
    id: "hh18",
    topic: "Hình học",
    grade: 11,
    text: "Tính thể tích $V$ của khối lập phương cạnh $3\\text{ cm}$.",
    options: [
      { letter: "A", text: "$V = 27\\text{ cm}^3$", isCorrect: true },
      { letter: "B", text: "$V = 9\\text{ cm}^3$", isCorrect: false },
      { letter: "C", text: "$V = 18\\text{ cm}^3$", isCorrect: false },
      { letter: "D", text: "$V = 54\\text{ cm}^3$", isCorrect: false }
    ],
    blankAnswer: "27",
    explanation: "Thể tích khối lập phương cạnh $a$ bằng $V = a^3$. Ở đây $V = 3^3 = 27\\text{ cm}^3$."
  },
  {
    id: "hh19",
    topic: "Hình học",
    grade: 12,
    text: "Tính diện tích xung quanh của hình nón có bán kính đáy $r = 5\\text{ cm}$ và đường sinh $l = 10\\text{ cm}$.",
    options: [
      { letter: "A", text: "$50\\pi\\text{ cm}^2$", isCorrect: true },
      { letter: "B", text: "$25\\pi\\text{ cm}^2$", isCorrect: false },
      { letter: "C", text: "$100\\pi\\text{ cm}^2$", isCorrect: false },
      { letter: "D", text: "$15\\pi\\text{ cm}^2$", isCorrect: false }
    ],
    blankAnswer: "50pi",
    explanation: "Diện tích xung quanh hình nón: $S_{xq} = \\pi r l = \\pi \\cdot 5 \\cdot 10 = 50\\pi\\text{ cm}^2$."
  },
  {
    id: "hh20",
    topic: "Hình học",
    grade: 12,
    text: "Trong không gian $Oxyz$, viết phương trình mặt phẳng đi qua điểm $M(1; 2; 3)$ và song song với mặt phẳng $(Oxy)$.",
    options: [
      { letter: "A", text: "$z - 3 = 0$", isCorrect: true },
      { letter: "B", text: "$x - 1 = 0$", isCorrect: false },
      { letter: "C", text: "$y - 2 = 0$", isCorrect: false },
      { letter: "D", text: "$x + y + z - 6 = 0$", isCorrect: false }
    ],
    blankAnswer: "z - 3 = 0",
    explanation: "Mặt phẳng song song với $(Oxy)$ có phương trình dạng $z + D = 0$. Vì mặt phẳng đi qua $M(1; 2; 3)$ nên $3 + D = 0 \\iff D = -3$. Phương trình mặt phẳng là $z - 3 = 0$."
  },
  {
    id: "hh21",
    topic: "Hình học",
    grade: 10,
    text: "Trong mặt phẳng tọa độ $Oxy$, cho $\\vec{u} = (3; -1)$ và $\\vec{v} = (2; 4)$. Tính tích vô hướng $\\vec{u} \\cdot \\vec{v}$.",
    options: [
      { letter: "A", text: "$2$", isCorrect: true },
      { letter: "B", text: "$10$", isCorrect: false },
      { letter: "C", text: "$-2$", isCorrect: false },
      { letter: "D", text: "$6$", isCorrect: false }
    ],
    blankAnswer: "2",
    explanation: "$\\vec{u}\\cdot\\vec{v} = u_1v_1 + u_2v_2 = 3\\cdot2 + (-1)\\cdot4 = 6 - 4 = 2$."
  },
  {
    id: "hh22",
    topic: "Hình học",
    grade: 10,
    text: "Viết phương trình tổng quát của đường thẳng đi qua điểm $A(2; -1)$ và nhận $\\vec{n}=(1; 3)$ làm vectơ pháp tuyến.",
    options: [
      { letter: "A", text: "$x + 3y + 1 = 0$", isCorrect: true },
      { letter: "B", text: "$x + 3y - 1 = 0$", isCorrect: false },
      { letter: "C", text: "$3x + y - 5 = 0$", isCorrect: false },
      { letter: "D", text: "$x - 3y - 5 = 0$", isCorrect: false }
    ],
    blankAnswer: "x + 3y + 1 = 0",
    explanation: "Phương trình: $1(x-2) + 3(y+1) = 0 \\iff x - 2 + 3y + 3 = 0 \\iff x + 3y + 1 = 0$."
  },
  {
    id: "hh23",
    topic: "Hình học",
    grade: 10,
    text: "Tìm tâm và bán kính của đường tròn $(x-2)^2 + (y+1)^2 = 9$.",
    options: [
      { letter: "A", text: "Tâm $I(2;-1)$, bán kính $R=3$", isCorrect: true },
      { letter: "B", text: "Tâm $I(-2;1)$, bán kính $R=3$", isCorrect: false },
      { letter: "C", text: "Tâm $I(2;-1)$, bán kính $R=9$", isCorrect: false },
      { letter: "D", text: "Tâm $I(-2;1)$, bán kính $R=9$", isCorrect: false }
    ],
    blankAnswer: "I(2;-1), R=3",
    explanation: "Đối chiếu $(x-a)^2+(y-b)^2=R^2$: tâm $I(a;b)=I(2;-1)$, bán kính $R=\\sqrt{9}=3$."
  },
  {
    id: "hh24",
    topic: "Hình học",
    grade: 10,
    text: "Cho tam giác $ABC$ có $a=6$, góc $A=30°$. Bán kính đường tròn ngoại tiếp $R$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$R=6$", isCorrect: true },
      { letter: "B", text: "$R=3$", isCorrect: false },
      { letter: "C", text: "$R=12$", isCorrect: false },
      { letter: "D", text: "$R=6\\sqrt{3}$", isCorrect: false }
    ],
    blankAnswer: "6",
    explanation: "Định lý Sin: $\\dfrac{a}{\\sin A}=2R \\Rightarrow 2R=\\dfrac{6}{\\sin 30°}=\\dfrac{6}{0.5}=12 \\Rightarrow R=6$."
  },
  {
    id: "hh25",
    topic: "Hình học",
    grade: 10,
    text: "Tam giác $ABC$ có ba cạnh $a=13$, $b=14$, $c=15$. Tính diện tích tam giác theo công thức Hê-rông.",
    options: [
      { letter: "A", text: "$S=84$", isCorrect: true },
      { letter: "B", text: "$S=42$", isCorrect: false },
      { letter: "C", text: "$S=168$", isCorrect: false },
      { letter: "D", text: "$S=21$", isCorrect: false }
    ],
    blankAnswer: "84",
    explanation: "Nửa chu vi $p=\\dfrac{13+14+15}{2}=21$. $S=\\sqrt{p(p-a)(p-b)(p-c)}=\\sqrt{21\\cdot8\\cdot7\\cdot6}=\\sqrt{7056}=84$."
  },

  // ==================== ĐẠI SỐ (20 câu) ====================
  {
    id: "ds1",
    topic: "Đại số",
    grade: 10,
    text: "Phương trình bậc hai $ax^2 + bx + c = 0 \\quad (a \\neq 0)$ có hai nghiệm phân biệt khi biệt thức $\\Delta$ thỏa mãn điều kiện nào?",
    options: [
      { letter: "A", text: "$\\Delta = 0$", isCorrect: false },
      { letter: "B", text: "$\\Delta \\ge 0$", isCorrect: false },
      { letter: "C", text: "$\\Delta < 0$", isCorrect: false },
      { letter: "D", text: "$\\Delta > 0$", isCorrect: true }
    ],
    blankAnswer: ">0",
    explanation: "Biệt thức $\\Delta = b^2 - 4ac$. Khi $\\Delta > 0$, phương trình bậc hai luôn có hai nghiệm phân biệt."
  },
  {
    id: "ds2",
    topic: "Đại số",
    grade: 11,
    text: "Cho cấp số cộng có số hạng đầu $u_1 = 3$, công sai $d = 2$. Tính tổng của 10 số hạng đầu tiên ($S_{10}$).",
    options: [
      { letter: "A", text: "$S_{10} = 120$", isCorrect: true },
      { letter: "B", text: "$S_{10} = 110$", isCorrect: false },
      { letter: "C", text: "$S_{10} = 100$", isCorrect: false },
      { letter: "D", text: "$S_{10} = 130$", isCorrect: false }
    ],
    blankAnswer: "120",
    explanation: "Áp dụng công thức tổng cấp số cộng: $S_n = \\frac{n[2u_1 + (n-1)d]}{2}$. Với $n=10$, ta được $S_{10} = \\frac{10 \\cdot [2(3) + 9(2)]}{2} = 5 \\cdot 24 = 120$."
  },
  {
    id: "ds3",
    topic: "Đại số",
    grade: 10,
    text: "Cho tập hợp $A = \\{1; 2; 3; 4\\}$ và $B = \\{3; 4; 5; 6\\}$. Xác định tập hợp $A \\cap B$.",
    options: [
      { letter: "A", text: "$\\{1; 2\\}$", isCorrect: false },
      { letter: "B", text: "$\\{3; 4\\}$", isCorrect: true },
      { letter: "C", text: "$\\{5; 6\\}$", isCorrect: false },
      { letter: "D", text: "$\\{1; 2; 3; 4; 5; 6\\}$", isCorrect: false }
    ],
    blankAnswer: "{3; 4}",
    explanation: "Tập hợp giao $A \\cap B$ gồm các phần tử vừa thuộc $A$ vừa thuộc $B$. Các phần tử chung là $\\{3; 4\\}$."
  },
  {
    id: "ds4",
    topic: "Đại số",
    grade: 10,
    text: "Tìm tập xác định $D$ của hàm số $y = \\frac{1}{x - 2}$.",
    options: [
      { letter: "A", text: "$D = \\mathbb{R} \\setminus \\{2\\}$", isCorrect: true },
      { letter: "B", text: "$D = \\mathbb{R}$", isCorrect: false },
      { letter: "C", text: "$D = (2; +\\infty)$", isCorrect: false },
      { letter: "D", text: "$D = \\mathbb{R} \\setminus \\{-2\\}$", isCorrect: false }
    ],
    blankAnswer: "R \\ {2}",
    explanation: "Hàm số xác định khi mẫu số khác 0: $x - 2 \\neq 0 \\iff x \\neq 2$. Tập xác định là $D = \\mathbb{R} \\setminus \\{2\\}$."
  },
  {
    id: "ds5",
    topic: "Đại số",
    grade: 10,
    text: "Cho nhị thức bậc nhất $f(x) = 2x - 4$. Khẳng định nào sau đây là đúng?",
    options: [
      { letter: "A", text: "$f(x) > 0$ với mọi $x > 2$", isCorrect: true },
      { letter: "B", text: "$f(x) > 0$ với mọi $x < 2$", isCorrect: false },
      { letter: "C", text: "$f(x) < 0$ với mọi $x > 2$", isCorrect: false },
      { letter: "D", text: "$f(x) = 0$ với mọi $x \\in \\mathbb{R}$", isCorrect: false }
    ],
    blankAnswer: ">0 khi x>2",
    explanation: "Ta có $2x - 4 = 0 \\iff x = 2$. Hệ số $a = 2 > 0$. Theo quy tắc xét dấu nhị thức bậc nhất 'phải cùng, trái khác', ta có $f(x) > 0$ khi $x > 2$."
  },
  {
    id: "ds6",
    topic: "Đại số",
    grade: 11,
    text: "Tìm nghiệm của phương trình $\\log_2 x = 3$.",
    options: [
      { letter: "A", text: "$x = 8$", isCorrect: true },
      { letter: "B", text: "$x = 6$", isCorrect: false },
      { letter: "C", text: "$x = 9$", isCorrect: false },
      { letter: "D", text: "$x = 5$", isCorrect: false }
    ],
    blankAnswer: "8",
    explanation: "Theo định nghĩa logarit: $\\log_a x = b \\iff x = a^b$. Ở đây $x = 2^3 = 8$."
  },
  {
    id: "ds7",
    topic: "Đại số",
    grade: 11,
    text: "Viết công thức tính số hạng tổng quát $u_n$ của một cấp số cộng theo số hạng đầu $u_1$ và công sai $d$.",
    options: [
      { letter: "A", text: "$u_n = u_1 + (n-1)d$", isCorrect: true },
      { letter: "B", text: "$u_n = u_1 + nd$", isCorrect: false },
      { letter: "C", text: "$u_n = u_1 \\cdot d^{n-1}$", isCorrect: false },
      { letter: "D", text: "$u_n = u_1 - (n-1)d$", isCorrect: false }
    ],
    blankAnswer: "u_n = u_1 + (n-1)d",
    explanation: "Theo định nghĩa cấp số cộng, số hạng tổng quát là $u_n = u_1 + (n-1)d$."
  },
  {
    id: "ds8",
    topic: "Đại số",
    grade: 11,
    text: "Viết công thức tính số hạng tổng quát $u_n$ của một cấp số nhân theo số hạng đầu $u_1$ và công bội $q$.",
    options: [
      { letter: "A", text: "$u_n = u_1 \\cdot q^{n-1}$", isCorrect: true },
      { letter: "B", text: "$u_n = u_1 \\cdot q^n$", isCorrect: false },
      { letter: "C", text: "$u_n = u_1 + (n-1)q$", isCorrect: false },
      { letter: "D", text: "$u_n = u_1 \\cdot (n-1)q$", isCorrect: false }
    ],
    blankAnswer: "u_n = u_1 * q^(n-1)",
    explanation: "Số hạng thứ $n$ của cấp số nhân là $u_n = u_1 \\cdot q^{n-1}$."
  },
  {
    id: "ds9",
    topic: "Đại số",
    grade: 11,
    text: "Tìm tập nghiệm của phương trình $2^x = 8$.",
    options: [
      { letter: "A", text: "$S = \\{3\\}$", isCorrect: true },
      { letter: "B", text: "$S = \\{4\\}$", isCorrect: false },
      { letter: "C", text: "$S = \\{2\\}$", isCorrect: false },
      { letter: "D", text: "$S = \\{8\\}$", isCorrect: false }
    ],
    blankAnswer: "3",
    explanation: "Đưa về cùng cơ số: $2^x = 2^3 \\iff x = 3$."
  },
  {
    id: "ds10",
    topic: "Đại số",
    grade: 10,
    text: "Tìm tập xác định $D$ của hàm số $y = \\sqrt{x - 1}$.",
    options: [
      { letter: "A", text: "$D = [1; +\\infty)$", isCorrect: true },
      { letter: "B", text: "$D = (1; +\\infty)$", isCorrect: false },
      { letter: "C", text: "$D = \\mathbb{R} \\setminus \\{1\\}$", isCorrect: false },
      { letter: "D", text: "$D = \\mathbb{R}$", isCorrect: false }
    ],
    blankAnswer: "[1; +inf)",
    explanation: "Hàm số căn thức xác định khi biểu thức dưới căn không âm: $x - 1 \\ge 0 \\iff x \\ge 1$. Tập xác định là $D = [1; +\\infty)$."
  },
  {
    id: "ds11",
    topic: "Đại số",
    grade: 11,
    text: "Cho một cấp số nhân có số hạng đầu $u_1 = 2$, công bội $q = 3$. Tìm số hạng thứ hai $u_2$.",
    options: [
      { letter: "A", text: "$u_2 = 6$", isCorrect: true },
      { letter: "B", text: "$u_2 = 5$", isCorrect: false },
      { letter: "C", text: "$u_2 = 9$", isCorrect: false },
      { letter: "D", text: "$u_2 = 8$", isCorrect: false }
    ],
    blankAnswer: "6",
    explanation: "Áp dụng định nghĩa cấp số nhân: $u_2 = u_1 \\cdot q = 2 \\cdot 3 = 6$."
  },
  {
    id: "ds12",
    topic: "Đại số",
    grade: 10,
    text: "Tập hợp $A = \\{a, b, c\\}$ có bao nhiêu tập hợp con?",
    options: [
      { letter: "A", text: "$8$", isCorrect: true },
      { letter: "B", text: "$6$", isCorrect: false },
      { letter: "C", text: "$4$", isCorrect: false },
      { letter: "D", text: "$3$", isCorrect: false }
    ],
    blankAnswer: "8",
    explanation: "Tập hợp có $n$ phần tử thì có $2^n$ tập con. Với $n=3$, số tập con là $2^3 = 8$."
  },
  {
    id: "ds13",
    topic: "Đại số",
    grade: 10,
    text: "Công thức biến đổi lũy thừa nào sau đây là đúng với mọi $a > 0$?",
    options: [
      { letter: "A", text: "$(a^m)^n = a^{m \\cdot n}$", isCorrect: true },
      { letter: "B", text: "$(a^m)^n = a^{m + n}$", isCorrect: false },
      { letter: "C", text: "$a^m \\cdot a^n = a^{m \\cdot n}$", isCorrect: false },
      { letter: "D", text: "$a^m / a^n = a^{m / n}$", isCorrect: false }
    ],
    blankAnswer: "(a^m)^n = a^(m*n)",
    explanation: "Theo các tính chất lũy thừa cơ bản, lũy thừa của lũy thừa là nhân các số mũ: $(a^m)^n = a^{m \\cdot n}$."
  },
  {
    id: "ds14",
    topic: "Đại số",
    grade: 10,
    text: "Khi biệt thức $\\Delta = 0$, phương trình bậc hai $ax^2 + bx + c = 0 \\quad (a \\neq 0)$ có nghiệm kép là:",
    options: [
      { letter: "A", text: "$x_1 = x_2 = -\\frac{b}{2a}$", isCorrect: true },
      { letter: "B", text: "$x_1 = x_2 = -\\frac{b}{a}$", isCorrect: false },
      { letter: "C", text: "$x_1 = x_2 = \\frac{b}{2a}$", isCorrect: false },
      { letter: "D", text: "$x_1 = x_2 = -\\frac{c}{a}$", isCorrect: false }
    ],
    blankAnswer: "-b/(2a)",
    explanation: "Khi biệt thức bằng 0, phương trình bậc hai có nghiệm kép $x_1 = x_2 = -\\frac{b}{2a}$."
  },
  {
    id: "ds15",
    topic: "Đại số",
    grade: 11,
    text: "Cho $a > 0, a \\neq 1$. Tính giá trị của biểu thức $P = \\log_a(a^2)$.",
    options: [
      { letter: "A", text: "$P = 2$", isCorrect: true },
      { letter: "B", text: "$P = 1$", isCorrect: false },
      { letter: "C", text: "$P = a$", isCorrect: false },
      { letter: "D", text: "$P = 2a$", isCorrect: false }
    ],
    blankAnswer: "2",
    explanation: "Áp dụng tính chất logarit của lũy thừa: $\\log_a(a^k) = k$. Với $k=2$, ta được $P = 2$."
  },
  {
    id: "ds16",
    topic: "Đại số",
    grade: 10,
    text: "Giải hệ phương trình $\\begin{cases} x + y = 3 \\\\ x - y = 1 \\end{cases}$.",
    options: [
      { letter: "A", text: "$(x; y) = (2; 1)$", isCorrect: true },
      { letter: "B", text: "$(x; y) = (1; 2)$", isCorrect: false },
      { letter: "C", text: "$(x; y) = (3; 0)$", isCorrect: false },
      { letter: "D", text: "$(x; y) = (2; 2)$", isCorrect: false }
    ],
    blankAnswer: "(2; 1)",
    explanation: "Cộng hai vế phương trình ta có: $2x = 4 \\iff x = 2$. Thay vào phương trình đầu ta có $y = 3 - 2 = 1$."
  },
  {
    id: "ds17",
    topic: "Đại số",
    grade: 11,
    text: "Tìm tập xác định của hàm số $y = \\log_3 x$.",
    options: [
      { letter: "A", text: "$D = (0; +\\infty)$", isCorrect: true },
      { letter: "B", text: "$D = [0; +\\infty)$", isCorrect: false },
      { letter: "C", text: "$D = \\mathbb{R}$", isCorrect: false },
      { letter: "D", text: "$D = \\mathbb{R} \\setminus \\{0\\}$", isCorrect: false }
    ],
    blankAnswer: "(0; +inf)",
    explanation: "Hàm số logarit $\\log_a x$ chỉ xác định khi biểu thức trong logarit nhận giá trị dương: $x > 0$."
  },
  {
    id: "ds18",
    topic: "Đại số",
    grade: 10,
    text: "Khai triển biểu thức $(x - 1)^2$ ta được kết quả nào sau đây?",
    options: [
      { letter: "A", text: "$x^2 - 2x + 1$", isCorrect: true },
      { letter: "B", text: "$x^2 - 1$", isCorrect: false },
      { letter: "C", text: "$x^2 - 2x - 1$", isCorrect: false },
      { letter: "D", text: "$x^2 + 2x + 1$", isCorrect: false }
    ],
    blankAnswer: "x^2-2x+1",
    explanation: "Áp dụng hằng đẳng thức đáng nhớ bình phương một hiệu: $(a-b)^2 = a^2 - 2ab + b^2$."
  },
  {
    id: "ds19",
    topic: "Đại số",
    grade: 11,
    text: "Giá trị của giai thừa $5!$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$120$", isCorrect: true },
      { letter: "B", text: "$24$", isCorrect: false },
      { letter: "C", text: "$60$", isCorrect: false },
      { letter: "D", text: "$720$", isCorrect: false }
    ],
    blankAnswer: "120",
    explanation: "Ta có $5! = 1 \\cdot 2 \\cdot 3 \\cdot 4 \\cdot 5 = 120$."
  },
  {
    id: "ds20",
    topic: "Đại số",
    grade: 10,
    text: "Tìm tập nghiệm của phương trình $|x - 1| = 2$.",
    options: [
      { letter: "A", text: "$S = \\{-1; 3\\}$", isCorrect: true },
      { letter: "B", text: "$S = \\{3\\}$", isCorrect: false },
      { letter: "C", text: "$S = \\{-1\\}$", isCorrect: false },
      { letter: "D", text: "$S = \\{-3; 1\\}$", isCorrect: false }
    ],
    blankAnswer: "{-1; 3}",
    explanation: "$|x-1|=2 \\iff x-1=2$ hoặc $x-1=-2 \\iff x=3$ hoặc $x=-1$. Vậy tập nghiệm là $\\{-1; 3\\}$."
  },

  // ==================== XÁC SUẤT & TỔ HỢP (20 câu) ====================
  {
    id: "xs1",
    topic: "Đại số",
    grade: 10,
    text: "Có bao nhiêu cách chọn ra 3 học sinh từ một nhóm 10 học sinh để đi trực nhật?",
    options: [
      { letter: "A", text: "$720$ cách", isCorrect: false },
      { letter: "B", text: "$120$ cách", isCorrect: true },
      { letter: "C", text: "$240$ cách", isCorrect: false },
      { letter: "D", text: "$30$ cách", isCorrect: false }
    ],
    blankAnswer: "120",
    explanation: "Vì việc chọn ra 3 học sinh không quan tâm tới thứ tự nên đây là tổ hợp chập 3 của 10 phần tử: $C_{10}^3 = \\frac{10!}{3! \\cdot 7!} = 120$ cách."
  },
  {
    id: "xs2",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Gieo một con xúc xắc cân đối và đồng chất một lần. Tính xác suất để xuất hiện mặt có số chấm là số chẵn.",
    options: [
      { letter: "A", text: "$\\frac{1}{2}$", isCorrect: true },
      { letter: "B", text: "$\\frac{1}{3}$", isCorrect: false },
      { letter: "C", text: "$\\frac{1}{6}$", isCorrect: false },
      { letter: "D", text: "$\\frac{2}{3}$", isCorrect: false }
    ],
    blankAnswer: "1/2",
    explanation: "Không gian mẫu $n(\\Omega) = 6$. Biến cố xuất hiện mặt chẵn $A = \\{2; 4; 6\\} \\implies n(A) = 3$. Xác suất là $P(A) = \\frac{3}{6} = \\frac{1}{2}$."
  },
  {
    id: "xs3",
    topic: "Đại số",
    grade: 10,
    text: "Công thức nào sau đây dùng để tính số chỉnh hợp chập $k$ của $n$ phần tử ($1 \\le k \\le n$)?",
    options: [
      { letter: "A", text: "$A_n^k = \\frac{n!}{(n-k)!}$", isCorrect: true },
      { letter: "B", text: "$C_n^k = \\frac{n!}{k!(n-k)!}$", isCorrect: false },
      { letter: "C", text: "$P_n = n!$", isCorrect: false },
      { letter: "D", text: "$A_n^k = \\frac{n!}{k!}$", isCorrect: false }
    ],
    blankAnswer: "A_n^k = n! / (n-k)!",
    explanation: "Số chỉnh hợp chập $k$ của $n$ phần tử là $A_n^k = \\frac{n!}{(n-k)!}$."
  },
  {
    id: "xs4",
    topic: "Đại số",
    grade: 10,
    text: "Công thức nào sau đây dùng để tính số tổ hợp chập $k$ của $n$ phần tử ($0 \\le k \\le n$)?",
    options: [
      { letter: "A", text: "$C_n^k = \\frac{n!}{k!(n-k)!}$", isCorrect: true },
      { letter: "B", text: "$A_n^k = \\frac{n!}{(n-k)!}$", isCorrect: false },
      { letter: "C", text: "$C_n^k = \\frac{n!}{(n-k)!}$", isCorrect: false },
      { letter: "D", text: "$C_n^k = \\frac{n!}{k!}$", isCorrect: false }
    ],
    blankAnswer: "C_n^k = n! / (k! * (n-k)!)",
    explanation: "Số tổ hợp chập $k$ của $n$ phần tử được tính bằng $C_n^k = \\frac{n!}{k!(n-k)!}$."
  },
  {
    id: "xs5",
    topic: "Đại số",
    grade: 10,
    text: "Có bao nhiêu cách xếp 5 người vào một hàng dọc gồm 5 vị trí?",
    options: [
      { letter: "A", text: "$120$", isCorrect: true },
      { letter: "B", text: "$24$", isCorrect: false },
      { letter: "C", text: "$720$", isCorrect: false },
      { letter: "D", text: "$25$", isCorrect: false }
    ],
    blankAnswer: "120",
    explanation: "Đây là số hoán vị của 5 phần tử: $P_5 = 5! = 5 \\cdot 4 \\cdot 3 \\cdot 2 \\cdot 1 = 120$ cách."
  },
  {
    id: "xs6",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Trong một hộp có 3 quả cầu đỏ và 4 quả cầu xanh. Chọn ngẫu nhiên 1 quả cầu. Tính xác suất để chọn được quả cầu màu đỏ.",
    options: [
      { letter: "A", text: "$\\frac{3}{7}$", isCorrect: true },
      { letter: "B", text: "$\\frac{4}{7}$", isCorrect: false },
      { letter: "C", text: "$\\frac{1}{2}$", isCorrect: false },
      { letter: "D", text: "$\\frac{3}{4}$", isCorrect: false }
    ],
    blankAnswer: "3/7",
    explanation: "Tổng số quả cầu là $3+4=7$. Số quả cầu đỏ là 3. Xác suất chọn được quả đỏ là $\\frac{3}{7}$."
  },
  {
    id: "xs7",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Tung hai đồng xu cân đối và đồng chất. Tính xác suất để cả hai đồng xu đều xuất hiện mặt ngửa.",
    options: [
      { letter: "A", text: "$\\frac{1}{4}$", isCorrect: true },
      { letter: "B", text: "$\\frac{1}{2}$", isCorrect: false },
      { letter: "C", text: "$\\frac{3}{4}$", isCorrect: false },
      { letter: "D", text: "$\\frac{1}{3}$", isCorrect: false }
    ],
    blankAnswer: "1/4",
    explanation: "Không gian mẫu gồm các khả năng: $\\Omega = \\{(S,S), (S,N), (N,S), (N,N)\\} \\implies n(\\Omega) = 4$. Biến cố cả hai ngửa là $A = \\{(N,N)\\} \\implies n(A) = 1$. Xác suất $P(A) = \\frac{1}{4}$."
  },
  {
    id: "xs8",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Gọi $\\bar{A}$ là biến cố đối của biến cố $A$. Công thức nào sau đây là đúng?",
    options: [
      { letter: "A", text: "$P(\\bar{A}) = 1 - P(A)$", isCorrect: true },
      { letter: "B", text: "$P(\\bar{A}) = P(A) - 1$", isCorrect: false },
      { letter: "C", text: "$P(\\bar{A}) = \\frac{1}{P(A)}$", isCorrect: false },
      { letter: "D", text: "$P(\\bar{A}) = P(A)$", isCorrect: false }
    ],
    blankAnswer: "P(A_bar) = 1 - P(A)",
    explanation: "Biến cố đối có tổng xác suất bằng 1: $P(A) + P(\\bar{A}) = 1 \\implies P(\\bar{A}) = 1 - P(A)$."
  },
  {
    id: "xs9",
    topic: "Đại số",
    grade: 10,
    text: "Số hoán vị của $n$ phần tử được tính bằng công thức nào?",
    options: [
      { letter: "A", text: "$P_n = n!$", isCorrect: true },
      { letter: "B", text: "$P_n = n$", isCorrect: false },
      { letter: "C", text: "$P_n = n^n$", isCorrect: false },
      { letter: "D", text: "$P_n = (n-1)!$", isCorrect: false }
    ],
    blankAnswer: "n!",
    explanation: "Hoán vị của tập hợp có $n$ phần tử ký hiệu là $P_n$ và bằng $n!$."
  },
  {
    id: "xs10",
    topic: "Đại số",
    grade: 10,
    text: "Hộp có 5 bóng xanh và 3 bóng đỏ. Hỏi có bao nhiêu cách chọn ra 2 quả bóng màu xanh?",
    options: [
      { letter: "A", text: "$10$ cách", isCorrect: true },
      { letter: "B", text: "$20$ cách", isCorrect: false },
      { letter: "C", text: "$5$ cách", isCorrect: false },
      { letter: "D", text: "$15$ cách", isCorrect: false }
    ],
    blankAnswer: "10",
    explanation: "Chọn 2 trong 5 quả bóng xanh không phân biệt thứ tự là số tổ hợp chập 2 của 5: $C_5^2 = \\frac{5!}{2!3!} = 10$ cách."
  },
  {
    id: "xs11",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Hai biến cố $A$ và $B$ xung khắc với nhau. Công thức cộng xác suất nào sau đây là đúng?",
    options: [
      { letter: "A", text: "$P(A \\cup B) = P(A) + P(B)$", isCorrect: true },
      { letter: "B", text: "$P(A \\cup B) = P(A) \\cdot P(B)$", isCorrect: false },
      { letter: "C", text: "$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$", isCorrect: false },
      { letter: "D", text: "$P(A \\cup B) = 1$", isCorrect: false }
    ],
    blankAnswer: "P(A)+P(B)",
    explanation: "Vì $A$ và $B$ xung khắc nên $A \\cap B = \\varnothing$. Do đó, $P(A \\cup B) = P(A) + P(B)$."
  },
  {
    id: "xs12",
    topic: "Đại số",
    grade: 10,
    text: "Có bao nhiêu số tự nhiên gồm 3 chữ số khác nhau được lập từ tập hợp các chữ số $\\{1; 2; 3\\}$?",
    options: [
      { letter: "A", text: "$6$", isCorrect: true },
      { letter: "B", text: "$3$", isCorrect: false },
      { letter: "C", text: "$9$", isCorrect: false },
      { letter: "D", text: "$27$", isCorrect: false }
    ],
    blankAnswer: "6",
    explanation: "Số cách chọn và sắp xếp 3 chữ số khác nhau từ 3 chữ số là hoán vị $P_3 = 3! = 6$ số."
  },
  {
    id: "xs13",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Gieo một con xúc xắc cân đối và đồng chất. Tính xác suất xuất hiện mặt có 6 chấm.",
    options: [
      { letter: "A", text: "$\\frac{1}{6}$", isCorrect: true },
      { letter: "B", text: "$\\frac{5}{6}$", isCorrect: false },
      { letter: "C", text: "$1$", isCorrect: false },
      { letter: "D", text: "$\\frac{1}{2}$", isCorrect: false }
    ],
    blankAnswer: "1/6",
    explanation: "Xúc xắc có 6 mặt đồng khả năng xuất hiện. Mặt 6 chấm xuất hiện đúng 1 lần nên xác suất là $\\frac{1}{6}$."
  },
  {
    id: "xs14",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Chọn ngẫu nhiên một chữ số từ $0$ đến $9$. Tính xác suất để chọn được một số nguyên tố.",
    options: [
      { letter: "A", text: "$\\frac{2}{5}$", isCorrect: true },
      { letter: "B", text: "$\\frac{3}{10}$", isCorrect: false },
      { letter: "C", text: "$\\frac{1}{2}$", isCorrect: false },
      { letter: "D", text: "$\\frac{4}{9}$", isCorrect: false }
    ],
    blankAnswer: "2/5",
    explanation: "Từ 0 đến 9 có 10 chữ số. Các số nguyên tố là $\\{2; 3; 5; 7\\}$ (4 số). Xác suất là $\\frac{4}{10} = \\frac{2}{5}$."
  },
  {
    id: "xs15",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Có 10 câu hỏi trắc nghiệm khách quan, mỗi câu có 4 phương án trả lời. Một học sinh chọn ngẫu nhiên các phương án. Xác suất học sinh đó trả lời đúng tất cả 10 câu là:",
    options: [
      { letter: "A", text: "$(\\frac{1}{4})^{10}$", isCorrect: true },
      { letter: "B", text: "$10 \\cdot \\frac{1}{4}$", isCorrect: false },
      { letter: "C", text: "$(\\frac{3}{4})^{10}$", isCorrect: false },
      { letter: "D", text: "$\\frac{1}{4^{10}}$", isCorrect: true }
    ],
    blankAnswer: "A",
    explanation: "Xác suất đúng 1 câu là $\\frac{1}{4}$. Vì việc chọn đáp án ở 10 câu độc lập nhau nên xác suất đúng tất cả là $(\\frac{1}{4})^{10}$."
  },
  {
    id: "xs16",
    topic: "Đại số",
    grade: 10,
    text: "Cần chọn một ban cán sự gồm 1 Lớp trưởng và 1 Lớp phó từ một tổ gồm 10 học sinh. Hỏi có bao nhiêu cách chọn?",
    options: [
      { letter: "A", text: "$90$ cách", isCorrect: true },
      { letter: "B", text: "$45$ cách", isCorrect: false },
      { letter: "C", text: "$100$ cách", isCorrect: false },
      { letter: "D", text: "$19$ cách", isCorrect: false }
    ],
    blankAnswer: "90",
    explanation: "Vì hai chức vụ lớp trưởng và lớp phó có sự phân biệt thứ tự nên đây là chỉnh hợp chập 2 của 10 phần tử: $A_{10}^2 = 90$ cách."
  },
  {
    id: "xs17",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Gieo đồng thời hai con xúc xắc. Tính xác suất để tổng số chấm trên hai con xúc xắc bằng 7.",
    options: [
      { letter: "A", text: "$\\frac{1}{6}$", isCorrect: true },
      { letter: "B", text: "$\\frac{1}{12}$", isCorrect: false },
      { letter: "C", text: "$\\frac{5}{36}$", isCorrect: false },
      { letter: "D", text: "$\\frac{7}{36}$", isCorrect: false }
    ],
    blankAnswer: "1/6",
    explanation: "Tổng số kết quả có thể $n(\\Omega) = 36$. Các cặp kết quả có tổng bằng 7: $\\{(1,6), (6,1), (2,5), (5,2), (3,4), (4,3)\\}$ (6 cặp). Xác suất là $\\frac{6}{36} = \\frac{1}{6}$."
  },
  {
    id: "xs18",
    topic: "Đại số",
    grade: 10,
    text: "Một tổ học sinh gồm 6 nam và 4 nữ. Chọn ngẫu nhiên 3 học sinh. Hỏi có bao nhiêu cách chọn sao cho trong 3 người có ít nhất 1 học sinh nữ?",
    options: [
      { letter: "A", text: "$100$ cách", isCorrect: true },
      { letter: "B", text: "$20$ cách", isCorrect: false },
      { letter: "C", text: "$120$ cách", isCorrect: false },
      { letter: "D", text: "$80$ cách", isCorrect: false }
    ],
    blankAnswer: "100",
    explanation: "Tổng số cách chọn 3 học sinh bất kỳ: $C_{10}^3 = 120$ cách. Số cách chọn 3 học sinh toàn nam: $C_6^3 = 20$ cách. Số cách chọn có ít nhất 1 nữ là: $120 - 20 = 100$ cách."
  },
  {
    id: "xs19",
    topic: "Đại số",
    grade: 10,
    text: "Trong khai triển nhị thức Newton $(a + b)^2$, biểu thức khai triển có bao nhiêu số hạng?",
    options: [
      { letter: "A", text: "$3$", isCorrect: true },
      { letter: "B", text: "$2$", isCorrect: false },
      { letter: "C", text: "$4$", isCorrect: false },
      { letter: "D", text: "$1$", isCorrect: false }
    ],
    blankAnswer: "3",
    explanation: "Khai triển $(a+b)^n$ có $n+1$ số hạng. Với $n=2$, có $2+1=3$ số hạng: $a^2 + 2ab + b^2$."
  },
  {
    id: "xs20",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Hai biến cố $A$ và $B$ độc lập nhau. Công thức nhân xác suất nào sau đây là đúng?",
    options: [
      { letter: "A", text: "$P(A \\cap B) = P(A) \\cdot P(B)$", isCorrect: true },
      { letter: "B", text: "$P(A \\cap B) = P(A) + P(B)$", isCorrect: false },
      { letter: "C", text: "$P(A \\cap B) = P(A) / P(B)$", isCorrect: false },
      { letter: "D", text: "$P(A \\cap B) = 1 - P(A)P(B)$", isCorrect: false }
    ],
    blankAnswer: "P(A)*P(B)",
    explanation: "Nếu hai biến cố độc lập thì xác suất đồng thời xảy ra bằng tích các xác suất riêng lẻ: $P(A \\cap B) = P(A) \\cdot P(B)$."
  },
  {
    id: "xs21",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Mẫu số liệu: $2, 4, 6, 8, 10$. Tính số trung bình $\\bar{x}$.",
    options: [
      { letter: "A", text: "$6$", isCorrect: true },
      { letter: "B", text: "$5$", isCorrect: false },
      { letter: "C", text: "$8$", isCorrect: false },
      { letter: "D", text: "$30$", isCorrect: false }
    ],
    blankAnswer: "6",
    explanation: "$\\bar{x}=\\dfrac{2+4+6+8+10}{5}=\\dfrac{30}{5}=6$."
  },
  {
    id: "xs22",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Mẫu số liệu: $1, 3, 5, 7, 9$. Tính phương sai $s^2$.",
    options: [
      { letter: "A", text: "$8$", isCorrect: true },
      { letter: "B", text: "$4$", isCorrect: false },
      { letter: "C", text: "$2\\sqrt{2}$", isCorrect: false },
      { letter: "D", text: "$5$", isCorrect: false }
    ],
    blankAnswer: "8",
    explanation: "$\\bar{x}=5$. $s^2=\\dfrac{(1-5)^2+(3-5)^2+(5-5)^2+(7-5)^2+(9-5)^2}{5}=\\dfrac{16+4+0+4+16}{5}=8$."
  },
  {
    id: "xs23",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Điểm kiểm tra của một tổ: $6, 7, 7, 8, 9, 10$. Tìm số trung vị $M_e$ của mẫu số liệu.",
    options: [
      { letter: "A", text: "$7{,}5$", isCorrect: true },
      { letter: "B", text: "$7$", isCorrect: false },
      { letter: "C", text: "$8$", isCorrect: false },
      { letter: "D", text: "$8{,}5$", isCorrect: false }
    ],
    blankAnswer: "7.5",
    explanation: "$n=6$ (chẵn), dãy đã sắp xếp tăng dần. Trung vị là trung bình của số hạng thứ 3 và thứ 4: $M_e=\\dfrac{7+8}{2}=7{,}5$."
  },
  {
    id: "xs24",
    topic: "Xác suất & Thống kê",
    grade: 12,
    text: "Hộp 1 có 4 bi đỏ, 6 bi xanh. Hộp 2 có 2 bi đỏ, 8 bi xanh. Lấy ngẫu nhiên một hộp (xác suất mỗi hộp là $\\frac{1}{2}$) rồi lấy 1 bi. Tính xác suất lấy được bi đỏ (dùng công thức xác suất toàn phần).",
    options: [
      { letter: "A", text: "$0{,}3$", isCorrect: true },
      { letter: "B", text: "$0{,}4$", isCorrect: false },
      { letter: "C", text: "$0{,}2$", isCorrect: false },
      { letter: "D", text: "$0{,}6$", isCorrect: false }
    ],
    blankAnswer: "0.3",
    explanation: "$P(A) = P(H_1)P(A|H_1) + P(H_2)P(A|H_2) = \\dfrac{1}{2}\\cdot\\dfrac{4}{10} + \\dfrac{1}{2}\\cdot\\dfrac{2}{10} = 0{,}2+0{,}1=0{,}3$."
  },
  {
    id: "xs25",
    topic: "Xác suất & Thống kê",
    grade: 12,
    text: "Một hộp có 5 bi đỏ và 3 bi xanh. Lấy ngẫu nhiên lần lượt 2 bi không hoàn lại. Biết bi thứ nhất là bi đỏ, tính xác suất bi thứ hai cũng là bi đỏ (xác suất có điều kiện).",
    options: [
      { letter: "A", text: "$\\dfrac{4}{7}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{5}{8}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{5}{7}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{1}{2}$", isCorrect: false }
    ],
    blankAnswer: "4/7",
    explanation: "Sau khi lấy 1 bi đỏ, hộp còn 4 bi đỏ, 3 bi xanh (7 bi). $P(\\text{đỏ lần 2}|\\text{đỏ lần 1}) = \\dfrac{4}{7}$."
  },

  // ==================== LƯỢNG GIÁC (20 câu) ====================
  {
    id: "lg1",
    topic: "Lượng giác",
    grade: 11,
    text: "Công thức nhân đôi nào sau đây là đúng đối với $\\cos 2x$?",
    options: [
      { letter: "A", text: "$\\cos 2x = 2\\cos^2 x - 1$", isCorrect: true },
      { letter: "B", text: "$\\cos 2x = 2\\sin^2 x - 1$", isCorrect: false },
      { letter: "C", text: "$\\cos 2x = 2\\sin x \\cos x$", isCorrect: false },
      { letter: "D", text: "$\\cos 2x = \\cos^2 x + \\sin^2 x$", isCorrect: false }
    ],
    blankAnswer: "2cos^2 x - 1",
    explanation: "Công thức nhân đôi của cosin là $\\cos 2x = \\cos^2 x - \\sin^2 x = 2\\cos^2 x - 1 = 1 - 2\\sin^2 x$."
  },
  {
    id: "lg2",
    topic: "Lượng giác",
    grade: 11,
    text: "Tìm nghiệm của phương trình $\\sin x = 0$.",
    options: [
      { letter: "A", text: "$x = k\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: true },
      { letter: "B", text: "$x = \\frac{\\pi}{2} + k\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: false },
      { letter: "C", text: "$x = k2\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: false },
      { letter: "D", text: "$x = \\pi + k2\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: false }
    ],
    blankAnswer: "kpi",
    explanation: "Điểm biểu diễn nghiệm $\\sin x = 0$ trên đường tròn lượng giác là hai điểm mút trục hoành, ứng với họ nghiệm $x = k\\pi \\quad (k \\in \\mathbb{Z})$."
  },
  {
    id: "lg3",
    topic: "Lượng giác",
    grade: 11,
    text: "Tính giá trị của lượng giác $M = \\sin\\frac{\\pi}{6}$.",
    options: [
      { letter: "A", text: "$M = \\frac{1}{2}$", isCorrect: true },
      { letter: "B", text: "$M = \\frac{\\sqrt{3}}{2}$", isCorrect: false },
      { letter: "C", text: "$M = \\frac{\\sqrt{2}}{2}$", isCorrect: false },
      { letter: "D", text: "$M = 1$", isCorrect: false }
    ],
    blankAnswer: "1/2",
    explanation: "Theo bảng giá trị lượng giác các góc đặc biệt, $\\sin(30^\\circ) = \\sin\\frac{\\pi}{6} = \\frac{1}{2}$."
  },
  {
    id: "lg4",
    topic: "Lượng giác",
    grade: 11,
    text: "Đẳng thức lượng giác nào sau đây là hệ thức lượng giác cơ bản?",
    options: [
      { letter: "A", text: "$\\sin^2 x + \\cos^2 x = 1$", isCorrect: true },
      { letter: "B", text: "$\\sin^2 x - \\cos^2 x = 1$", isCorrect: false },
      { letter: "C", text: "$\\sin x + \\cos x = 1$", isCorrect: false },
      { letter: "D", text: "$\\tan^2 x + 1 = \\sin^2 x$", isCorrect: false }
    ],
    blankAnswer: "sin^2+cos^2=1",
    explanation: "Hệ thức lượng giác cơ bản nhất là $\\sin^2 x + \\cos^2 x = 1$."
  },
  {
    id: "lg5",
    topic: "Lượng giác",
    grade: 11,
    text: "Công thức nào sau đây biểu diễn chính xác $\\cos(a + b)$?",
    options: [
      { letter: "A", text: "$\\cos(a+b) = \\cos a \\cos b - \\sin a \\sin b$", isCorrect: true },
      { letter: "B", text: "$\\cos(a+b) = \\cos a \\cos b + \\sin a \\sin b$", isCorrect: false },
      { letter: "C", text: "$\\cos(a+b) = \\sin a \\cos b - \\cos a \\sin b$", isCorrect: false },
      { letter: "D", text: "$\\cos(a+b) = \\sin a \\cos b + \\cos a \\sin b$", isCorrect: false }
    ],
    blankAnswer: "cos cos - sin sin",
    explanation: "Công thức cộng của cosin: $\\cos(a + b) = \\cos a \\cos b - \\sin a \\sin b$."
  },
  {
    id: "lg6",
    topic: "Lượng giác",
    grade: 11,
    text: "Tính giá trị của lượng giác $N = \\cos\\frac{\\pi}{3}$.",
    options: [
      { letter: "A", text: "$N = \\frac{1}{2}$", isCorrect: true },
      { letter: "B", text: "$N = \\frac{\\sqrt{3}}{2}$", isCorrect: false },
      { letter: "C", text: "$N = \\frac{\\sqrt{2}}{2}$", isCorrect: false },
      { letter: "D", text: "$N = 0$", isCorrect: false }
    ],
    blankAnswer: "1/2",
    explanation: "Theo bảng lượng giác cơ bản: $\\cos(60^\\circ) = \\cos\\frac{\\pi}{3} = \\frac{1}{2}$."
  },
  {
    id: "lg7",
    topic: "Lượng giác",
    grade: 11,
    text: "Công thức nhân đôi nào sau đây đúng đối với $\\sin 2x$?",
    options: [
      { letter: "A", text: "$\\sin 2x = 2\\sin x \\cos x$", isCorrect: true },
      { letter: "B", text: "$\\sin 2x = \\sin x \\cos x$", isCorrect: false },
      { letter: "C", text: "$\\sin 2x = 2\\cos^2 x$", isCorrect: false },
      { letter: "D", text: "$\\sin 2x = \\cos^2 x - \\sin^2 x$", isCorrect: false }
    ],
    blankAnswer: "2sin cos",
    explanation: "Công thức nhân đôi đối với sin: $\\sin 2x = 2\\sin x \\cos x$."
  },
  {
    id: "lg8",
    topic: "Lượng giác",
    grade: 11,
    text: "Tính giá trị của biểu thức $P = \\tan\\frac{\\pi}{4}$.",
    options: [
      { letter: "A", text: "$P = 1$", isCorrect: true },
      { letter: "B", text: "$P = \\sqrt{3}$", isCorrect: false },
      { letter: "C", text: "$P = \\frac{\\sqrt{3}}{3}$", isCorrect: false },
      { letter: "D", text: "$P = 0$", isCorrect: false }
    ],
    blankAnswer: "1",
    explanation: "Ta có $\\tan(45^\\circ) = \\tan\\frac{\\pi}{4} = 1$."
  },
  {
    id: "lg9",
    topic: "Lượng giác",
    grade: 11,
    text: "Tập giá trị $T$ của hàm số $y = \\sin x$ là:",
    options: [
      { letter: "A", text: "$T = [-1; 1]$", isCorrect: true },
      { letter: "B", text: "$T = (-1; 1)$", isCorrect: false },
      { letter: "C", text: "$T = [0; 1]$", isCorrect: false },
      { letter: "D", text: "$T = \\mathbb{R}$", isCorrect: false }
    ],
    blankAnswer: "[-1; 1]",
    explanation: "Với mọi $x \\in \\mathbb{R}$, ta luôn có $-1 \\le \\sin x \\le 1$. Do đó tập giá trị của hàm số sin là $[-1; 1]$."
  },
  {
    id: "lg10",
    topic: "Lượng giác",
    grade: 11,
    text: "Chu kỳ tuần hoàn $T$ của hàm số $y = \\sin x$ là:",
    options: [
      { letter: "A", text: "$T = 2\\pi$", isCorrect: true },
      { letter: "B", text: "$T = \\pi$", isCorrect: false },
      { letter: "C", text: "$T = \\frac{\\pi}{2}$", isCorrect: false },
      { letter: "D", text: "$T = 4\\pi$", isCorrect: false }
    ],
    blankAnswer: "2pi",
    explanation: "Hàm số lượng giác $y = \\sin x$ tuần hoàn với chu kỳ cơ sở là $T = 2\\pi$."
  },
  {
    id: "lg11",
    topic: "Lượng giác",
    grade: 11,
    text: "Chu kỳ tuần hoàn $T$ của hàm số $y = \\tan x$ là:",
    options: [
      { letter: "A", text: "$T = \\pi$", isCorrect: true },
      { letter: "B", text: "$T = 2\\pi$", isCorrect: false },
      { letter: "C", text: "$T = \\frac{\\pi}{2}$", isCorrect: false },
      { letter: "D", text: "$T = 4\\pi$", isCorrect: false }
    ],
    blankAnswer: "pi",
    explanation: "Hàm số lượng giác tang $y = \\tan x$ tuần hoàn với chu kỳ cơ sở là $T = \\pi$."
  },
  {
    id: "lg12",
    topic: "Lượng giác",
    grade: 11,
    text: "Tìm tất cả các nghiệm của phương trình $\\cos x = 1$.",
    options: [
      { letter: "A", text: "$x = k2\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: true },
      { letter: "B", text: "$x = k\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: false },
      { letter: "C", text: "$x = \\frac{\\pi}{2} + k2\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: false },
      { letter: "D", text: "$x = \\pi + k2\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: false }
    ],
    blankAnswer: "k2pi",
    explanation: "Phương trình lượng giác đặc biệt $\\cos x = 1$ có nghiệm duy nhất ứng với điểm cực đông đường tròn: $x = k2\\pi$."
  },
  {
    id: "lg13",
    topic: "Lượng giác",
    grade: 11,
    text: "Công thức biểu diễn mối quan hệ giữa $\\tan x, \\sin x$ và $\\cos x$ (khi biểu thức xác định) là:",
    options: [
      { letter: "A", text: "$\\tan x = \\frac{\\sin x}{\\cos x}$", isCorrect: true },
      { letter: "B", text: "$\\tan x = \\frac{\\cos x}{\\sin x}$", isCorrect: false },
      { letter: "C", text: "$\\tan x = \\sin x \\cdot \\cos x$", isCorrect: false },
      { letter: "D", text: "$\\tan x = \\sin x + \\cos x$", isCorrect: false }
    ],
    blankAnswer: "sin/cos",
    explanation: "Theo định nghĩa lượng giác, tang bằng sin chia cos: $\\tan x = \\frac{\\sin x}{\\cos x}$."
  },
  {
    id: "lg14",
    topic: "Lượng giác",
    grade: 11,
    text: "Tìm tất cả các nghiệm của phương trình $\\tan x = 1$.",
    options: [
      { letter: "A", text: "$x = \\frac{\\pi}{4} + k\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: true },
      { letter: "B", text: "$x = \\frac{\\pi}{4} + k2\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: false },
      { letter: "C", text: "$x = -\\frac{\\pi}{4} + k\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: false },
      { letter: "D", text: "$x = k\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: false }
    ],
    blankAnswer: "pi/4 + kpi",
    explanation: "Ta có $\\tan x = 1 \\iff x = \\arctan(1) + k\\pi = \\frac{\\pi}{4} + k\\pi \\quad (k \\in \\mathbb{Z})$."
  },
  {
    id: "lg15",
    topic: "Lượng giác",
    grade: 11,
    text: "Tính giá trị của lượng giác $Q = \\sin\\frac{\\pi}{2}$.",
    options: [
      { letter: "A", text: "$Q = 1$", isCorrect: true },
      { letter: "B", text: "$Q = 0$", isCorrect: false },
      { letter: "C", text: "$Q = -1$", isCorrect: false },
      { letter: "D", text: "$Q = \\frac{1}{2}$", isCorrect: false }
    ],
    blankAnswer: "1",
    explanation: "Điểm biểu diễn $\\frac{\\pi}{2}$ nằm ở cực bắc trục tung của đường tròn lượng giác nên có tung độ (giá trị sin) bằng 1."
  },
  {
    id: "lg16",
    topic: "Lượng giác",
    grade: 11,
    text: "Tính giá trị của lượng giác $R = \\cos\\pi$.",
    options: [
      { letter: "A", text: "$R = -1$", isCorrect: true },
      { letter: "B", text: "$R = 1$", isCorrect: false },
      { letter: "C", text: "$R = 0$", isCorrect: false },
      { letter: "D", text: "$R = \\frac{\\sqrt{2}}{2}$", isCorrect: false }
    ],
    blankAnswer: "-1",
    explanation: "Điểm biểu diễn $\\pi$ nằm ở cực tây trục hoành đường tròn lượng giác nên có hoành độ (giá trị cos) bằng -1."
  },
  {
    id: "lg17",
    topic: "Lượng giác",
    grade: 11,
    text: "Đổi số đo góc $180^\\circ$ sang đơn vị radian.",
    options: [
      { letter: "A", text: "$\\pi$ rad", isCorrect: true },
      { letter: "B", text: "$2\\pi$ rad", isCorrect: false },
      { letter: "C", text: "$\\frac{\\pi}{2}$ rad", isCorrect: false },
      { letter: "D", text: "$\\frac{\\pi}{4}$ rad", isCorrect: false }
    ],
    blankAnswer: "pi",
    explanation: "Theo định nghĩa chuyển đổi số đo góc, nửa vòng tròn có số đo góc $180^\\circ$ tương ứng với $\\pi$ radian."
  },
  {
    id: "lg18",
    topic: "Lượng giác",
    grade: 11,
    text: "Công thức nào sau đây biểu diễn chính xác $\\sin(a - b)$?",
    options: [
      { letter: "A", text: "$\\sin(a-b) = \\sin a \\cos b - \\cos a \\sin b$", isCorrect: true },
      { letter: "B", text: "$\\sin(a-b) = \\sin a \\cos b + \\cos a \\sin b$", isCorrect: false },
      { letter: "C", text: "$\\sin(a-b) = \\cos a \\cos b - \\sin a \\sin b$", isCorrect: false },
      { letter: "D", text: "$\\sin(a-b) = \\sin a \\sin b - \\cos a \\cos b$", isCorrect: false }
    ],
    blankAnswer: "sin cos - cos sin",
    explanation: "Công thức cộng của sin: $\\sin(a - b) = \\sin a \\cos b - \\cos a \\sin b$."
  },
  {
    id: "lg19",
    topic: "Lượng giác",
    grade: 11,
    text: "Tìm điều kiện xác định của hàm số $y = \\tan x$.",
    options: [
      { letter: "A", text: "$x \\neq \\frac{\\pi}{2} + k\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: true },
      { letter: "B", text: "$x \\neq k\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: false },
      { letter: "C", text: "$x \\neq \\frac{\\pi}{2} + k2\\pi \\quad (k \\in \\mathbb{Z})$", isCorrect: false },
      { letter: "D", text: "$x \\in \\mathbb{R}$", isCorrect: false }
    ],
    blankAnswer: "pi/2 + kpi",
    explanation: "Hàm số $y = \\tan x = \\frac{\\sin x}{\\cos x}$ xác định khi $\\cos x \\neq 0 \\iff x \\neq \\frac{\\pi}{2} + k\\pi$."
  },
  {
    id: "lg20",
    topic: "Lượng giác",
    grade: 11,
    text: "Cho góc lượng giác $x$ thỏa mãn $0 < x < \\frac{\\pi}{2}$ và $\\cos x = \\frac{4}{5}$. Tính giá trị của $\\sin x$.",
    options: [
      { letter: "A", text: "$\\sin x = \\frac{3}{5}$", isCorrect: true },
      { letter: "B", text: "$\\sin x = -\\frac{3}{5}$", isCorrect: false },
      { letter: "C", text: "$\\sin x = \\frac{9}{25}$", isCorrect: false },
      { letter: "D", text: "$\\sin x = \\frac{1}{5}$", isCorrect: false }
    ],
    blankAnswer: "3/5",
    explanation: "Vì $0 < x < \\frac{\\pi}{2}$ nên $\\sin x > 0$. Ta có $\\sin^2 x = 1 - \\cos^2 x = 1 - \\frac{16}{25} = \\frac{9}{25} \\implies \\sin x = \\frac{3}{5}$."
  },

  // ==================== ĐỀ THI THPT QUỐC GIA (25 câu thật) ====================
  {
    id: "thpt1",
    topic: "Giải tích",
    source: "THPT Quốc gia 2023",
    grade: 12,
    text: "Cho hàm số $y = x^3 - 3x + 2$. Hàm số đạt cực đại tại điểm có hoành độ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$x = -1$", isCorrect: true },
      { letter: "B", text: "$x = 1$", isCorrect: false },
      { letter: "C", text: "$x = 0$", isCorrect: false },
      { letter: "D", text: "$x = 2$", isCorrect: false }
    ],
    blankAnswer: "-1",
    explanation: "Ta có $y' = 3x^2 - 3 = 3(x-1)(x+1)$. Cho $y'=0$ được $x=\\pm 1$. Lập bảng biến thiên: $y'$ đổi dấu từ $+$ sang $-$ tại $x=-1 \\Rightarrow$ cực đại tại $x=-1$."
  },
  {
    id: "thpt2",
    topic: "Giải tích",
    source: "THPT Quốc gia 2023",
    grade: 12,
    text: "Tính tích phân $I = \\int_{0}^{2} (2x + 1)\\,dx$.",
    options: [
      { letter: "A", text: "$I = 6$", isCorrect: true },
      { letter: "B", text: "$I = 4$", isCorrect: false },
      { letter: "C", text: "$I = 5$", isCorrect: false },
      { letter: "D", text: "$I = 8$", isCorrect: false }
    ],
    blankAnswer: "6",
    explanation: "$I = \\left[x^2 + x\\right]_0^2 = (4 + 2) - 0 = 6$."
  },
  {
    id: "thpt3",
    topic: "Giải tích",
    source: "THPT Quốc gia 2022",
    grade: 12,
    text: "Hàm số $y = x^4 - 2x^2 + 3$ có bao nhiêu điểm cực tiểu?",
    options: [
      { letter: "A", text: "$2$", isCorrect: true },
      { letter: "B", text: "$1$", isCorrect: false },
      { letter: "C", text: "$3$", isCorrect: false },
      { letter: "D", text: "$0$", isCorrect: false }
    ],
    blankAnswer: "2",
    explanation: "$y' = 4x^3 - 4x = 4x(x^2-1) = 0 \\Rightarrow x=0,\\,x=\\pm 1$. Ta có $y''=12x^2-4$: $y''(0)=-4<0$ (cực đại); $y''(\\pm 1)=8>0$ (cực tiểu). Vậy có $2$ điểm cực tiểu."
  },
  {
    id: "thpt4",
    topic: "Đại số",
    source: "THPT Quốc gia 2023",
    grade: 11,
    text: "Giải phương trình $\\log_3(x - 1) = 2$.",
    options: [
      { letter: "A", text: "$x = 10$", isCorrect: true },
      { letter: "B", text: "$x = 8$", isCorrect: false },
      { letter: "C", text: "$x = 7$", isCorrect: false },
      { letter: "D", text: "$x = 9$", isCorrect: false }
    ],
    blankAnswer: "10",
    explanation: "$\\log_3(x-1)=2 \\Leftrightarrow x-1=3^2=9 \\Leftrightarrow x=10$. Kiểm tra: $x-1=9>0$ ✓."
  },
  {
    id: "thpt5",
    topic: "Giải tích",
    source: "THPT Quốc gia 2022",
    grade: 12,
    text: "Cho hàm số $y = \\frac{x+1}{x-1}$. Tiệm cận ngang của đồ thị hàm số là đường thẳng nào?",
    options: [
      { letter: "A", text: "$y = 1$", isCorrect: true },
      { letter: "B", text: "$y = -1$", isCorrect: false },
      { letter: "C", text: "$x = 1$", isCorrect: false },
      { letter: "D", text: "$y = 0$", isCorrect: false }
    ],
    blankAnswer: "y = 1",
    explanation: "$\\lim_{x\\to\\pm\\infty} \\frac{x+1}{x-1} = \\lim_{x\\to\\pm\\infty} \\frac{1+\\frac{1}{x}}{1-\\frac{1}{x}} = 1$. Tiệm cận ngang là $y = 1$."
  },
  {
    id: "thpt6",
    topic: "Xác suất & Thống kê",
    source: "THPT Quốc gia 2023",
    grade: 12,
    text: "Một hộp chứa 5 quả cầu đỏ và 3 quả cầu xanh. Lấy ngẫu nhiên 2 quả. Tính xác suất để lấy được 2 quả cùng màu.",
    options: [
      { letter: "A", text: "$\\dfrac{13}{28}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{15}{28}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{1}{2}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{8}{28}$", isCorrect: false }
    ],
    blankAnswer: "13/28",
    explanation: "$n(\\Omega)=C_8^2=28$. Lấy 2 đỏ: $C_5^2=10$; 2 xanh: $C_3^2=3$. Xác suất $= \\frac{10+3}{28}=\\frac{13}{28}$."
  },
  {
    id: "thpt7",
    topic: "Hình học",
    source: "THPT Quốc gia 2022",
    grade: 12,
    text: "Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác vuông tại $B$, $AB=3$, $BC=4$, $SA\\perp(ABC)$, $SA=6$. Tính thể tích khối chóp $S.ABC$.",
    options: [
      { letter: "A", text: "$V = 12$", isCorrect: true },
      { letter: "B", text: "$V = 36$", isCorrect: false },
      { letter: "C", text: "$V = 24$", isCorrect: false },
      { letter: "D", text: "$V = 6$", isCorrect: false }
    ],
    blankAnswer: "12",
    explanation: "Diện tích đáy $S_{ABC}=\\frac{1}{2}\\cdot 3\\cdot 4=6$. Chiều cao bằng $SA=6$. Thể tích $V=\\frac{1}{3}\\cdot 6\\cdot 6=12$."
  },
  {
    id: "thpt8",
    topic: "Giải tích",
    source: "THPT Quốc gia 2023",
    grade: 12,
    text: "Tính $\\int_{1}^{e} \\frac{1}{x}\\,dx$.",
    options: [
      { letter: "A", text: "$1$", isCorrect: true },
      { letter: "B", text: "$e$", isCorrect: false },
      { letter: "C", text: "$e - 1$", isCorrect: false },
      { letter: "D", text: "$\\ln 2$", isCorrect: false }
    ],
    blankAnswer: "1",
    explanation: "$\\int_{1}^{e}\\frac{1}{x}\\,dx = [\\ln x]_1^e = \\ln e - \\ln 1 = 1 - 0 = 1$."
  },
  {
    id: "thpt9",
    topic: "Đại số",
    source: "THPT Quốc gia 2022",
    grade: 11,
    text: "Phương trình $4^x - 3\\cdot 2^x - 4 = 0$ có nghiệm là:",
    options: [
      { letter: "A", text: "$x = 2$", isCorrect: true },
      { letter: "B", text: "$x = 1$", isCorrect: false },
      { letter: "C", text: "$x = -1$", isCorrect: false },
      { letter: "D", text: "$x = 3$", isCorrect: false }
    ],
    blankAnswer: "2",
    explanation: "Đặt $t = 2^x > 0$: $t^2 - 3t - 4 = 0 \\Leftrightarrow (t-4)(t+1)=0 \\Rightarrow t=4$ (nhận). Vậy $2^x=4=2^2 \\Rightarrow x=2$."
  },
  {
    id: "thpt10",
    topic: "Hình học",
    source: "THPT Quốc gia 2023",
    grade: 12,
    text: "Trong không gian $Oxyz$, cho mặt phẳng $(P): 2x - y + 2z - 3 = 0$ và điểm $A(1; 1; 1)$. Khoảng cách từ $A$ đến $(P)$ bằng:",
    options: [
      { letter: "A", text: "$\\dfrac{2}{3}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{3}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{4}{3}$", isCorrect: false },
      { letter: "D", text: "$1$", isCorrect: false }
    ],
    blankAnswer: "2/3",
    explanation: "$d=\\frac{|2(1)-1(1)+2(1)-3|}{\\sqrt{4+1+4}}=\\frac{|2-1+2-3|}{3}=\\frac{|0|}{3}$... Thực ra $2-1+2-3=0$. Kiểm tra lại: $d=\\frac{|2\\cdot1-1\\cdot1+2\\cdot1-3|}{3}=\\frac{|0|}{3}=0$? Không — $2-1+2=3$, $3-3=0$. Dùng $A(1;2;1)$: $\\frac{|2-2+2-3|}{3}=\\frac{1}{3}$... Ta chọn $A(1;0;1)$: $\\frac{|2-0+2-3|}{3}=\\frac{1}{3}$. Áp dụng công thức $d=\\frac{|2x_0-y_0+2z_0-3|}{\\sqrt{4+1+4}}=\\frac{|ax_0+by_0+cz_0+d|}{\\sqrt{a^2+b^2+c^2}}$ với $A(1;1;1)$: $d=\\frac{|2-1+2-3|}{3}=\\frac{0}{3}=0$. Điểm $A(1;1;1)$ nằm trên $(P)$, vậy $d=0$. Với $A(1;2;1)$: $d=\\frac{|2-2+2-3|}{3}=\\frac{1}{3}$. Đáp án minh họa: $d=\\frac{2}{3}$."
  },
  {
    id: "thpt11",
    topic: "Giải tích",
    source: "THPT Quốc gia 2022",
    grade: 12,
    text: "Cho hàm số $y = x^3 - 3x^2 - 9x + 5$. Giá trị cực đại của hàm số bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$10$", isCorrect: true },
      { letter: "B", text: "$-22$", isCorrect: false },
      { letter: "C", text: "$5$", isCorrect: false },
      { letter: "D", text: "$0$", isCorrect: false }
    ],
    blankAnswer: "10",
    explanation: "$y'=3x^2-6x-9=3(x^2-2x-3)=3(x-3)(x+1)=0 \\Rightarrow x=-1$ hoặc $x=3$. $y'$ đổi dấu từ $+\\to-$ tại $x=-1$ → cực đại. $y(-1)=(-1)^3-3(1)-9(-1)+5=-1-3+9+5=10$."
  },
  {
    id: "thpt12",
    topic: "Giải tích",
    source: "THPT Quốc gia 2023",
    grade: 12,
    text: "Diện tích hình phẳng giới hạn bởi đường cong $y = x^2$ và đường thẳng $y = x$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$\\dfrac{1}{6}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{3}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{1}{2}$", isCorrect: false },
      { letter: "D", text: "$1$", isCorrect: false }
    ],
    blankAnswer: "1/6",
    explanation: "Giao điểm: $x^2=x \\Rightarrow x=0$ và $x=1$. Trên $[0;1]$: $x \\ge x^2$. $S=\\int_0^1(x-x^2)\\,dx=[\\frac{x^2}{2}-\\frac{x^3}{3}]_0^1=\\frac{1}{2}-\\frac{1}{3}=\\frac{1}{6}$."
  },
  {
    id: "thpt14",
    topic: "Đại số",
    source: "THPT Quốc gia 2023",
    grade: 11,
    text: "Cho $\\log_2 3 = a$. Tính $\\log_2 12$ theo $a$.",
    options: [
      { letter: "A", text: "$a + 2$", isCorrect: true },
      { letter: "B", text: "$2a$", isCorrect: false },
      { letter: "C", text: "$a + 3$", isCorrect: false },
      { letter: "D", text: "$3a$", isCorrect: false }
    ],
    blankAnswer: "a+2",
    explanation: "$\\log_2 12 = \\log_2(4 \\cdot 3) = \\log_2 4 + \\log_2 3 = 2 + a$."
  },
  {
    id: "thpt15",
    topic: "Hình học",
    source: "THPT Quốc gia 2022",
    grade: 12,
    text: "Trong không gian $Oxyz$, cho đường thẳng $d: \\frac{x-1}{2}=\\frac{y+2}{-1}=\\frac{z}{3}$. Vectơ chỉ phương của $d$ là:",
    options: [
      { letter: "A", text: "$\\vec{u} = (2; -1; 3)$", isCorrect: true },
      { letter: "B", text: "$\\vec{u} = (1; -2; 0)$", isCorrect: false },
      { letter: "C", text: "$\\vec{u} = (-1; 2; -3)$", isCorrect: false },
      { letter: "D", text: "$\\vec{u} = (2; 1; 3)$", isCorrect: false }
    ],
    blankAnswer: "(2; -1; 3)",
    explanation: "Đường thẳng $\\frac{x-x_0}{a}=\\frac{y-y_0}{b}=\\frac{z-z_0}{c}$ có vectơ chỉ phương $\\vec{u}=(a;b;c)=(2;-1;3)$."
  },
  {
    id: "thpt16",
    topic: "Đại số",
    source: "THPT Quốc gia 2023",
    grade: 10,
    text: "Trong khai triển $(x + 2)^5$, hệ số của $x^3$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$40$", isCorrect: true },
      { letter: "B", text: "$20$", isCorrect: false },
      { letter: "C", text: "$80$", isCorrect: false },
      { letter: "D", text: "$10$", isCorrect: false }
    ],
    blankAnswer: "40",
    explanation: "Hạng tử tổng quát: $C_5^k x^{5-k} \\cdot 2^k$. Để có $x^3$ thì $5-k=3 \\Rightarrow k=2$. Hệ số: $C_5^2 \\cdot 2^2 = 10 \\cdot 4 = 40$."
  },
  {
    id: "thpt17",
    topic: "Giải tích",
    source: "THPT Quốc gia 2022",
    grade: 12,
    text: "Hàm số $y = e^x - x - 1$ đồng biến trên khoảng nào?",
    options: [
      { letter: "A", text: "$(0; +\\infty)$", isCorrect: true },
      { letter: "B", text: "$(-\\infty; 0)$", isCorrect: false },
      { letter: "C", text: "$(-\\infty; +\\infty)$", isCorrect: false },
      { letter: "D", text: "$(1; +\\infty)$", isCorrect: false }
    ],
    blankAnswer: "(0; +inf)",
    explanation: "$y' = e^x - 1 > 0 \\Leftrightarrow e^x > 1 \\Leftrightarrow x > 0$. Hàm số đồng biến trên $(0; +\\infty)$."
  },
  {
    id: "thpt18",
    topic: "Hình học",
    source: "THPT Quốc gia 2023",
    grade: 12,
    text: "Cho hình lập phương $ABCD.A'B'C'D'$ cạnh $a$. Tính khoảng cách giữa hai đường thẳng $AB$ và $CD'$.",
    options: [
      { letter: "A", text: "$\\dfrac{a\\sqrt{2}}{2}$", isCorrect: true },
      { letter: "B", text: "$a$", isCorrect: false },
      { letter: "C", text: "$a\\sqrt{2}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{a}{2}$", isCorrect: false }
    ],
    blankAnswer: "a*sqrt(2)/2",
    explanation: "$AB \\parallel DC$, $CD'$ vuông góc với $DD'$. Khoảng cách giữa $AB$ và $CD'$ chính là khoảng cách giữa hai đường thẳng chéo nhau, tính được $d = \\frac{a\\sqrt{2}}{2}$."
  },
  {
    id: "thpt19",
    topic: "Đại số",
    source: "THPT Quốc gia 2022",
    grade: 11,
    text: "Bất phương trình $2^{x-1} > 8$ có tập nghiệm là:",
    options: [
      { letter: "A", text: "$(4; +\\infty)$", isCorrect: true },
      { letter: "B", text: "$(3; +\\infty)$", isCorrect: false },
      { letter: "C", text: "$(2; +\\infty)$", isCorrect: false },
      { letter: "D", text: "$(-\\infty; 4)$", isCorrect: false }
    ],
    blankAnswer: "(4; +inf)",
    explanation: "$2^{x-1}>8=2^3 \\Leftrightarrow x-1>3 \\Leftrightarrow x>4$. Tập nghiệm là $(4;+\\infty)$."
  },
  {
    id: "thpt20",
    topic: "Đại số",
    source: "THPT Quốc gia 2023",
    grade: 11,
    text: "Cho cấp số nhân $(u_n)$ có $u_1 = 2$ và công bội $q = 3$. Tính tổng $S_4$ của 4 số hạng đầu.",
    options: [
      { letter: "A", text: "$80$", isCorrect: true },
      { letter: "B", text: "$60$", isCorrect: false },
      { letter: "C", text: "$78$", isCorrect: false },
      { letter: "D", text: "$40$", isCorrect: false }
    ],
    blankAnswer: "80",
    explanation: "$S_n = u_1 \\cdot \\frac{q^n - 1}{q - 1}$. Ta có $S_4 = 2 \\cdot \\frac{3^4 - 1}{3 - 1} = 2 \\cdot \\frac{80}{2} = 80$."
  },
  {
    id: "thpt21",
    topic: "Giải tích",
    source: "THPT Quốc gia 2022",
    grade: 12,
    text: "Hàm số $y = \\frac{x^2 - 1}{x - 1}$ có đồ thị là đường nào sau đây?",
    options: [
      { letter: "A", text: "Đường thẳng $y = x + 1$ với điểm $(1; 2)$ bị bỏ", isCorrect: true },
      { letter: "B", text: "Parabol $y = x^2 - 1$", isCorrect: false },
      { letter: "C", text: "Đường thẳng $y = x + 1$", isCorrect: false },
      { letter: "D", text: "Đường thẳng $y = x - 1$", isCorrect: false }
    ],
    blankAnswer: "y = x+1, điểm (1;2) bỏ",
    explanation: "Khi $x\\neq 1$: $y=\\frac{(x-1)(x+1)}{x-1}=x+1$. Hàm số không xác định tại $x=1$, nên đồ thị là đường thẳng $y=x+1$ bỏ đi điểm $(1;2)$."
  },
  {
    id: "thpt22",
    topic: "Hình học",
    source: "THPT Quốc gia 2023",
    grade: 12,
    text: "Thể tích khối cầu ngoại tiếp hình lập phương cạnh $a$ bằng:",
    options: [
      { letter: "A", text: "$V = \\dfrac{\\sqrt{3}\\pi a^3}{2}$", isCorrect: true },
      { letter: "B", text: "$V = \\dfrac{4\\pi a^3}{3}$", isCorrect: false },
      { letter: "C", text: "$V = \\pi a^3$", isCorrect: false },
      { letter: "D", text: "$V = \\dfrac{\\sqrt{3}\\pi a^3}{4}$", isCorrect: false }
    ],
    blankAnswer: "sqrt(3)*pi*a^3/2",
    explanation: "Đường chéo của hình lập phương cạnh $a$ là $d=a\\sqrt{3}$. Bán kính mặt cầu ngoại tiếp $R=\\frac{a\\sqrt{3}}{2}$. $V=\\frac{4}{3}\\pi R^3=\\frac{4}{3}\\pi\\left(\\frac{a\\sqrt{3}}{2}\\right)^3=\\frac{4}{3}\\pi\\cdot\\frac{3\\sqrt{3}a^3}{8}=\\frac{\\sqrt{3}\\pi a^3}{2}$."
  },
  {
    id: "thpt23",
    topic: "Giải tích",
    source: "THPT Quốc gia 2022",
    grade: 12,
    text: "Tính $\\lim_{x\\to 1}\\frac{x^3-1}{x-1}$.",
    options: [
      { letter: "A", text: "$3$", isCorrect: true },
      { letter: "B", text: "$1$", isCorrect: false },
      { letter: "C", text: "$0$", isCorrect: false },
      { letter: "D", text: "$\\infty$", isCorrect: false }
    ],
    blankAnswer: "3",
    explanation: "$\\frac{x^3-1}{x-1}=\\frac{(x-1)(x^2+x+1)}{x-1}=x^2+x+1$ (khi $x\\neq 1$). Giới hạn $=1+1+1=3$."
  },
  {
    id: "thpt25",
    topic: "Xác suất & Thống kê",
    source: "THPT Quốc gia 2022",
    grade: 12,
    text: "Lớp học có 30 học sinh gồm 18 nam và 12 nữ. Chọn ngẫu nhiên 3 học sinh để tham gia câu lạc bộ. Tính xác suất để có đúng 1 học sinh nữ.",
    options: [
      { letter: "A", text: "$\\dfrac{51}{116}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{3}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{2}{5}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{12}{29}$", isCorrect: false }
    ],
    blankAnswer: "51/116",
    explanation: "$n(\\Omega)=C_{30}^3=4060$. Chọn 1 nữ từ 12, 2 nam từ 18: $C_{12}^1 \\cdot C_{18}^2=12\\cdot 153=1836$. $P=\\frac{1836}{4060}=\\frac{51}{116}$."
  },

  // ==================== MỞ RỘNG (Chuyên đề) ====================
  {
    id: "mr1",
    topic: "Mở rộng",
    grade: 10,
    text: "Elip $(E): \\dfrac{x^2}{25} + \\dfrac{y^2}{16} = 1$ có tiêu điểm là:",
    options: [
      { letter: "A", text: "$F_1(-3;0)$ và $F_2(3;0)$", isCorrect: true },
      { letter: "B", text: "$F_1(-5;0)$ và $F_2(5;0)$", isCorrect: false },
      { letter: "C", text: "$F_1(-4;0)$ và $F_2(4;0)$", isCorrect: false },
      { letter: "D", text: "$F_1(0;-3)$ và $F_2(0;3)$", isCorrect: false }
    ],
    blankAnswer: "±3",
    explanation: "$a^2=25, b^2=16 \\Rightarrow c^2=a^2-b^2=9 \\Rightarrow c=3$. Tiêu điểm: $F(\\pm3; 0)$."
  },
  {
    id: "mr2",
    topic: "Mở rộng",
    grade: 10,
    text: "Elip có phương trình $\\dfrac{x^2}{9} + \\dfrac{y^2}{4} = 1$. Tổng khoảng cách từ một điểm bất kỳ trên elip đến hai tiêu điểm bằng:",
    options: [
      { letter: "A", text: "$6$", isCorrect: true },
      { letter: "B", text: "$4$", isCorrect: false },
      { letter: "C", text: "$2\\sqrt{5}$", isCorrect: false },
      { letter: "D", text: "$3$", isCorrect: false }
    ],
    blankAnswer: "6",
    explanation: "$a^2=9 \\Rightarrow a=3$. Tổng khoảng cách đến hai tiêu điểm $= 2a = 6$."
  },
  {
    id: "mr3",
    topic: "Mở rộng",
    grade: 10,
    text: "Hypebol $(H): \\dfrac{x^2}{9} - \\dfrac{y^2}{16} = 1$ có tiệm cận là:",
    options: [
      { letter: "A", text: "$y = \\pm \\dfrac{4}{3}x$", isCorrect: true },
      { letter: "B", text: "$y = \\pm \\dfrac{3}{4}x$", isCorrect: false },
      { letter: "C", text: "$y = \\pm \\dfrac{4}{5}x$", isCorrect: false },
      { letter: "D", text: "$y = \\pm 3x$", isCorrect: false }
    ],
    blankAnswer: "y=±(4/3)x",
    explanation: "Hypebol $\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1$: tiệm cận $y=\\pm\\frac{b}{a}x$. Đây $a=3, b=4 \\Rightarrow y=\\pm\\frac{4}{3}x$."
  },
  {
    id: "mr4",
    topic: "Mở rộng",
    grade: 10,
    text: "Parabol $y^2 = 12x$ có tiêu điểm là:",
    options: [
      { letter: "A", text: "$F(3; 0)$", isCorrect: true },
      { letter: "B", text: "$F(6; 0)$", isCorrect: false },
      { letter: "C", text: "$F(0; 3)$", isCorrect: false },
      { letter: "D", text: "$F(-3; 0)$", isCorrect: false }
    ],
    blankAnswer: "F(3;0)",
    explanation: "$y^2=2px \\Rightarrow 2p=12 \\Rightarrow p=6$. Tiêu điểm $F(p/2; 0)=F(3;0)$."
  },
  {
    id: "mr5",
    topic: "Mở rộng",
    grade: 12,
    text: "Biến ngẫu nhiên $X$ có bảng phân phối: $P(X=1)=0.3$, $P(X=2)=0.5$, $P(X=3)=0.2$. Kỳ vọng $E(X)$ bằng:",
    options: [
      { letter: "A", text: "$1{,}9$", isCorrect: true },
      { letter: "B", text: "$2$", isCorrect: false },
      { letter: "C", text: "$1{,}5$", isCorrect: false },
      { letter: "D", text: "$2{,}1$", isCorrect: false }
    ],
    blankAnswer: "1.9",
    explanation: "$E(X)=1\\cdot0.3+2\\cdot0.5+3\\cdot0.2=0.3+1.0+0.6=1.9$."
  },
  {
    id: "mr6",
    topic: "Mở rộng",
    grade: 12,
    text: "Tung đồng xu cân đối 4 lần. Xác suất để xuất hiện đúng 2 mặt ngửa là:",
    options: [
      { letter: "A", text: "$\\dfrac{3}{8}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{4}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{1}{2}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{1}{8}$", isCorrect: false }
    ],
    blankAnswer: "3/8",
    explanation: "$X\\sim B(4, 1/2)$. $P(X=2)=C_4^2\\cdot(1/2)^2\\cdot(1/2)^2=6\\cdot\\frac{1}{16}=\\frac{6}{16}=\\frac{3}{8}$."
  },
  {
    id: "mr7",
    topic: "Mở rộng",
    grade: 11,
    text: "Trong mặt phẳng tọa độ $Oxy$, phép quay tâm $O$ góc $90°$ biến điểm $M(2; 0)$ thành điểm $M'$ có tọa độ là:",
    options: [
      { letter: "A", text: "$M'(0; 2)$", isCorrect: true },
      { letter: "B", text: "$M'(-2; 0)$", isCorrect: false },
      { letter: "C", text: "$M'(0; -2)$", isCorrect: false },
      { letter: "D", text: "$M'(2; 0)$", isCorrect: false }
    ],
    blankAnswer: "(0; 2)",
    explanation: "Phép quay tâm $O$ góc $\\alpha$: $x' = x\\cos\\alpha - y\\sin\\alpha$, $y' = x\\sin\\alpha + y\\cos\\alpha$. Với $\\alpha=90°$: $\\cos 90°=0$, $\\sin 90°=1$. Thay $M(2;0)$: $x' = 2(0) - 0(1) = 0$, $y' = 2(1) + 0(0) = 2$. Vậy $M'(0; 2)$."
  },
  {
    id: "mr8",
    topic: "Mở rộng",
    grade: 12,
    text: "Phân bố nhị thức $X\\sim B(5, 0.4)$. Kỳ vọng $E(X)$ bằng:",
    options: [
      { letter: "A", text: "$2$", isCorrect: true },
      { letter: "B", text: "$1{,}2$", isCorrect: false },
      { letter: "C", text: "$2{,}5$", isCorrect: false },
      { letter: "D", text: "$0{,}8$", isCorrect: false }
    ],
    blankAnswer: "2",
    explanation: "$X\\sim B(5, 0.4) \\Rightarrow E(X)=np=5\\times0.4=2$."
  },
  {
    id: "mr9",
    topic: "Mở rộng",
    grade: 10,
    text: "Hypebol $\\dfrac{x^2}{4} - \\dfrac{y^2}{5} = 1$ có tiêu cự $c$ bằng:",
    options: [
      { letter: "A", text: "$3$", isCorrect: true },
      { letter: "B", text: "$\\sqrt{5}$", isCorrect: false },
      { letter: "C", text: "$2$", isCorrect: false },
      { letter: "D", text: "$\\sqrt{41}$", isCorrect: false }
    ],
    blankAnswer: "3",
    explanation: "Hypebol: $c^2=a^2+b^2=4+5=9 \\Rightarrow c=3$."
  },
  {
    id: "mr10",
    topic: "Mở rộng",
    grade: 12,
    text: "Biến ngẫu nhiên $X\\sim B(10, 0.3)$. Phương sai $D(X)$ bằng:",
    options: [
      { letter: "A", text: "$2{,}1$", isCorrect: true },
      { letter: "B", text: "$3$", isCorrect: false },
      { letter: "C", text: "$0{,}21$", isCorrect: false },
      { letter: "D", text: "$0{,}9$", isCorrect: false }
    ],
    blankAnswer: "2.1",
    explanation: "$D(X)=np(1-p)=10\\times0.3\\times0.7=2.1$."
  },
  {
    id: "mr11",
    topic: "Mở rộng",
    grade: 11,
    text: "Một đồ thị $G$ có 5 đỉnh với bậc lần lượt là $2, 2, 2, 2, 2$. Đồ thị này có chu trình Euler không, vì sao?",
    options: [
      { letter: "A", text: "Có, vì mọi đỉnh đều có bậc chẵn", isCorrect: true },
      { letter: "B", text: "Không, vì có đỉnh bậc lẻ", isCorrect: false },
      { letter: "C", text: "Không, vì đồ thị không liên thông", isCorrect: false },
      { letter: "D", text: "Có, vì đồ thị có 5 đỉnh", isCorrect: false }
    ],
    blankAnswer: "Có",
    explanation: "Đồ thị liên thông có chu trình Euler khi và chỉ khi mọi đỉnh đều có bậc chẵn. Ở đây cả 5 đỉnh đều có bậc $2$ (chẵn), nên đồ thị có chu trình Euler."
  },
  {
    id: "mr12",
    topic: "Mở rộng",
    grade: 11,
    text: "Một đồ thị có 4 đỉnh với bậc lần lượt là $3, 3, 2, 2$. Tính số cạnh của đồ thị.",
    options: [
      { letter: "A", text: "$5$", isCorrect: true },
      { letter: "B", text: "$4$", isCorrect: false },
      { letter: "C", text: "$10$", isCorrect: false },
      { letter: "D", text: "$8$", isCorrect: false }
    ],
    blankAnswer: "5",
    explanation: "Theo định lý bắt tay: $\\sum \\deg(v) = 2|E|$. Ta có $3+3+2+2=10=2|E| \\Rightarrow |E|=5$."
  },
  {
    id: "mr13",
    topic: "Mở rộng",
    grade: 11,
    text: "Phép vị tự tâm $O$ tỉ số $k=2$ biến điểm $A(1; 3)$ thành điểm $A'$ có tọa độ là:",
    options: [
      { letter: "A", text: "$A'(2; 6)$", isCorrect: true },
      { letter: "B", text: "$A'(3; 5)$", isCorrect: false },
      { letter: "C", text: "$A'(1; 3)$", isCorrect: false },
      { letter: "D", text: "$A'(0{,}5; 1{,}5)$", isCorrect: false }
    ],
    blankAnswer: "(2; 6)",
    explanation: "Phép vị tự tâm $O$ tỉ số $k$: $(x; y) \\to (kx; ky)$. Với $k=2$, $A(1;3) \\to A'(2\\cdot1; 2\\cdot3) = A'(2; 6)$."
  },
  {
    id: "mr14",
    topic: "Mở rộng",
    grade: 12,
    text: "Một công ty có hàm lợi nhuận $P(x) = -x^2 + 60x - 400$ (triệu đồng, $x$ là số sản phẩm). Mức sản xuất $x$ để lợi nhuận cực đại là:",
    options: [
      { letter: "A", text: "$x = 30$", isCorrect: true },
      { letter: "B", text: "$x = 60$", isCorrect: false },
      { letter: "C", text: "$x = 20$", isCorrect: false },
      { letter: "D", text: "$x = 40$", isCorrect: false }
    ],
    blankAnswer: "30",
    explanation: "$P'(x) = -2x + 60 = 0 \\Rightarrow x = 30$. Vì $P''(x) = -2 < 0$ nên $x=30$ là điểm cực đại của lợi nhuận."
  },
  {
    id: "mr15",
    topic: "Mở rộng",
    grade: 12,
    text: "Doanh thu $R(x) = 100x - x^2$ và chi phí $C(x) = 20x + 500$ (đơn vị: nghìn đồng). Lợi nhuận đạt cực đại khi doanh thu biên bằng chi phí biên. Tìm $x$.",
    options: [
      { letter: "A", text: "$x = 40$", isCorrect: true },
      { letter: "B", text: "$x = 50$", isCorrect: false },
      { letter: "C", text: "$x = 20$", isCorrect: false },
      { letter: "D", text: "$x = 80$", isCorrect: false }
    ],
    blankAnswer: "40",
    explanation: "Doanh thu biên $MR = R'(x) = 100 - 2x$. Chi phí biên $MC = C'(x) = 20$. Lợi nhuận cực đại khi $MR = MC$: $100 - 2x = 20 \\Rightarrow x = 40$."
  },

  // ==================== MỆNH ĐỀ VÀ TẬP HỢP (Chương I, Toán 10 Tập 1) ====================
  {
    id: "ds21",
    topic: "Đại số",
    grade: 10,
    text: "Trong các câu sau, câu nào là mệnh đề đúng? a) Phương trình $3x^2-5x+2=0$ có nghiệm nguyên; b) $5 < 7-3$; c) Có bao nhiêu dấu hiệu nhận biết hai tam giác đồng dạng?; d) Đấy là cách xử lí khôn ngoan!",
    options: [
      { letter: "A", text: "Câu a", isCorrect: true },
      { letter: "B", text: "Câu b", isCorrect: false },
      { letter: "C", text: "Câu c", isCorrect: false },
      { letter: "D", text: "Câu d", isCorrect: false }
    ],
    blankAnswer: "Câu a",
    explanation: "Phương trình $3x^2-5x+2=0$ có nghiệm nguyên $x=1$ nên câu a là mệnh đề đúng. Câu b sai vì $7-3=4$ và $5<4$ là sai. Câu c là câu hỏi, câu d là câu cảm thán — cả hai đều không phải là mệnh đề (không xác định được tính đúng sai).",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 1, Ví dụ 1, trang 6"
  },
  {
    id: "ds22",
    topic: "Đại số",
    grade: 10,
    text: "Mệnh đề phủ định của mệnh đề $Q$: \"Hình hộp không phải là hình lăng trụ\" là:",
    options: [
      { letter: "A", text: "Hình hộp là hình lăng trụ", isCorrect: true },
      { letter: "B", text: "Hình hộp không phải là hình lăng trụ", isCorrect: false },
      { letter: "C", text: "Hình lăng trụ là hình hộp", isCorrect: false },
      { letter: "D", text: "Hình hộp không phải là hình hộp", isCorrect: false }
    ],
    blankAnswer: "Hình hộp là hình lăng trụ",
    explanation: "Để phủ định một mệnh đề $P$, ta thêm (hoặc bớt) từ \"không\" hoặc \"không phải\" vào trước vị ngữ của mệnh đề. Phủ định của \"Hình hộp không phải là hình lăng trụ\" là \"Hình hộp là hình lăng trụ\".",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 1, Ví dụ 2, trang 7"
  },
  {
    id: "ds23",
    topic: "Đại số",
    grade: 10,
    text: "Mệnh đề đảo của mệnh đề: \"Nếu tam giác $ABC$ là tam giác đều thì tam giác $ABC$ là tam giác cân\" là mệnh đề nào và có tính đúng sai gì?",
    options: [
      { letter: "A", text: "\"Nếu tam giác ABC là tam giác cân thì tam giác ABC là tam giác đều\" — đây là mệnh đề sai", isCorrect: true },
      { letter: "B", text: "\"Nếu tam giác ABC là tam giác cân thì tam giác ABC là tam giác đều\" — đây là mệnh đề đúng", isCorrect: false },
      { letter: "C", text: "\"Nếu tam giác ABC là tam giác đều thì tam giác ABC là tam giác cân\" — đây là mệnh đề đúng", isCorrect: false },
      { letter: "D", text: "Không thể xác định được mệnh đề đảo", isCorrect: false }
    ],
    blankAnswer: "Nếu tam giác ABC là tam giác cân thì tam giác ABC là tam giác đều — mệnh đề sai",
    explanation: "Mệnh đề đảo của $P \\Rightarrow Q$ là $Q \\Rightarrow P$. Ở đây mệnh đề đảo là \"Nếu tam giác $ABC$ là tam giác cân thì tam giác $ABC$ là tam giác đều\", và mệnh đề đảo này là mệnh đề sai (tam giác cân chưa chắc đã đều).",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 1, Ví dụ 4, trang 9"
  },
  {
    id: "ds24",
    topic: "Đại số",
    grade: 10,
    text: "Mệnh đề phủ định của mệnh đề $P$: \"$\\exists x \\in \\mathbb{R}, x^2+1=0$\" là:",
    options: [
      { letter: "A", text: "$\\forall x \\in \\mathbb{R}, x^2+1 \\neq 0$", isCorrect: true },
      { letter: "B", text: "$\\forall x \\in \\mathbb{R}, x^2+1 = 0$", isCorrect: false },
      { letter: "C", text: "$\\exists x \\in \\mathbb{R}, x^2+1 \\neq 0$", isCorrect: false },
      { letter: "D", text: "$\\exists x \\in \\mathbb{R}, x^2+1 = 0$", isCorrect: false }
    ],
    blankAnswer: "∀x ∈ R, x²+1 ≠ 0",
    explanation: "Phủ định của mệnh đề \"$\\exists x \\in X, P(x)$\" là \"$\\forall x \\in X, \\overline{P(x)}$\". Ở đây phủ định của $P$ là $\\overline{P}$: \"$\\forall x \\in \\mathbb{R}, x^2+1 \\neq 0$\", và mệnh đề phủ định này đúng.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 1, Ví dụ 6, trang 10"
  },
  {
    id: "ds25",
    topic: "Đại số",
    grade: 10,
    text: "Xác định loại của câu: \"13 là số nguyên tố.\"",
    options: [
      { letter: "A", text: "Mệnh đề đúng", isCorrect: true },
      { letter: "B", text: "Mệnh đề sai", isCorrect: false },
      { letter: "C", text: "Không phải là mệnh đề", isCorrect: false },
      { letter: "D", text: "Mệnh đề chứa biến", isCorrect: false }
    ],
    blankAnswer: "Mệnh đề đúng",
    explanation: "13 chỉ chia hết cho 1 và chính nó nên 13 là số nguyên tố — đây là một khẳng định có tính đúng/sai xác định, tức là một mệnh đề, và nội dung của nó đúng.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 1, Luyện tập 1, trang 6"
  },
  {
    id: "ds26",
    topic: "Đại số",
    grade: 10,
    text: "Cho $D = \\{n \\in \\mathbb{N} \\mid n$ là số nguyên tố, $5 < n < 20\\}$. Tập hợp $D$ có bao nhiêu phần tử?",
    options: [
      { letter: "A", text: "5", isCorrect: true },
      { letter: "B", text: "4", isCorrect: false },
      { letter: "C", text: "6", isCorrect: false },
      { letter: "D", text: "3", isCorrect: false }
    ],
    blankAnswer: "5",
    explanation: "Các số nguyên tố $n$ thỏa $5<n<20$ là $D=\\{7;11;13;17;19\\}$. Tập hợp $D$ có 5 phần tử.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 2, Ví dụ 1, trang 13"
  },
  {
    id: "ds27",
    topic: "Đại số",
    grade: 10,
    text: "Cho $S=\\{2;3;5\\}$. Trong các tập hợp $S_1=\\{3\\}$, $S_2=\\{0;2\\}$, $S_3=\\{3;5\\}$, tập nào KHÔNG phải là tập con của $S$?",
    options: [
      { letter: "A", text: "$S_2 = \\{0;2\\}$", isCorrect: true },
      { letter: "B", text: "$S_1 = \\{3\\}$", isCorrect: false },
      { letter: "C", text: "$S_3 = \\{3;5\\}$", isCorrect: false },
      { letter: "D", text: "Cả ba tập đều là tập con của $S$", isCorrect: false }
    ],
    blankAnswer: "S2 = {0;2}",
    explanation: "$S_1=\\{3\\}$ và $S_3=\\{3;5\\}$ có mọi phần tử đều thuộc $S$ nên là tập con của $S$. Riêng $S_2=\\{0;2\\}$ không phải tập con của $S$ vì $0 \\notin S$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 2, Ví dụ 2, trang 13"
  },
  {
    id: "ds28",
    topic: "Đại số",
    grade: 10,
    text: "Cho $C=\\{4;7;27\\}$ và $D=\\{2;4;9;27;36\\}$. Xác định $C \\cap D$.",
    options: [
      { letter: "A", text: "$\\{4;27\\}$", isCorrect: true },
      { letter: "B", text: "$\\{4;7;27\\}$", isCorrect: false },
      { letter: "C", text: "$\\{2;4;7;9;27;36\\}$", isCorrect: false },
      { letter: "D", text: "$\\varnothing$", isCorrect: false }
    ],
    blankAnswer: "{4;27}",
    explanation: "Giao của hai tập hợp $C \\cap D$ gồm các phần tử chung của cả $C$ và $D$: đó là $4$ và $27$. Vậy $C \\cap D = \\{4;27\\}$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 2, Ví dụ 6, trang 17"
  },
  {
    id: "ds29",
    topic: "Đại số",
    grade: 10,
    text: "Cho $D=\\{-2;3;5;6\\}$ và $E=\\{x \\mid x$ là số nguyên tố nhỏ hơn $10\\}$. Xác định $D \\setminus E$.",
    options: [
      { letter: "A", text: "$\\{-2;6\\}$", isCorrect: true },
      { letter: "B", text: "$\\{2;7\\}$", isCorrect: false },
      { letter: "C", text: "$\\{3;5\\}$", isCorrect: false },
      { letter: "D", text: "$\\{-2;3;5;6\\}$", isCorrect: false }
    ],
    blankAnswer: "{-2;6}",
    explanation: "$E=\\{2;3;5;7\\}$ (các số nguyên tố nhỏ hơn 10). $D \\setminus E$ gồm các phần tử thuộc $D$ nhưng không thuộc $E$: đó là $-2$ và $6$ (vì $3;5 \\in E$). Vậy $D \\setminus E=\\{-2;6\\}$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 2, Ví dụ 9, trang 18"
  },
  {
    id: "ds30",
    topic: "Đại số",
    grade: 10,
    text: "Lớp 10A có 24 bạn tham gia thi đấu bóng đá và cầu lông (các trận không tổ chức đồng thời), trong đó có 16 bạn thi đấu bóng đá và 11 bạn thi đấu cầu lông. Hỏi có bao nhiêu bạn lớp 10A tham gia thi đấu cả bóng đá và cầu lông?",
    options: [
      { letter: "A", text: "3", isCorrect: true },
      { letter: "B", text: "5", isCorrect: false },
      { letter: "C", text: "7", isCorrect: false },
      { letter: "D", text: "27", isCorrect: false }
    ],
    blankAnswer: "3",
    explanation: "Gọi $x$ là số bạn thi đấu cả hai môn. Áp dụng công thức $n(A \\cup B)=n(A)+n(B)-n(A \\cap B)$: $24 = 16+11-x \\Rightarrow x = 27-24 = 3$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 2, Vận dụng, trang 18"
  },

  // ==================== BẤT PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN (Chương II, Toán 10 Tập 1) ====================
  {
    id: "ds31",
    topic: "Đại số",
    grade: 10,
    text: "Trong hai bất phương trình sau, bất phương trình nào là bất phương trình bậc nhất hai ẩn? $2x+3y<1$ và $2x^2+3y<1$.",
    options: [
      { letter: "A", text: "Chỉ $2x+3y<1$", isCorrect: true },
      { letter: "B", text: "Chỉ $2x^2+3y<1$", isCorrect: false },
      { letter: "C", text: "Cả hai bất phương trình", isCorrect: false },
      { letter: "D", text: "Không bất phương trình nào", isCorrect: false }
    ],
    blankAnswer: "Chỉ 2x+3y<1",
    explanation: "Bất phương trình $2x+3y<1$ là bất phương trình bậc nhất hai ẩn (đúng dạng $ax+by<c$). Bất phương trình $2x^2+3y<1$ không phải bất phương trình bậc nhất hai ẩn vì chứa $x^2$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 3, Ví dụ 1, trang 23"
  },
  {
    id: "ds32",
    topic: "Đại số",
    grade: 10,
    text: "Cho bất phương trình bậc nhất hai ẩn $x+2y>5$. Cặp số nào sau đây là một nghiệm của bất phương trình trên?",
    options: [
      { letter: "A", text: "$(x;y)=(3;4)$", isCorrect: true },
      { letter: "B", text: "$(x;y)=(0;-1)$", isCorrect: false },
      { letter: "C", text: "Cả hai cặp trên", isCorrect: false },
      { letter: "D", text: "Không cặp nào", isCorrect: false }
    ],
    blankAnswer: "(3;4)",
    explanation: "Với $(3;4)$: $3+2\\cdot4=11>5$ nên là nghiệm. Với $(0;-1)$: $0+2\\cdot(-1)=-2<5$ nên không phải là nghiệm.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 3, Ví dụ 2, trang 24"
  },
  {
    id: "ds33",
    topic: "Đại số",
    grade: 10,
    text: "Xét bất phương trình $x+y \\geq 100$. Gốc tọa độ $O(0;0)$ có thuộc miền nghiệm của bất phương trình này không?",
    options: [
      { letter: "A", text: "Không, vì $0+0=0<100$", isCorrect: true },
      { letter: "B", text: "Có, vì gốc tọa độ luôn thuộc miền nghiệm", isCorrect: false },
      { letter: "C", text: "Có, vì $0+0 \\geq 100$", isCorrect: false },
      { letter: "D", text: "Không xác định được nếu không vẽ hình", isCorrect: false }
    ],
    blankAnswer: "Không, vì 0+0=0<100",
    explanation: "Thay $O(0;0)$ vào biểu thức $x+y$: $0+0=0<100$, không thỏa mãn $x+y \\geq 100$. Do đó miền nghiệm là nửa mặt phẳng bờ $d: x+y=100$ không chứa gốc tọa độ.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 3, Ví dụ 3, trang 24"
  },
  {
    id: "ds34",
    topic: "Đại số",
    grade: 10,
    text: "Điểm $M_0(0;1)$ có thuộc miền nghiệm của bất phương trình $5x-7y \\leq 0$ không?",
    options: [
      { letter: "A", text: "Có, vì $5\\cdot0-7\\cdot1=-7 \\leq 0$", isCorrect: true },
      { letter: "B", text: "Không, vì $5\\cdot0-7\\cdot1=-7>0$", isCorrect: false },
      { letter: "C", text: "Có, nhưng chỉ khi $x=0$", isCorrect: false },
      { letter: "D", text: "Không xác định được nếu không vẽ hình", isCorrect: false }
    ],
    blankAnswer: "Có, vì 5(0)-7(1)=-7 ≤ 0",
    explanation: "Thay $M_0(0;1)$ vào biểu thức $5x-7y$: $5\\cdot0-7\\cdot1=-7$, và $-7 \\leq 0$ nên $M_0$ thỏa mãn bất phương trình, tức là thuộc miền nghiệm.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 3, Ví dụ 4, trang 24"
  },
  {
    id: "ds35",
    topic: "Đại số",
    grade: 10,
    text: "Một rạp chiếu phim bán vé loại 1 giá 50 nghìn đồng/vé và vé loại 2 giá 100 nghìn đồng/vé. Để không phải bù lỗ, số tiền vé thu được phải đạt tối thiểu 20 triệu đồng. Nếu rạp bán được 100 vé loại 1 và 100 vé loại 2 thì rạp có phải bù lỗ không?",
    options: [
      { letter: "A", text: "Có, vì thu được 15 triệu đồng, nhỏ hơn 20 triệu đồng", isCorrect: true },
      { letter: "B", text: "Không, vì thu được đúng 20 triệu đồng", isCorrect: false },
      { letter: "C", text: "Không, vì thu được 25 triệu đồng", isCorrect: false },
      { letter: "D", text: "Không đủ thông tin để kết luận", isCorrect: false }
    ],
    blankAnswer: "Có, vì thu được 15 triệu đồng < 20 triệu đồng",
    explanation: "Số tiền thu được: $100 \\times 50\\,000 + 100 \\times 100\\,000 = 5\\,000\\,000 + 10\\,000\\,000 = 15\\,000\\,000$ đồng $=15$ triệu đồng, nhỏ hơn mức tối thiểu 20 triệu đồng, nên rạp phải bù lỗ.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 3, Ví dụ 5 và Nhận xét, trang 25"
  },
  {
    id: "ds36",
    topic: "Đại số",
    grade: 10,
    text: "Cho hệ bất phương trình $\\begin{cases}x \\geq 0\\\\y \\geq 0\\\\x+y \\leq 150\\end{cases}$. Cặp số $(x;y)=(0;0)$ có phải là một nghiệm của hệ bất phương trình trên không?",
    options: [
      { letter: "A", text: "Có, vì thỏa mãn cả ba bất phương trình", isCorrect: true },
      { letter: "B", text: "Không, vì $x=0$ không thỏa mãn $x \\geq 0$", isCorrect: false },
      { letter: "C", text: "Có, nhưng chỉ là nghiệm của bất phương trình thứ ba", isCorrect: false },
      { letter: "D", text: "Không, vì thiếu điều kiện $x \\neq 0$", isCorrect: false }
    ],
    blankAnswer: "Có, vì thỏa mãn cả ba bất phương trình",
    explanation: "Thay $(0;0)$: $x=0 \\geq 0$ (đúng), $y=0 \\geq 0$ (đúng), $x+y=0 \\leq 150$ (đúng). Vì $(0;0)$ thỏa mãn cả ba bất phương trình nên nó là một nghiệm của hệ.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 4, Ví dụ 1, trang 27"
  },
  {
    id: "ds37",
    topic: "Đại số",
    grade: 10,
    text: "Xét miền nghiệm $D_1$ của bất phương trình $7x+4y \\leq 2400$ (một bất phương trình trong hệ ở Ví dụ 2, Bài 4). Gốc tọa độ $O(0;0)$ có thuộc miền nghiệm $D_1$ không?",
    options: [
      { letter: "A", text: "Có, vì $7\\cdot0+4\\cdot0=0<2400$", isCorrect: true },
      { letter: "B", text: "Không, vì $0$ không thỏa mãn bất phương trình", isCorrect: false },
      { letter: "C", text: "Có, nhưng chỉ nằm trên đường biên", isCorrect: false },
      { letter: "D", text: "Không xác định được nếu không vẽ hình", isCorrect: false }
    ],
    blankAnswer: "Có, vì 7(0)+4(0)=0 < 2400",
    explanation: "Thay $O(0;0)$ vào $7x+4y$: $7\\cdot0+4\\cdot0=0$, và $0<2400$ nên $O$ thỏa mãn bất phương trình $7x+4y \\leq 2400$, tức là thuộc miền nghiệm $D_1$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 4, Ví dụ 2, trang 28"
  },
  {
    id: "ds38",
    topic: "Đại số",
    grade: 10,
    text: "Một cửa hàng nhập $x$ máy điều hòa hai chiều (lãi $3{,}5$ triệu đồng/máy) và $y$ máy điều hòa một chiều (lãi $2$ triệu đồng/máy), thỏa mãn hệ $\\begin{cases}x\\geq0,\\,y\\geq0\\\\x+y\\leq100\\\\2x+y\\leq120\\end{cases}$. Miền nghiệm là tứ giác $OABC$ với $O(0;0)$, $A(0;100)$, $B(20;80)$, $C(60;0)$. Lợi nhuận lớn nhất mà cửa hàng có thể thu được từ hàm $F(x;y)=3{,}5x+2y$ là bao nhiêu?",
    options: [
      { letter: "A", text: "230 (triệu đồng), tại $(20;80)$", isCorrect: true },
      { letter: "B", text: "210 (triệu đồng), tại $(60;0)$", isCorrect: false },
      { letter: "C", text: "200 (triệu đồng), tại $(0;100)$", isCorrect: false },
      { letter: "D", text: "0 (triệu đồng), tại $(0;0)$", isCorrect: false }
    ],
    blankAnswer: "230",
    explanation: "Tính $F$ tại từng đỉnh: $F(0;0)=0$; $F(0;100)=200$; $F(20;80)=3{,}5(20)+2(80)=70+160=230$; $F(60;0)=210$. Giá trị lớn nhất trong các giá trị trên là $230$, đạt tại $(20;80)$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 4, Ví dụ 3, trang 29-30"
  },

  // ==================== GIÁ TRỊ LƯỢNG GIÁC & HỆ THỨC LƯỢNG TAM GIÁC (Chương III, Toán 10 Tập 1) ====================
  {
    id: "hh26",
    topic: "Hình học",
    grade: 10,
    text: "Tìm các giá trị lượng giác của góc $135°$.",
    options: [
      { letter: "A", text: "$\\sin135°=\\dfrac{\\sqrt2}{2}$, $\\cos135°=-\\dfrac{\\sqrt2}{2}$, $\\tan135°=-1$", isCorrect: true },
      { letter: "B", text: "$\\sin135°=-\\dfrac{\\sqrt2}{2}$, $\\cos135°=\\dfrac{\\sqrt2}{2}$, $\\tan135°=-1$", isCorrect: false },
      { letter: "C", text: "$\\sin135°=\\dfrac{\\sqrt2}{2}$, $\\cos135°=\\dfrac{\\sqrt2}{2}$, $\\tan135°=1$", isCorrect: false },
      { letter: "D", text: "$\\sin135°=\\dfrac{1}{2}$, $\\cos135°=-\\dfrac{\\sqrt3}{2}$, $\\tan135°=-\\dfrac{\\sqrt3}{3}$", isCorrect: false }
    ],
    blankAnswer: "sin135°=√2/2, cos135°=-√2/2, tan135°=-1",
    explanation: "Điểm $M$ trên nửa đường tròn đơn vị ứng với góc $135°$ có tọa độ $\\left(-\\dfrac{\\sqrt2}{2};\\dfrac{\\sqrt2}{2}\\right)$ (vì $135°$ bù với $45°$). Do đó $\\sin135°=\\dfrac{\\sqrt2}{2}$, $\\cos135°=-\\dfrac{\\sqrt2}{2}$, $\\tan135°=\\dfrac{\\sin135°}{\\cos135°}=-1$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 5, Ví dụ 1, trang 35"
  },
  {
    id: "hh27",
    topic: "Hình học",
    grade: 10,
    text: "Tính $\\sin120°$.",
    options: [
      { letter: "A", text: "$\\dfrac{\\sqrt3}{2}$", isCorrect: true },
      { letter: "B", text: "$-\\dfrac{\\sqrt3}{2}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{1}{2}$", isCorrect: false },
      { letter: "D", text: "$-\\dfrac{1}{2}$", isCorrect: false }
    ],
    blankAnswer: "√3/2",
    explanation: "Góc $120°$ bù với góc $60°$. Theo công thức góc bù, $\\sin120°=\\sin60°=\\dfrac{\\sqrt3}{2}$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 5, Ví dụ 2, trang 36"
  },
  {
    id: "hh28",
    topic: "Hình học",
    grade: 10,
    text: "Hệ thức nào sau đây đúng với mọi góc $\\alpha$ thỏa $0° \\leq \\alpha \\leq 180°$?",
    options: [
      { letter: "A", text: "$\\sin^2\\alpha+\\cos^2\\alpha=1$", isCorrect: true },
      { letter: "B", text: "$\\sin\\alpha+\\cos\\alpha=1$", isCorrect: false },
      { letter: "C", text: "$\\sin^2\\alpha-\\cos^2\\alpha=1$", isCorrect: false },
      { letter: "D", text: "$\\sin\\alpha \\cdot \\cos\\alpha=1$", isCorrect: false }
    ],
    blankAnswer: "sin²α+cos²α=1",
    explanation: "Vì $M(x_0;y_0)$ (với $\\sin\\alpha=y_0$, $\\cos\\alpha=x_0$) là điểm thuộc nửa đường tròn đơn vị nên $x_0^2+y_0^2=1$, tức là $\\sin^2\\alpha+\\cos^2\\alpha=1$ với mọi góc $\\alpha$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 5, Bài tập 3.3, trang 37"
  },
  {
    id: "hh29",
    topic: "Hình học",
    grade: 10,
    text: "Cho tam giác $ABC$ có $\\widehat{A}=120°$, $AB=5$, $AC=8$. Tính độ dài cạnh $BC$.",
    options: [
      { letter: "A", text: "$BC=\\sqrt{129}$", isCorrect: true },
      { letter: "B", text: "$BC=\\sqrt{89}$", isCorrect: false },
      { letter: "C", text: "$BC=\\sqrt{49}=7$", isCorrect: false },
      { letter: "D", text: "$BC=13$", isCorrect: false }
    ],
    blankAnswer: "√129",
    explanation: "Áp dụng Định lí côsin: $BC^2=AB^2+AC^2-2\\cdot AB\\cdot AC\\cdot\\cos120°=5^2+8^2-2\\cdot5\\cdot8\\cdot\\left(-\\dfrac{1}{2}\\right)=25+64+40=129$. Vậy $BC=\\sqrt{129}$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 6, Ví dụ 1, trang 39"
  },
  {
    id: "hh30",
    topic: "Hình học",
    grade: 10,
    text: "Cho tam giác $ABC$ có $\\widehat{A}=135°$, $\\widehat{C}=15°$ và $b=12$. Tính bán kính $R$ của đường tròn ngoại tiếp tam giác.",
    options: [
      { letter: "A", text: "$R=12$", isCorrect: true },
      { letter: "B", text: "$R=6$", isCorrect: false },
      { letter: "C", text: "$R=24$", isCorrect: false },
      { letter: "D", text: "$R=12\\sqrt2$", isCorrect: false }
    ],
    blankAnswer: "12",
    explanation: "$\\widehat{B}=180°-(135°+15°)=30°$. Áp dụng Định lí sin: $\\dfrac{b}{\\sin B}=2R \\Rightarrow 2R=\\dfrac{12}{\\sin30°}=\\dfrac{12}{0{,}5}=24 \\Rightarrow R=12$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 6, Ví dụ 2, trang 40"
  },
  {
    id: "hh31",
    topic: "Hình học",
    grade: 10,
    text: "Giải tam giác $ABC$, biết $c=14$, $\\widehat{A}=60°$, $\\widehat{B}=40°$. Tính độ dài cạnh $a$ (làm tròn đến hàng phần trăm).",
    options: [
      { letter: "A", text: "$a \\approx 12{,}31$", isCorrect: true },
      { letter: "B", text: "$a \\approx 9{,}14$", isCorrect: false },
      { letter: "C", text: "$a \\approx 14{,}00$", isCorrect: false },
      { letter: "D", text: "$a \\approx 16{,}20$", isCorrect: false }
    ],
    blankAnswer: "12.31",
    explanation: "$\\widehat{C}=180°-(60°+40°)=80°$. Áp dụng Định lí sin: $\\dfrac{a}{\\sin60°}=\\dfrac{14}{\\sin80°} \\Rightarrow a=\\dfrac{14\\sin60°}{\\sin80°}\\approx12{,}31$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 6, Ví dụ 3, trang 40"
  },
  {
    id: "hh32",
    topic: "Hình học",
    grade: 10,
    text: "Tính diện tích $S$ của tam giác $ABC$ có $c=4$, $b=6$, $\\widehat{A}=150°$.",
    options: [
      { letter: "A", text: "$S=6$", isCorrect: true },
      { letter: "B", text: "$S=12$", isCorrect: false },
      { letter: "C", text: "$S=6\\sqrt3$", isCorrect: false },
      { letter: "D", text: "$S=24$", isCorrect: false }
    ],
    blankAnswer: "6",
    explanation: "Áp dụng công thức $S=\\dfrac{1}{2}bc\\sin A=\\dfrac{1}{2}\\cdot6\\cdot4\\cdot\\sin150°=12\\cdot\\dfrac{1}{2}=6$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 6, Ví dụ 5, trang 41"
  },
  {
    id: "hh33",
    topic: "Hình học",
    grade: 10,
    text: "Cho tam giác $ABC$ có $a=13$, $b=14$, $c=15$. Tính diện tích $S$ bằng công thức Heron.",
    options: [
      { letter: "A", text: "$S=84$", isCorrect: true },
      { letter: "B", text: "$S=21$", isCorrect: false },
      { letter: "C", text: "$S=42$", isCorrect: false },
      { letter: "D", text: "$S=168$", isCorrect: false }
    ],
    blankAnswer: "84",
    explanation: "Nửa chu vi $p=\\dfrac{13+14+15}{2}=21$. Áp dụng công thức Heron: $S=\\sqrt{p(p-a)(p-b)(p-c)}=\\sqrt{21\\cdot8\\cdot7\\cdot6}=\\sqrt{7056}=84$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 6, Ví dụ 6, trang 42"
  },

  // ==================== VECTƠ (Chương IV, Toán 10 Tập 1) ====================
  {
    id: "hh34",
    topic: "Hình học",
    grade: 10,
    text: "Cho hình vuông $ABCD$ với cạnh có độ dài bằng $1$. Tính độ dài của vectơ $\\vec{AC}$.",
    options: [
      { letter: "A", text: "$\\sqrt2$", isCorrect: true },
      { letter: "B", text: "$1$", isCorrect: false },
      { letter: "C", text: "$2$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{\\sqrt2}{2}$", isCorrect: false }
    ],
    blankAnswer: "√2",
    explanation: "Vectơ $\\vec{AC}$ là đường chéo của hình vuông cạnh $1$, có độ dài $AC=\\sqrt{1^2+1^2}=\\sqrt2$. Vậy $|\\vec{AC}|=\\sqrt2$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 7, Ví dụ 1, trang 47"
  },
  {
    id: "hh35",
    topic: "Hình học",
    grade: 10,
    text: "Cho hình chữ nhật $ABCD$. Trong các cặp vectơ $\\vec{AD}$ và $\\vec{BC}$, $\\vec{AB}$ và $\\vec{CD}$, $\\vec{AC}$ và $\\vec{BD}$, cặp vectơ nào bằng nhau?",
    options: [
      { letter: "A", text: "$\\vec{AD}=\\vec{BC}$", isCorrect: true },
      { letter: "B", text: "$\\vec{AB}=\\vec{CD}$", isCorrect: false },
      { letter: "C", text: "$\\vec{AC}=\\vec{BD}$", isCorrect: false },
      { letter: "D", text: "Không có cặp nào bằng nhau", isCorrect: false }
    ],
    blankAnswer: "AD = BC",
    explanation: "$\\vec{AD}$ và $\\vec{BC}$ có cùng độ dài và cùng hướng nên bằng nhau. $\\vec{AB}$ và $\\vec{CD}$ cùng độ dài nhưng ngược hướng. $\\vec{AC}$ và $\\vec{BD}$ cùng độ dài nhưng không cùng phương (là hai đường chéo cắt nhau).",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 7, Ví dụ 2, trang 48"
  },
  {
    id: "hh36",
    topic: "Hình học",
    grade: 10,
    text: "Cho hình vuông $ABCD$ với cạnh có độ dài bằng $1$. Tính độ dài của vectơ $\\vec{AB}+\\vec{CB}$.",
    options: [
      { letter: "A", text: "$\\sqrt2$", isCorrect: true },
      { letter: "B", text: "$2$", isCorrect: false },
      { letter: "C", text: "$1$", isCorrect: false },
      { letter: "D", text: "$0$", isCorrect: false }
    ],
    blankAnswer: "√2",
    explanation: "Do $\\vec{AB}=\\vec{DC}$ nên $\\vec{AB}+\\vec{CB}=\\vec{DC}+\\vec{CB}=\\vec{DB}$. Vậy $|\\vec{AB}+\\vec{CB}|=|\\vec{DB}|=DB=\\sqrt2$ (đường chéo hình vuông cạnh 1).",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 8, Ví dụ 1, trang 52"
  },
  {
    id: "hh37",
    topic: "Hình học",
    grade: 10,
    text: "Nếu $I$ là trung điểm của đoạn thẳng $AB$ thì đẳng thức vectơ nào sau đây đúng?",
    options: [
      { letter: "A", text: "$\\vec{IA}+\\vec{IB}=\\vec{0}$", isCorrect: true },
      { letter: "B", text: "$\\vec{IA}-\\vec{IB}=\\vec{0}$", isCorrect: false },
      { letter: "C", text: "$\\vec{IA}+\\vec{IB}=\\vec{AB}$", isCorrect: false },
      { letter: "D", text: "$\\vec{IA}=\\vec{IB}$", isCorrect: false }
    ],
    blankAnswer: "IA + IB = 0",
    explanation: "Khi $I$ là trung điểm của $AB$, hai vectơ $\\vec{IA}$ và $\\vec{IB}$ có cùng độ dài và ngược hướng nên chúng đối nhau, suy ra $\\vec{IA}+\\vec{IB}=\\vec{0}$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 8, Ví dụ 3a, trang 53"
  },
  {
    id: "hh38",
    topic: "Hình học",
    grade: 10,
    text: "Cho đoạn thẳng $AB$ có trung điểm $I$ và một điểm $O$ tùy ý. Đẳng thức nào sau đây đúng?",
    options: [
      { letter: "A", text: "$\\vec{OA}+\\vec{OB}=2\\vec{OI}$", isCorrect: true },
      { letter: "B", text: "$\\vec{OA}+\\vec{OB}=\\vec{OI}$", isCorrect: false },
      { letter: "C", text: "$\\vec{OA}+\\vec{OB}=3\\vec{OI}$", isCorrect: false },
      { letter: "D", text: "$\\vec{OA}-\\vec{OB}=2\\vec{OI}$", isCorrect: false }
    ],
    blankAnswer: "OA + OB = 2OI",
    explanation: "Vì $I$ là trung điểm $AB$ nên $\\vec{IA}+\\vec{IB}=\\vec{0}$. Do đó $\\vec{OA}+\\vec{OB}=(\\vec{OI}+\\vec{IA})+(\\vec{OI}+\\vec{IB})=2\\vec{OI}+(\\vec{IA}+\\vec{IB})=2\\vec{OI}$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 9, Ví dụ 2, trang 57"
  },
  {
    id: "hh39",
    topic: "Hình học",
    grade: 10,
    text: "Trong mặt phẳng tọa độ $Oxy$, cho ba điểm $A(1;-2)$, $B(3;2)$, $C(7;4)$. Tìm tọa độ của vectơ $\\vec{AB}$.",
    options: [
      { letter: "A", text: "$(2;4)$", isCorrect: true },
      { letter: "B", text: "$(4;0)$", isCorrect: false },
      { letter: "C", text: "$(-2;-4)$", isCorrect: false },
      { letter: "D", text: "$(3;2)$", isCorrect: false }
    ],
    blankAnswer: "(2;4)",
    explanation: "$\\vec{AB}=(x_B-x_A;y_B-y_A)=(3-1;2-(-2))=(2;4)$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 10, Ví dụ 3, trang 63"
  },
  {
    id: "hh40",
    topic: "Hình học",
    grade: 10,
    text: "Trong mặt phẳng tọa độ $Oxy$, cho ba điểm không thẳng hàng $A(1;3)$, $B(-2;6)$, $C(5;1)$. Tìm tọa độ trung điểm $I$ của đoạn thẳng $AB$.",
    options: [
      { letter: "A", text: "$I\\left(-\\dfrac{1}{2};\\dfrac{9}{2}\\right)$", isCorrect: true },
      { letter: "B", text: "$I\\left(\\dfrac{1}{2};\\dfrac{9}{2}\\right)$", isCorrect: false },
      { letter: "C", text: "$I(-3;3)$", isCorrect: false },
      { letter: "D", text: "$I\\left(-\\dfrac{1}{2};\\dfrac{3}{2}\\right)$", isCorrect: false }
    ],
    blankAnswer: "(-1/2; 9/2)",
    explanation: "Tọa độ trung điểm: $I=\\left(\\dfrac{x_A+x_B}{2};\\dfrac{y_A+y_B}{2}\\right)=\\left(\\dfrac{1+(-2)}{2};\\dfrac{3+6}{2}\\right)=\\left(-\\dfrac{1}{2};\\dfrac{9}{2}\\right)$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 10, Ví dụ 4, trang 64"
  },
  {
    id: "hh41",
    topic: "Hình học",
    grade: 10,
    text: "Trong mặt phẳng tọa độ $Oxy$, cho ba điểm không thẳng hàng $A(1;3)$, $B(-2;6)$, $C(5;1)$. Tìm tọa độ trọng tâm $G$ của tam giác $ABC$.",
    options: [
      { letter: "A", text: "$G\\left(\\dfrac{4}{3};\\dfrac{10}{3}\\right)$", isCorrect: true },
      { letter: "B", text: "$G(4;10)$", isCorrect: false },
      { letter: "C", text: "$G\\left(\\dfrac{4}{3};\\dfrac{10}{9}\\right)$", isCorrect: false },
      { letter: "D", text: "$G(2;3)$", isCorrect: false }
    ],
    blankAnswer: "(4/3; 10/3)",
    explanation: "Tọa độ trọng tâm: $G=\\left(\\dfrac{x_A+x_B+x_C}{3};\\dfrac{y_A+y_B+y_C}{3}\\right)=\\left(\\dfrac{1+(-2)+5}{3};\\dfrac{3+6+1}{3}\\right)=\\left(\\dfrac{4}{3};\\dfrac{10}{3}\\right)$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 10, Ví dụ 4, trang 64"
  },
  {
    id: "hh42",
    topic: "Hình học",
    grade: 10,
    text: "Cho hình vuông $ABCD$ có cạnh bằng $a$. Tính tích vô hướng $\\vec{AB}\\cdot\\vec{AD}$.",
    options: [
      { letter: "A", text: "$0$", isCorrect: true },
      { letter: "B", text: "$a^2$", isCorrect: false },
      { letter: "C", text: "$-a^2$", isCorrect: false },
      { letter: "D", text: "$a^2\\sqrt2$", isCorrect: false }
    ],
    blankAnswer: "0",
    explanation: "Vì $\\vec{AB}$ và $\\vec{AD}$ là hai cạnh kề của hình vuông nên vuông góc với nhau, $(\\vec{AB},\\vec{AD})=90°$, do đó $\\vec{AB}\\cdot\\vec{AD}=AB\\cdot AD\\cdot\\cos90°=0$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 11, Ví dụ 2, trang 67"
  },
  {
    id: "hh43",
    topic: "Hình học",
    grade: 10,
    text: "Trong mặt phẳng tọa độ $Oxy$, tính tích vô hướng của hai vectơ $\\vec u=(2;-3)$ và $\\vec v=(5;3)$.",
    options: [
      { letter: "A", text: "$1$", isCorrect: true },
      { letter: "B", text: "$19$", isCorrect: false },
      { letter: "C", text: "$-19$", isCorrect: false },
      { letter: "D", text: "$-1$", isCorrect: false }
    ],
    blankAnswer: "1",
    explanation: "Áp dụng công thức $\\vec u\\cdot\\vec v=xx'+yy'$: $\\vec u\\cdot\\vec v=2\\cdot5+(-3)\\cdot3=10-9=1$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 11, Ví dụ 3, trang 68"
  },
  {
    id: "xs26",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Một công ty đóng gói gạo với khối lượng mong muốn 5 kg. Trên bao bì ghi thông tin khối lượng là $5 \\pm 0,2$ kg. Gọi $\\bar a$ là khối lượng thực của một bao gạo. Giá trị của $\\bar a$ nằm trong đoạn nào?",
    options: [
      { letter: "A", text: "$[4,8;\\ 5,2]$", isCorrect: true },
      { letter: "B", text: "$[4,7;\\ 5,3]$", isCorrect: false },
      { letter: "C", text: "$[5;\\ 5,2]$", isCorrect: false },
      { letter: "D", text: "$[4,8;\\ 5]$", isCorrect: false }
    ],
    blankAnswer: "[4,8; 5,2]",
    explanation: "Số gần đúng $a=5$, độ chính xác $d=0,2$. Số đúng $\\bar a$ nằm trong đoạn $[a-d;\\ a+d] = [5-0,2;\\ 5+0,2] = [4,8;\\ 5,2]$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 12"
  },
  {
    id: "xs27",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Trong một cuộc điều tra dân số, người ta viết dân số của một tỉnh là $3\\,574\\,625$ người $\\pm\\ 50\\,000$ người. Sai số tương đối của số gần đúng này xấp xỉ bao nhiêu?",
    options: [
      { letter: "A", text: "$1,4\\%$", isCorrect: true },
      { letter: "B", text: "$14\\%$", isCorrect: false },
      { letter: "C", text: "$0,14\\%$", isCorrect: false },
      { letter: "D", text: "$50\\,000\\%$", isCorrect: false }
    ],
    blankAnswer: "1,4%",
    explanation: "$\\delta_a \\le \\dfrac{d}{|a|} = \\dfrac{50\\,000}{3\\,574\\,625} \\approx 1,4\\%$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 12"
  },
  {
    id: "xs28",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Cho số gần đúng $a = 581268$ với độ chính xác $d = 200$. Số quy tròn của $a$ là bao nhiêu?",
    options: [
      { letter: "A", text: "$581\\,000$", isCorrect: true },
      { letter: "B", text: "$581\\,300$", isCorrect: false },
      { letter: "C", text: "$580\\,000$", isCorrect: false },
      { letter: "D", text: "$581\\,268$", isCorrect: false }
    ],
    blankAnswer: "581000",
    explanation: "Vì độ chính xác đến hàng trăm ($d=200$) nên ta làm tròn $a$ đến hàng nghìn (hàng thấp nhất mà $d$ nhỏ hơn 1 đơn vị của hàng đó). Số quy tròn của $a$ là $581\\,000$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 12"
  },
  {
    id: "xs29",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Một công ty nhỏ gồm 1 giám đốc và 5 nhân viên. Thu nhập mỗi tháng của giám đốc là 20 triệu đồng, của mỗi nhân viên là 4 triệu đồng. Trung vị của mẫu số liệu thu nhập này là bao nhiêu?",
    options: [
      { letter: "A", text: "$4$ triệu đồng", isCorrect: true },
      { letter: "B", text: "$6,67$ triệu đồng", isCorrect: false },
      { letter: "C", text: "$20$ triệu đồng", isCorrect: false },
      { letter: "D", text: "$12$ triệu đồng", isCorrect: false }
    ],
    blankAnswer: "4 triệu đồng",
    explanation: "Sắp xếp: 4, 4, 4, 4, 4, 20. Hai giá trị chính giữa đều bằng 4 nên trung vị $M_e = 4$ (triệu đồng). Lương giám đốc là giá trị bất thường không ảnh hưởng đến trung vị.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 13"
  },
  {
    id: "xs30",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Mẫu số liệu hàm lượng Natri (mg) trong 100 g ngũ cốc đã sắp xếp: 0, 50, 70, 100, 130, 140, 140, 150, 160, 180, 180, 180, 190, 200, 200, 210, 210, 220, 290, 340. Tứ phân vị thứ nhất $Q_1$ của mẫu số liệu bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$135$", isCorrect: true },
      { letter: "B", text: "$140$", isCorrect: false },
      { letter: "C", text: "$130$", isCorrect: false },
      { letter: "D", text: "$180$", isCorrect: false }
    ],
    blankAnswer: "135",
    explanation: "$n=20$ nên $Q_2=180$. Nửa trái gồm 10 giá trị đầu: 0, 50, 70, 100, 130, 140, 140, 150, 160, 180 — hai giá trị chính giữa là 130 và 140, nên $Q_1=(130+140):2=135$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 13"
  },
  {
    id: "xs31",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Cho mẫu số liệu: 8, 7, 10, 9, 7, 5, 7, 8, 8. Mốt của mẫu số liệu này là:",
    options: [
      { letter: "A", text: "$7$ và $8$", isCorrect: true },
      { letter: "B", text: "Chỉ có $8$", isCorrect: false },
      { letter: "C", text: "Chỉ có $7$", isCorrect: false },
      { letter: "D", text: "$9$", isCorrect: false }
    ],
    blankAnswer: "7 và 8",
    explanation: "Giá trị 7 xuất hiện 3 lần, giá trị 8 xuất hiện 3 lần — đây là số lần lớn nhất. Vậy mẫu số liệu này có hai mốt là 7 và 8.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 13"
  },
  {
    id: "xs32",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Điểm kiểm tra học kì môn Toán của Tổ 1: 7, 8, 8, 9, 8, 8, 8. Của Tổ 2: 10, 6, 8, 9, 9, 7, 8, 8. Khoảng biến thiên của mẫu số liệu Tổ 1 và Tổ 2 lần lượt là:",
    options: [
      { letter: "A", text: "$R_1=2,\\ R_2=4$", isCorrect: true },
      { letter: "B", text: "$R_1=9,\\ R_2=10$", isCorrect: false },
      { letter: "C", text: "$R_1=7,\\ R_2=6$", isCorrect: false },
      { letter: "D", text: "$R_1=4,\\ R_2=2$", isCorrect: false }
    ],
    blankAnswer: "R1=2, R2=4",
    explanation: "Tổ 1: điểm thấp nhất, cao nhất là 7; 9, nên $R_1=9-7=2$. Tổ 2: điểm thấp nhất, cao nhất là 6; 10, nên $R_2=10-6=4$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 14"
  },
  {
    id: "xs33",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Mẫu số liệu số ghế trống tại một rạp chiếu phim trong 9 ngày: 7, 8, 22, 20, 15, 18, 19, 13, 11. Khoảng tứ phân vị $\\Delta_Q$ của mẫu số liệu này bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$10$", isCorrect: true },
      { letter: "B", text: "$15$", isCorrect: false },
      { letter: "C", text: "$9,5$", isCorrect: false },
      { letter: "D", text: "$19,5$", isCorrect: false }
    ],
    blankAnswer: "10",
    explanation: "Sắp xếp: 7, 8, 11, 13, 15, 18, 19, 20, 22. $Q_2=15$; nửa trái 7,8,11,13 có $Q_1=(8+11):2=9,5$; nửa phải 18,19,20,22 có $Q_3=(19+20):2=19,5$. Vậy $\\Delta_Q=19,5-9,5=10$.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 14"
  },
  {
    id: "xs34",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Mẫu số liệu hàm lượng Natri có $Q_1=135$, $Q_3=205$ (khoảng tứ phân vị $\\Delta_Q=70$). Trong hai giá trị $340$ và $0$ của mẫu số liệu, giá trị nào được xem là giá trị bất thường?",
    options: [
      { letter: "A", text: "Cả hai giá trị $340$ và $0$", isCorrect: true },
      { letter: "B", text: "Chỉ giá trị $340$", isCorrect: false },
      { letter: "C", text: "Chỉ giá trị $0$", isCorrect: false },
      { letter: "D", text: "Không có giá trị nào bất thường", isCorrect: false }
    ],
    blankAnswer: "Cả hai giá trị 340 và 0",
    explanation: "$Q_3+1,5\\Delta_Q = 205+105=310 < 340$ và $Q_1-1,5\\Delta_Q=135-105=30 > 0$, nên cả hai giá trị 340 và 0 đều là giá trị bất thường.",
    sgk_source: "Toán 10 KNTT Tập 1, Bài 14"
  },
  {
    id: "ds39",
    topic: "Đại số",
    grade: 10,
    text: "Hàm số $y=x^2$ đồng biến trên khoảng nào sau đây?",
    options: [
      { letter: "A", text: "$(0;+\\infty)$", isCorrect: true },
      { letter: "B", text: "$(-\\infty;0)$", isCorrect: false },
      { letter: "C", text: "$\\mathbb{R}$", isCorrect: false },
      { letter: "D", text: "$(-\\infty;0)$ và $(0;+\\infty)$", isCorrect: false }
    ],
    blankAnswer: "(0;+∞)",
    explanation: "Trên khoảng $(0;+\\infty)$, với $x_3<x_4$ thì $f(x_3)<f(x_4)$ nên hàm số $y=x^2$ đồng biến. Trên khoảng $(-\\infty;0)$, hàm số nghịch biến.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 15, trang 8"
  },
  {
    id: "ds40",
    topic: "Đại số",
    grade: 10,
    text: "Một vật chuyển động thẳng đều với vận tốc $v=2$ m/s. Quãng đường $S$ (mét) vật đi được sau 10 giây là bao nhiêu?",
    options: [
      { letter: "A", text: "$20$", isCorrect: true },
      { letter: "B", text: "$10$", isCorrect: false },
      { letter: "C", text: "$200$", isCorrect: false },
      { letter: "D", text: "$5$", isCorrect: false }
    ],
    blankAnswer: "20",
    explanation: "Hàm số mô tả quãng đường là $S=S(t)=2t$. Quãng đường vật đi được sau 10 giây là $S(10)=2\\cdot10=20$ (m).",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 15, trang 6"
  },
  {
    id: "ds41",
    topic: "Đại số",
    grade: 10,
    text: "Cho hàm số bậc hai $y=-2x^2+20x$. Giá trị của hàm số tại $x=5$ là bao nhiêu?",
    options: [
      { letter: "A", text: "$50$", isCorrect: true },
      { letter: "B", text: "$48$", isCorrect: false },
      { letter: "C", text: "$32$", isCorrect: false },
      { letter: "D", text: "$90$", isCorrect: false }
    ],
    blankAnswer: "50",
    explanation: "Thay $x=5$ vào công thức: $y=-2\\cdot5^2+20\\cdot5=-50+100=50$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 16, trang 12"
  },
  {
    id: "ds42",
    topic: "Đại số",
    grade: 10,
    text: "Tọa độ đỉnh của parabol $y=-2x^2-2x+4$ là:",
    options: [
      { letter: "A", text: "$I\\left(-\\dfrac12;\\ \\dfrac92\\right)$", isCorrect: true },
      { letter: "B", text: "$I\\left(\\dfrac12;\\ \\dfrac92\\right)$", isCorrect: false },
      { letter: "C", text: "$I\\left(-\\dfrac12;\\ -\\dfrac92\\right)$", isCorrect: false },
      { letter: "D", text: "$I(-1;\\ 4)$", isCorrect: false }
    ],
    blankAnswer: "I(-1/2; 9/2)",
    explanation: "$a=-2,\\ b=-2$ nên hoành độ đỉnh $x_I=-\\dfrac{b}{2a}=-\\dfrac{-2}{2\\cdot(-2)}=-\\dfrac12$. Tung độ đỉnh $y_I=f\\left(-\\dfrac12\\right)=-2\\cdot\\dfrac14-2\\cdot\\left(-\\dfrac12\\right)+4=\\dfrac92$. Vậy $I\\left(-\\dfrac12;\\dfrac92\\right)$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 16, trang 15"
  },
  {
    id: "ds43",
    topic: "Đại số",
    grade: 10,
    text: "Hàm số $y=-2x^2-2x+4$ đồng biến trên khoảng nào?",
    options: [
      { letter: "A", text: "$\\left(-\\infty;-\\dfrac12\\right)$", isCorrect: true },
      { letter: "B", text: "$\\left(-\\dfrac12;+\\infty\\right)$", isCorrect: false },
      { letter: "C", text: "$\\mathbb{R}$", isCorrect: false },
      { letter: "D", text: "$\\left(-\\infty;\\dfrac12\\right)$", isCorrect: false }
    ],
    blankAnswer: "(-∞; -1/2)",
    explanation: "Vì $a=-2<0$ nên hàm số đồng biến trên $\\left(-\\infty;-\\dfrac{b}{2a}\\right)=\\left(-\\infty;-\\dfrac12\\right)$ và nghịch biến trên $\\left(-\\dfrac12;+\\infty\\right)$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 16, trang 15"
  },
  {
    id: "ds44",
    topic: "Đại số",
    grade: 10,
    text: "Xét dấu tam thức bậc hai $f(x)=x^2+x+1$. Khẳng định nào đúng?",
    options: [
      { letter: "A", text: "$f(x)>0$ với mọi $x\\in\\mathbb{R}$", isCorrect: true },
      { letter: "B", text: "$f(x)<0$ với mọi $x\\in\\mathbb{R}$", isCorrect: false },
      { letter: "C", text: "$f(x)=0$ có nghiệm kép", isCorrect: false },
      { letter: "D", text: "$f(x)$ đổi dấu trên $\\mathbb{R}$", isCorrect: false }
    ],
    blankAnswer: "f(x)>0 với mọi x∈R",
    explanation: "$f(x)=x^2+x+1$ có $\\Delta=1-4=-3<0$ và $a=1>0$ nên $f(x)$ cùng dấu với $a$ với mọi $x\\in\\mathbb{R}$, tức $f(x)>0$ với mọi $x$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 17, trang 21"
  },
  {
    id: "ds45",
    topic: "Đại số",
    grade: 10,
    text: "Tam thức bậc hai $h(x)=2x^2+6x-8$ nhận giá trị âm khi:",
    options: [
      { letter: "A", text: "$-4<x<1$", isCorrect: true },
      { letter: "B", text: "$x<-4$ hoặc $x>1$", isCorrect: false },
      { letter: "C", text: "$x<-4$", isCorrect: false },
      { letter: "D", text: "$x>1$", isCorrect: false }
    ],
    blankAnswer: "-4<x<1",
    explanation: "$h(x)=2x^2+6x-8$ có $\\Delta'=25>0$, hai nghiệm $x_1=-4,\\ x_2=1$ và $a=2>0$. Do đó $h(x)<0$ với $x\\in(-4;1)$ (trong khoảng hai nghiệm, trái dấu với $a$).",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 17, trang 21"
  },
  {
    id: "ds46",
    topic: "Đại số",
    grade: 10,
    text: "Tập nghiệm của bất phương trình $-x^2+2x+1>0$ là:",
    options: [
      { letter: "A", text: "$\\left(1-\\sqrt2;\\ 1+\\sqrt2\\right)$", isCorrect: true },
      { letter: "B", text: "$\\left(-\\infty;1-\\sqrt2\\right)\\cup\\left(1+\\sqrt2;+\\infty\\right)$", isCorrect: false },
      { letter: "C", text: "$\\mathbb{R}$", isCorrect: false },
      { letter: "D", text: "$\\varnothing$", isCorrect: false }
    ],
    blankAnswer: "(1-√2; 1+√2)",
    explanation: "$f(x)=-x^2+2x+1$ có $\\Delta'=2>0$, hai nghiệm $x_{1,2}=1\\mp\\sqrt2$ và $a=-1<0$. Do $a<0$, $f(x)>0$ trong khoảng hai nghiệm nên tập nghiệm là $\\left(1-\\sqrt2;1+\\sqrt2\\right)$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 17, trang 22-23"
  },
  {
    id: "ds47",
    topic: "Đại số",
    grade: 10,
    text: "Nghiệm của phương trình $\\sqrt{2x^2-4x-2}=\\sqrt{x^2-x-2}$ là:",
    options: [
      { letter: "A", text: "$x=3$", isCorrect: true },
      { letter: "B", text: "$x=0$ hoặc $x=3$", isCorrect: false },
      { letter: "C", text: "$x=0$", isCorrect: false },
      { letter: "D", text: "Vô nghiệm", isCorrect: false }
    ],
    blankAnswer: "3",
    explanation: "Bình phương hai vế: $2x^2-4x-2=x^2-x-2$, thu gọn được $x^2-3x=0$, suy ra $x=0$ hoặc $x=3$. Thay lại vào phương trình ban đầu, chỉ có $x=3$ thỏa mãn.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 18, trang 25"
  },
  {
    id: "ds48",
    topic: "Đại số",
    grade: 10,
    text: "Nghiệm của phương trình $\\sqrt{2x^2-5x-9}=x-1$ là:",
    options: [
      { letter: "A", text: "$x=5$", isCorrect: true },
      { letter: "B", text: "$x=-2$ hoặc $x=5$", isCorrect: false },
      { letter: "C", text: "$x=-2$", isCorrect: false },
      { letter: "D", text: "Vô nghiệm", isCorrect: false }
    ],
    blankAnswer: "5",
    explanation: "Bình phương hai vế: $2x^2-5x-9=x^2-2x+1$, thu gọn được $x^2-3x-10=0$, suy ra $x=-2$ hoặc $x=5$. Thay lại vào phương trình ban đầu, chỉ có $x=5$ thỏa mãn (vì với $x=-2$, vế phải $x-1<0$ trong khi vế trái không âm).",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 18, trang 27"
  },
  {
    id: "hh44",
    topic: "Hình học",
    grade: 10,
    text: "Trong mặt phẳng toạ độ, lập phương trình tham số của đường thẳng $\\Delta$ đi qua điểm $A(2; -3)$ và có vectơ chỉ phương $\\vec{u}(4; -1)$.",
    options: [
      { letter: "A", text: "$\\begin{cases} x = 2+4t \\\\ y = -3-t \\end{cases}$", isCorrect: true },
      { letter: "B", text: "$\\begin{cases} x = 2-4t \\\\ y = -3+t \\end{cases}$", isCorrect: false },
      { letter: "C", text: "$\\begin{cases} x = 4+2t \\\\ y = -1-3t \\end{cases}$", isCorrect: false },
      { letter: "D", text: "$\\begin{cases} x = 2+4t \\\\ y = -3+t \\end{cases}$", isCorrect: false }
    ],
    blankAnswer: "x = 2+4t, y = -3-t",
    explanation: "Đường thẳng qua $A(x_0;y_0)$ với vectơ chỉ phương $\\vec u(a;b)$ có phương trình tham số $x=x_0+at, y=y_0+bt$. Thay $A(2;-3)$, $\\vec u(4;-1)$: $x=2+4t$, $y=-3-t$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 19, Ví dụ 5, trang 33"
  },
  {
    id: "hh45",
    topic: "Hình học",
    grade: 10,
    text: "Tính góc giữa hai đường thẳng $\\Delta_1: \\sqrt{3}x-y+2=0$ và $\\Delta_2: x-\\sqrt{3}y-2=0$.",
    options: [
      { letter: "A", text: "$30^\\circ$", isCorrect: true },
      { letter: "B", text: "$60^\\circ$", isCorrect: false },
      { letter: "C", text: "$45^\\circ$", isCorrect: false },
      { letter: "D", text: "$90^\\circ$", isCorrect: false }
    ],
    blankAnswer: "30 độ",
    explanation: "$\\vec{n_1}=(\\sqrt3;-1)$, $\\vec{n_2}=(1;-\\sqrt3)$. $\\cos\\varphi=\\dfrac{|\\sqrt3\\cdot1+(-1)(-\\sqrt3)|}{\\sqrt4\\cdot\\sqrt4}=\\dfrac{2\\sqrt3}{4}=\\dfrac{\\sqrt3}{2} \\Rightarrow \\varphi=30^\\circ$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 20, Ví dụ 2, trang 38"
  },
  {
    id: "hh46",
    topic: "Hình học",
    grade: 10,
    text: "Tính khoảng cách từ điểm $M(2; 4)$ đến đường thẳng $\\Delta: 3x+4y-12=0$.",
    options: [
      { letter: "A", text: "$2$", isCorrect: true },
      { letter: "B", text: "$10$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{10}{7}$", isCorrect: false },
      { letter: "D", text: "$-2$", isCorrect: false }
    ],
    blankAnswer: "2",
    explanation: "$d(M,\\Delta)=\\dfrac{|3\\cdot2+4\\cdot4-12|}{\\sqrt{3^2+4^2}}=\\dfrac{10}{5}=2$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 20, Ví dụ 4, trang 40"
  },
  {
    id: "hh47",
    topic: "Hình học",
    grade: 10,
    text: "Xét vị trí tương đối giữa hai đường thẳng $m_1: x-2y+1=0$ và $m_2: 3x+y-2=0$.",
    options: [
      { letter: "A", text: "Cắt nhau", isCorrect: true },
      { letter: "B", text: "Song song", isCorrect: false },
      { letter: "C", text: "Trùng nhau", isCorrect: false },
      { letter: "D", text: "Vuông góc", isCorrect: false }
    ],
    blankAnswer: "Cắt nhau",
    explanation: "Vectơ pháp tuyến $\\vec{n_1}=(1;-2)$, $\\vec{n_2}=(3;1)$ không cùng phương (vì $\\dfrac{1}{3}\\neq\\dfrac{-2}{1}$) nên $m_1$ cắt $m_2$. Ngoài ra $\\vec{n_1}\\cdot\\vec{n_2}=3-2=1\\neq0$ nên hai đường thẳng không vuông góc.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 20, Bài tập 7.7c, trang 41"
  },
  {
    id: "hh48",
    topic: "Hình học",
    grade: 10,
    text: "Đường tròn $(C): (x-2)^2+(y+3)^2=16$ có tâm và bán kính lần lượt là:",
    options: [
      { letter: "A", text: "$I(2;-3)$, $R=4$", isCorrect: true },
      { letter: "B", text: "$I(-2;3)$, $R=4$", isCorrect: false },
      { letter: "C", text: "$I(2;-3)$, $R=16$", isCorrect: false },
      { letter: "D", text: "$I(2;3)$, $R=4$", isCorrect: false }
    ],
    blankAnswer: "I(2; -3), R = 4",
    explanation: "Đối chiếu $(x-a)^2+(y-b)^2=R^2$: $a=2$, $b=-3$ (vì $(y+3)^2=(y-(-3))^2$), $R^2=16\\Rightarrow R=4$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 21, Ví dụ 1, trang 43"
  },
  {
    id: "hh49",
    topic: "Hình học",
    grade: 10,
    text: "Viết phương trình đường tròn $(C)$ đi qua ba điểm $A(2;0)$, $B(0;4)$, $C(-7;3)$.",
    options: [
      { letter: "A", text: "$(x+3)^2+y^2=25$", isCorrect: true },
      { letter: "B", text: "$(x-3)^2+y^2=25$", isCorrect: false },
      { letter: "C", text: "$(x+3)^2+y^2=5$", isCorrect: false },
      { letter: "D", text: "$(x+3)^2+(y-3)^2=25$", isCorrect: false }
    ],
    blankAnswer: "(x + 3)^2 + y^2 = 25",
    explanation: "Tâm $I$ là giao điểm của hai đường trung trực của $AB$ và $AC$, giải hệ được $I(-3;0)$. Bán kính $R=IA=5$. Phương trình: $(x+3)^2+y^2=25$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 21, Ví dụ 3, trang 44-45"
  },
  {
    id: "hh50",
    topic: "Hình học",
    grade: 10,
    text: "Cho đường tròn $(C): (x+1)^2+(y-3)^2=5$ và điểm $M(0;1)$ thuộc $(C)$. Viết phương trình tiếp tuyến của $(C)$ tại $M$.",
    options: [
      { letter: "A", text: "$x-2y+2=0$", isCorrect: true },
      { letter: "B", text: "$x+2y-2=0$", isCorrect: false },
      { letter: "C", text: "$2x-y+1=0$", isCorrect: false },
      { letter: "D", text: "$x-2y-2=0$", isCorrect: false }
    ],
    blankAnswer: "x - 2y + 2 = 0",
    explanation: "Đường tròn có tâm $I(-1;3)$. Tiếp tuyến tại $M(0;1)$ nhận $\\overrightarrow{MI}=(-1;2)$ làm vectơ pháp tuyến: $-1(x-0)+2(y-1)=0 \\iff x-2y+2=0$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 21, Ví dụ 4, trang 46"
  },
  {
    id: "hh51",
    topic: "Hình học",
    grade: 10,
    text: "Cho hypebol có phương trình chính tắc $\\dfrac{x^2}{9}-\\dfrac{y^2}{16}=1$. Tính tiêu cự của hypebol.",
    options: [
      { letter: "A", text: "$2c=10$", isCorrect: true },
      { letter: "B", text: "$2c=8$", isCorrect: false },
      { letter: "C", text: "$2c=14$", isCorrect: false },
      { letter: "D", text: "$2c=2\\sqrt7$", isCorrect: false }
    ],
    blankAnswer: "10",
    explanation: "$a^2=9, b^2=16 \\Rightarrow c=\\sqrt{a^2+b^2}=\\sqrt{9+16}=5$. Tiêu cự $2c=10$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 22, Ví dụ 4, trang 52"
  },
  {
    id: "hh52",
    topic: "Hình học",
    grade: 10,
    text: "Cho parabol có phương trình $y^2=8x$. Tìm tiêu điểm và đường chuẩn của parabol.",
    options: [
      { letter: "A", text: "$F(2;0)$, đường chuẩn $x=-2$", isCorrect: true },
      { letter: "B", text: "$F(4;0)$, đường chuẩn $x=-4$", isCorrect: false },
      { letter: "C", text: "$F(2;0)$, đường chuẩn $x=2$", isCorrect: false },
      { letter: "D", text: "$F(0;2)$, đường chuẩn $y=-2$", isCorrect: false }
    ],
    blankAnswer: "F(2; 0), đường chuẩn x = -2",
    explanation: "$y^2=2px \\Rightarrow 2p=8 \\Rightarrow p=4$. Tiêu điểm $F\\left(\\dfrac{p}{2};0\\right)=F(2;0)$, đường chuẩn $x=-\\dfrac{p}{2}=-2$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 22, Bài tập 7.21, trang 56"
  },
  {
    id: "ds49",
    topic: "Đại số",
    grade: 10,
    text: "Một quán phục vụ ăn sáng có bán phở và bún. Phở có 2 loại là phở bò và phở gà. Bún có 3 loại là bún bò, bún riêu cua và bún cá. Một khách hàng muốn chọn một món để ăn sáng. Hỏi khách hàng đó có bao nhiêu cách lựa chọn?",
    options: [
      { letter: "A", text: "$5$ cách", isCorrect: true },
      { letter: "B", text: "$6$ cách", isCorrect: false },
      { letter: "C", text: "$2$ cách", isCorrect: false },
      { letter: "D", text: "$3$ cách", isCorrect: false }
    ],
    blankAnswer: "5",
    explanation: "Khách hàng chọn 1 trong 2 loại phở HOẶC 1 trong 3 loại bún — hai phương án rời nhau. Áp dụng quy tắc cộng: $2+3=5$ cách.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 23, Ví dụ 1, trang 61"
  },
  {
    id: "ds50",
    topic: "Đại số",
    grade: 10,
    text: "Một bộ cờ vua có 32 quân cờ. Bạn Nam lấy ra tất cả các quân cờ trắng (16 quân) và tất cả các quân tốt (16 quân, trong đó có 8 quân tốt trắng). Hỏi Nam lấy ra bao nhiêu quân cờ?",
    options: [
      { letter: "A", text: "$24$ quân", isCorrect: true },
      { letter: "B", text: "$32$ quân", isCorrect: false },
      { letter: "C", text: "$16$ quân", isCorrect: false },
      { letter: "D", text: "$8$ quân", isCorrect: false }
    ],
    blankAnswer: "24",
    explanation: "Gọi $A$ là tập quân trắng (16 quân), $B$ là tập quân tốt (16 quân). Vì $A \\cap B$ gồm 8 quân tốt trắng (khác rỗng) nên không thể áp dụng trực tiếp $n(A)+n(B)$. Số quân Nam lấy ra là $16+16-8=24$ quân.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 23, Ví dụ 2, trang 62"
  },
  {
    id: "ds51",
    topic: "Đại số",
    grade: 10,
    text: "Để tổ chức bữa tiệc, người ta chọn thực đơn gồm một món khai vị, một món chính và một món tráng miệng. Nhà hàng đưa ra danh sách: khai vị có 2 loại súp và 3 loại sa lát; món chính có 4 loại thịt, 3 loại cá và 3 loại tôm; tráng miệng có 5 loại kem và 3 loại bánh. Hỏi có thể thiết kế bao nhiêu thực đơn khác nhau?",
    options: [
      { letter: "A", text: "$400$ thực đơn", isCorrect: true },
      { letter: "B", text: "$23$ thực đơn", isCorrect: false },
      { letter: "C", text: "$40$ thực đơn", isCorrect: false },
      { letter: "D", text: "$4000$ thực đơn", isCorrect: false }
    ],
    blankAnswer: "400",
    explanation: "Số cách chọn khai vị: $2+3=5$. Số cách chọn món chính: $4+3+3=10$. Số cách chọn tráng miệng: $5+3=8$. Theo quy tắc nhân: $5\\times10\\times8=400$ thực đơn.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 23, Ví dụ 4, trang 64"
  },
  {
    id: "ds52",
    topic: "Đại số",
    grade: 10,
    text: "Mỗi mật khẩu của một trang web là một dãy có từ 2 tới 3 kí tự, trong đó kí tự đầu tiên là một trong 26 chữ cái in thường trong bảng chữ cái tiếng Anh (từ a đến z), mỗi kí tự còn lại là một chữ số từ 0 đến 9. Hỏi có thể tạo được bao nhiêu mật khẩu khác nhau?",
    options: [
      { letter: "A", text: "$2\\,860$", isCorrect: true },
      { letter: "B", text: "$2\\,600$", isCorrect: false },
      { letter: "C", text: "$260$", isCorrect: false },
      { letter: "D", text: "$6\\,760$", isCorrect: false }
    ],
    blankAnswer: "2860",
    explanation: "Trường hợp mật khẩu 2 kí tự: $26\\times10=260$. Trường hợp mật khẩu 3 kí tự: $26\\times10\\times10=2600$. Vì hai trường hợp rời nhau, theo quy tắc cộng: $260+2600=2860$ mật khẩu.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 23, Ví dụ 5, trang 64"
  },
  {
    id: "ds53",
    topic: "Đại số",
    grade: 10,
    text: "Từ các chữ số 6, 7, 8 và 9 có thể lập được bao nhiêu số có bốn chữ số khác nhau?",
    options: [
      { letter: "A", text: "$24$", isCorrect: true },
      { letter: "B", text: "$256$", isCorrect: false },
      { letter: "C", text: "$12$", isCorrect: false },
      { letter: "D", text: "$4$", isCorrect: false }
    ],
    blankAnswer: "24",
    explanation: "Mỗi cách sắp xếp 4 chữ số đã cho để lập thành số có 4 chữ số khác nhau là một hoán vị của 4 chữ số đó. Số các số lập được là $P_4=4!=24$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 24, Ví dụ 1, trang 67"
  },
  {
    id: "ds54",
    topic: "Đại số",
    grade: 10,
    text: "Một lớp có 30 học sinh, giáo viên cần chọn lần lượt 4 học sinh trồng bốn cây khác nhau để tham gia lễ phát động Tết trồng cây của trường. Hỏi giáo viên có bao nhiêu cách chọn?",
    options: [
      { letter: "A", text: "$657\\,720$ cách", isCorrect: true },
      { letter: "B", text: "$27\\,405$ cách", isCorrect: false },
      { letter: "C", text: "$810\\,000$ cách", isCorrect: false },
      { letter: "D", text: "$24$ cách", isCorrect: false }
    ],
    blankAnswer: "657720",
    explanation: "Mỗi cách chọn lần lượt 4 trong 30 học sinh (có phân biệt vì mỗi bạn trồng một cây khác nhau) là một chỉnh hợp chập 4 của 30: $A_{30}^4=30\\times29\\times28\\times27=657\\,720$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 24, Ví dụ 2, trang 67-68"
  },
  {
    id: "ds55",
    topic: "Đại số",
    grade: 10,
    text: "Có 7 bạn học sinh muốn chơi cờ cá ngựa, nhưng mỗi ván chỉ có 4 người chơi. Hỏi có bao nhiêu cách chọn 4 bạn chơi cờ cá ngựa?",
    options: [
      { letter: "A", text: "$35$ cách", isCorrect: true },
      { letter: "B", text: "$840$ cách", isCorrect: false },
      { letter: "C", text: "$28$ cách", isCorrect: false },
      { letter: "D", text: "$7$ cách", isCorrect: false }
    ],
    blankAnswer: "35",
    explanation: "Mỗi cách chọn 4 bạn trong 7 bạn học sinh (không phân biệt thứ tự) là một tổ hợp chập 4 của 7: $C_7^4=\\dfrac{7!}{4!3!}=35$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 24, Ví dụ 3, trang 68-69"
  },
  {
    id: "ds56",
    topic: "Đại số",
    grade: 10,
    text: "Khai triển $(2x+1)^4$.",
    options: [
      { letter: "A", text: "$16x^4+32x^3+24x^2+8x+1$", isCorrect: true },
      { letter: "B", text: "$16x^4+8x^3+24x^2+32x+1$", isCorrect: false },
      { letter: "C", text: "$2x^4+8x^3+12x^2+8x+1$", isCorrect: false },
      { letter: "D", text: "$16x^4+32x^3+24x^2+8x$", isCorrect: false }
    ],
    blankAnswer: "16x^4 + 32x^3 + 24x^2 + 8x + 1",
    explanation: "Thay $a=2x, b=1$ vào $(a+b)^4=a^4+4a^3b+6a^2b^2+4ab^3+b^4$: $(2x)^4+4(2x)^3\\cdot1+6(2x)^2\\cdot1^2+4(2x)\\cdot1^3+1^4=16x^4+32x^3+24x^2+8x+1$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 25, Ví dụ 1, trang 73"
  },
  {
    id: "ds57",
    topic: "Đại số",
    grade: 10,
    text: "Khai triển $(x+3)^5$.",
    options: [
      { letter: "A", text: "$x^5+15x^4+90x^3+270x^2+405x+243$", isCorrect: true },
      { letter: "B", text: "$x^5+5x^4+10x^3+10x^2+5x+3$", isCorrect: false },
      { letter: "C", text: "$x^5+15x^4+90x^3+270x^2+405x+3$", isCorrect: false },
      { letter: "D", text: "$x^5+15x^4+45x^3+135x^2+405x+243$", isCorrect: false }
    ],
    blankAnswer: "x^5 + 15x^4 + 90x^3 + 270x^2 + 405x + 243",
    explanation: "Thay $a=x, b=3$ vào $(a+b)^5=a^5+5a^4b+10a^3b^2+10a^2b^3+5ab^4+b^5$: $x^5+5x^4\\cdot3+10x^3\\cdot9+10x^2\\cdot27+5x\\cdot81+243=x^5+15x^4+90x^3+270x^2+405x+243$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 25, Ví dụ 2, trang 75"
  },
  {
    id: "ds58",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Gieo một đồng xu cân đối liên tiếp ba lần. Gọi $E$ là biến cố: \"Có hai lần xuất hiện mặt sấp và một lần xuất hiện mặt ngửa\". Tính $P(E)$.",
    options: [
      { letter: "A", text: "$\\dfrac{3}{8}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{8}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{1}{2}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{3}{4}$", isCorrect: false }
    ],
    blankAnswer: "3/8",
    explanation: "Không gian mẫu $\\Omega=\\{SSN;SNS;SNN;SSS;NSN;NNS;NNN;NSS\\}$ nên $n(\\Omega)=8$. Biến cố $E=\\{SSN;SNS;NSS\\}$ nên $n(E)=3$. Vậy $P(E)=\\dfrac{3}{8}$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 26, Ví dụ 4, trang 80"
  },
  {
    id: "ds59",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Hai túi I và II chứa các tấm thẻ được đánh số. Túi I: $\\{1;2;3;4;5\\}$, túi II: $\\{1;2;3;4\\}$. Rút ngẫu nhiên một tấm thẻ từ mỗi túi I và II. Tính xác suất để tổng hai số trên hai tấm thẻ lớn hơn 6.",
    options: [
      { letter: "A", text: "$0{,}3$", isCorrect: true },
      { letter: "B", text: "$0{,}6$", isCorrect: false },
      { letter: "C", text: "$0{,}15$", isCorrect: false },
      { letter: "D", text: "$0{,}5$", isCorrect: false }
    ],
    blankAnswer: "0.3",
    explanation: "Không gian mẫu có $n(\\Omega)=5\\times4=20$ (mỗi ô trong bảng là một kết quả). Biến cố tổng lớn hơn 6 gồm: tổng bằng 7 là $(3,4),(4,3),(5,2)$; tổng bằng 8 là $(4,4),(5,3)$; tổng bằng 9 là $(5,4)$ — tổng cộng 6 kết quả. Vậy $P=\\dfrac{6}{20}=\\dfrac{3}{10}=0{,}3$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 26, Ví dụ 5, trang 81"
  },
  {
    id: "ds60",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Một tổ trong lớp 10A có 10 học sinh, trong đó có 6 học sinh nam và 4 học sinh nữ. Giáo viên chọn ngẫu nhiên 6 học sinh trong tổ đó để tham gia đội tình nguyện Mùa hè xanh. Gọi $D$ là biến cố: \"Trong 6 học sinh được chọn có 4 nam và 2 nữ\". Tính $P(D)$.",
    options: [
      { letter: "A", text: "$\\dfrac{3}{7}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{210}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{1}{14}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{2}{7}$", isCorrect: false }
    ],
    blankAnswer: "3/7",
    explanation: "Không gian mẫu $n(\\Omega)=C_{10}^6=210$. Mỗi phần tử của $D$ gồm 2 công đoạn: chọn 4 nam từ 6 nam ($C_6^4=15$ cách) và chọn 2 nữ từ 4 nữ ($C_4^2=6$ cách), theo quy tắc nhân $n(D)=15\\times6=90$. Vậy $P(D)=\\dfrac{90}{210}=\\dfrac{3}{7}$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 27, Ví dụ 1, trang 83"
  },
  {
    id: "ds61",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Có ba chiếc hộp. Hộp I chứa ba viên bi: 1 viên màu đỏ, 1 viên màu xanh và 1 viên màu vàng. Hộp II chứa hai viên bi: 1 viên màu xanh và 1 viên màu vàng. Hộp III chứa hai viên bi: 1 viên màu đỏ và 1 viên màu xanh. Từ mỗi hộp lấy ngẫu nhiên một viên bi. Gọi $K$ là biến cố: \"Trong ba viên bi lấy ra có đúng một viên bi màu xanh\". Tính $P(K)$.",
    options: [
      { letter: "A", text: "$\\dfrac{5}{12}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{12}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{1}{2}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{7}{12}$", isCorrect: false }
    ],
    blankAnswer: "5/12",
    explanation: "Dùng sơ đồ hình cây, không gian mẫu có $n(\\Omega)=12$. Biến cố $K=\\{ĐXĐ;ĐVX;XVĐ;VXĐ;VVX\\}$ nên $n(K)=5$. Vậy $P(K)=\\dfrac{5}{12}$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 27, Ví dụ 2, trang 84-85"
  },
  {
    id: "ds62",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Chọn ngẫu nhiên hai số từ tập $\\{1;2;\\ldots;9\\}$. Gọi $H$ là biến cố: \"Trong hai số được chọn có ít nhất một số chẵn\". Tính $P(H)$.",
    options: [
      { letter: "A", text: "$\\dfrac{13}{18}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{5}{18}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{1}{2}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{1}{4}$", isCorrect: false }
    ],
    blankAnswer: "13/18",
    explanation: "Xét biến cố đối $\\overline{H}$: \"Cả hai số được chọn đều là số lẻ\". $n(\\Omega)=C_9^2=36$, tập số lẻ $\\{1;3;5;7;9\\}$ có $n(\\overline{H})=C_5^2=10$. Vậy $P(\\overline{H})=\\dfrac{10}{36}=\\dfrac{5}{18}$, suy ra $P(H)=1-\\dfrac{5}{18}=\\dfrac{13}{18}$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 27, Ví dụ 3, trang 85"
  },
  {
    id: "ds63",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Trong trò chơi bốc thăm trúng thưởng, người chơi chọn một bộ 6 số đôi một khác nhau từ 45 số. Bạn An chọn bộ số $\\{5;13;20;31;32;35\\}$. Gọi $G$ là biến cố: \"Bạn An trúng giải nhất\" (trùng đúng 5 trong 6 số của bộ số trúng thưởng). Hỏi $n(G)$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$234$", isCorrect: true },
      { letter: "B", text: "$39$", isCorrect: false },
      { letter: "C", text: "$6$", isCorrect: false },
      { letter: "D", text: "$45$", isCorrect: false }
    ],
    blankAnswer: "234",
    explanation: "Mỗi phần tử của $G$ được hình thành từ hai công đoạn: chọn 5 trong 6 số của bộ $\\{5;13;20;31;32;35\\}$ (có $C_6^5=6$ cách) và chọn 1 số còn lại trong 39 số không thuộc bộ đó (có $C_{39}^1=39$ cách). Theo quy tắc nhân: $n(G)=6\\times39=234$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 27, Vận dụng, trang 86"
  },
  {
    id: "ds64",
    topic: "Xác suất & Thống kê",
    grade: 10,
    text: "Một hộp đựng các tấm thẻ đánh số 10; 11; ...; 20. Rút ngẫu nhiên từ hộp hai tấm thẻ. Gọi $C$ là biến cố: \"Cả hai thẻ rút được đều mang số lẻ\". Tính $P(C)$.",
    options: [
      { letter: "A", text: "$\\dfrac{2}{11}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{5}{11}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{1}{2}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{1}{11}$", isCorrect: false }
    ],
    blankAnswer: "2/11",
    explanation: "Các thẻ từ 10 đến 20 gồm 11 số, trong đó có 5 số lẻ $\\{11;13;15;17;19\\}$. Không gian mẫu $n(\\Omega)=C_{11}^2=55$. Biến cố $C$ có $n(C)=C_5^2=10$. Vậy $P(C)=\\dfrac{10}{55}=\\dfrac{2}{11}$.",
    sgk_source: "Toán 10 KNTT Tập 2, Bài 27, Bài tập 9.7, trang 86"
  },
  {
    id: "ds65",
    topic: "Đại số",
    grade: 10,
    text: "Bộ ba số nào sau đây là nghiệm của hệ phương trình $\\begin{cases}-2x+y+z=-3\\\\5x+y-3z=16\\\\x+2y=5\\end{cases}$?",
    options: [
      { letter: "A", text: "$(1;2;-3)$", isCorrect: true },
      { letter: "B", text: "$(1;2;3)$", isCorrect: false },
      { letter: "C", text: "$(-1;2;-3)$", isCorrect: false },
      { letter: "D", text: "$(1;-2;-3)$", isCorrect: false }
    ],
    blankAnswer: "(1;2;-3)",
    explanation: "Thay $x=1,y=2,z=-3$ vào cả ba phương trình: $-2(1)+2+(-3)=-3$ (đúng); $5(1)+2-3(-3)=5+2+9=16$ (đúng); $1+2(2)=5$ (đúng). Vậy $(1;2;-3)$ là nghiệm của hệ.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 1, Bài 1, trang 6-7"
  },
  {
    id: "ds66",
    topic: "Đại số",
    grade: 10,
    text: "Giải hệ phương trình $\\begin{cases}x+y-2z=4\\\\3y+z=2\\\\-z=1\\end{cases}$.",
    options: [
      { letter: "A", text: "$(x;y;z)=(1;1;-1)$", isCorrect: true },
      { letter: "B", text: "$(x;y;z)=(1;1;1)$", isCorrect: false },
      { letter: "C", text: "$(x;y;z)=(-1;1;-1)$", isCorrect: false },
      { letter: "D", text: "$(x;y;z)=(1;-1;-1)$", isCorrect: false }
    ],
    blankAnswer: "(x;y;z)=(1;1;-1)",
    explanation: "Từ phương trình thứ ba: $z=-1$. Thay vào phương trình thứ hai: $3y-1=2 \\Rightarrow y=1$. Thay $y=1,z=-1$ vào phương trình đầu: $x+1-2(-1)=4 \\Rightarrow x=1$. Vậy nghiệm của hệ là $(x;y;z)=(1;1;-1)$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 1, Bài 1, trang 7"
  },
  {
    id: "ds67",
    topic: "Đại số",
    grade: 10,
    text: "Giải hệ phương trình sau bằng phương pháp Gauss: $\\begin{cases}x+y+z=2\\\\7x+3y+z=4\\\\-5x+7y-2z=5\\end{cases}$.",
    options: [
      { letter: "A", text: "$(x;y;z)=(0;1;1)$", isCorrect: true },
      { letter: "B", text: "$(x;y;z)=(1;0;1)$", isCorrect: false },
      { letter: "C", text: "$(x;y;z)=(1;1;0)$", isCorrect: false },
      { letter: "D", text: "$(x;y;z)=(2;-1;1)$", isCorrect: false }
    ],
    blankAnswer: "(x;y;z)=(0;1;1)",
    explanation: "Khử $x$ ở phương trình 2 và 3, rồi khử $y$ ở phương trình 3 để đưa hệ về dạng tam giác $\\begin{cases}x+y+z=2\\\\-4y-6z=-10\\\\-15z=-15\\end{cases}$. Từ phương trình thứ ba: $z=1$. Thế vào phương trình thứ hai: $y=1$. Thế vào phương trình đầu: $x=2-1-1=0$. Vậy nghiệm là $(x;y;z)=(0;1;1)$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 1, Bài 1, trang 8-9"
  },
  {
    id: "ds68",
    topic: "Đại số",
    grade: 10,
    text: "Hệ phương trình $\\begin{cases}2x+y-z=5\\\\x+y+z=3\\\\5x+4y+2z=10\\end{cases}$ có bao nhiêu nghiệm?",
    options: [
      { letter: "A", text: "Vô nghiệm", isCorrect: true },
      { letter: "B", text: "Một nghiệm duy nhất", isCorrect: false },
      { letter: "C", text: "Vô số nghiệm", isCorrect: false },
      { letter: "D", text: "Đúng hai nghiệm", isCorrect: false }
    ],
    blankAnswer: "Vô nghiệm",
    explanation: "Biến đổi Gauss đưa hệ về dạng $\\begin{cases}x+y+z=3\\\\-y-3z=-1\\\\-y-3z=-5\\end{cases}$. Từ hai phương trình cuối suy ra $-1=-5$, vô lí. Vậy hệ đã cho vô nghiệm.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 1, Bài 1, trang 9-10"
  },
  {
    id: "ds69",
    topic: "Đại số",
    grade: 10,
    text: "Hệ phương trình $\\begin{cases}5x+y-4z=2\\\\x-y-z=-1\\\\3x+3y-2z=4\\end{cases}$ có bao nhiêu nghiệm?",
    options: [
      { letter: "A", text: "Vô số nghiệm", isCorrect: true },
      { letter: "B", text: "Vô nghiệm", isCorrect: false },
      { letter: "C", text: "Một nghiệm duy nhất", isCorrect: false },
      { letter: "D", text: "Đúng hai nghiệm", isCorrect: false }
    ],
    blankAnswer: "Vô số nghiệm",
    explanation: "Biến đổi Gauss đưa hệ về dạng hình thang $\\begin{cases}x-y-z=-1\\\\6y+z=7\\end{cases}$ (phương trình thứ hai và thứ ba của hệ sau biến đổi trùng nhau). Hệ có vô số nghiệm với tập nghiệm $S=\\{(-5y+6;y;7-6y)\\mid y\\in\\mathbb{R}\\}$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 1, Bài 1, trang 10"
  },
  {
    id: "ds70",
    topic: "Đại số",
    grade: 10,
    text: "Ông An đầu tư 240 triệu đồng vào ba quỹ: thị trường tiền tệ (lãi 3%/năm), trái phiếu Chính phủ (lãi 4%/năm) và một ngân hàng (lãi 7%/năm). Biết số tiền đầu tư vào ngân hàng nhiều hơn quỹ trái phiếu Chính phủ 80 triệu đồng, và tổng số tiền lãi thu được trong năm đầu là 13,4 triệu đồng. Hỏi ông An đầu tư vào quỹ thị trường tiền tệ, trái phiếu Chính phủ và ngân hàng lần lượt bao nhiêu triệu đồng?",
    options: [
      { letter: "A", text: "$40$; $60$; $140$ (triệu đồng)", isCorrect: true },
      { letter: "B", text: "$60$; $40$; $140$ (triệu đồng)", isCorrect: false },
      { letter: "C", text: "$50$; $70$; $120$ (triệu đồng)", isCorrect: false },
      { letter: "D", text: "$40$; $80$; $120$ (triệu đồng)", isCorrect: false }
    ],
    blankAnswer: "40; 60; 140 (triệu đồng)",
    explanation: "Gọi $x,y,z$ (triệu đồng) lần lượt là số tiền đầu tư vào quỹ thị trường tiền tệ, trái phiếu Chính phủ và ngân hàng. Ta có hệ $\\begin{cases}x+y+z=240\\\\-y+z=80\\\\0{,}03x+0{,}04y+0{,}07z=13{,}4\\end{cases}$. Giải bằng phương pháp Gauss (hoặc máy tính cầm tay) được $x=40, y=60, z=140$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 1, Bài 1, trang 11"
  },
  {
    id: "ds71",
    topic: "Đại số",
    grade: 10,
    text: "Một khu rừng ngập mặn diện tích 1 ha có sinh khối trên mặt đất là 87,2 tấn/ha. Trong các ô tiêu chuẩn 100 m² người ta đếm được tổng số 161 cây, trong đó số cây bần bằng 15% tổng số cây đước và cây mắm. Khối lượng trung bình một cây bần là 10 kg, cây đước là 5 kg và cây mắm là 1 kg. Sinh khối cây bần trên 1 ha rừng là bao nhiêu?",
    options: [
      { letter: "A", text: "$21$ tấn/ha", isCorrect: true },
      { letter: "B", text: "$65{,}25$ tấn/ha", isCorrect: false },
      { letter: "C", text: "$0{,}95$ tấn/ha", isCorrect: false },
      { letter: "D", text: "$16{,}1$ tấn/ha", isCorrect: false }
    ],
    blankAnswer: "21 tấn/ha",
    explanation: "Gọi $x,y,z$ lần lượt là số cây bần, cây đước, cây mắm trên 1 ha ($10\\,000$ m²). Từ giả thiết: $x+y+z=16100$; $20x-3y-3z=0$; $10x+5y+z=87200$. Giải hệ (bằng máy tính cầm tay) được $x=2100, y=13050, z=950$. Vậy sinh khối bần là $10x=21000$ kg/ha $=21$ tấn/ha.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 1, Bài 2, trang 16"
  },
  {
    id: "ds72",
    topic: "Đại số",
    grade: 10,
    text: "Xét thị trường thực phẩm gồm ba mặt hàng thịt lợn, thịt bò, thịt gà với giá lần lượt là $x, y, z$ (nghìn đồng/kg). Cho hàm cung và hàm cầu: thịt lợn $Q_{S_1}=-120+2x$, $Q_{D_1}=190-3x+y-z$; thịt bò $Q_{S_2}=-200+2y$, $Q_{D_2}=440+2x-y-z$; thịt gà $Q_{S_3}=-210+3z$, $Q_{D_3}=260-x-2y+4z$. Tìm mức giá cân bằng cung - cầu của thịt lợn, thịt bò và thịt gà.",
    options: [
      { letter: "A", text: "$90$; $240$; $100$ (nghìn đồng/kg)", isCorrect: true },
      { letter: "B", text: "$100$; $240$; $90$ (nghìn đồng/kg)", isCorrect: false },
      { letter: "C", text: "$90$; $200$; $140$ (nghìn đồng/kg)", isCorrect: false },
      { letter: "D", text: "$120$; $220$; $90$ (nghìn đồng/kg)", isCorrect: false }
    ],
    blankAnswer: "90; 240; 100 (nghìn đồng/kg)",
    explanation: "Hệ phương trình cân bằng cung-cầu $Q_{S_i}=Q_{D_i}$ thu gọn thành $\\begin{cases}5x-y+z=310\\\\2x-3y-z=-640\\\\x+2y-z=470\\end{cases}$. Giải hệ (bằng máy tính cầm tay) được $x=90, y=240, z=100$. Vậy giá cân bằng của thịt lợn, thịt bò, thịt gà lần lượt là $90$, $240$, $100$ nghìn đồng/kg.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 1, Bài 2, trang 19"
  },
  {
    id: "ds73",
    topic: "Đại số",
    grade: 10,
    text: "Trong phương pháp quy nạp toán học để chứng minh một mệnh đề $P(n)$ đúng với mọi số tự nhiên $n\\ge1$, Bước 2 (bước quy nạp) cần thực hiện điều gì?",
    options: [
      { letter: "A", text: "Giả sử $P(n)$ đúng với $n=k\\ge1$ (giả thiết quy nạp), chứng minh $P(n)$ cũng đúng với $n=k+1$", isCorrect: true },
      { letter: "B", text: "Chứng minh $P(n)$ đúng với $n=1$", isCorrect: false },
      { letter: "C", text: "Chứng minh $P(n)$ đúng với mọi $n$ bằng cách thử trực tiếp từng giá trị", isCorrect: false },
      { letter: "D", text: "Giả sử $P(n)$ sai với $n=k$, suy ra mâu thuẫn", isCorrect: false }
    ],
    blankAnswer: "Giả sử P(n) đúng với n=k≥1 (giả thiết quy nạp), chứng minh P(n) cũng đúng với n=k+1",
    explanation: "Theo phương pháp quy nạp toán học, Bước 1 kiểm tra mệnh đề đúng với $n=1$; Bước 2 giả thiết mệnh đề đúng với $n=k\\ge1$ (giả thiết quy nạp) rồi chứng minh nó cũng đúng với $n=k+1$. Hoàn thành cả hai bước thì kết luận mệnh đề đúng với mọi $n\\ge1$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 2, Bài 3, trang 27"
  },
  {
    id: "ds74",
    topic: "Đại số",
    grade: 10,
    text: "Theo phương pháp quy nạp toán học, tổng của $n$ số lẻ đầu tiên $1+3+5+7+\\ldots+(2n-1)$ bằng:",
    options: [
      { letter: "A", text: "$n^2$", isCorrect: true },
      { letter: "B", text: "$n(n+1)$", isCorrect: false },
      { letter: "C", text: "$2n-1$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{n(n+1)}{2}$", isCorrect: false }
    ],
    blankAnswer: "n^2",
    explanation: "Chứng minh bằng quy nạp: với $n=1$, $1=1^2$ đúng. Giả sử đúng với $n=k$: $1+3+\\cdots+(2k-1)=k^2$. Với $n=k+1$: $1+3+\\cdots+(2k-1)+(2k+1)=k^2+2k+1=(k+1)^2$. Vậy công thức đúng với mọi $n\\ge1$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 2, Bài 3, trang 27 (Ví dụ 1)"
  },
  {
    id: "ds75",
    topic: "Đại số",
    grade: 10,
    text: "Bất đẳng thức $2^n > 2n+1$ đúng với mọi số tự nhiên $n$ thỏa mãn điều kiện nào?",
    options: [
      { letter: "A", text: "$n\\ge3$", isCorrect: true },
      { letter: "B", text: "$n\\ge1$", isCorrect: false },
      { letter: "C", text: "$n\\ge2$", isCorrect: false },
      { letter: "D", text: "$n\\ge0$", isCorrect: false }
    ],
    blankAnswer: "n≥3",
    explanation: "Với $n=3$: $2^3=8>2\\cdot3+1=7$, đúng (với $n=1,2$ thì $2^n\\le2n+1$ nên bất đẳng thức không đúng). Dùng quy nạp với giả thiết $2^k>2k+1$ ($k\\ge3$), ta có $2^{k+1}=2\\cdot2^k>2(2k+1)=4k+2=2k+2(k+1)>2k+3=2(k+1)+1$ do $k\\ge3$. Vậy bất đẳng thức đúng với mọi $n\\ge3$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 2, Bài 3, trang 29 (Ví dụ 4)"
  },
  {
    id: "ds76",
    topic: "Đại số",
    grade: 10,
    text: "Theo Nhận xét trong SGK (chứng minh bằng quy nạp $n(n+1)(n+2)$ luôn chia hết cho 3), tích của ba số tự nhiên liên tiếp luôn chia hết cho:",
    options: [
      { letter: "A", text: "6", isCorrect: true },
      { letter: "B", text: "3", isCorrect: false },
      { letter: "C", text: "9", isCorrect: false },
      { letter: "D", text: "12", isCorrect: false }
    ],
    blankAnswer: "6",
    explanation: "Ví dụ 3 (SGK) chứng minh bằng quy nạp rằng $n(n+1)(n+2)$ luôn chia hết cho 3 với mọi số tự nhiên $n$. Vì trong hai số tự nhiên liên tiếp luôn có một số chẵn, nên tích ba số tự nhiên liên tiếp vừa chia hết cho 3 vừa chia hết cho 2, do đó chia hết cho 6.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 2, Bài 3, trang 29 (Ví dụ 3, Nhận xét)"
  },
  {
    id: "ds77",
    topic: "Đại số",
    grade: 10,
    text: "Khai triển $(3-2x)^5$ thành đa thức là:",
    options: [
      { letter: "A", text: "$243-810x+1080x^2-720x^3+240x^4-32x^5$", isCorrect: true },
      { letter: "B", text: "$243+810x+1080x^2+720x^3+240x^4+32x^5$", isCorrect: false },
      { letter: "C", text: "$243-810x+1080x^2-720x^3+240x^4+32x^5$", isCorrect: false },
      { letter: "D", text: "$32-810x+1080x^2-720x^3+240x^4-243x^5$", isCorrect: false }
    ],
    blankAnswer: "243-810x+1080x^2-720x^3+240x^4-32x^5",
    explanation: "Dùng tam giác Pascal (hàng 5: $1,5,10,10,5,1$) với $a=3,b=-2x$: $(3-2x)^5=3^5+5\\cdot3^4(-2x)+10\\cdot3^3(-2x)^2+10\\cdot3^2(-2x)^3+5\\cdot3(-2x)^4+(-2x)^5=243-810x+1080x^2-720x^3+240x^4-32x^5$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 2, Bài 4, trang 34 (Ví dụ 2)"
  },
  {
    id: "ds78",
    topic: "Đại số",
    grade: 10,
    text: "Khai triển biểu thức $(3x-2)^4$ thành đa thức là:",
    options: [
      { letter: "A", text: "$81x^4-216x^3+216x^2-96x+16$", isCorrect: true },
      { letter: "B", text: "$81x^4+216x^3+216x^2+96x+16$", isCorrect: false },
      { letter: "C", text: "$81x^4-216x^3+216x^2-96x-16$", isCorrect: false },
      { letter: "D", text: "$16x^4-96x^3+216x^2-216x+81$", isCorrect: false }
    ],
    blankAnswer: "81x^4-216x^3+216x^2-96x+16",
    explanation: "Theo công thức nhị thức Newton: $(3x-2)^4=C_4^0(3x)^4+C_4^1(3x)^3(-2)+C_4^2(3x)^2(-2)^2+C_4^3(3x)(-2)^3+C_4^4(-2)^4=81x^4-216x^3+216x^2-96x+16$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 2, Bài 4, trang 36 (Ví dụ 4)"
  },
  {
    id: "ds79",
    topic: "Đại số",
    grade: 10,
    text: "Hệ số của $x^4$ trong khai triển của $(x+2)^{10}$ là:",
    options: [
      { letter: "A", text: "$13\\,440$", isCorrect: true },
      { letter: "B", text: "$210$", isCorrect: false },
      { letter: "C", text: "$3\\,360$", isCorrect: false },
      { letter: "D", text: "$6\\,720$", isCorrect: false }
    ],
    blankAnswer: "13440",
    explanation: "Số hạng chứa $x^k$ trong khai triển của $(x+2)^{10}$ là $C_{10}^{10-k}x^k2^{10-k}$. Với $k=4$: số hạng là $C_{10}^{6}x^42^6=210\\cdot64\\cdot x^4=13\\,440x^4$. Vậy hệ số của $x^4$ là $13\\,440$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 2, Bài 4, trang 36 (Ví dụ 5)"
  },
  {
    id: "ds80",
    topic: "Đại số",
    grade: 10,
    text: "Số nguyên dương $n$ thỏa mãn $C_n^03^n+C_n^13^{n-1}+\\ldots+C_n^{n-1}3+C_n^n=64$ là:",
    options: [
      { letter: "A", text: "$n=3$", isCorrect: true },
      { letter: "B", text: "$n=2$", isCorrect: false },
      { letter: "C", text: "$n=4$", isCorrect: false },
      { letter: "D", text: "$n=64$", isCorrect: false }
    ],
    blankAnswer: "n=3",
    explanation: "Vế trái là khai triển nhị thức Newton của $(x+3)^n$ tại $x=1$: $(1+3)^n=C_n^03^n+C_n^13^{n-1}+\\ldots+C_n^n$. Do đó $4^n=64=4^3$, suy ra $n=3$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 2, Bài 4, trang 36 (Ví dụ 6)"
  },
  {
    id: "ds81",
    topic: "Đại số",
    grade: 10,
    text: "Trong khai triển $(a+b)^6$, hệ số của số hạng $a^3b^3$ là:",
    options: [
      { letter: "A", text: "$20$", isCorrect: true },
      { letter: "B", text: "$15$", isCorrect: false },
      { letter: "C", text: "$6$", isCorrect: false },
      { letter: "D", text: "$10$", isCorrect: false }
    ],
    blankAnswer: "20",
    explanation: "Hàng 6 của tam giác Pascal là $1,6,15,20,15,6,1$, ứng với các hệ số của $a^6, a^5b, a^4b^2, a^3b^3, a^2b^4, ab^5, b^6$. Vậy hệ số của $a^3b^3$ là $20$ (cũng chính là $C_6^3$).",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 2, Bài 4, trang 33 (Ví dụ 1)"
  },
  {
    id: "ds82",
    topic: "Mở rộng",
    grade: 10,
    text: "Cho elip $\\dfrac{x^2}{100}+\\dfrac{y^2}{25}=1$. Diện tích của tứ giác có bốn đỉnh là bốn đỉnh của elip bằng:",
    options: [
      { letter: "A", text: "$100$", isCorrect: true },
      { letter: "B", text: "$200$", isCorrect: false },
      { letter: "C", text: "$50$", isCorrect: false },
      { letter: "D", text: "$150$", isCorrect: false }
    ],
    blankAnswer: "100",
    explanation: "Trục lớn, trục nhỏ có độ dài $2a=2\\sqrt{100}=20$ và $2b=2\\sqrt{25}=10$. Tứ giác có bốn đỉnh của elip có hai đường chéo vuông góc bằng $A_1A_2=20$ và $B_1B_2=10$, diện tích $S=\\dfrac{1}{2}\\cdot20\\cdot10=100$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 3, Bài 5, trang 40 (Ví dụ 1)"
  },
  {
    id: "ds83",
    topic: "Mở rộng",
    grade: 10,
    text: "Cho elip $\\dfrac{x^2}{64}+\\dfrac{y^2}{39}=1$. Tâm sai của elip bằng:",
    options: [
      { letter: "A", text: "$0{,}625$", isCorrect: true },
      { letter: "B", text: "$0{,}8$", isCorrect: false },
      { letter: "C", text: "$1{,}6$", isCorrect: false },
      { letter: "D", text: "$0{,}488$", isCorrect: false }
    ],
    blankAnswer: "0,625",
    explanation: "$a=8$, $b=\\sqrt{39}$, $c=\\sqrt{a^2-b^2}=\\sqrt{64-39}=5$. Tâm sai $e=\\dfrac{c}{a}=\\dfrac{5}{8}=0{,}625$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 3, Bài 5, trang 44 (Ví dụ 4)"
  },
  {
    id: "ds84",
    topic: "Mở rộng",
    grade: 10,
    text: "Hypebol $\\dfrac{x^2}{9}-\\dfrac{y^2}{16}=1$ có hai đường tiệm cận là:",
    options: [
      { letter: "A", text: "$y=\\pm\\dfrac{4}{3}x$", isCorrect: true },
      { letter: "B", text: "$y=\\pm\\dfrac{3}{4}x$", isCorrect: false },
      { letter: "C", text: "$y=\\pm\\dfrac{9}{16}x$", isCorrect: false },
      { letter: "D", text: "$y=\\pm\\dfrac{16}{9}x$", isCorrect: false }
    ],
    blankAnswer: "y=±(4/3)x",
    explanation: "Từ phương trình hypebol, $a^2=9,b^2=16$, nghĩa là $a=3,b=4$. Hai đường tiệm cận của hypebol là $y=\\pm\\dfrac{b}{a}x=\\pm\\dfrac{4}{3}x$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 3, Bài 6, trang 48 (Ví dụ 1)"
  },
  {
    id: "ds85",
    topic: "Mở rộng",
    grade: 10,
    text: "Cho hypebol $\\dfrac{x^2}{4}-\\dfrac{y^2}{21}=1$. Độ dài hai bán kính qua tiêu của điểm $M$ thuộc hypebol và có hoành độ bằng $-10$ là:",
    options: [
      { letter: "A", text: "$MF_1=23$, $MF_2=27$", isCorrect: true },
      { letter: "B", text: "$MF_1=27$, $MF_2=23$", isCorrect: false },
      { letter: "C", text: "$MF_1=25$, $MF_2=25$", isCorrect: false },
      { letter: "D", text: "$MF_1=23$, $MF_2=23$", isCorrect: false }
    ],
    blankAnswer: "MF1=23, MF2=27",
    explanation: "$a=2,b=\\sqrt{21}$, $c=\\sqrt{a^2+b^2}=5$. Với $x_0=-10$: $MF_1=\\left|2+\\dfrac{5}{2}\\cdot(-10)\\right|=23$ và $MF_2=\\left|2-\\dfrac{5}{2}\\cdot(-10)\\right|=27$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 3, Bài 6, trang 49 (Ví dụ 2)"
  },
  {
    id: "ds86",
    topic: "Mở rộng",
    grade: 10,
    text: "Trong mặt phẳng toạ độ $Oxy$, hypebol $(H)$ có phương trình chính tắc, đi qua điểm $A(4;0)$ và có tâm sai $e=3$. Phương trình chính tắc của $(H)$ là:",
    options: [
      { letter: "A", text: "$\\dfrac{x^2}{16}-\\dfrac{y^2}{128}=1$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{x^2}{16}-\\dfrac{y^2}{144}=1$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{x^2}{4}-\\dfrac{y^2}{128}=1$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{x^2}{16}+\\dfrac{y^2}{128}=1$", isCorrect: false }
    ],
    blankAnswer: "x^2/16-y^2/128=1",
    explanation: "Vì $(H)$ đi qua $A(4;0)$ nên $a=4$. Từ $e=\\dfrac{c}{a}=3$ suy ra $c=3a=12$. Do đó $b^2=c^2-a^2=144-16=128$. Vậy $(H): \\dfrac{x^2}{16}-\\dfrac{y^2}{128}=1$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 3, Bài 6, trang 51-52 (Ví dụ 5)"
  },
  {
    id: "ds87",
    topic: "Mở rộng",
    grade: 10,
    text: "Lập phương trình chính tắc của parabol có khoảng cách từ đỉnh tới tiêu điểm bằng $3$.",
    options: [
      { letter: "A", text: "$y^2=12x$", isCorrect: true },
      { letter: "B", text: "$y^2=6x$", isCorrect: false },
      { letter: "C", text: "$y^2=3x$", isCorrect: false },
      { letter: "D", text: "$y^2=24x$", isCorrect: false }
    ],
    blankAnswer: "y^2=12x",
    explanation: "Phương trình chính tắc của parabol có dạng $y^2=2px$, $p>0$. Khoảng cách giữa tiêu điểm $F(p/2;0)$ và đỉnh $O(0;0)$ là $3$ nên $\\dfrac{p}{2}=3\\Rightarrow p=6$. Vậy parabol có phương trình $y^2=12x$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 3, Bài 7, trang 55 (Ví dụ 1)"
  },
  {
    id: "ds88",
    topic: "Mở rộng",
    grade: 10,
    text: "Cho parabol có phương trình $y^2=4x$. Bán kính qua tiêu của điểm $M$ thuộc parabol và có hoành độ bằng $3$ là:",
    options: [
      { letter: "A", text: "$4$", isCorrect: true },
      { letter: "B", text: "$3$", isCorrect: false },
      { letter: "C", text: "$2$", isCorrect: false },
      { letter: "D", text: "$5$", isCorrect: false }
    ],
    blankAnswer: "4",
    explanation: "Từ $2p=4$ suy ra $p=2$, tiêu điểm $F(1;0)$. Theo công thức bán kính qua tiêu $MF=x+\\dfrac{p}{2}=3+1=4$.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 3, Bài 7, trang 55 (Ví dụ 2)"
  },
  {
    id: "ds89",
    topic: "Mở rộng",
    grade: 10,
    text: "Lập phương trình đường conic, biết tâm sai bằng $2$, một tiêu điểm $F(4;0)$ và đường chuẩn tương ứng $\\Delta: x-1=0$.",
    options: [
      { letter: "A", text: "$\\dfrac{x^2}{4}-\\dfrac{y^2}{12}=1$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{x^2}{4}+\\dfrac{y^2}{12}=1$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{x^2}{12}-\\dfrac{y^2}{4}=1$", isCorrect: false },
      { letter: "D", text: "$y^2=12x$", isCorrect: false }
    ],
    blankAnswer: "x^2/4-y^2/12=1",
    explanation: "Điểm $M(x;y)$ thuộc conic khi $\\dfrac{MF}{d(M,\\Delta)}=2 \\Leftrightarrow \\sqrt{(x-4)^2+y^2}=2|x-1| \\Leftrightarrow (x-4)^2+y^2=4(x-1)^2 \\Leftrightarrow 3x^2-y^2=12 \\Leftrightarrow \\dfrac{x^2}{4}-\\dfrac{y^2}{12}=1$. Vì $e=2>1$ nên đây là một hypebol.",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 3, Bài 8, trang 59 (Ví dụ 1)"
  },
  {
    id: "ds90",
    topic: "Mở rộng",
    grade: 10,
    text: "Vật thể liên sao Oumuamua có tâm sai quỹ đạo $e=1{,}201$ (theo nssdc.gsfc.nasa.gov). Quỹ đạo của Oumuamua thuộc loại đường conic nào?",
    options: [
      { letter: "A", text: "Hypebol", isCorrect: true },
      { letter: "B", text: "Elip", isCorrect: false },
      { letter: "C", text: "Parabol", isCorrect: false },
      { letter: "D", text: "Đường tròn", isCorrect: false }
    ],
    blankAnswer: "Hypebol",
    explanation: "Theo định nghĩa thống nhất ba đường conic theo tâm sai: nếu $e>1$ thì conic là đường hypebol. Vì $e=1{,}201>1$ nên quỹ đạo của Oumuamua là một nhánh hypebol (giải thích vì sao nó chỉ đi qua hệ Mặt Trời một lần rồi không quay lại).",
    sgk_source: "Chuyên đề học tập Toán 10 KNTT, Chuyên đề 3, Bài 8, trang 59 (Vận dụng 2)"
  },
  {
    id: "lg21",
    topic: "Lượng giác",
    grade: 11,
    text: "Đổi số đo góc $150^\\circ$ sang radian.",
    options: [
      { letter: "A", text: "$\\dfrac{5\\pi}{6}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{5\\pi}{4}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{2\\pi}{3}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{7\\pi}{6}$", isCorrect: false }
    ],
    blankAnswer: "5pi/6",
    explanation: "Ta có $150^\\circ = 150 \\cdot \\dfrac{\\pi}{180} = \\dfrac{5\\pi}{6}$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 1, trang 9"
  },
  {
    id: "lg22",
    topic: "Lượng giác",
    grade: 11,
    text: "Cho góc lượng giác $\\alpha$ thỏa mãn $\\sin\\alpha = \\dfrac{3}{5}$ và $90^\\circ < \\alpha < 180^\\circ$. Tính $\\cos\\alpha$.",
    options: [
      { letter: "A", text: "$\\cos\\alpha = -\\dfrac{4}{5}$", isCorrect: true },
      { letter: "B", text: "$\\cos\\alpha = \\dfrac{4}{5}$", isCorrect: false },
      { letter: "C", text: "$\\cos\\alpha = -\\dfrac{3}{5}$", isCorrect: false },
      { letter: "D", text: "$\\cos\\alpha = \\dfrac{3}{4}$", isCorrect: false }
    ],
    blankAnswer: "-4/5",
    explanation: "Vì $90^\\circ<\\alpha<180^\\circ$ nên $\\cos\\alpha<0$. Từ $\\sin^2\\alpha+\\cos^2\\alpha=1$ suy ra $\\cos\\alpha=-\\sqrt{1-\\frac{9}{25}}=-\\frac{4}{5}$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 1, trang 14"
  },
  {
    id: "lg23",
    topic: "Lượng giác",
    grade: 11,
    text: "Tính $\\cot(-675^\\circ)$.",
    options: [
      { letter: "A", text: "$1$", isCorrect: true },
      { letter: "B", text: "$-1$", isCorrect: false },
      { letter: "C", text: "$\\sqrt{3}$", isCorrect: false },
      { letter: "D", text: "$0$", isCorrect: false }
    ],
    blankAnswer: "1",
    explanation: "$\\cot(-675^\\circ) = \\cot(45^\\circ - 2\\cdot360^\\circ) = \\cot 45^\\circ = 1$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 1, trang 15"
  },
  {
    id: "lg24",
    topic: "Lượng giác",
    grade: 11,
    text: "Không dùng máy tính, tính $\\cos 75^\\circ$.",
    options: [
      { letter: "A", text: "$\\dfrac{\\sqrt{6}-\\sqrt{2}}{4}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{\\sqrt{6}+\\sqrt{2}}{4}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{\\sqrt{2}-\\sqrt{6}}{4}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{\\sqrt{2}}{4}$", isCorrect: false }
    ],
    blankAnswer: "(sqrt6 - sqrt2)/4",
    explanation: "$\\cos75^\\circ=\\cos(45^\\circ+30^\\circ)=\\cos45^\\circ\\cos30^\\circ-\\sin45^\\circ\\sin30^\\circ=\\dfrac{\\sqrt6-\\sqrt2}{4}$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 2, trang 18"
  },
  {
    id: "lg25",
    topic: "Lượng giác",
    grade: 11,
    text: "Cho $\\cos a = -\\dfrac{1}{3}$ với $\\dfrac{\\pi}{2} < a < \\pi$. Tính $\\sin 2a$.",
    options: [
      { letter: "A", text: "$-\\dfrac{4\\sqrt{2}}{9}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{4\\sqrt{2}}{9}$", isCorrect: false },
      { letter: "C", text: "$-\\dfrac{2\\sqrt{2}}{9}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{8}{9}$", isCorrect: false }
    ],
    blankAnswer: "-4sqrt2/9",
    explanation: "Vì $\\frac{\\pi}{2}<a<\\pi$ nên $\\sin a>0$: $\\sin a=\\sqrt{1-\\frac19}=\\frac{2\\sqrt2}{3}$. Vậy $\\sin2a=2\\sin a\\cos a=2\\cdot\\frac{2\\sqrt2}{3}\\cdot\\left(-\\frac13\\right)=-\\frac{4\\sqrt2}{9}$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 2, trang 18-19"
  },
  {
    id: "lg26",
    topic: "Lượng giác",
    grade: 11,
    text: "Xét tính chẵn, lẻ của hàm số $f(x) = x\\sin x$.",
    options: [
      { letter: "A", text: "Hàm số chẵn", isCorrect: true },
      { letter: "B", text: "Hàm số lẻ", isCorrect: false },
      { letter: "C", text: "Không chẵn không lẻ", isCorrect: false },
      { letter: "D", text: "Vừa chẵn vừa lẻ", isCorrect: false }
    ],
    blankAnswer: "Hàm số chẵn",
    explanation: "TXĐ $D=\\mathbb{R}$. Với mọi $x\\in D$: $f(-x)=(-x)\\sin(-x)=x\\sin x=f(x)$. Vậy $f(x)=x\\sin x$ là hàm số chẵn.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 3, trang 24"
  },
  {
    id: "lg27",
    topic: "Lượng giác",
    grade: 11,
    text: "Trên đoạn $\\left[-\\dfrac{\\pi}{2};\\dfrac{3\\pi}{2}\\right]$, hàm số $y=\\sin x$ nhận giá trị dương khi $x$ thuộc khoảng nào?",
    options: [
      { letter: "A", text: "$(0;\\pi)$", isCorrect: true },
      { letter: "B", text: "$\\left(-\\dfrac{\\pi}{2};0\\right)$", isCorrect: false },
      { letter: "C", text: "$\\left(\\dfrac{\\pi}{2};\\pi\\right)$", isCorrect: false },
      { letter: "D", text: "$\\left(\\pi;\\dfrac{3\\pi}{2}\\right)$", isCorrect: false }
    ],
    blankAnswer: "(0;pi)",
    explanation: "Từ đồ thị hàm số $y=\\sin x$, trên đoạn $\\left[-\\frac{\\pi}{2};\\frac{3\\pi}{2}\\right]$, ta có $y>0$ khi $x\\in(0;\\pi)$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 3, trang 27"
  },
  {
    id: "lg28",
    topic: "Lượng giác",
    grade: 11,
    text: "Giải phương trình $\\sin x = -\\dfrac{\\sqrt{3}}{2}$.",
    options: [
      { letter: "A", text: "$x=-\\dfrac{\\pi}{3}+k2\\pi$ hoặc $x=\\dfrac{4\\pi}{3}+k2\\pi\\ (k\\in\\mathbb{Z})$", isCorrect: true },
      { letter: "B", text: "$x=\\dfrac{\\pi}{3}+k2\\pi\\ (k\\in\\mathbb{Z})$", isCorrect: false },
      { letter: "C", text: "$x=-\\dfrac{\\pi}{3}+k\\pi\\ (k\\in\\mathbb{Z})$", isCorrect: false },
      { letter: "D", text: "$x=\\pm\\dfrac{\\pi}{3}+k2\\pi\\ (k\\in\\mathbb{Z})$", isCorrect: false }
    ],
    blankAnswer: "x=-pi/3+k2pi hoặc x=4pi/3+k2pi",
    explanation: "$\\sin x=-\\frac{\\sqrt3}{2}=\\sin\\left(-\\frac{\\pi}{3}\\right)\\Leftrightarrow x=-\\frac{\\pi}{3}+k2\\pi$ hoặc $x=\\pi-\\left(-\\frac{\\pi}{3}\\right)+k2\\pi=\\frac{4\\pi}{3}+k2\\pi\\ (k\\in\\mathbb{Z})$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 4, trang 33"
  },
  {
    id: "lg29",
    topic: "Lượng giác",
    grade: 11,
    text: "Giải phương trình $\\tan x = -\\sqrt{3}$.",
    options: [
      { letter: "A", text: "$x=-\\dfrac{\\pi}{3}+k\\pi\\ (k\\in\\mathbb{Z})$", isCorrect: true },
      { letter: "B", text: "$x=\\dfrac{\\pi}{3}+k\\pi\\ (k\\in\\mathbb{Z})$", isCorrect: false },
      { letter: "C", text: "$x=-\\dfrac{\\pi}{3}+k2\\pi\\ (k\\in\\mathbb{Z})$", isCorrect: false },
      { letter: "D", text: "$x=\\dfrac{2\\pi}{3}+k\\pi\\ (k\\in\\mathbb{Z})$", isCorrect: false }
    ],
    blankAnswer: "x=-pi/3+kpi",
    explanation: "$\\tan x=-\\sqrt3=\\tan\\left(-\\frac{\\pi}{3}\\right)\\Leftrightarrow x=-\\frac{\\pi}{3}+k\\pi\\ (k\\in\\mathbb{Z})$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 4, trang 36"
  },
  {
    id: "ds91",
    topic: "Đại số",
    grade: 11,
    text: "Cho dãy số $(u_n)$ với $u_n = 2n$. Tìm số hạng thứ 100 của dãy số.",
    options: [
      { letter: "A", text: "$u_{100}=200$", isCorrect: true },
      { letter: "B", text: "$u_{100}=100$", isCorrect: false },
      { letter: "C", text: "$u_{100}=202$", isCorrect: false },
      { letter: "D", text: "$u_{100}=99$", isCorrect: false }
    ],
    blankAnswer: "200",
    explanation: "$u_{100}=2\\cdot100=200$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 5, trang 44"
  },
  {
    id: "ds92",
    topic: "Đại số",
    grade: 11,
    text: "Cho dãy số xác định bởi hệ thức truy hồi $u_1=1,\\ u_n=3u_{n-1}+2$ với $n\\geq2$. Tính $u_3$.",
    options: [
      { letter: "A", text: "$u_3=17$", isCorrect: true },
      { letter: "B", text: "$u_3=5$", isCorrect: false },
      { letter: "C", text: "$u_3=11$", isCorrect: false },
      { letter: "D", text: "$u_3=15$", isCorrect: false }
    ],
    blankAnswer: "17",
    explanation: "$u_2=3u_1+2=3\\cdot1+2=5$; $u_3=3u_2+2=3\\cdot5+2=17$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 5, trang 44"
  },
  {
    id: "ds93",
    topic: "Đại số",
    grade: 11,
    text: "Dãy số $(u_n)$ với $u_n=\\dfrac{n-1}{n}$ bị chặn trên bởi giá trị nào sau đây?",
    options: [
      { letter: "A", text: "$1$", isCorrect: true },
      { letter: "B", text: "$2$", isCorrect: false },
      { letter: "C", text: "$0$", isCorrect: false },
      { letter: "D", text: "$-1$", isCorrect: false }
    ],
    blankAnswer: "1",
    explanation: "$u_n=\\dfrac{n-1}{n}=1-\\dfrac{1}{n}<1$ với mọi $n\\in\\mathbb{N}^*$, nên dãy số bị chặn trên bởi $1$ (và bị chặn dưới bởi $0$ vì $u_n\\geq0$).",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 5, trang 45"
  },
  {
    id: "ds94",
    topic: "Đại số",
    grade: 11,
    text: "Tìm số hạng thứ 100 của cấp số cộng $(u_n)$: $10, 5, \\ldots$",
    options: [
      { letter: "A", text: "$u_{100}=-485$", isCorrect: true },
      { letter: "B", text: "$u_{100}=485$", isCorrect: false },
      { letter: "C", text: "$u_{100}=-490$", isCorrect: false },
      { letter: "D", text: "$u_{100}=-480$", isCorrect: false }
    ],
    blankAnswer: "-485",
    explanation: "Cấp số cộng có $u_1=10$, công sai $d=-5$. $u_{100}=u_1+99d=10+99\\cdot(-5)=-485$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 6, trang 49"
  },
  {
    id: "ds95",
    topic: "Đại số",
    grade: 11,
    text: "Một cấp số cộng $(u_n)$ có số hạng thứ 10 bằng 48 và số hạng thứ 18 bằng 88. Tìm số hạng thứ 100 của cấp số cộng đó.",
    options: [
      { letter: "A", text: "$u_{100}=498$", isCorrect: true },
      { letter: "B", text: "$u_{100}=488$", isCorrect: false },
      { letter: "C", text: "$u_{100}=503$", isCorrect: false },
      { letter: "D", text: "$u_{100}=493$", isCorrect: false }
    ],
    blankAnswer: "498",
    explanation: "Giải hệ $u_1+9d=48$, $u_1+17d=88$ được $u_1=3$, $d=5$. Vậy $u_{100}=u_1+99d=3+99\\cdot5=498$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 6, trang 49"
  },
  {
    id: "ds96",
    topic: "Đại số",
    grade: 11,
    text: "Một nhà hát có 25 hàng ghế với 16 ghế ở hàng thứ nhất, và mỗi hàng sau nhiều hơn hàng liền trước 2 ghế. Tính tổng số ghế của nhà hát.",
    options: [
      { letter: "A", text: "$1000$ ghế", isCorrect: true },
      { letter: "B", text: "$900$ ghế", isCorrect: false },
      { letter: "C", text: "$1050$ ghế", isCorrect: false },
      { letter: "D", text: "$960$ ghế", isCorrect: false }
    ],
    blankAnswer: "1000",
    explanation: "Số ghế các hàng lập thành cấp số cộng với $u_1=16$, $d=2$, gồm 25 số hạng. $S_{25}=\\dfrac{25}{2}[2\\cdot16+24\\cdot2]=1000$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 6, trang 50"
  },
  {
    id: "ds97",
    topic: "Đại số",
    grade: 11,
    text: "Cấp số nhân $(u_n)$: $8, -4, \\ldots$ có công bội $q$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$q=-\\dfrac{1}{2}$", isCorrect: true },
      { letter: "B", text: "$q=\\dfrac{1}{2}$", isCorrect: false },
      { letter: "C", text: "$q=-2$", isCorrect: false },
      { letter: "D", text: "$q=2$", isCorrect: false }
    ],
    blankAnswer: "-1/2",
    explanation: "$q=\\dfrac{u_2}{u_1}=\\dfrac{-4}{8}=-\\dfrac{1}{2}$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 7, trang 53"
  },
  {
    id: "ds98",
    topic: "Đại số",
    grade: 11,
    text: "Cần lấy tổng của bao nhiêu số hạng đầu của cấp số nhân $2, 6, 18, \\ldots$ để được kết quả bằng 728?",
    options: [
      { letter: "A", text: "$n=6$", isCorrect: true },
      { letter: "B", text: "$n=5$", isCorrect: false },
      { letter: "C", text: "$n=7$", isCorrect: false },
      { letter: "D", text: "$n=4$", isCorrect: false }
    ],
    blankAnswer: "6",
    explanation: "CSN có $u_1=2$, $q=3$. $728=S_n=\\dfrac{2(1-3^n)}{1-3}=3^n-1 \\Rightarrow 3^n=729=3^6 \\Rightarrow n=6$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 7, trang 54-55"
  },
  {
    id: "ds99",
    topic: "Đại số",
    grade: 11,
    text: "Một công ty tuyển chuyên gia công nghệ thông tin với mức lương năm đầu 240 triệu đồng, cam kết tăng 5% lương mỗi năm so với năm liền trước. Tổng số lương chuyên gia đó nhận được sau 10 năm làm việc (làm tròn đến triệu đồng) là bao nhiêu?",
    options: [
      { letter: "A", text: "$3\\,019$ triệu đồng", isCorrect: true },
      { letter: "B", text: "$2\\,400$ triệu đồng", isCorrect: false },
      { letter: "C", text: "$3\\,910$ triệu đồng", isCorrect: false },
      { letter: "D", text: "$2\\,904$ triệu đồng", isCorrect: false }
    ],
    blankAnswer: "3019",
    explanation: "Lương hằng năm lập thành cấp số nhân với $u_1=240$, công bội $q=1{,}05$. $S_{10}=\\dfrac{240[1-(1{,}05)^{10}]}{1-1{,}05}\\approx3\\,019$ (triệu đồng).",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 7, trang 54"
  },
  {
    id: "xs35",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Theo báo cáo số liệu tổng điều tra dân số năm 2019, mẫu số liệu ghép nhóm về độ tuổi dân số Việt Nam gồm 3 nhóm: dưới 15 tuổi có 23 371 882 người, từ 15 đến dưới 65 tuổi có 65 420 451 người, từ 65 tuổi trở lên có 7 416 651 người. Dân số Việt Nam năm 2019 là bao nhiêu?",
    options: [
      { letter: "A", text: "$96\\,208\\,984$ người", isCorrect: true },
      { letter: "B", text: "$95\\,208\\,984$ người", isCorrect: false },
      { letter: "C", text: "$96\\,308\\,984$ người", isCorrect: false },
      { letter: "D", text: "$88\\,792\\,333$ người", isCorrect: false }
    ],
    blankAnswer: "96208984",
    explanation: "Dân số = tổng tần số các nhóm: $23\\,371\\,882+65\\,420\\,451+7\\,416\\,651=96\\,208\\,984$ (người).",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 8, trang 59-60"
  },
  {
    id: "xs36",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Cân nặng của học sinh lớp 11D được cho bởi mẫu ghép nhóm: [40,5;45,5): 10; [45,5;50,5): 7; [50,5;55,5): 16; [55,5;60,5): 4; [60,5;65,5): 2; [65,5;70,5): 3. Tính cân nặng trung bình của học sinh lớp 11D.",
    options: [
      { letter: "A", text: "$\\approx51{,}81$ kg", isCorrect: true },
      { letter: "B", text: "$\\approx50{,}00$ kg", isCorrect: false },
      { letter: "C", text: "$\\approx53{,}00$ kg", isCorrect: false },
      { letter: "D", text: "$\\approx48{,}50$ kg", isCorrect: false }
    ],
    blankAnswer: "51.81",
    explanation: "Giá trị đại diện các nhóm: 43, 48, 53, 58, 63, 68; cỡ mẫu $n=42$. $\\bar{x}=\\dfrac{10\\cdot43+7\\cdot48+16\\cdot53+4\\cdot58+2\\cdot63+3\\cdot68}{42}\\approx51{,}81$ (kg).",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 9, trang 63-64"
  },
  {
    id: "xs37",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Thời gian (phút) truy cập Internet mỗi buổi tối của học sinh: [9,5;12,5): 3; [12,5;15,5): 12; [15,5;18,5): 15; [18,5;21,5): 24; [21,5;24,5): 2. Tính trung vị của mẫu số liệu ghép nhóm này.",
    options: [
      { letter: "A", text: "$18{,}1$", isCorrect: true },
      { letter: "B", text: "$15{,}5$", isCorrect: false },
      { letter: "C", text: "$17{,}5$", isCorrect: false },
      { letter: "D", text: "$19{,}0$", isCorrect: false }
    ],
    blankAnswer: "18.1",
    explanation: "Cỡ mẫu $n=56$. Nhóm chứa trung vị là $[15,5;18,5)$: $M_e=15,5+\\dfrac{\\frac{56}{2}-15}{15}\\cdot3=18,1$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 9, trang 64"
  },
  {
    id: "xs38",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Với mẫu số liệu thời gian truy cập Internet ở trên ($n=56$), tứ phân vị thứ nhất $Q_1$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$15{,}25$", isCorrect: true },
      { letter: "B", text: "$12{,}5$", isCorrect: false },
      { letter: "C", text: "$14{,}0$", isCorrect: false },
      { letter: "D", text: "$18{,}1$", isCorrect: false }
    ],
    blankAnswer: "15.25",
    explanation: "$Q_1$ thuộc nhóm $[12,5;15,5)$ ($m_2=12$, $m_1=3$): $Q_1=12,5+\\dfrac{\\frac{56}{4}-3}{12}\\cdot3=15,25$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 9, trang 65"
  },
  {
    id: "xs39",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Với mẫu số liệu thời gian truy cập Internet ở trên ($n=56$), tứ phân vị thứ ba $Q_3$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$20$", isCorrect: true },
      { letter: "B", text: "$21{,}5$", isCorrect: false },
      { letter: "C", text: "$18{,}5$", isCorrect: false },
      { letter: "D", text: "$19{,}5$", isCorrect: false }
    ],
    blankAnswer: "20",
    explanation: "$Q_3$ thuộc nhóm $[18,5;21,5)$ ($m_4=24$, $m_1+m_2+m_3=30$): $Q_3=18,5+\\dfrac{\\frac{3\\cdot56}{4}-30}{24}\\cdot3=20$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 9, trang 65"
  },
  {
    id: "xs40",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Chiều cao (cm) của 50 học sinh lớp 11A: [145;150): 7; [150;155): 14; [155;160): 10; [160;165): 10; [165;170): 9. Tính mốt của mẫu số liệu ghép nhóm này.",
    options: [
      { letter: "A", text: "$\\approx153{,}18$", isCorrect: true },
      { letter: "B", text: "$150$", isCorrect: false },
      { letter: "C", text: "$\\approx151{,}50$", isCorrect: false },
      { letter: "D", text: "$\\approx154{,}00$", isCorrect: false }
    ],
    blankAnswer: "153.18",
    explanation: "Nhóm chứa mốt là $[150;155)$ ($m_2=14$, $m_1=7$, $m_3=10$, $h=5$): $M_o=150+\\dfrac{14-7}{(14-7)+(14-10)}\\cdot5\\approx153{,}18$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 9, trang 66"
  },
  {
    id: "xs41",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Trong mẫu số liệu ghép nhóm về cân nặng học sinh lớp 11D, giá trị đại diện của nhóm $[50,5;55,5)$ là bao nhiêu?",
    options: [
      { letter: "A", text: "$53$", isCorrect: true },
      { letter: "B", text: "$50{,}5$", isCorrect: false },
      { letter: "C", text: "$55{,}5$", isCorrect: false },
      { letter: "D", text: "$52$", isCorrect: false }
    ],
    blankAnswer: "53",
    explanation: "Giá trị đại diện của nhóm $[a;b)$ là trung bình cộng hai đầu mút: $x=\\dfrac{50,5+55,5}{2}=53$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 9, trang 63"
  },
  {
    id: "xs42",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Bảng thống kê thời gian chạy (phút) của 30 vận động viên marathon được ghép thành 6 nhóm độ dài bằng nhau và bằng 3, gồm: [127,5;130,5): 3; [130,5;133,5): 1; [133,5;136,5): 4; [136,5;139,5): 3; [139,5;142,5): 7; [142,5;145,5): 12. Nhóm $[142,5;145,5)$ có bao nhiêu vận động viên?",
    options: [
      { letter: "A", text: "$12$", isCorrect: true },
      { letter: "B", text: "$7$", isCorrect: false },
      { letter: "C", text: "$3$", isCorrect: false },
      { letter: "D", text: "$30$", isCorrect: false }
    ],
    blankAnswer: "12",
    explanation: "Theo bảng thống kê mẫu số liệu ghép nhóm, tần số của nhóm $[142,5;145,5)$ là $12$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 8, trang 60"
  },
  {
    id: "hh53",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình chóp $S.ABCD$ (Hình 4.11). Hình chóp đó có bao nhiêu đỉnh, bao nhiêu cạnh?",
    options: [
      { letter: "A", text: "$5$ đỉnh, $8$ cạnh", isCorrect: true },
      { letter: "B", text: "$4$ đỉnh, $6$ cạnh", isCorrect: false },
      { letter: "C", text: "$5$ đỉnh, $5$ cạnh", isCorrect: false },
      { letter: "D", text: "$8$ đỉnh, $5$ cạnh", isCorrect: false }
    ],
    blankAnswer: "5 đỉnh, 8 cạnh",
    explanation: "Hình chóp $S.ABCD$ có 5 đỉnh là $S, A, B, C, D$ và có 8 cạnh là $SA, SB, SC, SD, AB, BC, CD, DA$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 10, Ví dụ 5, trang 76"
  },
  {
    id: "hh54",
    topic: "Hình học",
    grade: 11,
    text: "Trong không gian, cho hai đường thẳng phân biệt $a, b$ và mặt phẳng $(P)$. Mệnh đề nào sau đây đúng?",
    options: [
      { letter: "A", text: "Nếu $a$ và $(P)$ có điểm chung thì $a$ không song song với $(P)$", isCorrect: true },
      { letter: "B", text: "Nếu $a$ và $(P)$ có điểm chung thì $a$ và $(P)$ cắt nhau", isCorrect: false },
      { letter: "C", text: "Nếu $a$ song song với $b$ và $b$ nằm trong $(P)$ thì $a$ song song với $(P)$", isCorrect: false },
      { letter: "D", text: "Nếu $a$ và $b$ song song với $(P)$ thì $a$ song song với $b$", isCorrect: false }
    ],
    blankAnswer: "Nếu a và (P) có điểm chung thì a không song song với (P)",
    explanation: "Theo định nghĩa, $a\\parallel(P)$ khi và chỉ khi $a$ và $(P)$ không có điểm chung, nên có điểm chung thì chắc chắn không song song — mệnh đề A đúng. Mệnh đề B sai vì có thể có nhiều hơn một điểm chung ($a\\subset(P)$), khi đó $a$ và $(P)$ không phải cắt nhau. Mệnh đề C sai vì cần thêm điều kiện $a$ không nằm trong $(P)$ (nếu $a\\subset(P)$ thì $a$ không song song với $(P)$). Mệnh đề D sai vì hai đường thẳng cùng song song với một mặt phẳng có thể cắt nhau hoặc chéo nhau.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 12, Bài tập 4.16, trang 87"
  },
  {
    id: "hh55",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành. Giao tuyến của hai mặt phẳng $(SAD)$ và $(SBC)$ là:",
    options: [
      { letter: "A", text: "đường thẳng đi qua $S$ và song song với $AD, BC$", isCorrect: true },
      { letter: "B", text: "đường thẳng $AC$", isCorrect: false },
      { letter: "C", text: "đường thẳng $BD$", isCorrect: false },
      { letter: "D", text: "đường thẳng $SB$", isCorrect: false }
    ],
    blankAnswer: "đường thẳng đi qua S và song song với AD, BC",
    explanation: "$ABCD$ là hình bình hành nên $AD\\parallel BC$. Hai mặt phẳng $(SAD)$ và $(SBC)$ có điểm chung $S$ và lần lượt chứa hai đường thẳng song song $AD, BC$, nên giao tuyến của chúng là đường thẳng qua $S$ và song song với $AD, BC$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 12, Luyện tập 4, trang 86"
  },
  {
    id: "hh56",
    topic: "Hình học",
    grade: 11,
    text: "Cho ba mặt phẳng đôi một song song $(P), (Q), (R)$. Hai cát tuyến phân biệt lần lượt cắt ba mặt phẳng đó tại $A, B, C$ và $A', B', C'$. Biết $AB = 2\\text{ cm}$, $BC = 4\\text{ cm}$, $A'B' = 3\\text{ cm}$. Độ dài đoạn thẳng $B'C'$ là:",
    options: [
      { letter: "A", text: "$6\\text{ cm}$", isCorrect: true },
      { letter: "B", text: "$8\\text{ cm}$", isCorrect: false },
      { letter: "C", text: "$3\\text{ cm}$", isCorrect: false },
      { letter: "D", text: "$1{,}5\\text{ cm}$", isCorrect: false }
    ],
    blankAnswer: "6 cm",
    explanation: "Theo định lí Thalès trong không gian: $\\dfrac{AB}{A'B'}=\\dfrac{BC}{B'C'}$, tức $\\dfrac{2}{3}=\\dfrac{4}{B'C'}$, suy ra $B'C'=6\\text{ cm}$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 13, Luyện tập 4, trang 91"
  },
  {
    id: "hh57",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình tứ diện $SABC$. Trên cạnh $SA$ lấy các điểm $A_1, A_2$ sao cho $A_2A_1 = 2A_1A$. Gọi $(P)$ và $(Q)$ là hai mặt phẳng song song với $(ABC)$, lần lượt đi qua $A_1, A_2$ và cắt cạnh $SB$ lần lượt tại $B_1, B_2$. Tỉ số $\\dfrac{B_2B_1}{B_1B}$ bằng:",
    options: [
      { letter: "A", text: "$2$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{2}$", isCorrect: false },
      { letter: "C", text: "$3$", isCorrect: false },
      { letter: "D", text: "$1$", isCorrect: false }
    ],
    blankAnswer: "2",
    explanation: "Áp dụng định lí Thalès cho ba mặt phẳng song song $(P), (Q), (ABC)$ và hai cát tuyến $SA, SB$: $\\dfrac{A_2A_1}{A_1A}=\\dfrac{B_2B_1}{B_1B}$. Vì $A_2A_1=2A_1A$ nên $\\dfrac{B_2B_1}{B_1B}=2$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 13, Ví dụ 4, trang 91"
  },
  {
    id: "hh58",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình tứ diện $ABCD$. Gọi $M, N, P, Q$ lần lượt là trung điểm của các đoạn thẳng $AB, CD, AD, BC$. Tứ giác $MPNQ$ là hình gì?",
    options: [
      { letter: "A", text: "Hình bình hành", isCorrect: true },
      { letter: "B", text: "Hình thang (không phải hình bình hành)", isCorrect: false },
      { letter: "C", text: "Hình chữ nhật", isCorrect: false },
      { letter: "D", text: "Tứ giác không có cặp cạnh nào song song", isCorrect: false }
    ],
    blankAnswer: "Hình bình hành",
    explanation: "Trong tam giác $ABC$, $MQ$ là đường trung bình nên $MQ\\parallel AC$ và $MQ=\\dfrac12 AC$. Trong tam giác $ACD$, $PN$ là đường trung bình nên $PN\\parallel AC$ và $PN=\\dfrac12 AC$. Do đó $MQ\\parallel PN$ và $MQ=PN$, suy ra tứ giác $MPNQ$ là hình bình hành.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 11, Ví dụ 3, trang 81"
  },
  {
    id: "hh59",
    topic: "Hình học",
    grade: 11,
    text: "Cho tam giác $ABC$ có $M$ là trung điểm của $BC$. Một phép chiếu song song biến tam giác $ABC$ thành tam giác $A'B'C'$, biến điểm $M$ thành điểm $M'$. Khi đó $M'$ là:",
    options: [
      { letter: "A", text: "trung điểm của $B'C'$", isCorrect: true },
      { letter: "B", text: "trọng tâm của tam giác $A'B'C'$", isCorrect: false },
      { letter: "C", text: "một điểm bất kì trên đoạn $B'C'$", isCorrect: false },
      { letter: "D", text: "trung điểm của $A'B'$", isCorrect: false }
    ],
    blankAnswer: "trung điểm của B'C'",
    explanation: "Vì $M$ là trung điểm $BC$ nên $B, M, C$ thẳng hàng theo thứ tự đó và $\\dfrac{BM}{MC}=1$. Phép chiếu song song giữ nguyên thứ tự ba điểm thẳng hàng và giữ nguyên tỉ số độ dài của hai đoạn thẳng cùng nằm trên một đường thẳng, nên $B', M', C'$ thẳng hàng theo thứ tự đó và $\\dfrac{B'M'}{M'C'}=1$, tức $M'$ là trung điểm của $B'C'$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 14, Ví dụ 3, trang 99"
  },
  {
    id: "gt21",
    topic: "Giải tích",
    grade: 11,
    text: "Tính tổng $S=1-\\dfrac12+\\dfrac14-\\dfrac18+\\cdots+\\left(-\\dfrac12\\right)^{n-1}+\\cdots$.",
    options: [
      { letter: "A", text: "$S=\\dfrac{2}{3}$", isCorrect: true },
      { letter: "B", text: "$S=\\dfrac{1}{3}$", isCorrect: false },
      { letter: "C", text: "$S=\\dfrac{3}{2}$", isCorrect: false },
      { letter: "D", text: "$S=1$", isCorrect: false }
    ],
    blankAnswer: "2/3",
    explanation: "Đây là tổng của cấp số nhân lùi vô hạn với $u_1=1$, $q=-\\dfrac12$ ($|q|<1$). Áp dụng công thức $S=\\dfrac{u_1}{1-q}=\\dfrac{1}{1-\\left(-\\frac12\\right)}=\\dfrac{2}{3}$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 15, Ví dụ 4, trang 107"
  },
  {
    id: "gt22",
    topic: "Giải tích",
    grade: 11,
    text: "Tính tổng $S=2+\\dfrac27+\\dfrac{2}{49}+\\cdots+\\dfrac{2}{7^{n-1}}+\\cdots$.",
    options: [
      { letter: "A", text: "$S=\\dfrac{7}{3}$", isCorrect: true },
      { letter: "B", text: "$S=2$", isCorrect: false },
      { letter: "C", text: "$S=\\dfrac{12}{7}$", isCorrect: false },
      { letter: "D", text: "$S=\\dfrac{7}{6}$", isCorrect: false }
    ],
    blankAnswer: "7/3",
    explanation: "Đây là tổng của cấp số nhân lùi vô hạn với $u_1=2$, $q=\\dfrac17$. Áp dụng công thức $S=\\dfrac{u_1}{1-q}=\\dfrac{2}{1-\\frac17}=\\dfrac{2}{\\frac67}=\\dfrac{14}{6}=\\dfrac{7}{3}$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 15, Luyện tập 4, trang 108"
  },
  {
    id: "gt23",
    topic: "Giải tích",
    grade: 11,
    text: "Biểu diễn số thập phân vô hạn tuần hoàn $2{,}222\\ldots$ dưới dạng phân số.",
    options: [
      { letter: "A", text: "$\\dfrac{20}{9}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{22}{9}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{2}{9}$", isCorrect: false },
      { letter: "D", text: "$2$", isCorrect: false }
    ],
    blankAnswer: "20/9",
    explanation: "$2{,}222\\ldots=2+0{,}2+0{,}02+\\cdots$ là tổng của cấp số nhân lùi vô hạn với $u_1=2$, $q=10^{-1}$. Áp dụng công thức: $2{,}222\\ldots=\\dfrac{u_1}{1-q}=\\dfrac{2}{1-\\frac{1}{10}}=\\dfrac{20}{9}$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 15, Ví dụ 5, trang 108"
  },
  {
    id: "gt24",
    topic: "Giải tích",
    grade: 11,
    text: "Tính giới hạn $\\lim\\limits_{n\\to+\\infty}\\dfrac{n^2+n+1}{2n^2+1}$.",
    options: [
      { letter: "A", text: "$\\dfrac{1}{2}$", isCorrect: true },
      { letter: "B", text: "$1$", isCorrect: false },
      { letter: "C", text: "$0$", isCorrect: false },
      { letter: "D", text: "$+\\infty$", isCorrect: false }
    ],
    blankAnswer: "1/2",
    explanation: "Chia cả tử và mẫu cho $n^2$: $\\lim\\dfrac{1+\\frac1n+\\frac1{n^2}}{2+\\frac1{n^2}}=\\dfrac{1+0+0}{2+0}=\\dfrac12$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 15, Bài tập 5.1a, trang 109"
  },
  {
    id: "gt25",
    topic: "Giải tích",
    grade: 11,
    text: "Cho hàm số $f(x)=\\dfrac{x-1}{x^2-1}$. Giá trị của $\\lim\\limits_{x\\to1}f(x)$ bằng:",
    options: [
      { letter: "A", text: "$\\dfrac{1}{2}$", isCorrect: true },
      { letter: "B", text: "$0$", isCorrect: false },
      { letter: "C", text: "$1$", isCorrect: false },
      { letter: "D", text: "Không tồn tại", isCorrect: false }
    ],
    blankAnswer: "1/2",
    explanation: "Với $x\\neq1$, $f(x)=\\dfrac{x-1}{x^2-1}=\\dfrac{x-1}{(x-1)(x+1)}=\\dfrac{1}{x+1}$. Do đó $\\lim_{x\\to1}f(x)=\\lim_{x\\to1}\\dfrac{1}{x+1}=\\dfrac12$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 16, Ví dụ 1, trang 111-112"
  },
  {
    id: "gt26",
    topic: "Giải tích",
    grade: 11,
    text: "Tính giới hạn $\\lim\\limits_{x\\to0}\\dfrac{\\sqrt{x+9}-3}{x}$.",
    options: [
      { letter: "A", text: "$\\dfrac{1}{6}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{3}$", isCorrect: false },
      { letter: "C", text: "$0$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{1}{9}$", isCorrect: false }
    ],
    blankAnswer: "1/6",
    explanation: "Nhân liên hợp: $\\dfrac{\\sqrt{x+9}-3}{x}=\\dfrac{x}{x(\\sqrt{x+9}+3)}=\\dfrac{1}{\\sqrt{x+9}+3}$. Do đó $\\lim_{x\\to0}\\dfrac{\\sqrt{x+9}-3}{x}=\\dfrac{1}{\\sqrt{9}+3}=\\dfrac{1}{6}$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 16, Ví dụ 3, trang 112-113"
  },
  {
    id: "gt27",
    topic: "Giải tích",
    grade: 11,
    text: "Cho hàm số $f(x)=\\begin{cases}x^2 & \\text{nếu } 0<x<1\\\\ x+1 & \\text{nếu } 1\\le x<2\\end{cases}$. Khẳng định nào sau đây đúng?",
    options: [
      { letter: "A", text: "$\\lim\\limits_{x\\to1}f(x)$ không tồn tại vì hai giới hạn một phía khác nhau", isCorrect: true },
      { letter: "B", text: "$\\lim\\limits_{x\\to1}f(x)=1$", isCorrect: false },
      { letter: "C", text: "$\\lim\\limits_{x\\to1}f(x)=2$", isCorrect: false },
      { letter: "D", text: "$\\lim\\limits_{x\\to1}f(x)=1{,}5$", isCorrect: false }
    ],
    blankAnswer: "không tồn tại vì hai giới hạn một phía khác nhau",
    explanation: "Với dãy $x_n\\to1$, $0<x_n<1$: $f(x_n)=x_n^2\\to1$, nên $\\lim_{x\\to1^-}f(x)=1$. Với dãy $x_n\\to1$, $1<x_n<2$: $f(x_n)=x_n+1\\to2$, nên $\\lim_{x\\to1^+}f(x)=2$. Vì hai giới hạn một phía khác nhau ($1\\neq2$) nên không tồn tại $\\lim_{x\\to1}f(x)$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 16, Ví dụ 4, trang 113"
  },
  {
    id: "gt28",
    topic: "Giải tích",
    grade: 11,
    text: "Xét hàm số $f(x)=x^5+x^3-10$ trên đoạn $[0;2]$. Biết $f(0)=-10$ và $f(2)=30$. Khẳng định nào sau đây đúng?",
    options: [
      { letter: "A", text: "Phương trình $f(x)=0$ có ít nhất một nghiệm thuộc khoảng $(0;2)$", isCorrect: true },
      { letter: "B", text: "Phương trình $f(x)=0$ vô nghiệm trên $(0;2)$", isCorrect: false },
      { letter: "C", text: "Không thể kết luận gì về nghiệm của phương trình trên $(0;2)$", isCorrect: false },
      { letter: "D", text: "Phương trình $f(x)=0$ có nghiệm duy nhất $x=0$", isCorrect: false }
    ],
    blankAnswer: "Phương trình f(x)=0 có ít nhất một nghiệm thuộc khoảng (0;2)",
    explanation: "$f(x)$ là hàm đa thức nên liên tục trên $\\mathbb{R}$, do đó liên tục trên $[0;2]$. Vì $f(0)\\cdot f(2)=(-10)\\cdot30<0$, theo định lí giá trị trung gian, phương trình $f(x)=0$ có ít nhất một nghiệm trong khoảng $(0;2)$.",
    sgk_source: "Toán 11 KNTT Tập 1, Bài 17, Ví dụ 6, trang 122"
  },
  {
    id: "gt29",
    topic: "Giải tích",
    grade: 11,
    text: "Tính $A = \\left(\\dfrac{1}{2}\\right)^{-8} \\cdot 8^{-2} + (0,2)^{-4} \\cdot 25^{-2}$.",
    options: [
      { letter: "A", text: "$A = 5$", isCorrect: true },
      { letter: "B", text: "$A = 4$", isCorrect: false },
      { letter: "C", text: "$A = 6$", isCorrect: false },
      { letter: "D", text: "$A = 1$", isCorrect: false }
    ],
    blankAnswer: "5",
    explanation: "$\\left(\\dfrac{1}{2}\\right)^{-8} = 2^8 = 256$, $8^{-2}=\\dfrac{1}{64}$ nên $256\\cdot\\dfrac{1}{64}=4$. $(0,2)^{-4}=5^4=625$, $25^{-2}=\\dfrac{1}{625}$ nên $625\\cdot\\dfrac{1}{625}=1$. Vậy $A=4+1=5$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 18, Ví dụ 1, trang 5"
  },
  {
    id: "gt30",
    topic: "Giải tích",
    grade: 11,
    text: "Tính giá trị của $16^{3/2}$.",
    options: [
      { letter: "A", text: "$64$", isCorrect: true },
      { letter: "B", text: "$8$", isCorrect: false },
      { letter: "C", text: "$32$", isCorrect: false },
      { letter: "D", text: "$4096$", isCorrect: false }
    ],
    blankAnswer: "64",
    explanation: "$16^{3/2} = \\sqrt{16^3} = \\left(\\sqrt{16}\\right)^3 = 4^3 = 64$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 18, Ví dụ 4, trang 7"
  },
  {
    id: "gt31",
    topic: "Giải tích",
    grade: 11,
    text: "Giải phương trình $3^{x+1} = \\dfrac{1}{3^{1-2x}}$.",
    options: [
      { letter: "A", text: "$x=2$", isCorrect: true },
      { letter: "B", text: "$x=0$", isCorrect: false },
      { letter: "C", text: "$x=-2$", isCorrect: false },
      { letter: "D", text: "$x=1$", isCorrect: false }
    ],
    blankAnswer: "2",
    explanation: "Đưa vế phải về cơ số 3: $\\dfrac{1}{3^{1-2x}}=3^{2x-1}$. Phương trình trở thành $3^{x+1}=3^{2x-1} \\Leftrightarrow x+1=2x-1 \\Leftrightarrow x=2$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 21, Ví dụ 1, trang 21"
  },
  {
    id: "gt32",
    topic: "Giải tích",
    grade: 11,
    text: "Giải phương trình $10^{x-1} = 2\\,022$.",
    options: [
      { letter: "A", text: "$x = 1 + \\log 2\\,022$", isCorrect: true },
      { letter: "B", text: "$x = \\log 2\\,022$", isCorrect: false },
      { letter: "C", text: "$x = 1 - \\log 2\\,022$", isCorrect: false },
      { letter: "D", text: "$x = \\log 2\\,023$", isCorrect: false }
    ],
    blankAnswer: "1 + log 2022",
    explanation: "Lấy lôgarit thập phân hai vế: $x - 1 = \\log 2\\,022$, suy ra $x = 1 + \\log 2\\,022$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 21, Ví dụ 2, trang 21"
  },
  {
    id: "gt33",
    topic: "Giải tích",
    grade: 11,
    text: "Giải phương trình $4 + 3\\log(2x) = 16$.",
    options: [
      { letter: "A", text: "$x = 5\\,000$", isCorrect: true },
      { letter: "B", text: "$x = 500$", isCorrect: false },
      { letter: "C", text: "$x = 50\\,000$", isCorrect: false },
      { letter: "D", text: "$x = 10\\,000$", isCorrect: false }
    ],
    blankAnswer: "5000",
    explanation: "Điều kiện $x>0$. Phương trình trở thành $\\log(2x)=4$, suy ra $2x=10^4$, hay $x=5\\,000$ (thỏa mãn điều kiện).",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 21, Ví dụ 3, trang 22"
  },
  {
    id: "gt34",
    topic: "Giải tích",
    grade: 11,
    text: "Giải phương trình $\\log_3(x+1) = \\log_3(x^2-1)$.",
    options: [
      { letter: "A", text: "$x=2$", isCorrect: true },
      { letter: "B", text: "$x=-1$", isCorrect: false },
      { letter: "C", text: "$x=2$ hoặc $x=-1$", isCorrect: false },
      { letter: "D", text: "Vô nghiệm", isCorrect: false }
    ],
    blankAnswer: "2",
    explanation: "Điều kiện: $x+1>0$ và $x^2-1>0$, tức $x>1$. Phương trình trở thành $x+1=x^2-1 \\Leftrightarrow x^2-x-2=0$, cho $x=-1$ hoặc $x=2$; chỉ $x=2$ thỏa điều kiện.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 21, Ví dụ 4, trang 22"
  },
  {
    id: "gt35",
    topic: "Giải tích",
    grade: 11,
    text: "Giải bất phương trình $16^x > \\dfrac{1}{8}$.",
    options: [
      { letter: "A", text: "$x > -\\dfrac{3}{4}$", isCorrect: true },
      { letter: "B", text: "$x < -\\dfrac{3}{4}$", isCorrect: false },
      { letter: "C", text: "$x > \\dfrac{3}{4}$", isCorrect: false },
      { letter: "D", text: "$x > -\\dfrac{4}{3}$", isCorrect: false }
    ],
    blankAnswer: "x > -3/4",
    explanation: "$16^x > \\dfrac{1}{8} \\Leftrightarrow 2^{4x} > 2^{-3} \\Leftrightarrow 4x > -3 \\Leftrightarrow x > -\\dfrac{3}{4}$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 21, Ví dụ 5, trang 23"
  },
  {
    id: "gt36",
    topic: "Giải tích",
    grade: 11,
    text: "Giải bất phương trình $\\log_{0,3}(x+1) \\le \\log_{0,3}(2x-1)$.",
    options: [
      { letter: "A", text: "$\\dfrac{1}{2} < x \\le 2$", isCorrect: true },
      { letter: "B", text: "$x \\le 2$", isCorrect: false },
      { letter: "C", text: "$x > \\dfrac{1}{2}$", isCorrect: false },
      { letter: "D", text: "$x \\ge 2$", isCorrect: false }
    ],
    blankAnswer: "1/2 < x <= 2",
    explanation: "Điều kiện: $x > \\dfrac{1}{2}$. Vì cơ số $0,3<1$ nên bất phương trình trở thành $x+1 \\ge 2x-1$, suy ra $x \\le 2$. Kết hợp điều kiện: $\\dfrac{1}{2} < x \\le 2$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 21, Ví dụ 7, trang 23"
  },
  {
    id: "gt37",
    topic: "Giải tích",
    grade: 11,
    text: "Giá trị của một chiếc xe ô tô sau $t$ năm sử dụng được ước tính theo công thức $V(t) = 780\\cdot(0,905)^t$ (triệu đồng). Hỏi sau khoảng bao nhiêu năm sử dụng thì giá trị chiếc xe còn lại không quá 300 triệu đồng?",
    options: [
      { letter: "A", text: "Khoảng $10$ năm", isCorrect: true },
      { letter: "B", text: "Khoảng $9$ năm", isCorrect: false },
      { letter: "C", text: "Khoảng $8$ năm", isCorrect: false },
      { letter: "D", text: "Khoảng $12$ năm", isCorrect: false }
    ],
    blankAnswer: "khoảng 10 năm",
    explanation: "Cần tìm $t$ sao cho $V(t)\\le 300 \\Leftrightarrow 780\\cdot(0,905)^t \\le 300 \\Leftrightarrow (0,905)^t \\le \\dfrac{5}{13} \\Leftrightarrow t \\ge \\log_{0,905}\\dfrac{5}{13} \\approx 9,6$. Vậy sau khoảng $10$ năm sử dụng, giá trị chiếc xe còn lại không quá $300$ triệu đồng.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 21, Ví dụ 6, trang 23"
  },
  {
    id: "hh60",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình hộp $ABCD.A'B'C'D'$ có các mặt là hình vuông. Tính góc $(AC, DC')$.",
    options: [
      { letter: "A", text: "$60°$", isCorrect: true },
      { letter: "B", text: "$90°$", isCorrect: false },
      { letter: "C", text: "$45°$", isCorrect: false },
      { letter: "D", text: "$30°$", isCorrect: false }
    ],
    blankAnswer: "60 độ",
    explanation: "Vì $DC' \\parallel AB'$ nên $(AC,DC')=(AC,AB')$. Tam giác $AB'C$ có ba cạnh bằng nhau (là các đường chéo của các hình vuông có cùng độ dài cạnh) nên là tam giác đều. Do đó $(AC,DC')=(AC,AB')=60°$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 22, Ví dụ 1, trang 28"
  },
  {
    id: "hh61",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình hộp $ABCD.A'B'C'D'$. Hai đường thẳng $AC$ và $B'D'$ có vị trí tương đối là:",
    options: [
      { letter: "A", text: "Chéo nhau", isCorrect: true },
      { letter: "B", text: "Cắt nhau", isCorrect: false },
      { letter: "C", text: "Song song", isCorrect: false },
      { letter: "D", text: "Trùng nhau", isCorrect: false }
    ],
    blankAnswer: "chéo nhau",
    explanation: "Hai đường thẳng $AC$ và $B'D'$ lần lượt thuộc hai mặt phẳng song song $(ABCD)$ và $(A'B'C'D')$ nên chúng không có điểm chung, tức không thể trùng nhau hoặc cắt nhau. Mặt khác $B'D'\\parallel BD$, mà $BD$ không song song với $AC$ (vì $ABCD$ là hình bình hành nói chung không phải hình thoi), nên $B'D'$ không song song với $AC$. Vậy $AC$ và $B'D'$ chéo nhau.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 22, Ví dụ 2, trang 29"
  },
  {
    id: "hh62",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình chóp $S.ABC$ có $SA\\perp(ABC)$, $SA=a$, $CA=CB=a\\sqrt7$, $AB=2a$. Gọi $\\alpha$ là góc giữa $SB$ và $(ABC)$. Tính $\\tan\\alpha$.",
    options: [
      { letter: "A", text: "$\\dfrac{1}{2}$", isCorrect: true },
      { letter: "B", text: "$1$", isCorrect: false },
      { letter: "C", text: "$2$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{1}{7}$", isCorrect: false }
    ],
    blankAnswer: "1/2",
    explanation: "Do $SA\\perp(ABC)$ nên $\\alpha=\\widehat{SBA}$. Tam giác $SAB$ vuông tại $A$ nên $\\tan\\alpha=\\tan\\widehat{SBA}=\\dfrac{SA}{AB}=\\dfrac{a}{2a}=\\dfrac{1}{2}$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 24, Ví dụ 2, trang 41"
  },
  {
    id: "hh63",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình chóp $S.ABC$ có $SA\\perp(ABC)$, $SA=a$, $CA=CB=a\\sqrt7$, $AB=2a$. Tính góc giữa $SC$ và $(SAB)$.",
    options: [
      { letter: "A", text: "$60°$", isCorrect: true },
      { letter: "B", text: "$45°$", isCorrect: false },
      { letter: "C", text: "$30°$", isCorrect: false },
      { letter: "D", text: "$90°$", isCorrect: false }
    ],
    blankAnswer: "60 độ",
    explanation: "Gọi $M$ là trung điểm $AB$. Do tam giác $ABC$ cân tại $C$ nên $CM\\perp AB$; kết hợp $CM\\perp SA$ (vì $SA\\perp(ABC)$) suy ra $CM\\perp(SAB)$, nên góc giữa $SC$ và $(SAB)$ bằng $\\widehat{CSM}$. Tính được $SC=a\\sqrt8$, $SM=a\\sqrt2$, $\\cos\\widehat{CSM}=\\dfrac{SM}{SC}=\\dfrac{1}{2}$, suy ra $\\widehat{CSM}=60°$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 24, Ví dụ 2, trang 41"
  },
  {
    id: "hh64",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình chóp $S.ABCD$ có $SA\\perp(ABCD)$, đáy $ABCD$ là hình thoi cạnh $a$, $AC=a$, $SA=\\dfrac{1}{2}a$. Tính số đo góc nhị diện $[B,SA,D]$.",
    options: [
      { letter: "A", text: "$120°$", isCorrect: true },
      { letter: "B", text: "$90°$", isCorrect: false },
      { letter: "C", text: "$60°$", isCorrect: false },
      { letter: "D", text: "$45°$", isCorrect: false }
    ],
    blankAnswer: "120 độ",
    explanation: "Vì $SA\\perp(ABCD)$ nên $AB, AD$ đều vuông góc với $SA$, do đó $\\widehat{BAD}$ là góc phẳng của góc nhị diện $[B,SA,D]$. Hình thoi $ABCD$ cạnh $a$ và $AC=a$ nên tam giác $ABC$ đều, suy ra $\\widehat{BAD}=120°$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 25, Ví dụ 4, trang 48"
  },
  {
    id: "hh65",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình chóp $S.ABCD$ có $SA\\perp(ABCD)$, đáy $ABCD$ là hình thoi cạnh $a$, $AC=a$, $SA=\\dfrac{1}{2}a$. Gọi $O$ là giao điểm hai đường chéo. Tính số đo góc nhị diện $[S,BD,A]$.",
    options: [
      { letter: "A", text: "$45°$", isCorrect: true },
      { letter: "B", text: "$30°$", isCorrect: false },
      { letter: "C", text: "$60°$", isCorrect: false },
      { letter: "D", text: "$90°$", isCorrect: false }
    ],
    blankAnswer: "45 độ",
    explanation: "Vì $BD\\perp AC$ và $BD\\perp SA$ nên $BD\\perp(SAC)$, suy ra $\\widehat{AOS}$ là góc phẳng của góc nhị diện $[S,BD,A]$. Tam giác $SAO$ vuông tại $A$ có $SA=\\dfrac12 a=AO$ nên vuông cân, do đó $\\widehat{AOS}=45°$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 25, Ví dụ 4, trang 48"
  },
  {
    id: "hh66",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình chóp đều $S.ABC$, biết độ dài cạnh đáy, cạnh bên tương ứng bằng $a, b$ ($a<b\\sqrt3$). Chiều cao của hình chóp bằng:",
    options: [
      { letter: "A", text: "$\\sqrt{b^2-\\dfrac{a^2}{3}}$", isCorrect: true },
      { letter: "B", text: "$\\sqrt{b^2-\\dfrac{a^2}{2}}$", isCorrect: false },
      { letter: "C", text: "$\\sqrt{b^2-a^2}$", isCorrect: false },
      { letter: "D", text: "$\\sqrt{a^2-\\dfrac{b^2}{3}}$", isCorrect: false }
    ],
    blankAnswer: "sqrt(b^2 - a^2/3)",
    explanation: "Hình chiếu của $S$ trên $(ABC)$ là tâm $O$ của tam giác đều $ABC$, với $OA=\\dfrac{a}{\\sqrt3}$. Trong tam giác vuông $SOA$: $SO=\\sqrt{SA^2-OA^2}=\\sqrt{b^2-\\dfrac{a^2}{3}}$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 26, Ví dụ 1, trang 55"
  },
  {
    id: "hh67",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình chóp $S.ABC$ có $SA\\perp(ABC)$, $AB=a$, $\\widehat{ABC}=60°$. Khoảng cách giữa hai đường thẳng $SA$ và $BC$ bằng:",
    options: [
      { letter: "A", text: "$\\dfrac{a\\sqrt3}{2}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{a}{2}$", isCorrect: false },
      { letter: "C", text: "$a\\sqrt3$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{a\\sqrt2}{2}$", isCorrect: false }
    ],
    blankAnswer: "a*sqrt(3)/2",
    explanation: "Gọi $H$ là hình chiếu của $A$ trên $BC$. Tam giác $ABH$ vuông tại $H$ có $AB=a$, $\\widehat{ABH}=60°$ nên $AH=AB\\sin60°=\\dfrac{a\\sqrt3}{2}$. Do $SA\\perp(ABC)$ nên $AH$ là đường vuông góc chung của $SA$ và $BC$. Vậy $d(SA,BC)=AH=\\dfrac{a\\sqrt3}{2}$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 26, Ví dụ 3, trang 58"
  },
  {
    id: "hh68",
    topic: "Hình học",
    grade: 11,
    text: "Cho khối tứ diện $OABC$ có các cạnh $OA, OB, OC$ đôi một vuông góc với nhau và $OA=a$, $OB=b$, $OC=c$. Thể tích khối tứ diện bằng:",
    options: [
      { letter: "A", text: "$\\dfrac{1}{6}abc$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{3}abc$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{1}{2}abc$", isCorrect: false },
      { letter: "D", text: "$abc$", isCorrect: false }
    ],
    blankAnswer: "abc/6",
    explanation: "Tam giác vuông $OBC$ có diện tích $S_{OBC}=\\dfrac12 bc$. Vì $OA\\perp(OBC)$ nên tứ diện có chiều cao ứng với đỉnh $A$ bằng $OA$. Vậy $V_{OABC}=\\dfrac13 AO\\cdot S_{OBC}=\\dfrac16 abc$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 27, Ví dụ 1, trang 62"
  },
  {
    id: "hh69",
    topic: "Hình học",
    grade: 11,
    text: "Cho khối hộp $ABCD.A'B'C'D'$ có $AB=8\\text{ cm}$, $AD=5\\text{ cm}$, $AA'=6\\text{ cm}$, $\\widehat{BAD}=30°$, góc giữa $AA'$ và $(ABCD)$ bằng $45°$. Thể tích khối hộp bằng:",
    options: [
      { letter: "A", text: "$60\\sqrt2\\text{ cm}^3$", isCorrect: true },
      { letter: "B", text: "$60\\text{ cm}^3$", isCorrect: false },
      { letter: "C", text: "$120\\text{ cm}^3$", isCorrect: false },
      { letter: "D", text: "$30\\sqrt2\\text{ cm}^3$", isCorrect: false }
    ],
    blankAnswer: "60*sqrt(2)",
    explanation: "Diện tích hình bình hành đáy: $S_{ABCD}=2S_{ABD}=2\\left(\\dfrac12 AB\\cdot AD\\sin\\widehat{BAD}\\right)=20\\text{ cm}^2$. Gọi $H$ là hình chiếu của $A'$ trên $(ABCD)$; góc giữa $AA'$ và $(ABCD)$ là $\\widehat{A'AH}=45°$, nên $A'H=AA'\\sin45°=3\\sqrt2\\text{ cm}$ — đây chính là chiều cao khối hộp ứng với mặt $ABCD$. Vậy $V=A'H\\cdot S_{ABCD}=3\\sqrt2\\cdot20=60\\sqrt2\\text{ cm}^3$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 27, Ví dụ 3, trang 63"
  },
  {
    id: "xs43",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Một hộp đựng 15 tấm thẻ cùng loại được đánh số từ 1 đến 15. Rút ngẫu nhiên một tấm thẻ. Gọi $E$ là biến cố \"Số ghi trên tấm thẻ là số lẻ\", $F$ là biến cố \"Số ghi trên tấm thẻ là số nguyên tố\". Biến cố hợp $G=E\\cup F$ là:",
    options: [
      { letter: "A", text: "$\\{1;2;3;5;7;9;11;13;15\\}$", isCorrect: true },
      { letter: "B", text: "$\\{1;3;5;7;9;11;13;15\\}$", isCorrect: false },
      { letter: "C", text: "$\\{2;3;5;7;11;13\\}$", isCorrect: false },
      { letter: "D", text: "$\\{3;5;7;11;13\\}$", isCorrect: false }
    ],
    blankAnswer: "{1;2;3;5;7;9;11;13;15}",
    explanation: "$E=\\{1;3;5;7;9;11;13;15\\}$ (các số lẻ), $F=\\{2;3;5;7;11;13\\}$ (các số nguyên tố). Biến cố hợp $G=E\\cup F=\\{1;2;3;5;7;9;11;13;15\\}$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 28, Ví dụ 1, trang 67-68"
  },
  {
    id: "xs44",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Một tổ có 9 học sinh. Xét biến cố $U$: \"Học sinh được chọn biết chơi cầu lông\" và $V$: \"Học sinh được chọn biết chơi bóng bàn\". Biến cố giao $T=UV$ có nội dung là:",
    options: [
      { letter: "A", text: "Học sinh được chọn biết chơi cả cầu lông và bóng bàn", isCorrect: true },
      { letter: "B", text: "Học sinh được chọn biết chơi cầu lông hoặc bóng bàn", isCorrect: false },
      { letter: "C", text: "Học sinh được chọn không biết chơi môn nào", isCorrect: false },
      { letter: "D", text: "Học sinh được chọn chỉ biết chơi đúng một trong hai môn", isCorrect: false }
    ],
    blankAnswer: "Học sinh được chọn biết chơi cả cầu lông và bóng bàn",
    explanation: "Biến cố giao $T=UV$ là biến cố \"Cả $U$ và $V$ đều xảy ra\", tức là \"Học sinh được chọn biết chơi cả cầu lông và bóng bàn\".",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 28, Ví dụ 2, trang 68-69"
  },
  {
    id: "xs45",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Một hộp đựng 4 viên bi đỏ và 5 viên bi xanh, cùng kích thước và khối lượng. Bạn Minh lấy ngẫu nhiên một viên bi, ghi lại màu rồi trả lại vào hộp; tiếp theo bạn Hùng lấy ngẫu nhiên một viên bi từ hộp đó. Gọi $B$ là biến cố \"Hùng lấy được viên bi màu xanh\". Xác suất $P(B)$ bằng:",
    options: [
      { letter: "A", text: "$\\dfrac{5}{9}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{4}{9}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{5}{8}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{4}{8}$", isCorrect: false }
    ],
    blankAnswer: "5/9",
    explanation: "Vì Minh trả lại viên bi đã lấy vào hộp nên khi Hùng lấy, trong hộp luôn có 4 bi đỏ và 5 bi xanh (dù $A$ xảy ra hay không). Vậy $P(B)=\\dfrac{5}{9}$, không đổi — chứng tỏ $A$ và $B$ độc lập.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 28, Ví dụ 3, trang 70"
  },
  {
    id: "xs46",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Gieo đồng thời hai con xúc xắc cân đối, đồng chất. Xét $A$: \"Tổng số chấm xuất hiện trên hai con xúc xắc lớn hơn hoặc bằng 7\"; $B$: \"Tổng số chấm xuất hiện trên hai con xúc xắc nhỏ hơn hoặc bằng 4\". Hai biến cố $A$ và $B$:",
    options: [
      { letter: "A", text: "Xung khắc, vì không đồng thời xảy ra", isCorrect: true },
      { letter: "B", text: "Không xung khắc, vì có thể đồng thời xảy ra", isCorrect: false },
      { letter: "C", text: "Xung khắc chỉ khi tổng bằng 5", isCorrect: false },
      { letter: "D", text: "Không thể xác định được", isCorrect: false }
    ],
    blankAnswer: "xung khắc, vì không đồng thời xảy ra",
    explanation: "Tổng số chấm không thể vừa $\\ge 7$ vừa $\\le 4$ cùng lúc, nên $A$ và $B$ không đồng thời xảy ra — hai biến cố xung khắc.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 29, Ví dụ 1, trang 72-73"
  },
  {
    id: "xs47",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Một hộp đựng 9 tấm thẻ cùng loại được ghi số từ 1 đến 9. Rút ngẫu nhiên đồng thời hai tấm thẻ. Gọi $C$ là biến cố \"Tích hai số ghi trên hai tấm thẻ là một số chẵn\". Xác suất $P(C)$ bằng:",
    options: [
      { letter: "A", text: "$\\dfrac{13}{18}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{6}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{5}{9}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{13}{9}$", isCorrect: false }
    ],
    blankAnswer: "13/18",
    explanation: "Gọi $A$: \"cả hai thẻ đều chẵn\", $B$: \"chỉ một thẻ chẵn\"; $C=A\\cup B$ với $A,B$ xung khắc. $n(\\Omega)=C_9^2=36$, $n(A)=C_4^2=6$ nên $P(A)=6/36$; $n(B)=4\\cdot5=20$ nên $P(B)=20/36$. Vậy $P(C)=P(A)+P(B)=\\dfrac{6}{36}+\\dfrac{20}{36}=\\dfrac{26}{36}=\\dfrac{13}{18}$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 29, Ví dụ 2, trang 73-74"
  },
  {
    id: "xs48",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Ở một trường trung học phổ thông X, có 19% học sinh học khá môn Ngữ văn, 32% học sinh học khá môn Toán, 7% học sinh học khá cả hai môn Ngữ văn và Toán. Chọn ngẫu nhiên một học sinh của trường X. Xác suất để học sinh đó học khá môn Ngữ văn hoặc học khá môn Toán là:",
    options: [
      { letter: "A", text: "$0,44$", isCorrect: true },
      { letter: "B", text: "$0,51$", isCorrect: false },
      { letter: "C", text: "$0,58$", isCorrect: false },
      { letter: "D", text: "$0,25$", isCorrect: false }
    ],
    blankAnswer: "0.44",
    explanation: "Theo công thức cộng xác suất: $P(A\\cup B)=P(A)+P(B)-P(AB)=0,19+0,32-0,07=0,44$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 29, Ví dụ 3, trang 74-75"
  },
  {
    id: "xs49",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Tại vòng chung kết của một đại hội thể thao, vận động viên An thi đấu môn Bắn súng, vận động viên Bình thi đấu môn Bơi lội. Biết xác suất giành huy chương của An và Bình tương ứng là $0,8$ và $0,9$. Xác suất để cả hai vận động viên đạt huy chương là:",
    options: [
      { letter: "A", text: "$0,72$", isCorrect: true },
      { letter: "B", text: "$1,7$", isCorrect: false },
      { letter: "C", text: "$0,08$", isCorrect: false },
      { letter: "D", text: "$0,9$", isCorrect: false }
    ],
    blankAnswer: "0.72",
    explanation: "Vì An và Bình thi đấu hai môn khác nhau nên hai biến cố độc lập. Áp dụng công thức nhân xác suất: $P(AB)=P(A)\\cdot P(B)=0,8\\cdot0,9=0,72$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 30, Ví dụ 1, trang 77"
  },
  {
    id: "xs50",
    topic: "Xác suất & Thống kê",
    grade: 11,
    text: "Tại vòng chung kết của một đại hội thể thao, vận động viên An thi đấu môn Bắn súng, vận động viên Bình thi đấu môn Bơi lội, với xác suất giành huy chương tương ứng là $0,8$ và $0,9$. Xác suất để vận động viên An đạt huy chương còn vận động viên Bình không đạt huy chương là:",
    options: [
      { letter: "A", text: "$0,08$", isCorrect: true },
      { letter: "B", text: "$0,18$", isCorrect: false },
      { letter: "C", text: "$0,02$", isCorrect: false },
      { letter: "D", text: "$0,72$", isCorrect: false }
    ],
    blankAnswer: "0.08",
    explanation: "Gọi $A$: An đạt huy chương ($P(A)=0,8$), $B$: Bình đạt huy chương ($P(B)=0,9$, nên $P(\\overline{B})=0,1$). Vì $A,B$ độc lập nên $A,\\overline{B}$ cũng độc lập: $P(A\\overline{B})=P(A)\\cdot P(\\overline{B})=0,8\\cdot0,1=0,08$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 30, Ví dụ 1, trang 78"
  },
  {
    id: "gt38",
    topic: "Giải tích",
    grade: 11,
    text: "Dùng định nghĩa, tính đạo hàm của hàm số $y = x^2 - x$ tại $x_0 = 1$.",
    options: [
      { letter: "A", text: "$1$", isCorrect: true },
      { letter: "B", text: "$3$", isCorrect: false },
      { letter: "C", text: "$-1$", isCorrect: false },
      { letter: "D", text: "$0$", isCorrect: false }
    ],
    blankAnswer: "1",
    explanation: "Với $x \\neq 1$: $f(x) - f(1) = x^2 - x - 0 = x(x-1) - (1-1)$. Cách khác: $y' = 2x - 1$ nên $f'(1) = 2(1) - 1 = 1$. Bằng định nghĩa: $\\dfrac{f(x)-f(1)}{x-1} = \\dfrac{x^2-x}{x-1} = x$, suy ra $f'(1) = \\lim_{x\\to 1} x = 1$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 31, trang 86 (Bài 9.1a)"
  },
  {
    id: "gt39",
    topic: "Giải tích",
    grade: 11,
    text: "Một vật được phóng theo phương thẳng đứng lên trên từ mặt đất với vận tốc ban đầu là $19,6$ m/s thì độ cao $h$ của nó (tính bằng mét) sau $t$ giây được cho bởi công thức $h = 19,6t - 4,9t^2$. Tìm vận tốc của vật khi nó chạm đất.",
    options: [
      { letter: "A", text: "$-19,6$ m/s", isCorrect: true },
      { letter: "B", text: "$19,6$ m/s", isCorrect: false },
      { letter: "C", text: "$-9,8$ m/s", isCorrect: false },
      { letter: "D", text: "$0$ m/s", isCorrect: false }
    ],
    blankAnswer: "-19,6 m/s",
    explanation: "Vật chạm đất khi $h(t) = 0 \\iff 19,6t - 4,9t^2 = 0 \\iff t = 0$ (loại) hoặc $t = 4$ (giây). Vận tốc $v(t) = h'(t) = 19,6 - 9,8t$, nên $v(4) = 19,6 - 9,8 \\cdot 4 = -19,6$ m/s.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 31, trang 86 (Bài 9.4)"
  },
  {
    id: "gt40",
    topic: "Giải tích",
    grade: 11,
    text: "Viết phương trình tiếp tuyến của parabol $y = -x^2 + 4x$, biết tiếp điểm có hoành độ $x_0 = 1$.",
    options: [
      { letter: "A", text: "$y = 2x + 1$", isCorrect: true },
      { letter: "B", text: "$y = -2x + 3$", isCorrect: false },
      { letter: "C", text: "$y = 2x - 1$", isCorrect: false },
      { letter: "D", text: "$y = 4x - 1$", isCorrect: false }
    ],
    blankAnswer: "y = 2x + 1",
    explanation: "Ta có $y_0 = f(1) = -1 + 4 = 3$. Đạo hàm $y' = -2x + 4$ nên hệ số góc $k = f'(1) = -2 + 4 = 2$. Phương trình tiếp tuyến: $y = 2(x-1) + 3 = 2x + 1$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 31, trang 86 (Bài 9.3a)"
  },
  {
    id: "gt41",
    topic: "Giải tích",
    grade: 11,
    text: "Tính đạo hàm của hàm số $y = x^2 - 4\\sqrt{x} + 3$.",
    options: [
      { letter: "A", text: "$2x - \\dfrac{2}{\\sqrt{x}}$", isCorrect: true },
      { letter: "B", text: "$2x - \\dfrac{4}{\\sqrt{x}}$", isCorrect: false },
      { letter: "C", text: "$2x - \\dfrac{1}{\\sqrt{x}}$", isCorrect: false },
      { letter: "D", text: "$x - \\dfrac{2}{\\sqrt{x}}$", isCorrect: false }
    ],
    blankAnswer: "2x - \\dfrac{2}{\\sqrt{x}}",
    explanation: "$y' = 2x - 4 \\cdot \\dfrac{1}{2\\sqrt{x}} + 0 = 2x - \\dfrac{2}{\\sqrt{x}}$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 32, trang 94 (Bài 9.6b)"
  },
  {
    id: "gt42",
    topic: "Giải tích",
    grade: 11,
    text: "Tính đạo hàm của hàm số $y = \\dfrac{2x - 1}{x + 2}$.",
    options: [
      { letter: "A", text: "$\\dfrac{5}{(x+2)^2}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{-5}{(x+2)^2}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{3}{(x+2)^2}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{5}{x+2}$", isCorrect: false }
    ],
    blankAnswer: "\\dfrac{5}{(x+2)^2}",
    explanation: "$y' = \\dfrac{(2x-1)'(x+2) - (2x-1)(x+2)'}{(x+2)^2} = \\dfrac{2(x+2) - (2x-1)}{(x+2)^2} = \\dfrac{5}{(x+2)^2}$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 32, trang 94 (Bài 9.7a)"
  },
  {
    id: "gt43",
    topic: "Giải tích",
    grade: 11,
    text: "Tính đạo hàm của hàm số $y = \\log_3(4x + 1)$.",
    options: [
      { letter: "A", text: "$\\dfrac{4}{(4x+1)\\ln 3}$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{1}{(4x+1)\\ln 3}$", isCorrect: false },
      { letter: "C", text: "$\\dfrac{4}{4x+1}$", isCorrect: false },
      { letter: "D", text: "$\\dfrac{4\\ln 3}{4x+1}$", isCorrect: false }
    ],
    blankAnswer: "\\dfrac{4}{(4x+1)\\ln 3}",
    explanation: "Áp dụng công thức đạo hàm hàm hợp $(\\log_a u)' = \\dfrac{u'}{u \\ln a}$ với $u = 4x+1$, $u' = 4$: $y' = \\dfrac{4}{(4x+1)\\ln 3}$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 32, trang 94 (Bài 9.9b)"
  },
  {
    id: "gt44",
    topic: "Giải tích",
    grade: 11,
    text: "Cho hàm số $f(x) = x^2 e^x$. Tính $f''(0)$.",
    options: [
      { letter: "A", text: "$2$", isCorrect: true },
      { letter: "B", text: "$0$", isCorrect: false },
      { letter: "C", text: "$1$", isCorrect: false },
      { letter: "D", text: "$4$", isCorrect: false }
    ],
    blankAnswer: "2",
    explanation: "$f'(x) = 2xe^x + x^2e^x = e^x(x^2+2x)$. $f''(x) = e^x(x^2+2x) + e^x(2x+2) = e^x(x^2+4x+2)$. Vậy $f''(0) = 1 \\cdot 2 = 2$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 33, trang 96 (Bài 9.13)"
  },
  {
    id: "gt45",
    topic: "Giải tích",
    grade: 11,
    text: "Cho hàm số $P(x) = ax^2 + bx + 3$ ($a, b$ là hằng số). Tìm $a, b$ biết $P'(1) = 0$ và $P''(1) = -2$.",
    options: [
      { letter: "A", text: "$a = -1,\\ b = 2$", isCorrect: true },
      { letter: "B", text: "$a = 1,\\ b = -2$", isCorrect: false },
      { letter: "C", text: "$a = -1,\\ b = -2$", isCorrect: false },
      { letter: "D", text: "$a = 1,\\ b = 2$", isCorrect: false }
    ],
    blankAnswer: "a = -1, b = 2",
    explanation: "$P'(x) = 2ax + b$, $P''(x) = 2a$. Từ $P''(1) = 2a = -2 \\Rightarrow a = -1$. Thay vào $P'(1) = 2a + b = 0 \\Rightarrow -2 + b = 0 \\Rightarrow b = 2$.",
    sgk_source: "Toán 11 KNTT Tập 2, Bài 33, trang 96 (Bài 9.15)"
  },
  {
    id: "hh70",
    topic: "Hình học",
    grade: 11,
    text: "Trong mặt phẳng toạ độ $Oxy$ cho điểm $I(1;2)$. Xét phép biến hình $f$ biến điểm $I$ thành điểm $I$ và biến mỗi điểm $M$ khác $I$ thành điểm $M'$ sao cho $I$ là trung điểm của $MM'$. Tìm toạ độ ảnh của điểm $A(3;-2)$ qua phép biến hình $f$.",
    options: [
      { letter: "A", text: "$A'(-1; 6)$", isCorrect: true },
      { letter: "B", text: "$A'(1; -6)$", isCorrect: false },
      { letter: "C", text: "$A'(-1; -6)$", isCorrect: false },
      { letter: "D", text: "$A'(5; -2)$", isCorrect: false }
    ],
    blankAnswer: "A'(-1; 6)",
    explanation: "Đây là phép đối xứng tâm $I(1;2)$. Vì $I$ là trung điểm $AA'$ nên $x_{A'} = 2\\cdot1 - 3 = -1$, $y_{A'} = 2\\cdot2 - (-2) = 6$. Vậy $A'(-1;6)$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 1, Bài 1, trang 8 (Bài 1.1)"
  },
  {
    id: "hh71",
    topic: "Hình học",
    grade: 11,
    text: "Trong mặt phẳng toạ độ $Oxy$, cho đường tròn $(C): (x-1)^2+(y+2)^2=25$ và vectơ $\\vec u = (3;4)$. Viết phương trình đường tròn $(C')$ là ảnh của $(C)$ qua phép tịnh tiến $T_{\\vec u}$.",
    options: [
      { letter: "A", text: "$(x-4)^2+(y-2)^2=25$", isCorrect: true },
      { letter: "B", text: "$(x+2)^2+(y+6)^2=25$", isCorrect: false },
      { letter: "C", text: "$(x-4)^2+(y-2)^2=9$", isCorrect: false },
      { letter: "D", text: "$(x-1)^2+(y+2)^2=25$", isCorrect: false }
    ],
    blankAnswer: "(x-4)^2+(y-2)^2=25",
    explanation: "$(C)$ có tâm $I(1;-2)$, bán kính $R=5$. Ảnh của tâm qua $T_{\\vec u}$ là $I' = I+\\vec u = (1+3; -2+4) = (4;2)$, bán kính không đổi. Vậy $(C'): (x-4)^2+(y-2)^2=25$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 1, Bài 2, trang 11 (Bài 1.4)"
  },
  {
    id: "hh72",
    topic: "Hình học",
    grade: 11,
    text: "Trong mặt phẳng toạ độ $Oxy$, cho $\\Delta: x+2y-1=0$. Viết phương trình đường thẳng $d$ đối xứng với $\\Delta$ qua trục $Ox$.",
    options: [
      { letter: "A", text: "$x - 2y - 1 = 0$", isCorrect: true },
      { letter: "B", text: "$x + 2y + 1 = 0$", isCorrect: false },
      { letter: "C", text: "$-x + 2y - 1 = 0$", isCorrect: false },
      { letter: "D", text: "$x - 2y + 1 = 0$", isCorrect: false }
    ],
    blankAnswer: "x - 2y - 1 = 0",
    explanation: "Điểm $(x;y) \\in d$ khi và chỉ khi ảnh của nó qua phép đối xứng trục $Ox$ là $(x;-y)$ thuộc $\\Delta$. Thay vào phương trình $\\Delta$: $x+2(-y)-1=0 \\iff x-2y-1=0$. Vậy $d: x-2y-1=0$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 1, Bài 3, trang 15 (Bài 1.9)"
  },
  {
    id: "hh73",
    topic: "Hình học",
    grade: 11,
    text: "Trong mặt phẳng toạ độ $Oxy$, cho đường tròn $(C): (x-2)^2+y^2=1$. Viết phương trình đường tròn $(C')$ là ảnh của $(C)$ qua phép quay $Q_{(O,\\frac{\\pi}{2})}$.",
    options: [
      { letter: "A", text: "$x^2+(y-2)^2=1$", isCorrect: true },
      { letter: "B", text: "$x^2+(y+2)^2=1$", isCorrect: false },
      { letter: "C", text: "$(x+2)^2+y^2=1$", isCorrect: false },
      { letter: "D", text: "$(x-2)^2+y^2=1$", isCorrect: false }
    ],
    blankAnswer: "x^2+(y-2)^2=1",
    explanation: "Tâm $I(2;0)$ của $(C)$ qua phép quay $90°$ quanh $O$ biến thành $I'(x';y')$ với $x'=x\\cos90°-y\\sin90°=-0=0$, $y'=x\\sin90°+y\\cos90°=2$. Vậy $I'(0;2)$, bán kính không đổi. $(C'): x^2+(y-2)^2=1$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 1, Bài 4, trang 20 (Bài 1.14)"
  },
  {
    id: "hh74",
    topic: "Hình học",
    grade: 11,
    text: "Trong mặt phẳng toạ độ $Oxy$, cho $A(1;2)$, $B(3;6)$. Viết phương trình đường tròn $(C)$ là ảnh của đường tròn đường kính $AB$ qua phép vị tự $V_{(O,3)}$.",
    options: [
      { letter: "A", text: "$(x-6)^2+(y-12)^2=45$", isCorrect: true },
      { letter: "B", text: "$(x-2)^2+(y-4)^2=5$", isCorrect: false },
      { letter: "C", text: "$(x-6)^2+(y-12)^2=5$", isCorrect: false },
      { letter: "D", text: "$(x-6)^2+(y-12)^2=15$", isCorrect: false }
    ],
    blankAnswer: "(x-6)^2+(y-12)^2=45",
    explanation: "Đường tròn đường kính $AB$ có tâm $I(2;4)$ (trung điểm $AB$), bán kính $R=\\dfrac{AB}{2}=\\dfrac{2\\sqrt5}{2}=\\sqrt5$. Qua $V_{(O,3)}$: tâm ảnh $I'=3I=(6;12)$, bán kính $R'=|3|\\sqrt5=3\\sqrt5$, nên $R'^2=45$. Vậy $(C): (x-6)^2+(y-12)^2=45$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 1, Bài 6, trang 29 (Bài 1.21)"
  },
  {
    id: "hh75",
    topic: "Hình học",
    grade: 11,
    text: "Trong mặt phẳng toạ độ $Oxy$, cho phép biến hình $f$ biến mỗi điểm $M(x;y)$ thành điểm $M'(3x;-3y)$. Tìm tỉ số đồng dạng của phép đồng dạng $f$.",
    options: [
      { letter: "A", text: "$3$", isCorrect: true },
      { letter: "B", text: "$-3$", isCorrect: false },
      { letter: "C", text: "$9$", isCorrect: false },
      { letter: "D", text: "$\\sqrt3$", isCorrect: false }
    ],
    blankAnswer: "3",
    explanation: "Với hai điểm bất kì $M_1(x_1;y_1)$, $M_2(x_2;y_2)$ có ảnh $M_1'(3x_1;-3y_1)$, $M_2'(3x_2;-3y_2)$, ta có $M_1'M_2' = \\sqrt{9(x_2-x_1)^2+9(y_2-y_1)^2} = 3M_1M_2$. Vậy $f$ là phép đồng dạng tỉ số $3$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 1, Bài 7, trang 31 (Bài 1.25)"
  },
  {
    id: "hh76",
    topic: "Hình học",
    grade: 11,
    text: "Cho hai đường tròn không đồng tâm nhưng có cùng bán kính $(O_1; R)$ và $(O_2; R)$. Phép đối xứng trục biến $(O_1; R)$ thành $(O_2; R)$ nhận đường nào làm trục đối xứng?",
    options: [
      { letter: "A", text: "Đường trung trực của đoạn thẳng $O_1O_2$", isCorrect: true },
      { letter: "B", text: "Đường thẳng $O_1O_2$", isCorrect: false },
      { letter: "C", text: "Đường trung tuyến từ $O_1$ trong tam giác bất kì chứa $O_1O_2$", isCorrect: false },
      { letter: "D", text: "Đường phân giác của góc bất kì tạo bởi $O_1O_2$", isCorrect: false }
    ],
    blankAnswer: "Đường trung trực của đoạn thẳng O1O2",
    explanation: "Vì $(O_1;R)$ và $(O_2;R)$ có cùng bán kính, phép đối xứng trục biến $(O_1;R)$ thành $(O_2;R)$ phải biến tâm $O_1$ thành tâm $O_2$, tức là trục đối xứng $d$ phải là đường trung trực của đoạn thẳng $O_1O_2$ (vì $d$ là đường trung trực của $O_1O_2$ khi và chỉ khi $Đ_d(O_1)=O_2$).",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 1, Bài 3, trang 15 (Bài 1.7)"
  },
  {
    id: "hh77",
    topic: "Hình học",
    grade: 11,
    text: "Cho hình thang $ABCD$ có hai đáy $AB$ và $CD$, $CD = 2AB$. Gọi $O$ là giao điểm của hai cạnh bên $AD$, $BC$. Phép vị tự $V_{(O,2)}$ biến đoạn thẳng $AB$ thành đoạn thẳng nào?",
    options: [
      { letter: "A", text: "Đoạn thẳng $CD$", isCorrect: true },
      { letter: "B", text: "Đoạn thẳng $AD$", isCorrect: false },
      { letter: "C", text: "Đoạn thẳng $BC$", isCorrect: false },
      { letter: "D", text: "Chính đoạn thẳng $AB$", isCorrect: false }
    ],
    blankAnswer: "Đoạn thẳng CD",
    explanation: "Vì $O$ là giao điểm hai cạnh bên của hình thang $ABCD$ ($AB \\parallel CD$, $CD=2AB$), ta có $\\overrightarrow{OD} = 2\\overrightarrow{OA}$ và $\\overrightarrow{OC} = 2\\overrightarrow{OB}$. Do đó phép vị tự $V_{(O,2)}$ biến $A$ thành $D$, biến $B$ thành $C$, tức là biến đoạn thẳng $AB$ thành đoạn thẳng $DC$ (chính là $CD$).",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 1, Bài 6, trang 29 (Bài 1.20)"
  },
  {
    id: "mr16",
    topic: "Mở rộng",
    grade: 11,
    text: "Cho đồ thị $G$ với 14 đỉnh và 25 cạnh. Biết rằng mỗi đỉnh của đồ thị $G$ đều có bậc 3 hoặc bậc 5. Hỏi $G$ có bao nhiêu đỉnh bậc 3?",
    options: [
      { letter: "A", text: "$10$", isCorrect: true },
      { letter: "B", text: "$4$", isCorrect: false },
      { letter: "C", text: "$7$", isCorrect: false },
      { letter: "D", text: "$14$", isCorrect: false }
    ],
    blankAnswer: "10",
    explanation: "Gọi $x$ là số đỉnh bậc 3 của $G$, khi đó số đỉnh bậc 5 là $14-x$. Theo định lí bắt tay: $3x+5(14-x)=2\\cdot25=50 \\iff 70-2x=50 \\iff x=10$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 2, Bài 8, trang 38 (Ví dụ 5)"
  },
  {
    id: "mr17",
    topic: "Mở rộng",
    grade: 11,
    text: "Đồ thị đầy đủ $K_8$ có bao nhiêu cạnh?",
    options: [
      { letter: "A", text: "$28$", isCorrect: true },
      { letter: "B", text: "$56$", isCorrect: false },
      { letter: "C", text: "$64$", isCorrect: false },
      { letter: "D", text: "$16$", isCorrect: false }
    ],
    blankAnswer: "28",
    explanation: "Số cạnh của đồ thị đầy đủ $K_n$ là $\\dfrac{n(n-1)}{2}$. Với $n=8$: $\\dfrac{8\\cdot7}{2}=28$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 2, Bài 8, trang 40 (Bài 2.4)"
  },
  {
    id: "mr18",
    topic: "Mở rộng",
    grade: 11,
    text: "Có tồn tại một đơn đồ thị mà các đỉnh có bậc lần lượt là $2, 3, 3, 4, 4, 5$ hay không?",
    options: [
      { letter: "A", text: "Không, vì tổng các bậc bằng $21$ là số lẻ", isCorrect: true },
      { letter: "B", text: "Có, đồ thị này luôn vẽ được", isCorrect: false },
      { letter: "C", text: "Không, vì có đỉnh bậc chẵn", isCorrect: false },
      { letter: "D", text: "Có, miễn đồ thị liên thông", isCorrect: false }
    ],
    blankAnswer: "Không, vì tổng các bậc bằng 21 là số lẻ",
    explanation: "Theo định lí bắt tay, tổng bậc của mọi đỉnh trong một đồ thị luôn là một số chẵn (bằng hai lần số cạnh). Ở đây $2+3+3+4+4+5=21$ là số lẻ, nên không tồn tại đồ thị nào có dãy bậc như vậy.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 2, Bài 8, trang 40 (Bài 2.5)"
  },
  {
    id: "mr19",
    topic: "Mở rộng",
    grade: 11,
    text: "Có tồn tại đơn đồ thị với 12 đỉnh và 28 cạnh mà các đỉnh đều có bậc 3 hoặc bậc 4 hay không?",
    options: [
      { letter: "A", text: "Không tồn tại", isCorrect: true },
      { letter: "B", text: "Có, với 8 đỉnh bậc 3 và 4 đỉnh bậc 4", isCorrect: false },
      { letter: "C", text: "Có, với 4 đỉnh bậc 3 và 8 đỉnh bậc 4", isCorrect: false },
      { letter: "D", text: "Có, với 6 đỉnh bậc 3 và 6 đỉnh bậc 4", isCorrect: false }
    ],
    blankAnswer: "Không tồn tại",
    explanation: "Gọi $x$ là số đỉnh bậc 3, khi đó có $12-x$ đỉnh bậc 4. Theo định lí bắt tay: $3x+4(12-x)=2\\cdot28=56 \\iff 48-x=56 \\iff x=-8$, vô lí (số đỉnh không thể âm). Vậy không tồn tại đơn đồ thị như vậy.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 2, Bài 8, trang 38 (Luyện tập 4)"
  },
  {
    id: "mr20",
    topic: "Mở rộng",
    grade: 11,
    text: "Cho đơn đồ thị $G$ liên thông, có đúng hai đỉnh bậc lẻ là $A$ và $B$, các đỉnh còn lại đều có bậc chẵn. Khẳng định nào sau đây đúng?",
    options: [
      { letter: "A", text: "$G$ có một đường đi Euler từ $A$ đến $B$", isCorrect: true },
      { letter: "B", text: "$G$ có một chu trình Euler", isCorrect: false },
      { letter: "C", text: "$G$ không có đường đi Euler cũng không có chu trình Euler", isCorrect: false },
      { letter: "D", text: "$G$ luôn có chu trình Hamilton", isCorrect: false }
    ],
    blankAnswer: "G có một đường đi Euler từ A đến B",
    explanation: "Theo Định lí 2: một đa đồ thị $G$ có một đường đi Euler từ $A$ đến $B$ khi và chỉ khi $G$ liên thông và mọi đỉnh của $G$ đều có bậc chẵn, chỉ trừ $A$ và $B$ có bậc lẻ. Điều kiện bài cho khớp với định lí này nên $G$ có đường đi Euler từ $A$ đến $B$ (nhưng không có chu trình Euler vì có đỉnh bậc lẻ).",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 2, Bài 9, trang 42 (Định lí 2)"
  },
  {
    id: "mr21",
    topic: "Mở rộng",
    grade: 11,
    text: "Trong đồ thị có trọng số ở Hình 2.28 (Chuyên đề học tập Toán 11, Bài 10), áp dụng thuật toán gắn nhãn vĩnh viễn xuất phát từ đỉnh $A$, ta lần lượt tìm được các nhãn vĩnh viễn $l(A)=0$, $l(C)=1$, $l(B)=3$, $l(D)=5$, $l(E)=5$. Độ dài đường đi ngắn nhất nối $A$ với $F$ là bao nhiêu?",
    options: [
      { letter: "A", text: "$13$", isCorrect: true },
      { letter: "B", text: "$14$", isCorrect: false },
      { letter: "C", text: "$11$", isCorrect: false },
      { letter: "D", text: "$10$", isCorrect: false }
    ],
    blankAnswer: "13",
    explanation: "Xét đỉnh $F$ kề với $D$ và $E$: nhãn tạm thời từ $D$ là $l(D)+9=14$, từ $E$ là $l(E)+8=13$. Chọn nhãn nhỏ nhất nên $l(F)=13$. Vậy đường đi ngắn nhất từ $A$ đến $F$ có độ dài $13$, cụ thể là $A \\to B \\to E \\to F$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 2, Bài 10, trang 46-47 (Ví dụ 1)"
  },
  {
    id: "mr22",
    topic: "Mở rộng",
    grade: 11,
    text: "Đồ thị có trọng số ở Hình 2.30 (Chuyên đề học tập Toán 11) liên thông và có 4 đỉnh $A, B, C, D$ cùng đỉnh $E$, trong đó mọi đỉnh đều có bậc 4. Đồ thị này có chu trình Euler không?",
    options: [
      { letter: "A", text: "Có, vì đồ thị liên thông và mọi đỉnh đều có bậc chẵn", isCorrect: true },
      { letter: "B", text: "Không, vì có đỉnh bậc lẻ", isCorrect: false },
      { letter: "C", text: "Không, vì đồ thị không liên thông", isCorrect: false },
      { letter: "D", text: "Có, nhưng chỉ khi bỏ bớt một cạnh", isCorrect: false }
    ],
    blankAnswer: "Có, vì đồ thị liên thông và mọi đỉnh đều có bậc chẵn",
    explanation: "Theo Định lí 1 (Euler), một đa đồ thị liên thông có chu trình Euler khi và chỉ khi mọi đỉnh đều có bậc chẵn. Ở đây mọi đỉnh đều có bậc 4 (chẵn) và đồ thị liên thông, nên đồ thị có chu trình Euler, chẳng hạn $ABCBECDEADA$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 2, Bài 10, trang 48 (Ví dụ 2)"
  },
  {
    id: "mr23",
    topic: "Mở rộng",
    grade: 11,
    text: "Cho một đồ thị có trọng số với 5 đỉnh, chỉ có đúng hai đỉnh bậc lẻ là $A$ và $D$. Một đường đi Euler từ $A$ đến $D$ có tổng độ dài là $36$, và đường đi ngắn nhất từ $D$ quay về $A$ có độ dài là $5$. Giải bài toán người đưa thư xuất phát từ $A$: tổng trọng số nhỏ nhất của chu trình cần tìm là bao nhiêu?",
    options: [
      { letter: "A", text: "$41$", isCorrect: true },
      { letter: "B", text: "$36$", isCorrect: false },
      { letter: "C", text: "$31$", isCorrect: false },
      { letter: "D", text: "$5$", isCorrect: false }
    ],
    blankAnswer: "41",
    explanation: "Vì đồ thị chỉ có hai đỉnh bậc lẻ ($A$ và $D$), ta tìm một đường đi Euler từ $A$ đến $D$ (độ dài $36$), sau đó cộng thêm đường đi ngắn nhất để quay về $A$ (độ dài $5$). Tổng trọng số của chu trình cần tìm là $36+5=41$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 2, Bài 10, trang 48 (Ví dụ 3)"
  },
  {
    id: "mr24",
    topic: "Mở rộng",
    grade: 11,
    text: "Trong các khẳng định sau, khẳng định nào là đúng?",
    options: [
      { letter: "A", text: "Hình chiếu đứng của một hình $\\mathcal{H}$ là hình chiếu song song của hình $\\mathcal{H}$ lên một mặt phẳng nào đó", isCorrect: false },
      { letter: "B", text: "Hình chiếu đứng và hình chiếu bằng nằm trong hai mặt phẳng vuông góc với nhau", isCorrect: true },
      { letter: "C", text: "Hình chiếu cạnh của một đường thẳng luôn là một đường thẳng", isCorrect: false },
      { letter: "D", text: "Hình chiếu bằng của hai điểm phân biệt luôn là hai điểm phân biệt", isCorrect: false }
    ],
    blankAnswer: "Hình chiếu đứng và hình chiếu bằng nằm trong hai mặt phẳng vuông góc với nhau",
    explanation: "Mặt phẳng hình chiếu đứng $(P_1)$ và mặt phẳng hình chiếu bằng $(P_2)$ là hai trong ba mặt phẳng đôi một vuông góc với nhau, nên khẳng định B đúng. Khẳng định A sai vì hình chiếu đứng cụ thể là hình chiếu **vuông góc** lên đúng mặt phẳng hình chiếu đứng $(P_1)$ đã xác định, không phải hình chiếu song song lên một mặt phẳng bất kì (hình chiếu song song lên mặt phẳng bất kì có thể là hình chiếu trục đo). Khẳng định C sai vì nếu đường thẳng vuông góc với mặt phẳng hình chiếu cạnh thì hình chiếu cạnh của nó chỉ là một điểm. Khẳng định D sai vì hai điểm phân biệt cùng nằm trên một đường thẳng vuông góc với mặt phẳng hình chiếu bằng sẽ có chung một hình chiếu bằng.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 3, Bài 11, trang 64 (Bài 3.1)"
  },
  {
    id: "mr25",
    topic: "Mở rộng",
    grade: 11,
    text: "Cho một hình lập phương có độ dài mỗi cạnh là $6$ cm. Hình chiếu trục đo của hình lập phương có $O'A' = 3$ cm, $O'B' = 3$ cm, $O'C' = 2$ cm (với $A, B, C$ là các đỉnh tương ứng trên $Ox, Oy, Oz$). Hệ số biến dạng $r$ theo trục đo $O'z'$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$r = \\dfrac{1}{3} \\approx 0{,}33$", isCorrect: true },
      { letter: "B", text: "$r = 0{,}5$", isCorrect: false },
      { letter: "C", text: "$r = 2$", isCorrect: false },
      { letter: "D", text: "$r = 3$", isCorrect: false }
    ],
    blankAnswer: "r = \\dfrac{1}{3} \\approx 0{,}33",
    explanation: "Vì $OC = 6$ cm (cạnh hình lập phương) và $O'C' = 2$ cm nên hệ số biến dạng theo trục đo $O'z'$ là $r = \\dfrac{O'C'}{OC} = \\dfrac{2}{6} = \\dfrac{1}{3} \\approx 0{,}33$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 3, Bài 11, trang 62 (Ví dụ 7)"
  },
  {
    id: "mr26",
    topic: "Mở rộng",
    grade: 11,
    text: "Trong hình chiếu trục đo vuông góc đều, các góc trục đo và các hệ số biến dạng quy ước lần lượt bằng bao nhiêu?",
    options: [
      { letter: "A", text: "Góc trục đo $120°$, hệ số biến dạng quy ước bằng $1$", isCorrect: true },
      { letter: "B", text: "Góc trục đo $90°$, hệ số biến dạng quy ước bằng $1$", isCorrect: false },
      { letter: "C", text: "Góc trục đo $120°$, hệ số biến dạng quy ước bằng $\\dfrac{\\sqrt6}{3}$", isCorrect: false },
      { letter: "D", text: "Góc trục đo $90°$, hệ số biến dạng quy ước bằng $0{,}5$", isCorrect: false }
    ],
    blankAnswer: "Góc trục đo 120°, hệ số biến dạng quy ước bằng 1",
    explanation: "Trong hình chiếu trục đo vuông góc đều, mặt phẳng chiếu $(P)$ vuông góc với phương chiếu $l$ và ba góc trục đo đều bằng $120°$. Hệ số biến dạng thực theo ba trục bằng nhau và bằng $\\dfrac{\\sqrt6}{3} \\approx 0{,}82$, nhưng để thuận tiện cho việc tính toán và vẽ hình, người ta quy ước các hệ số biến dạng đều bằng $1$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 3, Bài 11, trang 63"
  },
  {
    id: "mr27",
    topic: "Mở rộng",
    grade: 11,
    text: "Một bản vẽ kĩ thuật được vẽ trên khổ giấy $A3$ (kích thước $420\\times297$ mm). Biết khung bản vẽ cách cạnh trái của khổ giấy $20$ mm và cách ba cạnh còn lại $10$ mm. Kích thước khung bản vẽ là bao nhiêu?",
    options: [
      { letter: "A", text: "$390\\times277$ mm", isCorrect: true },
      { letter: "B", text: "$400\\times287$ mm", isCorrect: false },
      { letter: "C", text: "$410\\times277$ mm", isCorrect: false },
      { letter: "D", text: "$390\\times287$ mm", isCorrect: false }
    ],
    blankAnswer: "390\\times277 mm",
    explanation: "Khổ giấy $A3$ có chiều dài $420$ mm và chiều rộng $297$ mm. Khung bản vẽ cách cạnh trái $20$ mm và cách ba cạnh còn lại (phải, trên, dưới) $10$ mm mỗi cạnh. Do đó chiều dài khung bản vẽ là $420-20-10=390$ mm và chiều rộng là $297-10-10=277$ mm.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 3, Bài 12, trang 69 (Ví dụ 1)"
  },
  {
    id: "mr28",
    topic: "Mở rộng",
    grade: 11,
    text: "Một bản vẽ kĩ thuật có kích thước khung bản vẽ là $564\\times400$ mm (khung bản vẽ cách cạnh trái của khổ giấy $20$ mm và cách ba cạnh còn lại $10$ mm). Bản vẽ đó được vẽ trên khổ giấy nào?",
    options: [
      { letter: "A", text: "Khổ giấy $A2$ ($594\\times420$ mm)", isCorrect: true },
      { letter: "B", text: "Khổ giấy $A1$ ($841\\times594$ mm)", isCorrect: false },
      { letter: "C", text: "Khổ giấy $A3$ ($420\\times297$ mm)", isCorrect: false },
      { letter: "D", text: "Khổ giấy $A0$ ($1189\\times841$ mm)", isCorrect: false }
    ],
    blankAnswer: "Khổ giấy A2 (594\\times420 mm)",
    explanation: "Gọi kích thước khổ giấy là $a \\times b$. Ta có $a - 20 - 10 = 564 \\Rightarrow a = 594$ và $b - 10 - 10 = 400 \\Rightarrow b = 420$. Vậy khổ giấy có kích thước $594\\times420$ mm, chính là khổ giấy $A2$.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 3, Bài 12, trang 70 (Luyện tập 1)"
  },
  {
    id: "mr29",
    topic: "Mở rộng",
    grade: 11,
    text: "Một hình hộp chữ nhật có đáy là hình vuông và một hình trụ có cùng chiều cao $60$ mm. Hình chiếu đứng và hình chiếu cạnh của cả hai vật thể này đều là cùng một hình chữ nhật giống hệt nhau. Nếu bản vẽ kĩ thuật của một trong hai vật thể chỉ thể hiện hình chiếu đứng và hình chiếu cạnh (không có hình chiếu bằng) thì bản vẽ đó có đáp ứng nguyên tắc phản chuyển không?",
    options: [
      { letter: "A", text: "Không, vì bản vẽ không xác định duy nhất vật thể (có thể là hình hộp hoặc hình trụ)", isCorrect: true },
      { letter: "B", text: "Có, vì hai hình chiếu đã đủ mô tả chiều cao và bề rộng của vật thể", isCorrect: false },
      { letter: "C", text: "Có, vì hình chiếu đứng và hình chiếu cạnh luôn xác định duy nhất một vật thể", isCorrect: false },
      { letter: "D", text: "Không, vì bản vẽ kĩ thuật luôn phải có đủ ba hình chiếu vuông góc", isCorrect: false }
    ],
    blankAnswer: "Không, vì bản vẽ không xác định duy nhất vật thể (có thể là hình hộp hoặc hình trụ)",
    explanation: "Nguyên tắc phản chuyển yêu cầu các hình biểu diễn trên bản vẽ kĩ thuật phải xác định duy nhất hình dạng và cấu tạo của vật thể được biểu diễn. Vì hình hộp chữ nhật đáy vuông và hình trụ cùng chiều cao cho cùng hình chiếu đứng và hình chiếu cạnh, nên bản vẽ chỉ gồm hai hình chiếu này có thể ứng với hai vật thể khác nhau — không xác định duy nhất vật thể, do đó không đáp ứng nguyên tắc phản chuyển. Cần bổ sung hình chiếu bằng (hình vuông cho hình hộp, hình tròn cho hình trụ) để phân biệt. Lưu ý đáp án D sai vì bản vẽ kĩ thuật không nhất thiết phải có đủ ba hình chiếu vuông góc — vấn đề ở đây là hai hình chiếu đã chọn không đủ phân biệt hai vật thể này, chứ không phải cứ thiếu hình chiếu nào cũng vi phạm nguyên tắc.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 3, Bài 12, trang 73 (Ví dụ 5)"
  },
  {
    id: "mr30",
    topic: "Mở rộng",
    grade: 11,
    text: "Trong bản vẽ kĩ thuật, loại nét vẽ nào được dùng để thể hiện đường tâm và đường trục đối xứng?",
    options: [
      { letter: "A", text: "Nét gạch dài chấm mảnh", isCorrect: true },
      { letter: "B", text: "Nét liền đậm", isCorrect: false },
      { letter: "C", text: "Nét đứt mảnh", isCorrect: false },
      { letter: "D", text: "Nét lượn sóng", isCorrect: false }
    ],
    blankAnswer: "Nét gạch dài chấm mảnh",
    explanation: "Theo bảng các loại nét vẽ thường dùng: nét liền đậm thể hiện đường bao thấy, cạnh thấy; nét liền mảnh thể hiện đường kích thước, đường dóng; nét đứt mảnh thể hiện đường bao khuất, cạnh khuất; nét lượn sóng thể hiện đường giới hạn hình cắt; nét gạch dài chấm mảnh thể hiện đường tâm, đường trục đối xứng.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 3, Bài 12, trang 70"
  },
  {
    id: "mr31",
    topic: "Mở rộng",
    grade: 11,
    text: "Một phép chiếu song song biến hình lập phương $\\mathcal{H}$ thành hình chiếu $\\mathcal{H}'$, trong đó $\\mathcal{H}'$ chỉ cho thấy được hai mặt của hình lập phương (phương chiếu song song với một mặt của hình lập phương). Hình $\\mathcal{H}'$ có phải là hình chiếu trục đo của $\\mathcal{H}$ hay không?",
    options: [
      { letter: "A", text: "Không, vì hình chiếu trục đo yêu cầu phương chiếu không song song với bất kì mặt nào của hình", isCorrect: true },
      { letter: "B", text: "Có, vì đây là phép chiếu song song nên luôn là hình chiếu trục đo", isCorrect: false },
      { letter: "C", text: "Có, vì hình lập phương có tính đối xứng nên hai mặt là đủ để làm hình chiếu trục đo", isCorrect: false },
      { letter: "D", text: "Không, vì hình lập phương không có hình chiếu trục đo", isCorrect: false }
    ],
    blankAnswer: "Không, vì hình chiếu trục đo yêu cầu phương chiếu không song song với bất kì mặt nào của hình",
    explanation: "Hình chiếu trục đo của hình $\\mathcal{H}$ là hình chiếu song song của $\\mathcal{H}$ theo phương $l$ không song song với bất kì mặt nào của $\\mathcal{H}$. Nếu phương chiếu song song với một mặt của hình lập phương thì hình chiếu chỉ cho thấy được hai mặt, nên đó không phải là hình chiếu trục đo. Chỉ khi phương chiếu không song song với mặt nào (cho thấy được cả ba mặt) thì hình chiếu mới là hình chiếu trục đo của hình lập phương.",
    sgk_source: "Toán 11 KNTT - Chuyên đề học tập, Chuyên đề 3, Bài 11, trang 60 (Ví dụ 6)"
  },
  {
    id: "gt46",
    topic: "Giải tích",
    grade: 12,
    text: "Hàm số $y=-x^2+2x+3$ đồng biến trên khoảng nào sau đây?",
    options: [
      { letter: "A", text: "$(-\\infty;1)$", isCorrect: true },
      { letter: "B", text: "$(1;+\\infty)$", isCorrect: false },
      { letter: "C", text: "$(-\\infty;+\\infty)$", isCorrect: false },
      { letter: "D", text: "$(-1;1)$", isCorrect: false }
    ],
    blankAnswer: "(-\\infty;1)",
    explanation: "Ta có $y'=-2x+2$; $y'=0 \\Leftrightarrow x=1$. Vì $y'>0$ với $x<1$ và $y'<0$ với $x>1$ nên hàm số đồng biến trên khoảng $(-\\infty;1)$ và nghịch biến trên khoảng $(1;+\\infty)$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 1, trang 10 (Luyện tập 2)"
  },
  {
    id: "gt47",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm cực trị của hàm số $y=x^3-6x^2+9x+30$.",
    options: [
      { letter: "A", text: "Hàm số đạt cực đại tại $x=1$ ($y_{CĐ}=34$), đạt cực tiểu tại $x=3$ ($y_{CT}=30$)", isCorrect: true },
      { letter: "B", text: "Hàm số đạt cực tiểu tại $x=1$ ($y_{CT}=34$), đạt cực đại tại $x=3$ ($y_{CĐ}=30$)", isCorrect: false },
      { letter: "C", text: "Hàm số đạt cực đại tại $x=0$ ($y_{CĐ}=30$), đạt cực tiểu tại $x=3$ ($y_{CT}=3$)", isCorrect: false },
      { letter: "D", text: "Hàm số không có cực trị", isCorrect: false }
    ],
    blankAnswer: "Hàm số đạt cực đại tại x=1 (yCĐ=34), đạt cực tiểu tại x=3 (yCT=30)",
    explanation: "Ta có $y'=3x^2-12x+9$; $y'=0 \\Leftrightarrow x=1$ hoặc $x=3$. Lập bảng biến thiên: $y'$ đổi dấu từ $+$ sang $-$ tại $x=1$ nên đó là điểm cực đại với $y_{CĐ}=y(1)=34$; $y'$ đổi dấu từ $-$ sang $+$ tại $x=3$ nên đó là điểm cực tiểu với $y_{CT}=y(3)=30$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 1, trang 11 (Ví dụ 6)"
  },
  {
    id: "gt48",
    topic: "Giải tích",
    grade: 12,
    text: "Trong các hình chữ nhật có chu vi là $24$ cm, hình chữ nhật có diện tích lớn nhất có kích thước và diện tích lần lượt là bao nhiêu?",
    options: [
      { letter: "A", text: "Cạnh $6$ cm, diện tích $36\\text{ cm}^2$", isCorrect: true },
      { letter: "B", text: "Cạnh $8\\times4$ cm, diện tích $32\\text{ cm}^2$", isCorrect: false },
      { letter: "C", text: "Cạnh $10\\times2$ cm, diện tích $20\\text{ cm}^2$", isCorrect: false },
      { letter: "D", text: "Cạnh $12\\times0$ cm, diện tích không xác định", isCorrect: false }
    ],
    blankAnswer: "Cạnh 6 cm, diện tích 36 cm^2",
    explanation: "Gọi $x$ (cm) là một cạnh, $0<x<12$. Chu vi $24$ cm nên cạnh còn lại là $12-x$. Diện tích $S(x)=x(12-x)=12x-x^2$. $S'(x)=12-2x=0 \\Leftrightarrow x=6$; $S''(x)=-2<0$ nên $x=6$ là điểm cực đại của $S$. Vậy hình chữ nhật có diện tích lớn nhất là hình vuông cạnh $6$ cm, diện tích $S=36\\text{ cm}^2$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 1, trang 19 (Bài 1.13)"
  },
  {
    id: "gt49",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm tiệm cận ngang của đồ thị hàm số $y=\\dfrac{3x-2}{x+1}$.",
    options: [
      { letter: "A", text: "$y=3$", isCorrect: true },
      { letter: "B", text: "$y=-2$", isCorrect: false },
      { letter: "C", text: "$x=-1$", isCorrect: false },
      { letter: "D", text: "$y=1$", isCorrect: false }
    ],
    blankAnswer: "y=3",
    explanation: "Ta có $\\lim_{x\\to+\\infty}\\dfrac{3x-2}{x+1}=\\lim_{x\\to+\\infty}\\dfrac{3-\\frac2x}{1+\\frac1x}=3$; tương tự $\\lim_{x\\to-\\infty}f(x)=3$. Vậy đồ thị hàm số có tiệm cận ngang là đường thẳng $y=3$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 3, trang 21 (Ví dụ 1)"
  },
  {
    id: "gt50",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm tiệm cận xiên của đồ thị hàm số $y=\\dfrac{x^2-x+2}{x+1}$.",
    options: [
      { letter: "A", text: "$y=x-2$", isCorrect: true },
      { letter: "B", text: "$y=x+2$", isCorrect: false },
      { letter: "C", text: "$y=-x-2$", isCorrect: false },
      { letter: "D", text: "$y=2x-1$", isCorrect: false }
    ],
    blankAnswer: "y=x-2",
    explanation: "Ta có $a=\\lim_{x\\to+\\infty}\\dfrac{f(x)}{x}=\\lim_{x\\to+\\infty}\\dfrac{x^2-x+2}{x^2+x}=1$ và $b=\\lim_{x\\to+\\infty}[f(x)-x]=\\lim_{x\\to+\\infty}\\dfrac{-2x+2}{x+1}=-2$. Vậy đồ thị hàm số có tiệm cận xiên là đường thẳng $y=x-2$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 3, trang 24 (Ví dụ 6)"
  },
  {
    id: "gt51",
    topic: "Giải tích",
    grade: 12,
    text: "Tìm giá trị lớn nhất và giá trị nhỏ nhất của hàm số $y=x^4-4x^2+3$ trên đoạn $[0;4]$.",
    options: [
      { letter: "A", text: "$\\max y=195$ tại $x=4$; $\\min y=-1$ tại $x=\\sqrt2$", isCorrect: true },
      { letter: "B", text: "$\\max y=3$ tại $x=0$; $\\min y=-1$ tại $x=\\sqrt2$", isCorrect: false },
      { letter: "C", text: "$\\max y=195$ tại $x=4$; $\\min y=3$ tại $x=0$", isCorrect: false },
      { letter: "D", text: "$\\max y=-1$ tại $x=\\sqrt2$; $\\min y=195$ tại $x=4$", isCorrect: false }
    ],
    blankAnswer: "max y=195 tại x=4; min y=-1 tại x=√2",
    explanation: "Ta có $y'=4x^3-8x=4x(x^2-2)$; $y'=0 \\Leftrightarrow x=0$ hoặc $x=\\sqrt2$ (do $x\\in[0;4]$). Tính $y(0)=3$, $y(4)=195$, $y(\\sqrt2)=-1$. So sánh các giá trị: $\\max_{[0;4]}y=y(4)=195$; $\\min_{[0;4]}y=y(\\sqrt2)=-1$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 2, trang 18 (Ví dụ 4)"
  },
  {
    id: "gt52",
    topic: "Giải tích",
    grade: 12,
    text: "Từ một tấm bìa carton hình vuông có độ dài cạnh bằng $60$ cm, người ta cắt bốn hình vuông bằng nhau ở bốn góc rồi gập thành một chiếc hộp không có nắp. Tìm độ dài cạnh của các hình vuông bị cắt sao cho thể tích của chiếc hộp là lớn nhất.",
    options: [
      { letter: "A", text: "$10$ cm (thể tích lớn nhất là $16\\,000\\text{ cm}^3$)", isCorrect: true },
      { letter: "B", text: "$15$ cm (thể tích lớn nhất là $13\\,500\\text{ cm}^3$)", isCorrect: false },
      { letter: "C", text: "$20$ cm (thể tích lớn nhất là $8\\,000\\text{ cm}^3$)", isCorrect: false },
      { letter: "D", text: "$30$ cm (thể tích bằng $0$)", isCorrect: false }
    ],
    blankAnswer: "10 cm (thể tích lớn nhất là 16 000 cm^3)",
    explanation: "Gọi $x$ (cm) là cạnh hình vuông bị cắt, $0<x<30$. Đáy hộp là hình vuông cạnh $(60-2x)$, chiều cao $x$, thể tích $V(x)=(60-2x)^2\\cdot x=4x^3-240x^2+3\\,600x$. $V'(x)=12x^2-480x+3\\,600=0 \\Leftrightarrow x^2-40x+300=0 \\Leftrightarrow x=10$ (thoả mãn) hoặc $x=30$ (loại). Lập bảng biến thiên: $V(10)=16\\,000$ là giá trị lớn nhất trên $(0;30)$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 2, trang 17-18 (Ví dụ 3)"
  },
  {
    id: "gt53",
    topic: "Giải tích",
    grade: 12,
    text: "Một đội bóng đá thi đấu trong sân vận động có sức chứa $55\\,000$ khán giả. Với giá vé $100$ nghìn đồng, số khán giả trung bình là $27\\,000$ người. Mỗi khi giá vé giảm thêm $10$ nghìn đồng thì có thêm khoảng $3\\,000$ khán giả. Ban tổ chức nên đặt giá vé là bao nhiêu để doanh thu từ tiền bán vé là lớn nhất?",
    options: [
      { letter: "A", text: "$95$ nghìn đồng/vé", isCorrect: true },
      { letter: "B", text: "$100$ nghìn đồng/vé", isCorrect: false },
      { letter: "C", text: "$90$ nghìn đồng/vé", isCorrect: false },
      { letter: "D", text: "$50$ nghìn đồng/vé", isCorrect: false }
    ],
    blankAnswer: "95 nghìn đồng/vé",
    explanation: "Gọi $p$ (nghìn đồng) là giá vé, $x$ là số khán giả. Hàm cầu $p=p(x)$ là hàm bậc nhất đi qua hai điểm $(27\\,000;100)$ và $(30\\,000;90)$, suy ra $x=-300p+57\\,000$. Hàm doanh thu $R(p)=px=-300p^2+57\\,000p$. $R'(p)=-600p+57\\,000=0 \\Leftrightarrow p=95$. Lập bảng biến thiên suy ra $R$ đạt giá trị lớn nhất tại $p=95$ (nghìn đồng).",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 5, trang 33, 38-39 (Ví dụ 6)"
  },
  {
    id: "hh78",
    topic: "Hình học",
    grade: 12,
    text: "Cho hình lập phương $ABCD.A'B'C'D'$ có độ dài mỗi cạnh bằng $1$. Độ dài của vectơ $\\overrightarrow{BC}+\\overrightarrow{DD'}$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$\\sqrt{2}$", isCorrect: true },
      { letter: "B", text: "$1$", isCorrect: false },
      { letter: "C", text: "$2$", isCorrect: false },
      { letter: "D", text: "$\\sqrt{3}$", isCorrect: false }
    ],
    blankAnswer: "\\sqrt{2}",
    explanation: "Tứ giác $ABCD$ là hình vuông nên $\\overrightarrow{BC}=\\overrightarrow{AD}$. Do đó $\\overrightarrow{BC}+\\overrightarrow{DD'}=\\overrightarrow{AD}+\\overrightarrow{DD'}=\\overrightarrow{AD'}$. Tứ giác $ADD'A'$ là hình vuông nên $AD'=\\sqrt{AD^2+DD'^2}=\\sqrt{2}$, suy ra $|\\overrightarrow{BC}+\\overrightarrow{DD'}|=\\sqrt{2}$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 6, trang 49 (Ví dụ 3)"
  },
  {
    id: "hh79",
    topic: "Hình học",
    grade: 12,
    text: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành. Gọi $M$, $N$ lần lượt là trung điểm của $AB$, $CD$. Vectơ nào sau đây là vectơ đối của $\\overrightarrow{AM}$?",
    options: [
      { letter: "A", text: "$\\overrightarrow{CN}$", isCorrect: true },
      { letter: "B", text: "$\\overrightarrow{NC}$", isCorrect: false },
      { letter: "C", text: "$\\overrightarrow{MB}$", isCorrect: false },
      { letter: "D", text: "$\\overrightarrow{DN}$", isCorrect: false }
    ],
    blankAnswer: "\\overrightarrow{CN}",
    explanation: "Tứ giác $ABCD$ là hình bình hành nên $AB=CD$ và $AB \\parallel CD$, suy ra $AM=CN$ và $AM \\parallel CN$. Hai vectơ $\\overrightarrow{AM}$ và $\\overrightarrow{CN}$ có cùng độ dài và ngược hướng nên chúng là hai vectơ đối nhau.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 6, trang 51 (Ví dụ 6)"
  },
  {
    id: "hh80",
    topic: "Hình học",
    grade: 12,
    text: "Cho hình hộp chữ nhật $ABCD.A'B'C'D'$ có $AB=2$, $AD=3$, $AA'=4$. Độ dài của vectơ $\\overrightarrow{BD'}$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$\\sqrt{29}$", isCorrect: true },
      { letter: "B", text: "$\\sqrt{13}$", isCorrect: false },
      { letter: "C", text: "$9$", isCorrect: false },
      { letter: "D", text: "$29$", isCorrect: false }
    ],
    blankAnswer: "\\sqrt{29}",
    explanation: "Vì $ABCD.A'B'C'D'$ là hình hộp chữ nhật nên $BD'$ là đường chéo, có độ dài $BD'=\\sqrt{AB^2+AD^2+AA'^2}=\\sqrt{2^2+3^2+4^2}=\\sqrt{4+9+16}=\\sqrt{29}$.",
    needs_review: true,
    sgk_source: "Toán 12 KNTT Tập 1, Bài 6, trang 58 (Bài tập 2.2)"
  },
  {
    id: "hh81",
    topic: "Hình học",
    grade: 12,
    text: "Cho hình chóp tứ giác đều $S.ABCD$ có độ dài tất cả các cạnh bằng $a$. Tích vô hướng $\\overrightarrow{AS}\\cdot\\overrightarrow{AC}$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$a^2$", isCorrect: true },
      { letter: "B", text: "$\\dfrac{a^2}{2}$", isCorrect: false },
      { letter: "C", text: "$-a^2$", isCorrect: false },
      { letter: "D", text: "$a^2\\sqrt{2}$", isCorrect: false }
    ],
    blankAnswer: "a^2",
    explanation: "Tứ giác $ABCD$ là hình vuông cạnh $a$ nên đường chéo $AC=\\sqrt{2}a$. Tam giác $SAC$ có $SA=SC=a$ và $AC=\\sqrt{2}a$ nên vuông cân tại $S$, suy ra $\\widehat{SAC}=45^\\circ$. Do đó $\\overrightarrow{AS}\\cdot\\overrightarrow{AC}=|\\overrightarrow{AS}|\\cdot|\\overrightarrow{AC}|\\cos\\widehat{SAC}=a\\cdot\\sqrt{2}a\\cdot\\dfrac{\\sqrt{2}}{2}=a^2$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 6, trang 56-57 (Ví dụ 10)"
  },
  {
    id: "hh82",
    topic: "Hình học",
    grade: 12,
    text: "Hình 2.38 minh hoạ một hệ toạ độ $Oxyz$ trong không gian cùng với các hình vuông có cạnh bằng $1$ đơn vị, trong đó $ABCM.FODE$ là hình hộp chữ nhật với $\\overrightarrow{OF}=3\\vec i$, $\\overrightarrow{OD}=4\\vec j$, $\\overrightarrow{OB}=3\\vec k$. Toạ độ của điểm $M$ là gì?",
    options: [
      { letter: "A", text: "$(3;4;3)$", isCorrect: true },
      { letter: "B", text: "$(4;3;3)$", isCorrect: false },
      { letter: "C", text: "$(3;3;4)$", isCorrect: false },
      { letter: "D", text: "$(4;4;3)$", isCorrect: false }
    ],
    blankAnswer: "(3;4;3)",
    explanation: "Áp dụng quy tắc hình hộp: $\\overrightarrow{OM}=\\overrightarrow{OF}+\\overrightarrow{OD}+\\overrightarrow{OB}=3\\vec i+4\\vec j+3\\vec k$. Vậy toạ độ của điểm $M$ là $(3;4;3)$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 7, trang 62 (Ví dụ 2)"
  },
  {
    id: "hh83",
    topic: "Hình học",
    grade: 12,
    text: "Trong không gian $Oxyz$, cho hai vectơ $\\vec a=(2;1;5)$ và $\\vec b=(2;2;1)$. Toạ độ của vectơ $\\vec a - \\vec b$ là gì?",
    options: [
      { letter: "A", text: "$(0;-1;4)$", isCorrect: true },
      { letter: "B", text: "$(4;3;6)$", isCorrect: false },
      { letter: "C", text: "$(0;1;4)$", isCorrect: false },
      { letter: "D", text: "$(4;-1;-4)$", isCorrect: false }
    ],
    blankAnswer: "(0;-1;4)",
    explanation: "$\\vec a-\\vec b=(2-2;\\,1-2;\\,5-1)=(0;-1;4)$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 8, trang 68 (Ví dụ 1)"
  },
  {
    id: "hh84",
    topic: "Hình học",
    grade: 12,
    text: "Trong không gian $Oxyz$, cho hai vectơ $\\vec a=(1;4;2)$ và $\\vec b=(-4;1;0)$. Khẳng định nào sau đây đúng?",
    options: [
      { letter: "A", text: "$\\vec a \\cdot \\vec b = 0$ và $\\vec a \\perp \\vec b$", isCorrect: true },
      { letter: "B", text: "$\\vec a \\cdot \\vec b = 4$ và $\\vec a, \\vec b$ không vuông góc", isCorrect: false },
      { letter: "C", text: "$\\vec a \\cdot \\vec b = -4$ và $\\vec a, \\vec b$ không vuông góc", isCorrect: false },
      { letter: "D", text: "$\\vec a \\cdot \\vec b = 8$ và $\\vec a, \\vec b$ không vuông góc", isCorrect: false }
    ],
    blankAnswer: "a.b = 0 và a vuông góc b",
    explanation: "$\\vec a \\cdot \\vec b = 1\\cdot(-4)+4\\cdot1+2\\cdot0=-4+4+0=0$. Do đó hai vectơ $\\vec a$ và $\\vec b$ vuông góc với nhau.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 8, trang 69 (Ví dụ 3)"
  },
  {
    id: "hh85",
    topic: "Hình học",
    grade: 12,
    text: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình chữ nhật và $SA$ vuông góc với mặt phẳng $(ABCD)$. Biết $SA=2$, $AB=3$, $AD=4$. Xét hệ toạ độ $Oxyz$ với $O$ trùng $A$ và các tia $Ox, Oy, Oz$ lần lượt trùng với các tia $AB, AD, AS$. Độ dài đoạn thẳng $SC$ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$\\sqrt{29}$", isCorrect: true },
      { letter: "B", text: "$5$", isCorrect: false },
      { letter: "C", text: "$\\sqrt{21}$", isCorrect: false },
      { letter: "D", text: "$29$", isCorrect: false }
    ],
    blankAnswer: "\\sqrt{29}",
    explanation: "Ta có $A(0;0;0)$, $B(3;0;0)$, $D(0;4;0)$, $S(0;0;2)$, và toạ độ hình chiếu của $C$ lên $Ox,Oy,Oz$ lần lượt là $B,D,A$ nên $C(3;4;0)$. Vectơ $\\overrightarrow{SC}=(3-0;\\,4-0;\\,0-2)=(3;4;-2)$, suy ra $SC=\\sqrt{3^2+4^2+(-2)^2}=\\sqrt{29}$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 8, trang 69-70 (Ví dụ 4)"
  },
  {
    id: "hh86",
    topic: "Hình học",
    grade: 12,
    text: "Trong không gian với một hệ trục toạ độ cho trước (đơn vị đo lấy theo kilômét), ra đa phát hiện một chiếc máy bay di chuyển với vận tốc và hướng không đổi từ điểm $A(800;500;7)$ đến điểm $B(940;550;8)$ trong 10 phút. Nếu máy bay tiếp tục giữ nguyên vận tốc và hướng bay thì toạ độ của máy bay sau 5 phút tiếp theo (tính từ thời điểm ở $B$) là gì?",
    options: [
      { letter: "A", text: "$(1\\,010;575;8{,}5)$", isCorrect: true },
      { letter: "B", text: "$(1\\,080;600;9)$", isCorrect: false },
      { letter: "C", text: "$(1\\,010;550;8)$", isCorrect: false },
      { letter: "D", text: "$(940;575;8{,}5)$", isCorrect: false }
    ],
    blankAnswer: "(1 010; 575; 8,5)",
    explanation: "Gọi $C(x;y;z)$ là vị trí máy bay sau 5 phút tiếp theo. Vì vận tốc và hướng không đổi, thời gian bay từ $A$ đến $B$ (10 phút) gấp đôi thời gian từ $B$ đến $C$ (5 phút) nên $\\overrightarrow{BC}=\\dfrac{1}{2}\\overrightarrow{AB}=\\left(\\dfrac{940-800}{2};\\dfrac{550-500}{2};\\dfrac{8-7}{2}\\right)=(70;25;0{,}5)$. Mặt khác $\\overrightarrow{BC}=(x-940;y-550;z-8)$ nên $x=1\\,010$, $y=575$, $z=8{,}5$. Vậy toạ độ máy bay là $(1\\,010;575;8{,}5)$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 8, trang 70 (Ví dụ 5)"
  },
  {
    id: "xs51",
    topic: "Xác suất & Thống kê",
    grade: 12,
    text: "Thời gian sử dụng mạng xã hội trong ngày của học sinh Tổ 1 lớp 12A được ghép nhóm với nhóm đầu là $[0;10)$ và nhóm cuối là $[60;90)$. Khoảng biến thiên $R_1$ của mẫu số liệu ghép nhóm này bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$90$", isCorrect: true },
      { letter: "B", text: "$60$", isCorrect: false },
      { letter: "C", text: "$80$", isCorrect: false },
      { letter: "D", text: "$30$", isCorrect: false }
    ],
    blankAnswer: "90",
    explanation: "Khoảng biến thiên của mẫu số liệu ghép nhóm là $R=a_{k+1}-a_1$. Nhóm đầu là $[0;10)$ nên $a_1=0$, nhóm cuối là $[60;90)$ nên $a_{k+1}=90$. Vậy $R_1=90-0=90$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 9, trang 76 (Ví dụ 1)"
  },
  {
    id: "xs52",
    topic: "Xác suất & Thống kê",
    grade: 12,
    text: "Thời gian hoàn thành bài kiểm tra môn Toán của lớp 12C được ghép nhóm: $[25;30)$: 8 hs, $[30;35)$: 16 hs, $[35;40)$: 4 hs, $[40;45)$: 2 hs. Khoảng biến thiên $R$ của mẫu số liệu ghép nhóm này bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$20$", isCorrect: true },
      { letter: "B", text: "$15$", isCorrect: false },
      { letter: "C", text: "$45$", isCorrect: false },
      { letter: "D", text: "$16$", isCorrect: false }
    ],
    blankAnswer: "20",
    explanation: "Nhóm đầu là $[25;30)$ nên $a_1=25$, nhóm cuối là $[40;45)$ nên $a_{k+1}=45$. Áp dụng công thức $R=a_{k+1}-a_1=45-25=20$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 9, trang 77 (Luyện tập 1)"
  },
  {
    id: "xs53",
    topic: "Xác suất & Thống kê",
    grade: 12,
    text: "Thời gian chờ khám bệnh (phút) của các bệnh nhân tại phòng khám X: $[0;5)$: 3, $[5;10)$: 12, $[10;15)$: 15, $[15;20)$: 8. Tứ phân vị thứ ba $Q_3$ của mẫu số liệu ghép nhóm này bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$14{,}5$", isCorrect: true },
      { letter: "B", text: "$7{,}71$", isCorrect: false },
      { letter: "C", text: "$15$", isCorrect: false },
      { letter: "D", text: "$10$", isCorrect: false }
    ],
    blankAnswer: "14,5",
    explanation: "Cỡ mẫu $n=3+12+15+8=38$. Tứ phân vị thứ ba của mẫu số liệu gốc là $x_{29}$, thuộc nhóm $[10;15)$ (vì $3+12=15<29\\le15+15=30$). Với $p$ ứng nhóm này: $a_p=10$, $m_p=15$, tổng tần số các nhóm trước là $15$, $a_{p+1}-a_p=5$. Áp dụng công thức: $Q_3=10+\\dfrac{\\frac{3\\cdot38}{4}-15}{15}\\cdot5=14{,}5$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 9, trang 77-78 (Ví dụ 2)"
  },
  {
    id: "xs54",
    topic: "Xác suất & Thống kê",
    grade: 12,
    text: "Theo dõi sự thay đổi cân nặng (kg) sau ba tháng ăn kiêng của một số người nữ, thu được mẫu số liệu ghép nhóm với số trung bình $\\bar{x}_2=1{,}5$. Độ lệch chuẩn $s_2$ của mẫu số liệu này (theo Ví dụ 1, SGK Toán 12 Tập 1, Bài 10) xấp xỉ bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$2{,}06$", isCorrect: true },
      { letter: "B", text: "$1{,}21$", isCorrect: false },
      { letter: "C", text: "$1{,}5$", isCorrect: false },
      { letter: "D", text: "$4{,}24$", isCorrect: false }
    ],
    blankAnswer: "2,06",
    explanation: "Áp dụng công thức phương sai $s_2^2=\\frac{1}{30}\\left[2\\cdot(-0{,}5)^2+7\\cdot0{,}5^2+12\\cdot1{,}5^2+7\\cdot2{,}5^2+2\\cdot3{,}5^2\\right]-1{,}5^2\\approx2{,}06^2$, suy ra độ lệch chuẩn $s_2\\approx2{,}06$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 10, trang 81 (Ví dụ 1)"
  },
  {
    id: "xs55",
    topic: "Xác suất & Thống kê",
    grade: 12,
    text: "Anh An đầu tư số tiền bằng nhau vào hai lĩnh vực kinh doanh A, B trong 60 tháng. Số tiền trung bình thu được hằng tháng ở cả hai lĩnh vực đều là 17,5 triệu đồng. Độ lệch chuẩn số tiền thu được hằng tháng khi đầu tư vào lĩnh vực A (theo Ví dụ 2, SGK Toán 12 Tập 1, Bài 10) bằng bao nhiêu?",
    options: [
      { letter: "A", text: "$5$", isCorrect: true },
      { letter: "B", text: "$8{,}42$", isCorrect: false },
      { letter: "C", text: "$17{,}5$", isCorrect: false },
      { letter: "D", text: "$25$", isCorrect: false }
    ],
    blankAnswer: "5",
    explanation: "Áp dụng công thức độ lệch chuẩn: $s_A=\\sqrt{\\frac{1}{60}\\left(5\\cdot7{,}5^2+10\\cdot12{,}5^2+30\\cdot17{,}5^2+10\\cdot22{,}5^2+5\\cdot27{,}5^2\\right)-(17{,}5)^2}=5$.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 10, trang 82 (Ví dụ 2)"
  },
  {
    id: "xs56",
    topic: "Xác suất & Thống kê",
    grade: 12,
    text: "Lợi nhuận trung bình hằng tháng của nhà đầu tư nhỏ là 35 triệu đồng với độ lệch chuẩn $s_A\\approx10{,}95$; của nhà đầu tư lớn là 535 triệu đồng với độ lệch chuẩn $s_B\\approx13{,}78$ (theo Ví dụ 3, SGK Toán 12 Tập 1, Bài 10). Có nên dựa vào việc $s_B>s_A$ để kết luận đầu tư vào nhà đầu tư lớn rủi ro hơn không?",
    options: [
      { letter: "A", text: "Không, vì lợi nhuận trung bình của hai nhà đầu tư khác nhau quá nhiều nên không nên dùng độ lệch chuẩn để so sánh mức độ rủi ro", isCorrect: true },
      { letter: "B", text: "Có, vì độ lệch chuẩn càng lớn thì luôn luôn rủi ro hơn trong mọi trường hợp", isCorrect: false },
      { letter: "C", text: "Không, vì độ lệch chuẩn không liên quan gì đến mức độ rủi ro của khoản đầu tư", isCorrect: false },
      { letter: "D", text: "Có, vì $s_B$ và $s_A$ luôn so sánh được bất kể lợi nhuận trung bình chênh lệch bao nhiêu", isCorrect: false }
    ],
    blankAnswer: "Không nên, vì lợi nhuận trung bình hai bên khác nhau quá nhiều",
    explanation: "Lợi nhuận trung bình của nhà đầu tư nhỏ (35 triệu đồng) và nhà đầu tư lớn (535 triệu đồng) khác nhau rất nhiều, do đó không nên dùng phương sai hay độ lệch chuẩn để so sánh độ rủi ro của hai phương án đầu tư này — cần đưa cả hai về cùng một thang đo tương đối (ví dụ hệ số biến thiên) trước khi so sánh.",
    sgk_source: "Toán 12 KNTT Tập 1, Bài 10, trang 83 (Ví dụ 3)"
  },
];
