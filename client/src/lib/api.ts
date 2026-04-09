import { supabase } from "@/integrations/supabase/client";

// ── Helpers ──────────────────────────────────────────────────────────────────

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}

export function mapKeys<T = any>(obj: any): T {
  if (Array.isArray(obj)) return obj.map(mapKeys) as any;
  if (obj === null || typeof obj !== "object") return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [snakeToCamel(k), mapKeys(v)])
  ) as T;
}

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return user.id;
}

function throwIfError(result: { error: any; data: any }) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

// ── Auth / Profile ──────────────────────────────────────────────────────────

export const authApi = {
  getProfile: async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      // Profile might not exist yet, create it
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || "",
            login_method: user.app_metadata?.provider || "google",
            last_signed_in: new Date().toISOString(),
          })
          .select()
          .single();
        if (insertError) throw insertError;
        return mapKeys(newProfile);
      }
      throw error;
    }
    // Update last_signed_in
    await supabase.from("profiles").update({ last_signed_in: new Date().toISOString() }).eq("id", userId);
    return mapKeys(data);
  },
};

// ── Bank Accounts ───────────────────────────────────────────────────────────

export const bankAccountsApi = {
  list: async () => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("bank_accounts").select("*").eq("user_id", userId).eq("is_active", true).order("name")
    );
    return mapKeys(data);
  },
  create: async (input: { name: string; balance: string; accountType: string }) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("bank_accounts").insert({
        user_id: userId,
        name: input.name,
        balance: parseFloat(input.balance) || 0,
        account_type: input.accountType as any,
      }).select().single()
    );
    return mapKeys(data);
  },
  update: async (input: { id: number; name?: string; balance?: string; accountType?: string }) => {
    const userId = await getUserId();
    const updates: any = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.balance !== undefined) updates.balance = parseFloat(input.balance);
    if (input.accountType !== undefined) updates.account_type = input.accountType;
    updates.updated_at = new Date().toISOString();
    const data = throwIfError(
      await supabase.from("bank_accounts").update(updates).eq("id", input.id).eq("user_id", userId).select().single()
    );
    return mapKeys(data);
  },
  delete: async (input: { id: number }) => {
    const userId = await getUserId();
    throwIfError(
      await supabase.from("bank_accounts").update({ is_active: false }).eq("id", input.id).eq("user_id", userId)
    );
  },
};

// ── Transactions ────────────────────────────────────────────────────────────

export const transactionsApi = {
  list: async (input: { accountId: number }) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("transactions").select("*").eq("user_id", userId).eq("account_id", input.accountId).order("date", { ascending: false })
    );
    return mapKeys(data);
  },
  create: async (input: { accountId: number; date: string; description: string; amount: string; type: string; category?: string; isPersonal?: boolean }) => {
    const userId = await getUserId();
    const amount = parseFloat(input.amount);
    const data = throwIfError(
      await supabase.from("transactions").insert({
        user_id: userId,
        account_id: input.accountId,
        date: input.date,
        description: input.description,
        amount,
        type: input.type as any,
        category: input.category || null,
        is_personal: input.isPersonal || false,
      }).select().single()
    );
    // Update account balance
    const { data: account } = await supabase.from("bank_accounts").select("balance").eq("id", input.accountId).single();
    if (account) {
      const newBalance = input.type === "income"
        ? account.balance + amount
        : account.balance - amount;
      await supabase.from("bank_accounts").update({ balance: newBalance }).eq("id", input.accountId);
    }
    return mapKeys(data);
  },
};

// ── Bank Transfers ──────────────────────────────────────────────────────────

export const bankTransfersApi = {
  transfer: async (input: { fromAccountId: number; toAccountId: number; amount: string; description: string }) => {
    const userId = await getUserId();
    const amount = parseFloat(input.amount);
    const date = new Date().toISOString().split("T")[0];

    // Create withdrawal transaction
    await supabase.from("transactions").insert({
      user_id: userId, account_id: input.fromAccountId, date, description: input.description,
      amount, type: "expense" as any, category: "transfer",
    });
    // Create deposit transaction
    await supabase.from("transactions").insert({
      user_id: userId, account_id: input.toAccountId, date, description: input.description,
      amount, type: "income" as any, category: "transfer",
    });
    // Update balances
    const { data: fromAcc } = await supabase.from("bank_accounts").select("balance").eq("id", input.fromAccountId).single();
    const { data: toAcc } = await supabase.from("bank_accounts").select("balance").eq("id", input.toAccountId).single();
    if (fromAcc) await supabase.from("bank_accounts").update({ balance: fromAcc.balance - amount }).eq("id", input.fromAccountId);
    if (toAcc) await supabase.from("bank_accounts").update({ balance: toAcc.balance + amount }).eq("id", input.toAccountId);
  },
};

// ── Investments ─────────────────────────────────────────────────────────────

