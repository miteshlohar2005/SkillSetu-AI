import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import crypto from "crypto";

test("Authentication Security & Validation", async (t) => {
  await t.test("Password hashing with bcrypt behaves consistently", async () => {
    const rawPassword = "SecurePassword@2026";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.notEqual(rawPassword, hash, "Hash must not equal plaintext");
    assert.ok(hash.startsWith("$2"), "Hash must be a valid bcrypt signature");

    const matches = await bcrypt.compare(rawPassword, hash);
    assert.equal(matches, true, "Bcrypt compare must succeed for valid password");

    const wrongMatches = await bcrypt.compare("WrongPassword", hash);
    assert.equal(wrongMatches, false, "Bcrypt compare must fail for invalid password");
  });

  await t.test("Secure OTP generation produces 6-digit numeric codes", () => {
    for (let i = 0; i < 20; i++) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      assert.equal(otp.length, 6, "OTP must be exactly 6 characters");
      assert.ok(/^\d{6}$/.test(otp), "OTP must consist of digits only");
    }
  });

  await t.test("User email normalization logic", () => {
    const rawInputs = [
      "  Officer@Domain.COM  ",
      "OFFICER@DOMAIN.COM",
      "officer@domain.com  ",
    ];
    rawInputs.forEach((input) => {
      const normalized = input.toLowerCase().trim();
      assert.equal(normalized, "officer@domain.com");
    });
  });
});
