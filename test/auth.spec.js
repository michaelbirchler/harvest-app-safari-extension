import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock authentication functions
class AuthValidator {
  validateSubdomain(subdomain) {
    if (!subdomain || subdomain.trim() === "") {
      return { valid: false, error: "subdomain_required" };
    }

    // Check for XSS patterns
    const xssPatterns = [/<script/i, /javascript:/i, /on\w+=/i, /<iframe/i];
    if (xssPatterns.some((pattern) => pattern.test(subdomain))) {
      return { valid: false, error: "invalid_characters" };
    }

    // Check for SQL injection patterns
    const sqlPatterns = [/['";]/g, /--/, /\/\*/];
    if (sqlPatterns.some((pattern) => pattern.test(subdomain))) {
      return { valid: false, error: "invalid_characters" };
    }

    // Subdomain should be alphanumeric with hyphens only
    if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
      return { valid: false, error: "invalid_subdomain_format" };
    }

    // Subdomain length check
    if (subdomain.length < 2 || subdomain.length > 63) {
      return { valid: false, error: "subdomain_length" };
    }

    // Cannot start or end with hyphen
    if (subdomain.startsWith("-") || subdomain.endsWith("-")) {
      return { valid: false, error: "invalid_subdomain_format" };
    }

    return { valid: true };
  }

  validateToken(token) {
    if (!token || token.trim() === "") {
      return { valid: false, error: "token_required" };
    }

    // Check for XSS patterns
    const xssPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
    if (xssPatterns.some((pattern) => pattern.test(token))) {
      return { valid: false, error: "invalid_token_format" };
    }

    // Token length should be reasonable (Harvest tokens are typically 64+ chars)
    if (token.length < 20) {
      return { valid: false, error: "token_too_short" };
    }

    if (token.length > 200) {
      return { valid: false, error: "token_too_long" };
    }

    return { valid: true };
  }

  sanitizeInput(input) {
    return input.replace(/[<>'"]/g, "").trim();
  }
}

class HarvestAuth {
  constructor(validator) {
    this.validator = validator;
    this.subdomain = null;
    this.token = null;
    this.authenticated = false;
  }

  async login(subdomain, token) {
    // Sanitize inputs first before validation
    const cleanSubdomain = this.validator.sanitizeInput(subdomain);
    const cleanToken = this.validator.sanitizeInput(token);

    // Validate subdomain
    const subdomainValidation =
      this.validator.validateSubdomain(cleanSubdomain);
    if (!subdomainValidation.valid) {
      throw new Error(subdomainValidation.error);
    }

    // Validate token
    const tokenValidation = this.validator.validateToken(cleanToken);
    if (!tokenValidation.valid) {
      throw new Error(tokenValidation.error);
    }

    // Attempt authentication
    const authUrl = `https://${cleanSubdomain}.harvestapp.com/api/v2/users/me`;

    try {
      const response = await fetch(authUrl, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          "Harvest-Account-ID": "",
          "User-Agent": "Safari Harvest Extension",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("auth_failed");
        } else if (response.status === 403) {
          throw new Error("auth_forbidden");
        } else {
          throw new Error("auth_network_error");
        }
      }

      const data = await response.json();

      this.subdomain = cleanSubdomain;
      this.token = cleanToken;
      this.authenticated = true;

      return {
        success: true,
        user: data,
      };
    } catch (error) {
      if (error.message.startsWith("auth_")) {
        throw error;
      }
      throw new Error("auth_network_error");
    }
  }

  logout() {
    this.subdomain = null;
    this.token = null;
    this.authenticated = false;
  }

  isAuthenticated() {
    return this.authenticated;
  }

  getCredentials() {
    if (!this.authenticated) {
      return null;
    }
    return {
      subdomain: this.subdomain,
      token: this.token,
    };
  }
}

describe("Authentication Flow", () => {
  let validator;
  let auth;

  beforeEach(() => {
    validator = new AuthValidator();
    auth = new HarvestAuth(validator);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Subdomain Validation", () => {
    it("accepts valid subdomain", () => {
      const result = validator.validateSubdomain("mycompany");
      expect(result.valid).toBe(true);
    });

    it("accepts subdomain with hyphens", () => {
      const result = validator.validateSubdomain("my-company-name");
      expect(result.valid).toBe(true);
    });

    it("accepts subdomain with numbers", () => {
      const result = validator.validateSubdomain("company123");
      expect(result.valid).toBe(true);
    });

    it("rejects empty subdomain", () => {
      const result = validator.validateSubdomain("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("subdomain_required");
    });

    it("rejects subdomain with spaces", () => {
      const result = validator.validateSubdomain("my company");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_subdomain_format");
    });

    it("rejects subdomain with special characters", () => {
      const result = validator.validateSubdomain("my@company");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_subdomain_format");
    });

    it("rejects subdomain starting with hyphen", () => {
      const result = validator.validateSubdomain("-company");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_subdomain_format");
    });

    it("rejects subdomain ending with hyphen", () => {
      const result = validator.validateSubdomain("company-");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_subdomain_format");
    });

    it("rejects too short subdomain", () => {
      const result = validator.validateSubdomain("a");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("subdomain_length");
    });

    it("rejects too long subdomain", () => {
      const longSubdomain = "a".repeat(64);
      const result = validator.validateSubdomain(longSubdomain);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("subdomain_length");
    });

    it("rejects XSS attempt with script tag", () => {
      const result = validator.validateSubdomain("<script>alert(1)</script>");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_characters");
    });

    it("rejects XSS attempt with javascript protocol", () => {
      const result = validator.validateSubdomain("javascript:alert(1)");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_characters");
    });

    it("rejects XSS attempt with event handler", () => {
      const result = validator.validateSubdomain('company" onclick="alert(1)');
      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_characters");
    });

    it("rejects SQL injection attempt with quotes", () => {
      const result = validator.validateSubdomain("company' OR '1'='1");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_characters");
    });

    it("rejects SQL injection attempt with comment", () => {
      const result = validator.validateSubdomain("company--");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_characters");
    });
  });

  describe("Token Validation", () => {
    const validToken = "a".repeat(64); // 64-char token

    it("accepts valid token", () => {
      const result = validator.validateToken(validToken);
      expect(result.valid).toBe(true);
    });

    it("rejects empty token", () => {
      const result = validator.validateToken("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("token_required");
    });

    it("rejects token that's too short", () => {
      const result = validator.validateToken("short");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("token_too_short");
    });

    it("rejects token that's too long", () => {
      const longToken = "a".repeat(201);
      const result = validator.validateToken(longToken);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("token_too_long");
    });

    it("rejects XSS attempt in token", () => {
      const result = validator.validateToken(
        "<script>alert(1)</script>" + validToken
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_token_format");
    });
  });

  describe("Input Sanitization", () => {
    it("trims whitespace", () => {
      const result = validator.sanitizeInput("  mycompany  ");
      expect(result).toBe("mycompany");
    });

    it("removes dangerous characters", () => {
      const result = validator.sanitizeInput("my<company>test");
      expect(result).toBe("mycompanytest");
    });

    it("removes quotes", () => {
      const result = validator.sanitizeInput("my\"company's");
      expect(result).toBe("mycompanys");
    });
  });

  describe("Authentication Success", () => {
    const validSubdomain = "mycompany";
    const validToken = "a".repeat(64);
    const mockUser = {
      id: 12345,
      email: "user@example.com",
      first_name: "John",
      last_name: "Doe",
    };

    beforeEach(() => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      });
    });

    it("successfully authenticates with valid credentials", async () => {
      const result = await auth.login(validSubdomain, validToken);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(auth.isAuthenticated()).toBe(true);
    });

    it("stores credentials after successful auth", async () => {
      await auth.login(validSubdomain, validToken);

      const creds = auth.getCredentials();
      expect(creds.subdomain).toBe(validSubdomain);
      expect(creds.token).toBe(validToken);
    });

    it("makes API call to correct endpoint", async () => {
      await auth.login(validSubdomain, validToken);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://mycompany.harvestapp.com/api/v2/users/me",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${validToken}`,
          }),
        })
      );
    });