export const investmentsApi = {
  list: async (params?: any) => {
    const userId = await getUserId();
    let query = supabase.from("investments").select("*").eq("user_id", userId);
    if (!params?.includeInactive) query = query.eq("is_active", true);
    const data = throwIfError(await query.order("code"));
    return mapKeys(data);
  },
  create: async (input: any) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("investments").insert({
        user_id: userId, code: input.code, type: input.type, shares: input.shares || 1,
        purchase_price: parseFloat(input.purchasePrice), purchase_date: input.purchaseDate,
        current_price: input.currentPrice ? parseFloat(input.currentPrice) : null,
        name: input.name || null, administrator: input.administrator || null,
        dy_percent: input.dyPercent ? parseFloat(input.dyPercent) : null,
      }).select().single()
    );
    return mapKeys(data);
  },
  update: async (input: any) => {
    const userId = await getUserId();
    const updates: any = { updated_at: new Date().toISOString() };
    if (input.code !== undefined) updates.code = input.code;
    if (input.type !== undefined) updates.type = input.type;
    if (input.shares !== undefined) updates.shares = input.shares;
    if (input.purchasePrice !== undefined) updates.purchase_price = parseFloat(input.purchasePrice);
    if (input.purchaseDate !== undefined) updates.purchase_date = input.purchaseDate;
    if (input.currentPrice !== undefined) updates.current_price = input.currentPrice ? parseFloat(input.currentPrice) : null;
    if (input.salePrice !== undefined) updates.sale_price = input.salePrice ? parseFloat(input.salePrice) : null;
    if (input.saleDate !== undefined) updates.sale_date = input.saleDate || null;
    if (input.name !== undefined) updates.name = input.name;
    if (input.administrator !== undefined) updates.administrator = input.administrator;
    if (input.dyPercent !== undefined) updates.dy_percent = input.dyPercent ? parseFloat(input.dyPercent) : null;
    const data = throwIfError(
      await supabase.from("investments").update(updates).eq("id", input.id).eq("user_id", userId).select().single()
    );
    return mapKeys(data);
  },
  delete: async (input: { id: number }) => {
    const userId = await getUserId();
    throwIfError(await supabase.from("investments").update({ is_active: false }).eq("id", input.id).eq("user_id", userId));
  },
};

// ── Products ────────────────────────────────────────────────────────────────

export const productsApi = {
  list: async (params?: { isActive?: boolean }) => {
    const userId = await getUserId();
    let query = supabase.from("products").select("*").eq("user_id", userId);
    if (params?.isActive !== undefined) query = query.eq("is_active", params.isActive);
    const data = throwIfError(await query.order("name"));
    return mapKeys(data);
  },
  getLowStock: async () => {
    const userId = await getUserId();
    const { data } = await supabase.from("products").select("*").eq("user_id", userId).eq("is_active", true).gt("minimum_stock", 0);
    const lowStock = (data || []).filter((p: any) => p.quantity <= p.minimum_stock);
    return mapKeys(lowStock);
  },
  create: async (input: any) => {
    const userId = await getUserId();
    const cost = parseFloat(input.cost) || 0;
    const salePrice = parseFloat(input.salePrice) || 0;
    const profit = salePrice - cost;
    const profitMargin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
    const data = throwIfError(
      await supabase.from("products").insert({
        user_id: userId, name: input.name, description: input.description || null,
        category: input.category || null, cost, sale_price: salePrice, profit, profit_margin: profitMargin,
        quantity: parseInt(input.quantity) || 0, minimum_stock: parseInt(input.minimumStock) || 0,
        is_testing: input.isTesting || false,
      }).select().single()
    );
    return mapKeys(data);
  },
  update: async (input: any) => {
    const userId = await getUserId();
    const updates: any = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.category !== undefined) updates.category = input.category;
    if (input.cost !== undefined && input.salePrice !== undefined) {
      const cost = parseFloat(input.cost);
      const salePrice = parseFloat(input.salePrice);
      updates.cost = cost;
      updates.sale_price = salePrice;
      updates.profit = salePrice - cost;
      updates.profit_margin = salePrice > 0 ? ((salePrice - cost) / salePrice) * 100 : 0;
    }
    if (input.quantity !== undefined) updates.quantity = parseInt(input.quantity);
    if (input.minimumStock !== undefined) updates.minimum_stock = parseInt(input.minimumStock);
    if (input.isTesting !== undefined) updates.is_testing = input.isTesting;
    const data = throwIfError(
      await supabase.from("products").update(updates).eq("id", input.id).eq("user_id", userId).select().single()
    );
    return mapKeys(data);
  },
  delete: async (input: { id: number }) => {
    const userId = await getUserId();
    throwIfError(await supabase.from("products").update({ is_active: false }).eq("id", input.id).eq("user_id", userId));
  },
};

// ── Product Images ──────────────────────────────────────────────────────────

export const productImagesApi = {
  list: async (productId: number) => {
    const data = throwIfError(
      await (supabase.from as any)("product_images").select("*").eq("product_id", productId).order("created_at")
    );
    return mapKeys(data);
  },
  upload: async (input: { productId: number; file: File }) => {
    const userId = await getUserId();
    const ext = input.file.name.split(".").pop() || "jpg";
    const path = `${userId}/${input.productId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, input.file, { contentType: input.file.type });
    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);

    const data = throwIfError(
      await (supabase.from as any)("product_images").insert({
        product_id: input.productId,
        url: urlData.publicUrl,
        storage_path: path,
      }).select().single()
    );
    return mapKeys(data);
  },
  delete: async (input: { id: number; storagePath: string }) => {
    await supabase.storage.from("product-images").remove([input.storagePath]);
    throwIfError(await (supabase.from as any)("product_images").delete().eq("id", input.id));
  },
};

// ── Product Kit Images ──────────────────────────────────────────────────────

export const productKitImagesApi = {
  list: async (kitId: number) => {
    const data = throwIfError(
      await (supabase.from as any)("product_kit_images").select("*").eq("kit_id", kitId).order("created_at")
    );
    return mapKeys(data);
  },
  upload: async (input: { kitId: number; file: File }) => {
    const userId = await getUserId();
    const ext = input.file.name.split(".").pop() || "jpg";
    const path = `${userId}/kits/${input.kitId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, input.file, { contentType: input.file.type });
    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);

    const data = throwIfError(
      await (supabase.from as any)("product_kit_images").insert({
        kit_id: input.kitId,
        url: urlData.publicUrl,
        storage_path: path,
      }).select().single()
    );
    return mapKeys(data);
  },
  delete: async (input: { id: number; storagePath: string }) => {
    await supabase.storage.from("product-images").remove([input.storagePath]);
    throwIfError(await (supabase.from as any)("product_kit_images").delete().eq("id", input.id));
  },
};

// ── Product Kits ────────────────────────────────────────────────────────────

