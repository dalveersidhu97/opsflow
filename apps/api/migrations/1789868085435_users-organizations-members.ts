import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
    
        CREATE TABLE users (
            id UUID PRIMARY KEY,
            email VARCHAR(120) NOT NULL,
            password_hash TEXT NOT NULL,

            CONSTRAINT users_email_check CHECK (email = LOWER(btrim(email)) AND char_length(btrim(email)) BETWEEN 4 AND 120),
            CONSTRAINT users_password_hash_check CHECK (char_length(password_hash) > 0)
        );

        CREATE UNIQUE INDEX users_email_unique_idx ON users (LOWER(email));

        CREATE TABLE organizations (
            id UUID PRIMARY KEY,
            organization_name VARCHAR(120) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

            CONSTRAINT organizations_name_check
                CHECK (organization_name = btrim(organization_name) AND char_length(btrim(organization_name)) BETWEEN 2 AND 120)
        );

        CREATE TABLE organization_memberships (
            organization_id UUID NOT NULL,
            user_id UUID NOT NULL,
            user_role VARCHAR(120) NOT NULL,

            CONSTRAINT organization_memberships_user_role_check
                CHECK (
                    user_role IN (
                        'OWNER',
                        'MEMBER'
                    )
                ),

            CONSTRAINT organization_memberships_user_organization_pk PRIMARY KEY (organization_id, user_id),
            CONSTRAINT organization_memberships_user_id_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
            CONSTRAINT organization_memberships_organization_id_fk FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
        );
    
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
        
        DROP TABLE organization_memberships;
        DROP TABLE organizations;
        DROP TABLE users;
        
  `);
}
