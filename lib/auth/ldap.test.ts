import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sanitizeLdapUsername, isLdapEnabled } from "./ldap";

describe("sanitizeLdapUsername", () => {
  it("passes through a normal username unchanged", () => {
    expect(sanitizeLdapUsername("john.doe")).toBe("john.doe");
  });

  it("strips backslash (LDAP escape prefix)", () => {
    expect(sanitizeLdapUsername("admin\\injected")).toBe("admininjected");
  });

  it("strips asterisk (wildcard)", () => {
    expect(sanitizeLdapUsername("user*")).toBe("user");
  });

  it("strips opening parenthesis", () => {
    // | is not stripped (harmless without surrounding parens), but ( ) * are
    expect(sanitizeLdapUsername("admin)(|(uid=*")).toBe("admin|uid=");
  });

  it("strips closing parenthesis", () => {
    expect(sanitizeLdapUsername("user)extra")).toBe("userextra");
  });

  it("strips null byte", () => {
    expect(sanitizeLdapUsername("admin\x00injected")).toBe("admininjected");
  });

  it("strips all special chars from a combined injection attempt", () => {
    // Common LDAP injection: *()|&
    const malicious = "admin)(&(password=*))(|(uid=*";
    const safe = sanitizeLdapUsername(malicious);
    expect(safe).not.toContain("*");
    expect(safe).not.toContain("(");
    expect(safe).not.toContain(")");
    expect(safe).not.toContain("\\");
  });

  it("preserves allowed username characters: letters, digits, @, -, _", () => {
    const username = "user-name_123@company.com";
    expect(sanitizeLdapUsername(username)).toBe(username);
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeLdapUsername("")).toBe("");
  });
});

describe("isLdapEnabled", () => {
  const ORIG_LDAP_URI = process.env.LDAP_URI;
  const ORIG_LDAP_BASE_DN = process.env.LDAP_BASE_DN;

  afterEach(() => {
    process.env.LDAP_URI = ORIG_LDAP_URI;
    process.env.LDAP_BASE_DN = ORIG_LDAP_BASE_DN;
  });

  it("returns false when both env vars are absent", () => {
    delete process.env.LDAP_URI;
    delete process.env.LDAP_BASE_DN;
    expect(isLdapEnabled()).toBe(false);
  });

  it("returns false when only LDAP_URI is set", () => {
    process.env.LDAP_URI = "ldap://dc.example.com:389";
    delete process.env.LDAP_BASE_DN;
    expect(isLdapEnabled()).toBe(false);
  });

  it("returns false when only LDAP_BASE_DN is set", () => {
    delete process.env.LDAP_URI;
    process.env.LDAP_BASE_DN = "dc=example,dc=com";
    expect(isLdapEnabled()).toBe(false);
  });

  it("returns true when both LDAP_URI and LDAP_BASE_DN are set", () => {
    process.env.LDAP_URI = "ldap://dc.example.com:389";
    process.env.LDAP_BASE_DN = "dc=example,dc=com";
    expect(isLdapEnabled()).toBe(true);
  });

  it("returns false when LDAP_URI is an empty string", () => {
    process.env.LDAP_URI = "";
    process.env.LDAP_BASE_DN = "dc=example,dc=com";
    expect(isLdapEnabled()).toBe(false);
  });
});
