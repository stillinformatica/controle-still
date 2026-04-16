import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_PROJECT_URL = "https://zhfvxzvuegdvzufhkaqo.supabase.co";

type SyncResult = {
  id: number;
  name: string;
  success: boolean;
  action?: string;
  error?: string;
};

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
  cleanupMissing: z.boolean().optional().default(true),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function syncSingleProduct(targetAnonKey: string, product: z.infer<typeof ProductSchema>): Promise<SyncResult> {
  try {
    const response = await fetch(`${TARGET_PROJECT_URL}/functions/v1/receive-product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${targetAnonKey}`,
      },
      body: JSON.stringify({
        source_id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        quantity: product.quantity,
        images: product.images,
        isTesting: product.isTesting,
        upsert: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        id: product.id,
        name: product.name,
        success: false,
        error: errorText || `Status ${response.status}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    return {
      id: product.id,
      name: product.name,
      success: true,
      action: data.action || "synced",
    };
  } catch (e) {
    return {
      id: product.id,
      name: product.name,
      success: false,
      error: e instanceof Error ? e.message : "Erro desconhecido",
    };
  }
}

async function cleanupMissingProducts(targetAnonKey: string, sourceIds: number[]): Promise<SyncResult> {
  try {
    const response = await fetch(`${TARGET_PROJECT_URL}/functions/v1/remove-missing-products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${targetAnonKey}`,
      },
      body: JSON.stringify({ source_ids: sourceIds }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        id: 0,
        name: "Remoção de produtos ausentes",
        success: false,
        error: errorText || `Status ${response.status}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    const removedCount = typeof data.removed_count === "number" ? data.removed_count : 0;

    return {
      id: 0,
      name: "Remoção de produtos ausentes",
      success: true,
      action: removedCount > 0 ? `${removedCount} removido(s)` : "none_removed",
    };
  } catch (e) {
    return {
      id: 0,
      name: "Remoção de produtos ausentes",
      success: false,
      error: e instanceof Error ? e.message : "Erro desconhecido",
    };
  }
}

export async function handleSyncProducts(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400);
    }

    const { products, cleanupMissing } = parsed.data;
    const results: SyncResult[] = [];
    const targetAnonKey = Deno.env.get("TARGET_SITE_ANON_KEY") || "";

    if (!targetAnonKey) {
      return jsonResponse({ error: "Secret TARGET_SITE_ANON_KEY não configurado" }, 500);
    }

    for (const product of products) {
      results.push(await syncSingleProduct(targetAnonKey, product));
    }

    if (cleanupMissing) {
      const sourceIds = [...new Set(products.map((product) => product.id).filter((id) => Number.isFinite(id)))];
      const cleanupResult = await cleanupMissingProducts(targetAnonKey, sourceIds);
      results.push(cleanupResult);
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return jsonResponse({
      success: failCount === 0,
      message: `Sincronização concluída: ${successCount} sucesso, ${failCount} erro(s)`,
      results,
    });
  } catch (error) {
    console.error("Error syncing products:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
}

if (import.meta.main) {
  Deno.serve(handleSyncProducts);
}