export const productKitsApi = {
  list: async () => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("product_kits").select("*").eq("user_id", userId).eq("is_active", true).order("name")
    );
    return mapKeys(data);
  },
  getItems: async (input: { kitId: number }) => {
    const data = throwIfError(
      await supabase.from("product_kit_items").select("*, products(name)").eq("kit_id", input.kitId)
    );
    return data.map((item: any) => ({
      ...mapKeys(item),
      productName: item.products?.name || `Produto #${item.product_id}`,
    }));
  },
  create: async (input: any) => {
    const userId = await getUserId();
    // Calculate total cost
    let totalCost = 0;
    for (const item of input.items) {
      const { data: product } = await supabase.from("products").select("cost").eq("id", item.productId).single();
      if (product) totalCost += product.cost * item.quantity;
    }
    const salePrice = parseFloat(input.salePrice);
    const profit = salePrice - totalCost;
    const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    const kit = throwIfError(
      await supabase.from("product_kits").insert({
        user_id: userId, name: input.name, description: input.description || null,
        sale_price: salePrice, total_cost: totalCost, profit, profit_margin: profitMargin,
        category: input.category || null,
      }).select().single()
    );

    for (const item of input.items) {
      await supabase.from("product_kit_items").insert({
        kit_id: kit.id, product_id: item.productId, quantity: item.quantity,
      });
    }
    return mapKeys(kit);
  },
  update: async (input: any) => {
    const userId = await getUserId();
    let totalCost = 0;
    if (input.items) {
      for (const item of input.items) {
        const { data: product } = await supabase.from("products").select("cost").eq("id", item.productId).single();
        if (product) totalCost += product.cost * item.quantity;
      }
    }
    const salePrice = parseFloat(input.salePrice);
    const profit = salePrice - totalCost;
    const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    throwIfError(
      await supabase.from("product_kits").update({
        name: input.name, description: input.description || null,
        sale_price: salePrice, total_cost: totalCost, profit, profit_margin: profitMargin,
        category: input.category || null,
        updated_at: new Date().toISOString(),
      }).eq("id", input.id).eq("user_id", userId)
    );

    if (input.items) {
      await supabase.from("product_kit_items").delete().eq("kit_id", input.id);
      for (const item of input.items) {
        await supabase.from("product_kit_items").insert({
          kit_id: input.id, product_id: item.productId, quantity: item.quantity,
        });
      }
    }
  },
  delete: async (input: { id: number }) => {
    const userId = await getUserId();
    await supabase.from("product_kit_items").delete().eq("kit_id", input.id);
    throwIfError(await supabase.from("product_kits").update({ is_active: false }).eq("id", input.id).eq("user_id", userId));
  },
  sellKit: async (input: { kitId: number; quantity: number }) => {
    const userId = await getUserId();
    const { data: items } = await supabase.from("product_kit_items").select("*").eq("kit_id", input.kitId);
    if (items) {
      for (const item of items) {
        const { data: product } = await supabase.from("products").select("quantity").eq("id", item.product_id).single();
        if (product) {
          await supabase.from("products").update({
            quantity: product.quantity - (item.quantity * input.quantity),
          }).eq("id", item.product_id);
        }
      }
    }
  },
};

// ── Sales ───────────────────────────────────────────────────────────────────

