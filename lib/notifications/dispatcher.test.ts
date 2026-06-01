import { describe, it, expect } from "vitest";
import { isSafeWebhookUrl } from "./dispatcher";

describe("isSafeWebhookUrl", () => {
  // ---- allowed ----

  it("allows a public HTTPS URL", () => {
    expect(isSafeWebhookUrl("https://hooks.example.com/notify")).toBe(true);
  });

  it("allows a public HTTP URL", () => {
    expect(isSafeWebhookUrl("http://api.example.com/webhook")).toBe(true);
  });

  it("allows a public URL with a port", () => {
    expect(isSafeWebhookUrl("https://api.example.com:8443/hook")).toBe(true);
  });

  // ---- blocked: protocols ----

  it("blocks ftp:// URLs", () => {
    expect(isSafeWebhookUrl("ftp://example.com/hook")).toBe(false);
  });

  it("blocks file:// URLs", () => {
    expect(isSafeWebhookUrl("file:///etc/passwd")).toBe(false);
  });

  it("blocks totally invalid URLs", () => {
    expect(isSafeWebhookUrl("not-a-url")).toBe(false);
  });

  it("blocks empty string", () => {
    expect(isSafeWebhookUrl("")).toBe(false);
  });

  // ---- blocked: loopback ----

  it("blocks localhost", () => {
    expect(isSafeWebhookUrl("http://localhost/hook")).toBe(false);
  });

  it("blocks 127.0.0.1", () => {
    expect(isSafeWebhookUrl("http://127.0.0.1/hook")).toBe(false);
  });

  it("blocks 127.0.0.2 (full 127.0.0.0/8 loopback range)", () => {
    expect(isSafeWebhookUrl("http://127.0.0.2/hook")).toBe(false);
  });

  it("blocks 127.255.255.255", () => {
    expect(isSafeWebhookUrl("http://127.255.255.255/hook")).toBe(false);
  });

  it("blocks IPv6 loopback ::1", () => {
    expect(isSafeWebhookUrl("http://[::1]/hook")).toBe(false);
  });

  // ---- blocked: link-local ----

  it("blocks 169.254.x.x (link-local / AWS metadata)", () => {
    expect(isSafeWebhookUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
  });

  it("blocks 169.254.0.1", () => {
    expect(isSafeWebhookUrl("http://169.254.0.1/hook")).toBe(false);
  });

  // ---- blocked: RFC 1918 private ranges ----

  it("blocks 10.x.x.x", () => {
    expect(isSafeWebhookUrl("http://10.0.0.1/hook")).toBe(false);
  });

  it("blocks 10.255.255.255", () => {
    expect(isSafeWebhookUrl("http://10.255.255.255/hook")).toBe(false);
  });

  it("blocks 172.16.x.x", () => {
    expect(isSafeWebhookUrl("http://172.16.0.1/hook")).toBe(false);
  });

  it("blocks 172.31.x.x", () => {
    expect(isSafeWebhookUrl("http://172.31.255.255/hook")).toBe(false);
  });

  it("allows 172.15.x.x (just outside private range)", () => {
    expect(isSafeWebhookUrl("http://172.15.0.1/hook")).toBe(true);
  });

  it("allows 172.32.x.x (just outside private range)", () => {
    expect(isSafeWebhookUrl("http://172.32.0.1/hook")).toBe(true);
  });

  it("blocks 192.168.x.x", () => {
    expect(isSafeWebhookUrl("http://192.168.1.1/hook")).toBe(false);
  });

  it("allows 192.169.x.x (public)", () => {
    expect(isSafeWebhookUrl("http://192.169.0.1/hook")).toBe(true);
  });

  // ---- blocked: NAT64 well-known prefix ----

  it("blocks NAT64 prefix 64:ff9b:: loopback", () => {
    expect(isSafeWebhookUrl("http://[64:ff9b::7f00:1]/hook")).toBe(false);
  });

  it("blocks NAT64 prefix 64:ff9b:: AWS metadata", () => {
    expect(isSafeWebhookUrl("http://[64:ff9b::a9fe:a9fe]/hook")).toBe(false);
  });

  // ---- blocked: IPv4-mapped IPv6 ----

  it("blocks IPv4-mapped IPv6 loopback ::ffff:127.0.0.1", () => {
    expect(isSafeWebhookUrl("http://[::ffff:7f00:1]/hook")).toBe(false);
  });

  it("blocks IPv4-mapped IPv6 private 10.x via ::ffff:", () => {
    expect(isSafeWebhookUrl("http://[::ffff:a00:1]/hook")).toBe(false);
  });

  it("blocks IPv4-mapped IPv6 RFC 1918 192.168.x via ::ffff:", () => {
    expect(isSafeWebhookUrl("http://[::ffff:c0a8:101]/hook")).toBe(false);
  });

  // ---- blocked: IPv6 private ranges ----

  it("blocks IPv6 unique-local fd::/8", () => {
    expect(isSafeWebhookUrl("http://[fd12:3456::1]/hook")).toBe(false);
  });

  it("blocks IPv6 unique-local fc::/8", () => {
    expect(isSafeWebhookUrl("http://[fc00::1]/hook")).toBe(false);
  });

  it("blocks IPv6 link-local fe80::/10", () => {
    expect(isSafeWebhookUrl("http://[fe80::1]/hook")).toBe(false);
  });

  // ---- Teams webhook (real-world allow) ----

  it("allows a real Teams Incoming Webhook URL", () => {
    expect(
      isSafeWebhookUrl(
        "https://company.webhook.office.com/webhookb2/abc123/IncomingWebhook/xyz/token"
      )
    ).toBe(true);
  });
});
