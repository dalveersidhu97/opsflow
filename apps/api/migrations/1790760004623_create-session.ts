import type { MigrationBuilder } from 'node-pg-migrate';

export function up(pgm: MigrationBuilder): void {
    pgm.sql(`
    CREATE TABLE sessions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      token_digest TEXT NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,

      CONSTRAINT sessions_user_id_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

      CONSTRAINT sessions_token_digest_uk
        UNIQUE (token_digest),

      CONSTRAINT sessions_expiry_check
        CHECK (expires_at > created_at)
    );
  `);

    pgm.createIndex('sessions', 'user_id');
}

export function down(pgm: MigrationBuilder): void {
    pgm.sql('DROP TABLE sessions;');
}