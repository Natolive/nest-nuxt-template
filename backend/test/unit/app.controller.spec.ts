import { AppController } from '@src/app.controller.js';
import type { Database } from '@src/common/infrastructure/database/database.module.js';

const db = (execute: () => Promise<unknown>) => ({ execute }) as unknown as Database;

describe('AppController', () => {
  it('reports the database up', async () => {
    expect(await new AppController(db(() => Promise.resolve())).health()).toEqual({ database: true });
  });

  it('reports the database down', async () => {
    expect(await new AppController(db(() => Promise.reject(new Error('down')))).health()).toEqual({ database: false });
  });
});