export const salesApi = {
  list: async (_params?: any) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("sales").select("*").eq("user_id", userId).order("date", { ascending: false })
    );
    return mapKeys(data);
  },
  create: async (input: any) => {
    const userId = await getUserId();
    // Calculate totals from items
    let totalAmount = 0;
    let totalCost = 0;
    for (const item of input.items) {
      totalAmount += item.unitPrice * item.quantity;
      totalCost += (item.unitCost || 0) * item.quantity;
    }
    const totalProfit = totalAmount - totalCost;

    // Create the sale
    const sale = throwIfError(
      await supabase.from("sales").insert({
        user_id: userId, date: input.date, description: input.description,
        amount: totalAmount, cost: totalCost, profit: totalProfit,
        source: input.source, customer_name: input.customerName || null,
        account_id: input.accountId || null,
      }).select().single()
    );

    // Create sale items
    for (const item of input.items) {
      await supabase.from("sale_items").insert({
        sale_id: sale.id, description: item.description,
        product_id: item.productId || null, quantity: item.quantity,
        unit_price: item.unitPrice, unit_cost: item.unitCost || 0,
        total_price: item.unitPrice * item.quantity,
        total_cost: (item.unitCost || 0) * item.quantity,
      });

      // Decrease product stock
      if (item.productId && !item.isKit) {
        const { data: product } = await supabase.from("products").select("quantity").eq("id", item.productId).single();
        if (product) {
          await supabase.from("products").update({
            quantity: Math.max(0, product.quantity - item.quantity),
          }).eq("id", item.productId);
        }
      }
    }

    // Update bank account balance and create transaction if applicable
    if (input.accountId && input.source !== "debtor") {
      const { data: account } = await supabase.from("bank_accounts").select("balance").eq("id", input.accountId).single();
      if (account) {
        await supabase.from("bank_accounts").update({ balance: account.balance + totalAmount }).eq("id", input.accountId);
      }
      // Create transaction record
      await supabase.from("transactions").insert({
        user_id: userId, account_id: input.accountId, date: input.date,
        description: `Venda: ${input.description}`, amount: totalAmount,
        type: "income" as any, category: "sale", is_personal: false,
      });
    }

    // Create debtor if source is debtor
    if (input.source === "debtor" && input.customerName) {
      await supabase.from("debtors").insert({
        user_id: userId, name: input.customerName,
        total_amount: totalAmount, remaining_amount: totalAmount,
        description: input.description,
      });
    }

    return mapKeys(sale);
  },
  delete: async (input: { id: number }) => {
    const userId = await getUserId();
    // Get sale details
    const { data: sale } = await supabase.from("sales").select("*").eq("id", input.id).eq("user_id", userId).single();
    if (!sale) throw new Error("Venda não encontrada");

    // Get sale items to restore stock
    const { data: items } = await supabase.from("sale_items").select("*").eq("sale_id", input.id);
    if (items) {
      for (const item of items) {
        if (item.product_id) {
          const { data: product } = await supabase.from("products").select("quantity").eq("id", item.product_id).single();
          if (product) {
            await supabase.from("products").update({ quantity: product.quantity + item.quantity }).eq("id", item.product_id);
          }
        }
      }
      await supabase.from("sale_items").delete().eq("sale_id", input.id);
    }

    // Revert bank account balance and delete transaction
    if (sale.account_id && sale.source !== "debtor") {
      const { data: account } = await supabase.from("bank_accounts").select("balance").eq("id", sale.account_id).single();
      if (account) {
        await supabase.from("bank_accounts").update({ balance: account.balance - sale.amount }).eq("id", sale.account_id);
      }
      // Remove related transaction
      await supabase.from("transactions").delete()
        .eq("user_id", userId).eq("account_id", sale.account_id)
        .eq("amount", sale.amount).ilike("description", `Venda:%`).limit(1);
    }

    // Revert debtor if source was debtor
    if (sale.source === "debtor" && sale.customer_name) {
      const { data: debtors } = await supabase.from("debtors")
        .select("*")
        .eq("user_id", userId)
        .eq("name", sale.customer_name)
        .eq("total_amount", sale.amount)
        .order("created_at", { ascending: false })
        .limit(1);
      if (debtors && debtors.length > 0) {
        const debtor = debtors[0];
        // Delete any payments associated with this debtor
        await supabase.from("debtor_payments").delete().eq("debtor_id", debtor.id);
        // Delete the debtor
        await supabase.from("debtors").delete().eq("id", debtor.id).eq("user_id", userId);
      }
    }

    throwIfError(await supabase.from("sales").delete().eq("id", input.id).eq("user_id", userId));
  },
  update: async (input: any) => {
    const userId = await getUserId();

    // Get old sale to revert effects
    const { data: oldSale } = await supabase.from("sales").select("*").eq("id", input.id).eq("user_id", userId).single();
    if (!oldSale) throw new Error("Venda não encontrada");

    // Revert old stock
    const { data: oldItems } = await supabase.from("sale_items").select("*").eq("sale_id", input.id);
    if (oldItems) {
      for (const item of oldItems) {
        if (item.product_id) {
          const { data: product } = await supabase.from("products").select("quantity").eq("id", item.product_id).single();
          if (product) {
            await supabase.from("products").update({ quantity: product.quantity + item.quantity }).eq("id", item.product_id);
          }
        }
      }
      await supabase.from("sale_items").delete().eq("sale_id", input.id);
    }

    // Revert old bank balance
    if (oldSale.account_id && oldSale.source !== "debtor") {
      const { data: account } = await supabase.from("bank_accounts").select("balance").eq("id", oldSale.account_id).single();
      if (account) {
        await supabase.from("bank_accounts").update({ balance: account.balance - oldSale.amount }).eq("id", oldSale.account_id);
      }
    }

    // Revert old debtor
    if (oldSale.source === "debtor" && oldSale.customer_name) {
      const { data: debtors } = await supabase.from("debtors")
        .select("*").eq("user_id", userId).eq("name", oldSale.customer_name)
        .eq("total_amount", oldSale.amount).order("created_at", { ascending: false }).limit(1);
      if (debtors && debtors.length > 0) {
        await supabase.from("debtor_payments").delete().eq("debtor_id", debtors[0].id);
        await supabase.from("debtors").delete().eq("id", debtors[0].id).eq("user_id", userId);
      }
    }

    // Calculate new totals
    let totalAmount = 0;
    let totalCost = 0;
    for (const item of input.items) {
      totalAmount += item.unitPrice * item.quantity;
      totalCost += (item.unitCost || 0) * item.quantity;
    }
    const totalProfit = totalAmount - totalCost;

    // Update sale
    const sale = throwIfError(
      await supabase.from("sales").update({
        date: input.date, description: input.description,
        amount: totalAmount, cost: totalCost, profit: totalProfit,
        source: input.source, customer_name: input.customerName || null,
        account_id: input.accountId || null, updated_at: new Date().toISOString(),
      }).eq("id", input.id).eq("user_id", userId).select().single()
    );

    // Create new sale items & decrease stock
    for (const item of input.items) {
      await supabase.from("sale_items").insert({
        sale_id: input.id, description: item.description,
        product_id: item.productId || null, quantity: item.quantity,
        unit_price: item.unitPrice, unit_cost: item.unitCost || 0,
        total_price: item.unitPrice * item.quantity,
        total_cost: (item.unitCost || 0) * item.quantity,
      });
      if (item.productId && !item.isKit) {
        const { data: product } = await supabase.from("products").select("quantity").eq("id", item.productId).single();
        if (product) {
          await supabase.from("products").update({ quantity: Math.max(0, product.quantity - item.quantity) }).eq("id", item.productId);
        }
      }
    }

    // Apply new bank balance
    if (input.accountId && input.source !== "debtor") {
      const { data: account } = await supabase.from("bank_accounts").select("balance").eq("id", input.accountId).single();
      if (account) {
        await supabase.from("bank_accounts").update({ balance: account.balance + totalAmount }).eq("id", input.accountId);
      }
    }

    // Create new debtor if needed
    if (input.source === "debtor" && input.customerName) {
      await supabase.from("debtors").insert({
        user_id: userId, name: input.customerName,
        total_amount: totalAmount, remaining_amount: totalAmount,
        description: input.description,
      });
    }

    return mapKeys(sale);
  },
};

// ── Services ────────────────────────────────────────────────────────────────

