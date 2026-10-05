import { Controller, Get, Inject } from '@nestjs/common';
import type { HealthDto } from '@socle/shared';
import { sql } from 'drizzle-orm';
import { DB, type Database } from './common/infrastructure/database/database.module.js';

@Controller()
export class AppController {
  constructor(@Inject(DB) private readonly db: Database) {}

  // Santé de l'API et de la base, affichée par la page d'accueil.
  @Get('health')
  async health(): Promise<HealthDto> {
    const database = await this.db.execute(sql`select 1`).then(() => true, () => false);
    return { database };
  }
}
