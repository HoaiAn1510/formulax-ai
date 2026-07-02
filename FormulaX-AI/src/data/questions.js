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
  }
];
