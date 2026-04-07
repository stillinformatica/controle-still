import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_PROJECT_URL = "https://zhfvxzvuegdvzufhkaqo.supabase.co";

const BodySchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  category: z.string().default(""),
  price: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  images: z.array(z.string()).default([]),
  isTesting: z.boolean().default(false),
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

    const product = parsed.data;

    // Forward to the target site's edge function
    const response = await fetch(`${TARGET_PROJECT_URL}/functions/v1/receive-product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("TARGET_SITE_ANON_KEY") || ""}`,
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Target site error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao enviar para o site. Verifique se o endpoint está configurado." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json().catch(() => ({}));

    return new Response(
      JSON.stringify({ success: true, message: "Produto anunciado com sucesso!", result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error announcing product:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
