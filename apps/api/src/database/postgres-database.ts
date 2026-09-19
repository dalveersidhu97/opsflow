import {
    Injectable,
    type OnModuleDestroy,
} from '@nestjs/common';
import {
    Pool,
    type QueryResult,
    type QueryResultRow,
} from 'pg';

@Injectable()
export class PostgresDatabase
    implements OnModuleDestroy {
    private readonly pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString:
                process.env.DATABASE_URL,
            max: 10,
            connectionTimeoutMillis: 2_000,
            idleTimeoutMillis: 30_000,
        });

        this.pool.on('error', (error) => {
            console.error(
                'Unexpected PostgreSQL pool error',
                error,
            );
        });
    }

    query<Row extends QueryResultRow>(
        text: string,
        values: unknown[] = [],
    ): Promise<QueryResult<Row>> {
        return this.pool.query<Row>(
            text,
            values,
        );
    }

    async onModuleDestroy(): Promise<void> {
        await this.pool.end();
    }
}