import { Module } from '@nestjs/common';
import { IncidentsModule } from './incidents/incidents.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    IncidentsModule,
    AuthModule,
  ]
})
export class AppModule { }
