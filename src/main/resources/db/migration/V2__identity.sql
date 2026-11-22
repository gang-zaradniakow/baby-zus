-- identity: user accounts, one-time login codes of the mock mObywatel, refresh tokens

create table user_account (
    id           uuid primary key,
    subject      text        not null unique,
    persona_id   text,
    display_name text,
    roles        text[]      not null,
    created_at   timestamptz not null
);

create table authorization_code (
    code_hash    text primary key,
    subject      text        not null,
    persona_id   text,
    display_name text,
    redirect_uri text        not null,
    expires_at   timestamptz not null
);

create table refresh_token (
    id         uuid primary key,
    user_id    uuid        not null references user_account (id),
    token_hash text        not null unique,
    expires_at timestamptz not null,
    revoked_at timestamptz
);

create index refresh_token_user_id on refresh_token (user_id);
