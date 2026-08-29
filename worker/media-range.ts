export type ByteRangeResult =
  | { kind: "none" }
  | { kind: "invalid" }
  | { kind: "range"; offset: number; length: number; end: number };

export function parseSingleByteRange(header: string | null, size: number): ByteRangeResult {
  if (!header) return { kind: "none" };
  if (!Number.isSafeInteger(size) || size <= 0) return { kind: "invalid" };

  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return { kind: "invalid" };

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return { kind: "invalid" };
    const length = Math.min(suffixLength, size);
    const offset = size - length;
    return { kind: "range", offset, length, end: size - 1 };
  }

  const offset = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(requestedEnd) || offset >= size || requestedEnd < offset) {
    return { kind: "invalid" };
  }
  const end = Math.min(requestedEnd, size - 1);
  return { kind: "range", offset, length: end - offset + 1, end };
}
