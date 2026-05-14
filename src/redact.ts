const SECRET_PATTERNS: RegExp[] = [
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  /\bsk-[A-Za-z0-9]{20,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /(?<=(api[_-]?key|token|secret|password)["'\s:=]+)[^"'\s,}]{8,}/gi,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g
];

export function redactSecrets(input: Buffer): { content: Buffer; redacted: boolean } {
  if (input.includes(0)) return { content: input, redacted: false };
  let text = input.toString("utf8");
  let redacted = false;
  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern, () => {
      redacted = true;
      return "[REDACTED]";
    });
  }
  return { content: Buffer.from(text, "utf8"), redacted };
}