export const servicesApi = {
  list: async (_params?: any) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("services").select("*").eq("user_id", userId).order("date", { ascending: false })
    );
    return mapKeys(data);
  },
  getNextOSNumber: async () => {
    const userId = await getUserId();
    const { data } = await supabase
      .from("services")
      .select("os_number")
      .eq("user_id", userId)
      .not("os_number", "is", null)
      .order("os_number", { ascending: false })
      .limit(1);
    if (data && data.length > 0 && data[0].os_number) {
      const num = parseInt(data[0].os_number.replace(/\D/g, ""), 10);
      if (!isNaN(num)) return String(num + 1).padStart(4, "0");
    }
    return "0001";
  },
  create: async (input: any) => {
    const userId = await getUserId();
    const serviceType = input.serviceType || "pending";
    const isCompleted = serviceType === "no_repair" || serviceType === "repaired" || serviceType === "test";
    const amount = input.amount ? parseFloat(input.amount) : 0;
    const cost = input.cost ? parseFloat(input.cost) : 0;
    const data = throwIfError(
      await supabase.from("services").insert({
        user_id: userId, date: input.date, description: input.description,
        service_type: serviceType,
        status: isCompleted ? "completed" : "open",
        amount: input.amount ? parseFloat(input.amount) : null,
        cost: cost,
        profit: amount - cost,
        customer_name: input.customerName || null,
        os_number: input.osNumber || null,
        serial_number: input.serialNumber || null,
        account_id: input.accountId || null,
        storage_location: input.storageLocation || null,
      }).select().single()
    );
    // Auto-create debtor for repaired/test services with amount
    if ((serviceType === "repaired" || serviceType === "test") && amount > 0 && input.customerName) {
      await supabase.from("debtors").insert({
        user_id: userId,
        name: input.customerName,
        total_amount: amount,
        remaining_amount: amount,
        description: `Serviço OS ${input.osNumber || "S/N"} - ${input.description}`,
      });
    }
    return mapKeys(data);
  },
  update: async (input: any) => {
    const userId = await getUserId();
    // Fetch current service to detect status change
    const { data: currentService } = await supabase.from("services").select("*").eq("id", input.id).eq("user_id", userId).single();
    const updates: any = { updated_at: new Date().toISOString() };
    if (input.date !== undefined) updates.date = input.date;
    if (input.description !== undefined) updates.description = input.description;
    if (input.serviceType !== undefined) {
      updates.service_type = input.serviceType;
      const isCompleted = input.serviceType === "no_repair" || input.serviceType === "repaired" || input.serviceType === "test";
      updates.status = isCompleted ? "completed" : "open";
    }
    if (input.amount !== undefined) updates.amount = input.amount ? parseFloat(input.amount) : null;
    if (input.cost !== undefined) updates.cost = input.cost ? parseFloat(input.cost) : 0;
    if (input.amount !== undefined || input.cost !== undefined) {
      const amt = input.amount ? parseFloat(input.amount) : 0;
      const cst = input.cost ? parseFloat(input.cost) : 0;
      updates.profit = amt - cst;
    }
    if (input.customerName !== undefined) updates.customer_name = input.customerName;
    if (input.osNumber !== undefined) updates.os_number = input.osNumber;
    if (input.serialNumber !== undefined) updates.serial_number = input.serialNumber;
    if (input.accountId !== undefined) updates.account_id = input.accountId || null;
    if (input.storageLocation !== undefined) updates.storage_location = input.storageLocation;
    const data = throwIfError(
      await supabase.from("services").update(updates).eq("id", input.id).eq("user_id", userId).select().single()
    );
    // Auto-create debtor if status changed to completed (repaired/test) and wasn't completed before
    const newType = input.serviceType || currentService?.service_type;
    const wasCompleted = currentService?.status === "completed";
    const isNowCompleted = (newType === "repaired" || newType === "test") && updates.status === "completed";
    if (isNowCompleted && !wasCompleted) {
      const amount = updates.amount ?? currentService?.amount ?? 0;
      const customerName = updates.customer_name ?? currentService?.customer_name;
      const osNumber = updates.os_number ?? currentService?.os_number;
      const description = updates.description ?? currentService?.description;
      if (amount > 0 && customerName) {
        await supabase.from("debtors").insert({
          user_id: userId,
          name: customerName,
          total_amount: amount,
          remaining_amount: amount,
          description: `Serviço OS ${osNumber || "S/N"} - ${description}`,
        });
      }
    }
    return mapKeys(data);
  },
  delete: async (input: { id: number }) => {
    const userId = await getUserId();
    throwIfError(await supabase.from("services").delete().eq("id", input.id).eq("user_id", userId));
  },
};

// ── Expenses ────────────────────────────────────────────────────────────────

export const expensesApi = {
  list: async (_params?: any) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("expenses").select("*").eq("user_id", userId).order("date", { ascending: false })
    );
    return mapKeys(data);
  },
  create: async (input: any) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("expenses").insert({
        user_id: userId, date: input.date, description: input.description,
        amount: parseFloat(input.amount), category: input.category,
        is_paid: input.isPaid || false, is_recurring: input.isRecurring || false,
        due_date: input.dueDate || null, account_id: input.accountId || null,
      }).select().single()
    );
    return mapKeys(data);
  },
  update: async (input: any) => {
    const userId = await getUserId();
    const updates: any = { updated_at: new Date().toISOString() };
    if (input.date !== undefined) updates.date = input.date;
    if (input.description !== undefined) updates.description = input.description;
    if (input.amount !== undefined) updates.amount = parseFloat(input.amount);
    if (input.category !== undefined) updates.category = input.category;
    if (input.isPaid !== undefined) updates.is_paid = input.isPaid;
    if (input.isRecurring !== undefined) updates.is_recurring = input.isRecurring;
    if (input.dueDate !== undefined) updates.due_date = input.dueDate || null;
    if (input.accountId !== undefined) updates.account_id = input.accountId || null;
    const data = throwIfError(
      await supabase.from("expenses").update(updates).eq("id", input.id).eq("user_id", userId).select().single()
    );
    return mapKeys(data);
  },
  delete: async (input: { id: number }) => {
    const userId = await getUserId();
    throwIfError(await supabase.from("expenses").delete().eq("id", input.id).eq("user_id", userId));
  },
};

