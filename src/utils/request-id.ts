/** A function, not a bare `crypto.randomUUID()`: that exists in a secure context only,
 *  so over plain HTTP it took sign-in down. Serve HTTPS anyway — docs/DEPLOY.md. */

const VERSION_BYTE = 6;
const VARIANT_BYTE = 8;
const UUID_BYTES = 16;
const HEX = 16;
const BYTE_HEX_WIDTH = 2;
const GROUPS = [8, 12, 16, 20] as const;

function uuidV4(webCrypto: Crypto): string {
  const bytes = webCrypto.getRandomValues(new Uint8Array(UUID_BYTES));
  bytes[VERSION_BYTE] = ((bytes[VERSION_BYTE] ?? 0) & 0x0f) | 0x40;
  bytes[VARIANT_BYTE] = ((bytes[VARIANT_BYTE] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(HEX).padStart(BYTE_HEX_WIDTH, "0")).join(
    "",
  );
  const [a, b, c, d] = GROUPS;
  return `${hex.slice(0, a)}-${hex.slice(a, b)}-${hex.slice(b, c)}-${hex.slice(c, d)}-${hex.slice(d)}`;
}

export function createRequestId(): string {
  const webCrypto: Crypto | undefined = globalThis.crypto;

  if (typeof webCrypto?.randomUUID === "function") return webCrypto.randomUUID();
  if (typeof webCrypto?.getRandomValues === "function") return uuidV4(webCrypto);

  // No WebCrypto at all. Not random enough to keep a secret with — it never
  // does; the id is a log join key, and a request with no id is worse.
  return `${Date.now().toString(HEX)}-${Math.random().toString(HEX).slice(2)}`;
}
