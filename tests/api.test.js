import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../api/history.js";

function mockRes() {
  const res = { statusCode: 0, headers: {}, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.setHeader = (k, v) => { res.headers[k] = v; };
  return res;
}

test("/api/history validates the symbol and parses Yahoo", async (t) => {
  const bad = mockRes();
  await handler({ query: { symbol: "nv da;rm" } }, bad);
  assert.equal(bad.statusCode, 400);

  let calledUrl = "";
  t.mock.method(globalThis, "fetch", async (url) => {
    calledUrl = url;
    return new Response(JSON.stringify({ chart: { result: [{
      meta: { symbol: "ENR.DE", currency: "EUR", gmtoffset: 3600 },
      timestamp: [1704182400, 1704268800],
      indicators: { quote: [{ open: [10, 11], high: [11, 12], low: [9, 10], close: [10.5, 11.5], volume: [1, 2] }] },
    }] } }), { status: 200 });
  });
  const ok = mockRes();
  await handler({ query: { symbol: "enr.de", range: "max" } }, ok);
  assert.equal(ok.statusCode, 200);
  assert.match(calledUrl, /chart\/ENR\.DE\?range=max&interval=1d/);
  assert.equal(ok.body.currency, "EUR");
  assert.equal(ok.body.bars.length, 2);
  assert.ok(ok.headers["Cache-Control"]);

  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ chart: { result: null, error: { description: "No data found, symbol may be delisted" } } }), { status: 404 }));
  const nf = mockRes();
  await handler({ query: { symbol: "ZZZZ" } }, nf);
  assert.equal(nf.statusCode, 404);
  assert.match(nf.body.error, /No data found/);

  t.mock.method(globalThis, "fetch", async () => new Response("<html>Too Many Requests</html>", { status: 429 }));
  const rl = mockRes();
  await handler({ query: { symbol: "NVDA" } }, rl);
  assert.equal(rl.statusCode, 502);
  assert.match(rl.body.error, /429/);
});