// ── Debtors ─────────────────────────────────────────────────────────────────

export const debtorsApi = {
  list: async () => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("debtors").select("*").eq("user_id", userId).order("created_at", { ascending: false })
    );
    return mapKeys(data);
  },
  create: async (input: any) => {
    const userId = await getUserId();
    const totalAmount = parseFloat(input.totalAmount);
    const data = throwIfError(
      await supabase.from("debtors").insert({
        user_id: userId, name: input.name,
        total_amount: totalAmount, remaining_amount: input.remainingAmount ? parseFloat(input.remainingAmount) : totalAmount,
        description: input.description || null, due_date: input.dueDate || null,
      }).select().single()
    );
    return mapKeys(data);
  },
  update: async (input: any) => {
    const userId = await getUserId();
    const updates: any = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.totalAmount !== undefined) updates.total_amount = parseFloat(input.totalAmount);
    if (input.remainingAmount !== undefined) updates.remaining_amount = parseFloat(input.remainingAmount);
    if (input.description !== undefined) updates.description = input.description;
    if (input.dueDate !== undefined) updates.due_date = input.dueDate || null;
    if (input.status !== undefined) updates.status = input.status;
    const data = throwIfError(
      await supabase.from("debtors").update(updates).eq("id", input.id).eq("user_id", userId).select().single()
    );
    return mapKeys(data);
  },
  delete: async (input: { id: number }) => {
    const userId = await getUserId();
    await supabase.from("debtor_payments").delete().eq("debtor_id", input.id).eq("user_id", userId);
    throwIfError(await supabase.from("debtors").delete().eq("id", input.id).eq("user_id", userId));
  },
  createPayment: async (input: { debtorId: number; amount: string; date: string; accountId?: number; notes?: string }) => {
    const userId = await getUserId();
    const amount = parseFloat(input.amount);
    await supabase.from("debtor_payments").insert({
      user_id: userId, debtor_id: input.debtorId, amount, date: input.date,
      account_id: input.accountId || null, notes: input.notes || null,
    });
    // Update debtor
    const { data: debtor } = await supabase.from("debtors").select("*").eq("id", input.debtorId).single();
    if (debtor) {
      const newPaid = debtor.paid_amount + amount;
      const newRemaining = debtor.total_amount - newPaid;
      const newStatus = newRemaining <= 0 ? "paid" : newPaid > 0 ? "partial" : "pending";
      await supabase.from("debtors").update({
        paid_amount: newPaid, remaining_amount: Math.max(0, newRemaining), status: newStatus,
      }).eq("id", input.debtorId);
    }
    // Update bank account
    if (input.accountId) {
      const { data: account } = await supabase.from("bank_accounts").select("balance").eq("id", input.accountId).single();
      if (account) {
        await supabase.from("bank_accounts").update({ balance: account.balance + amount }).eq("id", input.accountId);
      }
      // Create transaction record for debtor payment
      await supabase.from("transactions").insert({
        user_id: userId, account_id: input.accountId, date: input.date,
        description: `Pagamento devedor: ${debtor?.name || ''}`, amount,
        type: "income" as any, category: "debtor_payment", is_personal: false,
      });
    }
  },
  listPayments: async (input: { debtorId: number }) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("debtor_payments").select("*").eq("user_id", userId).eq("debtor_id", input.debtorId).order("date", { ascending: false })
    );
    return mapKeys(data);
  },
  listSalesByCustomer: async (input: { customerName: string }) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("sales").select("*").eq("user_id", userId).eq("customer_name", input.customerName).order("date", { ascending: false })
    );
    return mapKeys(data);
  },
  listPaymentsByIds: async (input: { debtorIds: number[] }) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("debtor_payments").select("*").eq("user_id", userId).in("debtor_id", input.debtorIds).order("date", { ascending: false })
    );
    return mapKeys(data);
  },
};

// ── Purchases ───────────────────────────────────────────────────────────────

export const purchasesApi = {
  list: async () => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("purchases").select("*").eq("user_id", userId).order("date", { ascending: false })
    );
    return mapKeys(data);
  },
  create: async (input: any) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("purchases").insert({
        user_id: userId, date: input.date, supplier: input.supplier,
        description: input.description, amount: parseFloat(input.amount),
        status: input.status || "pending", account_id: input.accountId || null,
        due_date: input.dueDate || null, paid_date: input.paidDate || null,
        notes: input.notes || null,
      }).select().single()
    );
    return mapKeys(data);
  },
  update: async (input: any) => {
    const userId = await getUserId();
    const updates: any = { updated_at: new Date().toISOString() };
    if (input.date !== undefined) updates.date = input.date;
    if (input.supplier !== undefined) updates.supplier = input.supplier;
    if (input.description !== undefined) updates.description = input.description;
    if (input.amount !== undefined) updates.amount = parseFloat(input.amount);
    if (input.status !== undefined) updates.status = input.status;
    if (input.accountId !== undefined) updates.account_id = input.accountId || null;
    if (input.dueDate !== undefined) updates.due_date = input.dueDate || null;
    if (input.paidDate !== undefined) updates.paid_date = input.paidDate || null;
    if (input.notes !== undefined) updates.notes = input.notes || null;
    const data = throwIfError(
      await supabase.from("purchases").update(updates).eq("id", input.id).eq("user_id", userId).select().single()
    );
    return mapKeys(data);
  },
  delete: async (input: { id: number }) => {
    const userId = await getUserId();
    throwIfError(await supabase.from("purchases").delete().eq("id", input.id).eq("user_id", userId));
  },
};

