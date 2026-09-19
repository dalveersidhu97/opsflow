import { Module } from '@nestjs/common';
import { IncidentsModule } from './incidents/incidents.module.js';

@Module({
  imports: [
    IncidentsModule,
  ]
})
export class AppModule { }