    it("sanitizes inputs before making API call", async () => {
      // Use inputs that will pass validation but have whitespace
      const validSubdomainWithSpace = "mycompany";
      const validTokenWithSpace = "a".repeat(64);

      await auth.login(
        ` ${validSubdomainWithSpace} `,
        ` ${validTokenWithSpace} `
      );

      expect(global.fetch).toHaveBeenCalledWith(
        "https://mycompany.harvestapp.com/api/v2/users/me",
        expect.any(Object)
      );
    });
  });

  describe("Authentication Failures", () => {
    const validSubdomain = "mycompany";
    const validToken = "a".repeat(64);

    it("throws error for invalid subdomain", async () => {
      await expect(auth.login("invalid@subdomain", validToken)).rejects.toThrow(
        "invalid_subdomain_format"
      );

      expect(auth.isAuthenticated()).toBe(false);
    });

    it("throws error for invalid token", async () => {
      await expect(auth.login(validSubdomain, "short")).rejects.toThrow(
        "token_too_short"
      );

      expect(auth.isAuthenticated()).toBe(false);
    });

    it("handles 401 unauthorized response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(auth.login(validSubdomain, validToken)).rejects.toThrow(
        "auth_failed"
      );

      expect(auth.isAuthenticated()).toBe(false);
    });

    it("handles 403 forbidden response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      });

      await expect(auth.login(validSubdomain, validToken)).rejects.toThrow(
        "auth_forbidden"
      );
    });

    it("handles network errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      await expect(auth.login(validSubdomain, validToken)).rejects.toThrow(
        "auth_network_error"
      );

      expect(auth.isAuthenticated()).toBe(false);
    });

    it("does not store credentials on failed auth", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      try {
        await auth.login(validSubdomain, validToken);
      } catch (e) {
        // Expected to throw
      }

      expect(auth.getCredentials()).toBeNull();
    });
  });

  describe("Logout", () => {
    const validSubdomain = "mycompany";
    const validToken = "a".repeat(64);

    it("clears authentication state", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1 }),
      });

      await auth.login(validSubdomain, validToken);
      expect(auth.isAuthenticated()).toBe(true);

      auth.logout();

      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getCredentials()).toBeNull();
    });

    it("can be called when not authenticated", () => {
      expect(() => auth.logout()).not.toThrow();
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("handles null subdomain", () => {
      const result = validator.validateSubdomain(null);
      expect(result.valid).toBe(false);
    });

    it("handles undefined token", () => {
      const result = validator.validateToken(undefined);
      expect(result.valid).toBe(false);
    });

    it("handles whitespace-only subdomain", () => {
      const result = validator.validateSubdomain("   ");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("subdomain_required");
    });

    it("handles API response without JSON body", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(auth.login("mycompany", "a".repeat(64))).rejects.toThrow();
    });
  });
});
