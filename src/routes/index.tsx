import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Check, Gift, Heart, Sparkles } from "lucide-react";
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

function Index() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Gift | null>(null);
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        {loading ? (
          <p className="text-center text-muted-foreground">Carregando lista...</p>
        ) : (
          <>
            <Section
              title="Disponíveis para presentear"
              icon={<Gift className="h-5 w-5" />}
              count={available.length}
              subtitle="Toque em um item para reservá-lo"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {available.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelected(g)}
                    className="group rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-soft)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-lg text-card-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {g.name}
                      </span>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                        Escolher
                      </span>
                    </div>
                  </button>
                ))}
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
                {claimed.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-border/60 bg-muted/40 p-5 opacity-80"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-lg line-through" style={{ fontFamily: "var(--font-body)" }}>
                        {g.name}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reservado por {g.claimed_by}
                    </p>
                  </div>
                ))}
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
                {owned.map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </Section>
          </>
        )}
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        Feito com <Heart className="inline h-3.5 w-3.5 text-primary" /> para Sara & Matias
      </footer>

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
    </div>
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
