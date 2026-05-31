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

  // ---- Teams webhook (real-world allow) ----

  it("allows a real Teams Incoming Webhook URL", () => {
    expect(
      isSafeWebhookUrl(
        "https://company.webhook.office.com/webhookb2/abc123/IncomingWebhook/xyz/token"
      )
    ).toBe(true);
  });
});
