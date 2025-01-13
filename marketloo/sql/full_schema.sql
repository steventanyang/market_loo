create table
  public.markets (
    id uuid not null default extensions.uuid_generate_v4 (),
    title text not null,
    description text null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    closes_at timestamp with time zone not null,
    outcome text null,
    volume numeric null default 0,
    user_id uuid null,
    status text null,
    constraint markets_pkey primary key (id),
    constraint markets_user_id_fkey foreign key (user_id) references auth.users (id)
  ) tablespace pg_default;

  create table
  public.options (
    id uuid not null default extensions.uuid_generate_v4 (),
    market_id uuid null,
    name text not null,
    yes_outcome_id uuid null,
    no_outcome_id uuid null,
    created_at timestamp with time zone null default now(),
    constraint options_pkey primary key (id),
    constraint options_market_id_fkey foreign key (market_id) references markets (id),
    constraint options_no_outcome_id_fkey foreign key (no_outcome_id) references outcomes (outcome_id),
    constraint options_yes_outcome_id_fkey foreign key (yes_outcome_id) references outcomes (outcome_id)
  ) tablespace pg_default;

  create table
  public.orders (
    id uuid not null default extensions.uuid_generate_v4 (),
    market_id uuid not null,
    user_id uuid not null,
    type text not null,
    amount bigint not null,
    price numeric not null,
    status text not null,
    created_at timestamp with time zone not null default timezone ('utc'::text, now()),
    outcome_id uuid null,
    constraint orders_pkey primary key (id),
    constraint orders_market_id_fkey foreign key (market_id) references markets (id),
    constraint orders_outcome_id_fkey foreign key (outcome_id) references outcomes (outcome_id) on delete cascade,
    constraint orders_user_id_fkey foreign key (user_id) references auth.users (id),
    constraint orders_status_check check (
      (
        status = any (
          array[
            'pending'::text,
            'filled'::text,
            'cancelled'::text
          ]
        )
      )
    ),
    constraint orders_type_check check (
      (
        type = any (array['buying'::text, 'selling'::text])
      )
    )
  ) tablespace pg_default;


  create table
  public.outcomes (
    outcome_id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    market_id uuid null default gen_random_uuid (),
    name text null,
    initial_price numeric null,
    current_price numeric null,
    is_winner boolean null,
    constraint outcomes_pkey primary key (outcome_id),
    constraint outcomes_market_id_fkey foreign key (market_id) references markets (id) on delete cascade
  ) tablespace pg_default;

  create table
  public.positions (
    id uuid not null default extensions.uuid_generate_v4 (),
    user_id uuid not null,
    market_id uuid not null,
    outcome_id uuid not null,
    amount integer not null default 0,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    constraint positions_pkey primary key (id),
    constraint positions_user_id_market_id_outcome_id_key unique (user_id, market_id, outcome_id),
    constraint positions_market_id_fkey foreign key (market_id) references markets (id),
    constraint positions_outcome_id_fkey foreign key (outcome_id) references outcomes (outcome_id),
    constraint positions_user_id_fkey foreign key (user_id) references auth.users (id)
  ) tablespace pg_default;

  create table
  public.trades (
    id uuid not null default gen_random_uuid (),
    market_id uuid not null,
    buyer_order_id uuid not null,
    seller_order_id uuid not null,
    amount integer not null,
    price numeric not null,
    outcome_id uuid not null,
    created_at timestamp with time zone null default timezone ('utc'::text, now()),
    constraint trades_pkey primary key (id),
    constraint trades_buyer_order_id_fkey foreign key (buyer_order_id) references orders (id),
    constraint trades_market_id_fkey foreign key (market_id) references markets (id),
    constraint trades_outcome_id_fkey foreign key (outcome_id) references outcomes (outcome_id),
    constraint trades_seller_order_id_fkey foreign key (seller_order_id) references orders (id),
    constraint trades_price_positive check ((price > (0)::numeric)),
    constraint trades_amount_positive check ((amount > 0))
  ) tablespace pg_default;

create index if not exists trades_market_id_idx on public.trades using btree (market_id) tablespace pg_default;

create index if not exists trades_buyer_order_id_idx on public.trades using btree (buyer_order_id) tablespace pg_default;

create index if not exists trades_seller_order_id_idx on public.trades using btree (seller_order_id) tablespace pg_default;

create index if not exists trades_outcome_id_idx on public.trades using btree (outcome_id) tablespace pg_default;


create table
  public.users (
    id uuid not null default gen_random_uuid (),
    username text not null,
    email text null,
    balance_of_poo numeric null default '500'::numeric,
    created_at timestamp without time zone null default now(),
    is_admin boolean not null default false,
    trade_volume numeric null default 0,
    profit numeric null default 0,
    positions numeric null default 0,
    constraint users_pkey primary key (id),
    constraint users_email1_key unique (email)
  ) tablespace pg_default;