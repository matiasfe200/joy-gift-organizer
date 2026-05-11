import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_PIN = "199408";

type EditPayload = {
  pin: string;
  action:
    | { type: "add"; name: string; already_owned: boolean }
    | { type: "rename"; id: string; name: string }
    | { type: "delete"; id: string }
    | { type: "toggle_owned"; id: string; already_owned: boolean }
    | { type: "unclaim"; id: string };
};

export const adminEditGift = createServerFn({ method: "POST" })
  .inputValidator((data: EditPayload) => {
    if (!data || typeof data.pin !== "string") throw new Error("Invalid payload");
    return data;
  })
  .handler(async ({ data }) => {
    if (data.pin !== ADMIN_PIN) {
      throw new Error("PIN incorreto");
    }
    const { action } = data;
    switch (action.type) {
      case "add": {
        const name = action.name.trim();
        if (!name || name.length > 120) throw new Error("Nome inválido");
        const { error } = await supabaseAdmin
          .from("gifts")
          .insert({ name, already_owned: !!action.already_owned });
        if (error) throw new Error(error.message);
        return { ok: true };
      }
      case "rename": {
        const name = action.name.trim();
        if (!name || name.length > 120) throw new Error("Nome inválido");
        const { error } = await supabaseAdmin
          .from("gifts")
          .update({ name })
          .eq("id", action.id);
        if (error) throw new Error(error.message);
        return { ok: true };
      }
      case "delete": {
        const { error } = await supabaseAdmin
          .from("gifts")
          .delete()
          .eq("id", action.id);
        if (error) throw new Error(error.message);
        return { ok: true };
      }
      case "toggle_owned": {
        const { error } = await supabaseAdmin
          .from("gifts")
          .update({
            already_owned: action.already_owned,
            // se passou para "já temos", limpamos a reserva
            ...(action.already_owned ? { claimed_by: null, claimed_at: null } : {}),
          })
          .eq("id", action.id);
        if (error) throw new Error(error.message);
        return { ok: true };
      }
      case "unclaim": {
        const { error } = await supabaseAdmin
          .from("gifts")
          .update({ claimed_by: null, claimed_at: null })
          .eq("id", action.id);
        if (error) throw new Error(error.message);
        return { ok: true };
      }
    }
  });
