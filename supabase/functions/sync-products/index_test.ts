import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { handleSyncProducts } from "./index.ts";

Deno.test("retorna 400 para body inválido", async () => {
  const response = await handleSyncProducts(
    new Request("http://localhost/sync-products", {
      method: "POST",
      body: JSON.stringify({ products: [{ id: "x" }] }),
    }),
  );

  assertEquals(response.status, 400);
});

Deno.test("sincroniza produtos e executa limpeza de ausentes", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnvGet = Deno.env.get;

  Deno.env.get = (key: string) => {
    if (key === "TARGET_SITE_ANON_KEY") return "test-key";
    return originalEnvGet.call(Deno.env, key);
  };

  let callCount = 0;
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    callCount += 1;
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith("/receive-product")) {
      return new Response(JSON.stringify({ action: "updated" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.endsWith("/remove-missing-products")) {
      const parsedBody = JSON.parse(String(init?.body));
      assertEquals(parsedBody.source_ids, [10]);

      return new Response(JSON.stringify({ removed_count: 2 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("not found", { status: 404 });
  };

  try {
    const response = await handleSyncProducts(
      new Request("http://localhost/sync-products", {
        method: "POST",
        body: JSON.stringify({
          products: [
            {
              id: 10,
              name: "Produto 1",
              description: "Desc",
              category: "Teste",
              price: 99.9,
              quantity: 1,
              images: ["https://teste/imagem.jpg"],
              isTesting: false,
            },
          ],
        }),
      }),
    );

    const result = await response.json();

    assertEquals(response.status, 200);
    assertEquals(callCount, 2);
    assertEquals(result.success, true);
    assertEquals(result.results.length, 2);
    assertEquals(result.results[1].name, "Remoção de produtos ausentes");
    assertEquals(result.results[1].action, "2 removido(s)");
  } finally {
    globalThis.fetch = originalFetch;
    Deno.env.get = originalEnvGet;
  }
});