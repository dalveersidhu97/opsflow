import type {
  MigrationBuilder,
} from 'node-pg-migrate';

export function up(
  pgm: MigrationBuilder,
): void {
  pgm.sql(`
    CREATE TABLE incidents (
      id UUID PRIMARY KEY,

      title VARCHAR(120) NOT NULL,

      description TEXT,

      priority TEXT NOT NULL,

      status TEXT NOT NULL,

      reporter_id TEXT NOT NULL,

      created_at TIMESTAMPTZ NOT NULL,

      CONSTRAINT incidents_title_length_check
        CHECK (
          char_length(btrim(title))
          BETWEEN 5 AND 120
        ),

      CONSTRAINT incidents_description_length_check
        CHECK (
          description IS NULL
          OR char_length(description) <= 2000
        ),

      CONSTRAINT incidents_priority_check
        CHECK (
          priority IN (
            'LOW',
            'MEDIUM',
            'HIGH',
            'CRITICAL'
          )
        ),

      CONSTRAINT incidents_status_check
        CHECK (
          status IN ('OPEN')
        ),

      CONSTRAINT incidents_reporter_not_empty_check
        CHECK (
          char_length(btrim(reporter_id)) > 0
        )
    );
  `);
}

export function down(
  pgm: MigrationBuilder,
): void {
  pgm.sql(`
    DROP TABLE incidents;
  `);
}