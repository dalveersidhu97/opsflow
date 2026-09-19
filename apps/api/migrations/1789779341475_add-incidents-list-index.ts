import type {
    MigrationBuilder,
} from 'node-pg-migrate';

export function up(
    pgm: MigrationBuilder,
): void {
    pgm.createIndex(
        'incidents',
        [{ name: 'created_at', sort: 'DESC' }, { name: 'id', sort: 'DESC' }],
        { name: 'incidents_created_at_id_idx' },
    );
}

export function down(
    pgm: MigrationBuilder,
): void {
    pgm.dropIndex(
        'incidents',
        [{ name: 'created_at', sort: 'DESC' }, { name: 'id', sort: 'DESC' }],
        {
            name: 'incidents_created_at_id_idx',
        },
    );
}