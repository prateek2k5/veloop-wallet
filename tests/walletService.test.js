const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAmount, getCurrencyField } = require("../src/services/walletService");

test("accepts positive whole-number wallet amounts", () => {
  assert.equal(validateAmount(1), undefined);
  assert.equal(validateAmount(2500), undefined);
});

test("rejects zero, negative, fractional and unsafe amounts", () => {
  for (const amount of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "500", NaN]) {
    assert.throws(() => validateAmount(amount), { statusCode: 400 });
  }
});

test("maps all supported wallet currencies to their balance fields", () => {
  assert.equal(getCurrencyField("VES"), "ves");
  assert.equal(getCurrencyField("SVES"), "sves");
  assert.equal(getCurrencyField("GEMS"), "gems");
  assert.equal(getCurrencyField("TOKENS"), "tokens");
  assert.equal(getCurrencyField("SPINS"), "spins");
});

test("rejects unsupported currencies", () => {
  assert.throws(() => getCurrencyField("USD"), { statusCode: 400 });
  assert.throws(() => getCurrencyField(""), { statusCode: 400 });
});
