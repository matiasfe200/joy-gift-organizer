
CREATE TABLE public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  already_owned boolean NOT NULL DEFAULT false,
  claimed_by text,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gifts" ON public.gifts FOR SELECT USING (true);

CREATE POLICY "Anyone can claim unclaimed gifts" ON public.gifts
  FOR UPDATE USING (claimed_by IS NULL AND already_owned = false)
  WITH CHECK (claimed_by IS NOT NULL);

ALTER PUBLICATION supabase_realtime ADD TABLE public.gifts;
ALTER TABLE public.gifts REPLICA IDENTITY FULL;

INSERT INTO public.gifts (name, already_owned) VALUES
  ('Fogão Cooktop', true),
  ('Armário de Cozinha', true),
  ('Cama', true),
  ('Cabeceira', true),
  ('Máquina de Lavar', true),
  ('TV', true),
  ('Painel de TV', true),
  ('Geladeira', false),
  ('Micro-ondas', false),
  ('Forno Elétrico', false),
  ('Liquidificador', false),
  ('Batedeira', false),
  ('Cafeteira', false),
  ('Sanduicheira', false),
  ('Air Fryer', false),
  ('Conjunto de Panelas', false),
  ('Jogo de Talheres', false),
  ('Jogo de Pratos', false),
  ('Jogo de Copos', false),
  ('Jogo de Taças', false),
  ('Jogo de Xícaras', false),
  ('Faqueiro', false),
  ('Tábua de Carne', false),
  ('Conjunto de Potes Herméticos', false),
  ('Escorredor de Louças', false),
  ('Lixeira de Cozinha', false),
  ('Toalhas de Banho', false),
  ('Jogo de Cama Casal', false),
  ('Edredom Casal', false),
  ('Travesseiros', false),
  ('Jogo de Toalhas de Mesa', false),
  ('Ferro de Passar', false),
  ('Aspirador de Pó', false),
  ('Vassoura e Rodo', false),
  ('Conjunto de Banheiro', false),
  ('Cortinas', false),
  ('Varal de Roupas', false),
  ('Cesto de Roupas', false);
