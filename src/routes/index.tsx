import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminEditGift } from "@/lib/admin-gifts.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Check,
  Gift as GiftIcon,
  Heart,
  Sparkles,
  Bed,
  Tv,
  Sofa,
  Shirt,
  Refrigerator,
  WashingMachine,
  Microwave,
  Flame,
  CookingPot,
  Utensils,
  UtensilsCrossed,
  Coffee,
  GlassWater,
  Sandwich,
  Soup,
  Cookie,
  Fan,
  Package,
  Blinds,
  Bath,
  Armchair,
  Archive,
  Layers,
  Lock,
  LockOpen,
  Pencil,
  Trash2,
  Plus,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import invite from "@/assets/invite.jpeg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chá de Panela — Sara & Matias" },
      {
        name: "description",
        content:
          "Lista de presentes do Chá de Panela de Sara e Matias. Escolha um presente para abençoar nosso novo lar.",
      },
    ],
  }),
  component: Index,
});

type Gift = {
  id: string;
  name: string;
  already_owned: boolean;
  claimed_by: string | null;
  claimed_at: string | null;
};

const ICONS: Record<string, LucideIcon> = {
  "Cama": Bed,
  "Cabeceira da cama": Bed,
  "Mesa de jantar": Armchair,
  "Painel da TV": Tv,
  "TV": Tv,
  "Armário de cozinha": Archive,
  "Máquina de lavar": WashingMachine,
  "Fogão cooktop": Flame,
  "Geladeira": Refrigerator,
  "Sofá": Sofa,
  "Guarda-roupas": Shirt,
  "Base/balcão do cooktop": Flame,
  "Tanquinho de lavar roupa": WashingMachine,
  "Panela de pressão": CookingPot,
  "Jogo de panelas": CookingPot,
  "Frigideira": CookingPot,
  "Assadeiras": Cookie,
  "Air fryer": Microwave,
  "Forno elétrico": Microwave,
  "Micro-ondas": Microwave,
  "Sanduicheira": Sandwich,
  "Liquidificador": Soup,
  "Cafeteira": Coffee,
  "Escorredor de pratos": UtensilsCrossed,
  "Jogo de pratos": UtensilsCrossed,
  "Copos": GlassWater,
  "Talheres": Utensils,
  "Potes organizadores": Package,
  "Cobertas": Bed,
  "Cortinas": Blinds,
  "Toalhas": Bath,
  "Tábua de passar roupa": Shirt,
  "Ventilador": Fan,
  "Tapetes": Layers,
};

function iconFor(name: string): LucideIcon {
  return ICONS[name] ?? GiftIcon;
}

type Burst = { id: number; left: number; top: number };

