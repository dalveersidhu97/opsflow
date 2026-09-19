import { Module } from '@nestjs/common';
import { PostgresDatabase } from './postgres-database.js';

@Module({
    providers: [PostgresDatabase],
    exports: [PostgresDatabase],
})
export class DatabaseModule { }