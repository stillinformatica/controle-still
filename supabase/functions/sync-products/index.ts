import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_PROJECT_URL = "https://zhfvxzvuegdvzufhkaqo.supabase.co";

const ProductSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  description: z.string().default(""),
  category: z.string().default(""),
  price: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  quantity: z.number().default(0),
  images: z.array(z.string()).default([]),
  isTesting: z.boolean().default(false),
});

const BodySchema = z.object({
  products: z.array(ProductSchema),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { products } = parsed.data;
    const results: { id: number; name: string; success: boolean; error?: string }[] = [];

    for (const product of products) {
      try {
        const response = await fetch(`${TARGET_PROJECT_URL}/functions/v1/receive-product`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("TARGET_SITE_ANON_KEY") || ""}`,
          },
          body: JSON.stringify({
            id: product.id,
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            quantity: product.quantity,
            images: product.images,
            isTesting: product.isTesting,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          results.push({ id: product.id, name: product.name, success: false, error: errorText || `Status ${response.status}` });
        } else {
          results.push({ id: product.id, name: product.name, success: true });
        }
      } catch (e) {
        results.push({ id: product.id, name: product.name, success: false, error: e instanceof Error ? e.message : "Erro desconhecido" });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        message: `Sincronização concluída: ${successCount} sucesso, ${failCount} erro(s)`,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error syncing products:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
