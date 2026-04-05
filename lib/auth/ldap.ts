/**
 * LDAP / Active Directory authentication module
 *
 * Flow:
 *   1. Bind with a service account (read-only, just for searching)
 *   2. Search for the user by username using LDAP_USER_FILTER
 *   3. Attempt to bind with the found user's DN + their password
 *   4. If bind succeeds, return the user's attributes (email, displayName…)
 *
 * Supports:
 *   - Microsoft Active Directory  (sAMAccountName, userPrincipalName)
 *   - OpenLDAP / FreeIPA          (uid, mail)
 *   - Any RFC 4511 compliant LDAP server
 */

import ldap from "ldapjs";

export interface LdapUser {
  dn: string;
  username: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  department?: string;
}

function getEnv(key: string): string {
  return process.env[key] ?? "";
}

/** Build the ldapjs client */
function createClient(): ldap.Client {
  const uri = getEnv("LDAP_URI"); // e.g. ldap://dc.company.com:389 or ldaps://...
  const client = ldap.createClient({
    url: uri,
    tlsOptions: { rejectUnauthorized: getEnv("LDAP_TLS_REJECT_UNAUTHORIZED") !== "false" },
    timeout: 10000,
    connectTimeout: 10000,
  });
  return client;
}

/** Promisified bind */
function bindClient(client: ldap.Client, dn: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/** Promisified search — returns first matching entry's attributes */
function searchOne(
  client: ldap.Client,
  base: string,
  filter: string
): Promise<ldap.SearchEntryObject | null> {
  return new Promise((resolve, reject) => {
    client.search(
      base,
      {
        scope: "sub",
        filter,
        attributes: [
          "dn",
          "sAMAccountName",
          "uid",
          "mail",
          "userPrincipalName",
          "displayName",
          "givenName",
          "sn",
          "department",
          "cn",
        ],
        sizeLimit: 1,
        timeLimit: 10,
      },
      (err, res) => {
        if (err) { reject(err); return; }

        let found: ldap.SearchEntryObject | null = null;

        res.on("searchEntry", (entry) => {
          found = entry.pojo;
        });
        res.on("error", reject);
        res.on("end", () => resolve(found));
      }
    );
  });
}

/** Unbind and destroy the client */
function destroyClient(client: ldap.Client): void {
  try { client.unbind(); } catch { /* ignore */ }
}

function attr(entry: ldap.SearchEntryObject, ...keys: string[]): string {
  for (const key of keys) {
    const val = entry.attributes.find((a) => a.type.toLowerCase() === key.toLowerCase());
    if (val?.values?.[0]) return val.values[0] as string;
  }
  return "";
}

/**
 * Authenticate a user against LDAP.
 * Returns the user's attributes on success, null on failure.
 */
export async function authenticateLdap(
  username: string,
  password: string
): Promise<LdapUser | null> {
  const uri = getEnv("LDAP_URI");
  const baseDn = getEnv("LDAP_BASE_DN");
  const bindDn = getEnv("LDAP_BIND_DN");
  const bindPassword = getEnv("LDAP_BIND_PASSWORD");
  const filterTemplate = getEnv("LDAP_USER_FILTER") || "(|(sAMAccountName={{username}})(uid={{username}})(userPrincipalName={{username}}))";

  if (!uri || !baseDn) return null; // LDAP not configured

  // Build the search filter — replace {{username}} placeholder
  // Escape special LDAP characters in the username to prevent injection
  const safeUsername = username.replace(/[\\*()\x00]/g, "");
  const filter = filterTemplate.replace(/\{\{username\}\}/g, safeUsername);

  const client = createClient();

  try {
    // Step 1: Bind with service account to search
    if (bindDn && bindPassword) {
      await bindClient(client, bindDn, bindPassword);
    } else {
      // Anonymous bind (some LDAP servers allow this for searching)
      await bindClient(client, "", "");
    }

    // Step 2: Search for the user
    const entry = await searchOne(client, baseDn, filter);
    if (!entry) return null;

    const userDn = entry.objectName as string;
    if (!userDn) return null;

    // Step 3: Re-bind as the user to verify their password
    try {
      await bindClient(client, userDn, password);
    } catch {
      // Wrong password
      return null;
    }

    // Step 4: Extract attributes
    const email =
      attr(entry, "mail") ||
      attr(entry, "userPrincipalName") ||
      `${username}@${baseDn.split(",").filter((p) => p.toLowerCase().startsWith("dc=")).map((p) => p.slice(3)).join(".")}`;

    const displayName =
      attr(entry, "displayName") ||
      attr(entry, "cn") ||
      [attr(entry, "givenName"), attr(entry, "sn")].filter(Boolean).join(" ") ||
      username;

    return {
      dn: userDn,
      username: attr(entry, "sAMAccountName") || attr(entry, "uid") || username,
      email,
      displayName,
      firstName: attr(entry, "givenName") || undefined,
      lastName: attr(entry, "sn") || undefined,
      department: attr(entry, "department") || undefined,
    };
  } catch (err) {
    console.error("[LDAP] Authentication error:", err);
    return null;
  } finally {
    destroyClient(client);
  }
}

/** Returns true if LDAP is configured in environment variables */
export function isLdapEnabled(): boolean {
  return Boolean(process.env.LDAP_URI && process.env.LDAP_BASE_DN);
}
