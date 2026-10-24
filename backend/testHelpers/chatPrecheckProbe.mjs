const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = typeof input === "string" ? input : input?.url || "";
  if (url.includes("api.groq.com")) {
    process.stderr.write("[test:groq_call]\n");
    throw new Error("Unexpected Groq call from invalid-angle precheck test");
  }
  return originalFetch(input, init);
};