function Index() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Gift | null>(null);
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);

  // Admin / edit mode state
  const editFn = useServerFn(adminEditGift);
  const [adminPin, setAdminPin] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [editing, setEditing] = useState<Gift | null>(null);
  const [editName, setEditName] = useState("");
  const [editOwned, setEditOwned] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOwned, setNewOwned] = useState(false);
  const [busy, setBusy] = useState(false);

  const isAdmin = !!adminPin;

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_pin");
    if (stored) setAdminPin(stored);
  }, []);

  useEffect(() => {
    supabase
      .from("gifts")
      .select("*")
      .order("already_owned", { ascending: true })
      .order("name")
      .then(({ data }) => {
        if (data) setGifts(data as Gift[]);
        setLoading(false);
      });

    const channel = supabase
      .channel("gifts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gifts" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setGifts((prev) =>
              prev.map((g) => (g.id === (payload.new as Gift).id ? (payload.new as Gift) : g))
            );
          } else if (payload.eventType === "INSERT") {
            setGifts((prev) =>
              prev.some((g) => g.id === (payload.new as Gift).id)
                ? prev
                : [...prev, payload.new as Gift]
            );
          } else if (payload.eventType === "DELETE") {
            setGifts((prev) => prev.filter((g) => g.id !== (payload.old as Gift).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerBurst = () => {
    const id = Date.now();
    setBursts((b) => [...b, { id, left: 50, top: 60 }]);
    setTimeout(() => {
      setBursts((b) => b.filter((x) => x.id !== id));
    }, 5200);
  };

  const handleClaim = async () => {
    if (!selected || !guestName.trim()) return;
    setSubmitting(true);
    const { error, data } = await supabase
      .from("gifts")
      .update({ claimed_by: guestName.trim(), claimed_at: new Date().toISOString() })
      .eq("id", selected.id)
      .is("claimed_by", null)
      .select()
      .single();
    setSubmitting(false);
    if (error || !data) {
      toast.error("Ops! Esse presente já foi escolhido por outra pessoa.");
    } else {
      toast.success(`Obrigada, ${guestName.trim()}! Presente reservado com carinho. 💕`);
      setSelected(null);
      setGuestName("");
      triggerBurst();
    }
  };

  const submitPin = () => {
    const pin = pinValue.trim();
    if (pin === "199408") {
      setAdminPin(pin);
      sessionStorage.setItem("admin_pin", pin);
      setPinOpen(false);
      setPinValue("");
      toast.success("Modo edição ativado.");
    } else {
      toast.error("PIN incorreto.");
    }
  };

  const lockAdmin = () => {
    setAdminPin(null);
    sessionStorage.removeItem("admin_pin");
    toast.message("Modo edição desativado.");
  };

  type AdminAction =
    | { type: "add"; name: string; already_owned: boolean }
    | { type: "rename"; id: string; name: string }
    | { type: "delete"; id: string }
    | { type: "toggle_owned"; id: string; already_owned: boolean }
    | { type: "unclaim"; id: string };
  const runAdmin = async (action: AdminAction) => {
    if (!adminPin) return;
    setBusy(true);
    try {
      await editFn({ data: { pin: adminPin, action } });
      // refetch para garantir sincronia (realtime cobre na maioria dos casos)
      const { data } = await supabase
        .from("gifts")
        .select("*")
        .order("already_owned", { ascending: true })
        .order("name");
      if (data) setGifts(data as Gift[]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      toast.error(msg);
      if (msg.toLowerCase().includes("pin")) lockAdmin();
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (g: Gift) => {
    setEditing(g);
    setEditName(g.name);
    setEditOwned(g.already_owned);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      if (editName.trim() && editName.trim() !== editing.name) {
        await runAdmin({ type: "rename", id: editing.id, name: editName.trim() });
      }
      if (editOwned !== editing.already_owned) {
        await runAdmin({ type: "toggle_owned", id: editing.id, already_owned: editOwned });
      }
      toast.success("Item atualizado.");
      setEditing(null);
    } catch {
      /* toast already shown */
    }
  };

  const deleteEditing = async () => {
    if (!editing) return;
    if (!confirm(`Excluir "${editing.name}"?`)) return;
    try {
      await runAdmin({ type: "delete", id: editing.id });
      toast.success("Item removido.");
      setEditing(null);
    } catch {
      /* */
    }
  };

  const unclaim = async (g: Gift) => {
    try {
      await runAdmin({ type: "unclaim", id: g.id });
      toast.success("Reserva desfeita.");
    } catch {
      /* */
    }
  };

  const submitAdd = async () => {
    if (!newName.trim()) return;
    try {
      await runAdmin({ type: "add", name: newName.trim(), already_owned: newOwned });
      toast.success("Item adicionado.");
      setNewName("");
      setNewOwned(false);
      setAdding(false);
    } catch {
      /* */
    }
  };

  const owned = gifts.filter((g) => g.already_owned);
  const available = gifts.filter((g) => !g.already_owned && !g.claimed_by);
  const claimed = gifts.filter((g) => !g.already_owned && g.claimed_by);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-2 md:items-center md:py-16">
          <div className="order-2 md:order-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm text-secondary-foreground">
              <Sparkles className="h-4 w-4" />
              Sábado, 06 de Junho de 2026 — 19:30
            </div>
            <h1
              className="mt-6 text-6xl leading-none text-primary md:text-7xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Chá de Panela
            </h1>
            <h2
              className="text-5xl leading-none text-primary/80 md:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sara & Matias
            </h2>
            <p
              className="mt-6 max-w-md text-lg text-foreground/80"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Venha celebrar conosco o nosso Chá de Panela, um encontro especial.
              Escolha abaixo um presente para abençoar nosso novo lar — quando
              alguém escolhe, o item é marcado automaticamente.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Rua df1 chácara 17b — setor Santo Antônio
            </p>
          </div>
          <div className="order-1 md:order-2">
            <div
              className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-border/60"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <img src={invite} alt="Convite Chá de Panela Sara e Matias" className="block w-full" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Admin toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
          {isAdmin && (
            <>
              <span className="mr-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <LockOpen className="h-3.5 w-3.5" />
                Modo edição ativo
              </span>
              <Button size="sm" variant="default" onClick={() => setAdding(true)}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar item
              </Button>
              <Button size="sm" variant="outline" onClick={lockAdmin}>
                <Lock className="mr-1 h-4 w-4" /> Sair
              </Button>
            </>
          )}
          {!isAdmin && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setPinOpen(true)}
            >
              <Lock className="mr-1 h-4 w-4" /> Editar lista
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Carregando lista...</p>
        ) : (
          <>
            <Section
              title="Disponíveis para presentear"
              icon={<GiftIcon className="h-5 w-5" />}
              count={available.length}
              subtitle="Toque em um item para reservá-lo"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {available.map((g) => {
                  const Icon = iconFor(g.name);
                  return (
                    <div
                      key={g.id}
                      className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-soft)]"
                    >
                      <button
                        type="button"
                        onClick={() => setSelected(g)}
                        className="absolute inset-0 rounded-2xl"
                        aria-label={`Reservar ${g.name}`}
                      />
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="relative flex flex-1 items-center justify-between gap-2">
                        <span className="text-lg text-card-foreground" style={{ fontFamily: "var(--font-body)" }}>
                          {g.name}
                        </span>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(g);
                            }}
                            className="relative z-10 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </button>
                        ) : (
                          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                            Escolher
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {available.length === 0 && (
                  <p className="text-muted-foreground">Tudo já foi escolhido — obrigada! 💕</p>
                )}
              </div>
            </Section>

            <Section
              title="Já reservados"
              icon={<Heart className="h-5 w-5" />}
              count={claimed.length}
              subtitle="Esses presentes já foram escolhidos com carinho"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {claimed.map((g) => {
                  const Icon = iconFor(g.name);
                  return (
                    <div
                      key={g.id}
                      className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/40 p-4 opacity-90"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/60 text-primary/70">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-lg line-through" style={{ fontFamily: "var(--font-body)" }}>
                            {g.name}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Reservado por {g.claimed_by}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => unclaim(g)}
                            disabled={busy}
                          >
                            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Liberar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => openEdit(g)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {claimed.length === 0 && (
                  <p className="text-muted-foreground">Ninguém escolheu ainda — seja o primeiro!</p>
                )}
              </div>
            </Section>

            <Section
              title="Itens que já temos"
              icon={<Check className="h-5 w-5" />}
              count={owned.length}
              subtitle="Estes itens dispensam — já fazem parte do nosso lar"
            >
              <div className="flex flex-wrap gap-2">
                {owned.map((g) => {
                  const Icon = iconFor(g.name);
                  return (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-muted-foreground"
                    >
                      <Icon className="h-4 w-4 text-primary/70" />
                      {g.name}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => openEdit(g)}
                          className="ml-1 rounded-full p-1 text-primary/70 hover:bg-primary/10 hover:text-primary"
                          aria-label={`Editar ${g.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </Section>
          </>
        )}
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        Feito com <Heart className="inline h-3.5 w-3.5 text-primary" /> para Sara & Matias
      </footer>

      {/* Reserve dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)" }} className="text-3xl text-primary">
              Reservar presente
            </DialogTitle>
            <DialogDescription>
              Você está reservando: <strong className="text-foreground">{selected?.name}</strong>.
              Digite seu nome para confirmar — o item será marcado para todos.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Seu nome"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleClaim()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button onClick={handleClaim} disabled={!guestName.trim() || submitting}>
              {submitting ? "Reservando..." : "Confirmar reserva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN dialog */}
      <Dialog
        open={pinOpen}
        onOpenChange={(o) => {
          setPinOpen(o);
          if (!o) setPinValue("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Lock className="h-5 w-5" /> Acesso restrito
            </DialogTitle>
            <DialogDescription>
              Digite o PIN para liberar a edição da lista.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={pinValue}
            onChange={(e) => setPinValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitPin()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPinOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitPin} disabled={!pinValue.trim()}>
              Entrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit item dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Pencil className="h-5 w-5" /> Editar item
            </DialogTitle>
            <DialogDescription>
              Altere o nome, mude a categoria ou exclua o item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="edit-owned" className="text-sm font-medium">
                  Já temos este item
                </Label>
                <p className="text-xs text-muted-foreground">
                  Move para a seção "Itens que já temos".
                </p>
              </div>
              <Switch id="edit-owned" checked={editOwned} onCheckedChange={setEditOwned} />
            </div>
            {editing?.claimed_by && (
              <p className="text-xs text-muted-foreground">
                Reservado por <strong>{editing.claimed_by}</strong>
              </p>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="destructive" onClick={deleteEditing} disabled={busy}>
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button onClick={saveEdit} disabled={busy || !editName.trim()}>
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add item dialog */}
      <Dialog
        open={adding}
        onOpenChange={(o) => {
          setAdding(o);
          if (!o) {
            setNewName("");
            setNewOwned(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Plus className="h-5 w-5" /> Novo item
            </DialogTitle>
            <DialogDescription>Adicione um item à lista.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nome</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAdd()}
                maxLength={120}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="new-owned" className="text-sm font-medium">
                Já temos este item
              </Label>
              <Switch id="new-owned" checked={newOwned} onCheckedChange={setNewOwned} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
            <Button onClick={submitAdd} disabled={busy || !newName.trim()}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating S&M hearts overlay */}
      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        {bursts.map((b) => (
          <CelebrationOverlay key={b.id} />
        ))}
      </div>
    </div>
  );
}

function CelebrationOverlay() {
  const hearts = Array.from({ length: 28 });
  return (
    <>
      {/* Soft radial backdrop */}
      <div
        className="animate-celebration-backdrop absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, oklch(0.7 0.16 10 / 0.18), transparent 60%)",
        }}
      />

      {/* Floating hearts */}
      {hearts.map((_, i) => {
        const dx = (Math.random() - 0.5) * 480;
        const rot = (Math.random() - 0.5) * 60;
        const size = 28 + Math.random() * 56;
        const delay = Math.random() * 1.2;
        const left = 50 + (Math.random() - 0.5) * 70;
        return (
          <div
            key={i}
            className="animate-heart-float absolute"
            style={{
              left: `${left}%`,
              top: "75%",
              ["--dx" as never]: `${dx}px`,
              ["--r" as never]: `${rot}deg`,
              animationDelay: `${delay}s`,
            }}
          >
            <div className="relative" style={{ width: size, height: size }}>
              <Heart
                className="absolute inset-0 text-primary"
                style={{ width: size, height: size }}
                fill="currentColor"
                strokeWidth={1}
              />
              <span
                className="absolute inset-0 flex items-center justify-center text-primary-foreground"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: size * 0.45,
                  paddingTop: size * 0.08,
                  textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                }}
              >
                S&amp;M
              </span>
            </div>
          </div>
        );
      })}

      {/* Final centered heart with thank-you message */}
      <div
        className="animate-final-heart absolute"
        style={{ left: "50%", top: "50%" }}
      >
        <div className="flex flex-col items-center">
          <div className="relative animate-heart-pulse" style={{ width: 220, height: 220 }}>
            <Heart
              className="absolute inset-0 text-primary"
              style={{ width: 220, height: 220 }}
              fill="currentColor"
              strokeWidth={1}
            />
            <span
              className="absolute inset-0 flex items-center justify-center text-primary-foreground"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 96,
                paddingTop: 18,
                textShadow: "0 2px 6px rgba(0,0,0,0.25)",
              }}
            >
              S&amp;M
            </span>
          </div>
          <p
            className="mt-4 max-w-xs text-center text-2xl text-primary"
            style={{
              fontFamily: "var(--font-body)",
              textShadow: "0 1px 10px oklch(0.985 0.015 80 / 0.9)",
            }}
          >
            Agradecemos por ajudar em nossa história
          </p>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  subtitle,
  count,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-2xl text-primary" style={{ fontFamily: "var(--font-body)" }}>
            {icon}
            {title}
            <span className="ml-1 rounded-full bg-secondary px-2.5 py-0.5 text-sm text-secondary-foreground">
              {count}
            </span>
          </h3>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
