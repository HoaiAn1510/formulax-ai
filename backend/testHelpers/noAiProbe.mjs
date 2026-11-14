// Chặn MỌI lời gọi AI (Gemini, Groq) trong test route — in dấu "[test:ai_call]" để test khẳng định không có.
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = typeof input === "string" ? input : input?.url || "";
  if (url.includes("generativelanguage.googleapis.com") || url.includes("api.groq.com")) {
    process.stderr.write("[test:ai_call]\n");
    throw new Error("Unexpected AI call in test");
  }
  return originalFetch(input, init);
};