// ── Suppliers ───────────────────────────────────────────────────────────────

export const suppliersApi = {
  list: async () => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("suppliers").select("*").eq("user_id", userId).order("name")
    );
    return mapKeys(data);
  },
  create: async (input: any) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("suppliers").insert({
        user_id: userId, name: input.name,
        phone: input.phone || null, email: input.email || null,
        address: input.contact || null, notes: input.notes || null,
      }).select().single()
    );
    return mapKeys(data);
  },
  update: async (input: any) => {
    const userId = await getUserId();
    const updates: any = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.email !== undefined) updates.email = input.email;
    if (input.notes !== undefined) updates.notes = input.notes;
    const data = throwIfError(
      await supabase.from("suppliers").update(updates).eq("id", input.id).eq("user_id", userId).select().single()
    );
    return mapKeys(data);
  },
  delete: async (input: { id: number }) => {
    const userId = await getUserId();
    throwIfError(await supabase.from("suppliers").delete().eq("id", input.id).eq("user_id", userId));
  },
  getPurchases: async (supplierName: string) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", userId)
        .eq("supplier", supplierName)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
    );
    return mapKeys(data);
  },
  getPayments: async (supplierName: string) => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase
        .from("supplier_payments")
        .select("*")
        .eq("user_id", userId)
        .eq("supplier_name", supplierName)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
    );
    return mapKeys(data);
  },
};

// ── Collaborators ───────────────────────────────────────────────────────────

export const collaboratorsApi = {
  list: async () => {
    const userId = await getUserId();
    const data = throwIfError(
      await supabase.from("collaborators").select("*").eq("owner_id", userId).order("created_at", { ascending: false })
    );
    return mapKeys(data);
  },
  invite: async (input: { email: string; name?: string }) => {
    const userId = await getUserId();
    const inviteToken = crypto.randomUUID();
    throwIfError(
      await supabase.from("collaborators").insert({
        owner_id: userId, email: input.email, name: input.name || null,
        invite_token: inviteToken, status: "pending" as any,
      })
    );
    return { inviteToken };
  },
  acceptInvite: async (input: { inviteToken: string }) => {
    const userId = await getUserId();
    const { data: collab } = await supabase.from("collaborators").select("*").eq("invite_token", input.inviteToken).single();
    if (!collab) throw new Error("Convite não encontrado");
    throwIfError(
      await supabase.from("collaborators").update({ user_id: userId, status: "active" as any }).eq("id", collab.id)
    );
  },
  acceptPendingInvite: async () => {
    const userId = await getUserId();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error("Email não encontrado");
    const { data: collab } = await supabase.from("collaborators").select("*").eq("email", user.email).eq("status", "pending").single();
    if (!collab) throw new Error("Convite não encontrado para este email");
    throwIfError(
      await supabase.from("collaborators").update({ user_id: userId, status: "active" as any }).eq("id", collab.id)
    );
  },
  getPermissions: async (input: { collaboratorId: number }) => {
    const data = throwIfError(
      await supabase.from("collaborator_permissions").select("*").eq("collaborator_id", input.collaboratorId)
    );
    return mapKeys(data);
  },
  updatePermissions: async (input: { collaboratorId: number; permissions: Array<{ section: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }> }) => {
    // Delete existing permissions
    await supabase.from("collaborator_permissions").delete().eq("collaborator_id", input.collaboratorId);
    // Insert new permissions
    for (const perm of input.permissions) {
      await supabase.from("collaborator_permissions").insert({
        collaborator_id: input.collaboratorId, section: perm.section,
        can_view: perm.canView, can_create: perm.canCreate,
        can_edit: perm.canEdit, can_delete: perm.canDelete,
      });
    }
  },
  updateStatus: async (input: { collaboratorId: number; status: string }) => {
    throwIfError(
      await supabase.from("collaborators").update({ status: input.status as any }).eq("id", input.collaboratorId)
    );
  },
  delete: async (input: { collaboratorId: number }) => {
    await supabase.from("collaborator_permissions").delete().eq("collaborator_id", input.collaboratorId);
    throwIfError(await supabase.from("collaborators").delete().eq("id", input.collaboratorId));
  },
  myCollaboratorInfo: async () => {
    const userId = await getUserId();
    const { data: collab } = await supabase.from("collaborators")
      .select("*").eq("user_id", userId).eq("status", "active").maybeSingle();
    if (!collab) return null;
    const { data: permissions } = await supabase.from("collaborator_permissions")
      .select("*").eq("collaborator_id", collab.id);
    return { ...mapKeys(collab), permissions: mapKeys(permissions || []) };
  },
};

// ── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: async () => {
    const userId = await getUserId();
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;

    const [accountsRes, investmentsRes, debtorsRes, salesRes, servicesRes, expensesRes] = await Promise.all([
      supabase.from("bank_accounts").select("balance, name").eq("user_id", userId).eq("is_active", true),
      supabase.from("investments").select("shares, purchase_price, current_price").eq("user_id", userId).eq("is_active", true),
      supabase.from("debtors").select("remaining_amount").eq("user_id", userId).neq("status", "paid"),
      supabase.from("sales").select("amount, cost, profit").eq("user_id", userId).gte("date", monthStart).lte("date", monthEnd),
      supabase.from("services").select("amount").eq("user_id", userId).gte("date", monthStart).lte("date", monthEnd),
      supabase.from("expenses").select("amount, category").eq("user_id", userId).gte("date", monthStart).lte("date", monthEnd),
    ]);

    const marketplaceKeywords = ["shopee", "mercado livre", "mercadolivre", "mercado pago"];
    const isMarketplace = (name: string) => marketplaceKeywords.some(kw => name.toLowerCase().includes(kw));
    const allAccounts = accountsRes.data || [];
    const businessAccounts = allAccounts.filter(a => !isMarketplace(a.name));
    const marketplaceAccounts = allAccounts.filter(a => isMarketplace(a.name));
    const totalBalance = businessAccounts.reduce((s, a) => s + a.balance, 0);
    const totalMarketplace = marketplaceAccounts.reduce((s, a) => s + a.balance, 0);
    const totalInvestments = (investmentsRes.data || []).reduce((s, i) => s + i.shares * (i.current_price || i.purchase_price), 0);
    const totalDebtors = (debtorsRes.data || []).reduce((s, d) => s + d.remaining_amount, 0) + totalMarketplace;
    const monthSales = (salesRes.data || []).reduce((s, sale) => s + sale.amount, 0);
    const monthServices = (servicesRes.data || []).reduce((s, svc) => s + (svc.amount || 0), 0);
    const monthIncome = monthSales + monthServices;
    const expensesStill = (expensesRes.data || []).filter(e => e.category === "still").reduce((s, e) => s + e.amount, 0);
    const expensesEdgar = (expensesRes.data || []).filter(e => e.category !== "still").reduce((s, e) => s + e.amount, 0);
    const totalExpenses = (expensesRes.data || []).reduce((s, e) => s + e.amount, 0);

    return {
      totalBalance,
      totalInvestments,
      totalDebtors,
      netWorth: totalBalance + totalInvestments + totalDebtors,
      monthIncome,
      expensesStill,
      expensesEdgar,
      monthProfit: monthIncome - totalExpenses,
    };
  },
};

// ── Reports ─────────────────────────────────────────────────────────────────

export const reportsApi = {
  topSellingProducts: async (input: { startDate: string; endDate: string }) => {
    const userId = await getUserId();
    const { data: saleItems } = await supabase
      .from("sale_items")
      .select("*, sales!inner(user_id, date)")
      .eq("sales.user_id", userId)
      .gte("sales.date", input.startDate)
      .lte("sales.date", input.endDate);

    const productMap: Record<string, { productId: number | null; productName: string; totalQuantity: number; totalRevenue: number; totalCost: number; totalProfit: number }> = {};
    for (const item of (saleItems || [])) {
      const key = item.description;
      if (!productMap[key]) {
        productMap[key] = { productId: item.product_id, productName: item.description, totalQuantity: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0 };
      }
      productMap[key].totalQuantity += item.quantity;
      productMap[key].totalRevenue += item.total_price;
      productMap[key].totalCost += item.total_cost;
      productMap[key].totalProfit += item.total_price - item.total_cost;
    }
    return Object.values(productMap);
  },
  salesByDay: async (input: { startDate: string; endDate: string }) => {
    const userId = await getUserId();
    const { data: sales } = await supabase
      .from("sales")
      .select("date, amount, profit")
      .eq("user_id", userId)
      .gte("date", input.startDate)
      .lte("date", input.endDate)
      .order("date");

    const dayMap: Record<string, { date: string; totalRevenue: number; totalProfit: number; salesCount: number }> = {};
    for (const sale of (sales || [])) {
      if (!dayMap[sale.date]) {
        dayMap[sale.date] = { date: sale.date, totalRevenue: 0, totalProfit: 0, salesCount: 0 };
      }
      dayMap[sale.date].totalRevenue += sale.amount;
      dayMap[sale.date].totalProfit += sale.profit;
      dayMap[sale.date].salesCount += 1;
    }
    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  },
  salesSummary: async (input: { startDate: string; endDate: string }) => {
    const userId = await getUserId();
    const { data: sales } = await supabase
      .from("sales")
      .select("amount, profit")
      .eq("user_id", userId)
      .gte("date", input.startDate)
      .lte("date", input.endDate);

    const totalSales = sales?.length || 0;
    const totalRevenue = (sales || []).reduce((s, sale) => s + sale.amount, 0);
    const totalProfit = (sales || []).reduce((s, sale) => s + sale.profit, 0);
    return {
      totalSales,
      totalRevenue,
      totalProfit,
      avgTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
    };
  },
  productDetail: async (input: { productId: number }) => {
    const userId = await getUserId();
    const { data: items } = await supabase
      .from("sale_items")
      .select("*, sales!inner(user_id, date)")
      .eq("sales.user_id", userId)
      .eq("product_id", input.productId);

    const totalQuantity = (items || []).reduce((s, i) => s + i.quantity, 0);
    const totalRevenue = (items || []).reduce((s, i) => s + i.total_price, 0);
    const totalCost = (items || []).reduce((s, i) => s + i.total_cost, 0);

    const dayMap: Record<string, { date: string; totalQuantity: number; totalRevenue: number; totalProfit: number }> = {};
    for (const item of (items || [])) {
      const date = (item as any).sales?.date || "";
      if (!dayMap[date]) dayMap[date] = { date, totalQuantity: 0, totalRevenue: 0, totalProfit: 0 };
      dayMap[date].totalQuantity += item.quantity;
      dayMap[date].totalRevenue += item.total_price;
      dayMap[date].totalProfit += item.total_price - item.total_cost;
    }

    return {
      totalQuantity,
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
      dailySales: Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
};

// ── Supplier Payments ───────────────────────────────────────────────────────

export const supplierPaymentsApi = {
  create: async (input: { supplierName: string; amount: string; date: string; accountId: number; notes?: string }) => {
    const userId = await getUserId();
    const amount = parseFloat(input.amount);
    const data = throwIfError(
      await supabase.from("supplier_payments").insert({
        user_id: userId, supplier_name: input.supplierName,
        amount, date: input.date, account_id: input.accountId,
        notes: input.notes || null,
      }).select().single()
    );
    // Debit bank account
    const { data: account } = await supabase.from("bank_accounts").select("balance").eq("id", input.accountId).single();
    if (account) {
      await supabase.from("bank_accounts").update({ balance: account.balance - amount }).eq("id", input.accountId);
    }
    return mapKeys(data);
  },
};
