import { afterEach, describe, expect, it, vi } from "vitest";
import { createRequestId } from "@/utils/request-id";

/** What the API accepts (`SAFE_REQUEST_ID` in its request-context middleware). */
const API_ACCEPTS = /^[\w-]{1,64}$/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createRequestId", () => {
  it("uses the platform generator when there is one", () => {
    const randomUUID = vi.fn(() => "11111111-2222-4333-8444-555555555555");
    vi.stubGlobal("crypto", { ...globalThis.crypto, randomUUID });

    expect(createRequestId()).toBe("11111111-2222-4333-8444-555555555555");
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  // The production bug: over plain HTTP `randomUUID` is not defined, and this
  // runs in the request interceptor — so it took sign-in down with a TypeError.
  it("still returns an id in an insecure context, where randomUUID is absent", () => {
    vi.stubGlobal("crypto", { getRandomValues: globalThis.crypto.getRandomValues.bind(crypto) });

    const id = createRequestId();
    expect(id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
    expect(id).not.toBe(createRequestId());
  });

  it("still returns an id with no WebCrypto at all", () => {
    vi.stubGlobal("crypto", undefined);

    expect(createRequestId()).toMatch(API_ACCEPTS);
  });

  it("only ever produces ids the API will keep rather than replace", () => {
    for (const stub of [
      globalThis.crypto,
      { getRandomValues: globalThis.crypto.getRandomValues.bind(crypto) },
      undefined,
    ]) {
      vi.stubGlobal("crypto", stub);
      expect(createRequestId()).toMatch(API_ACCEPTS);
    }
  });
});
