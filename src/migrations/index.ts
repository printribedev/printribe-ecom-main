import * as migration_20261113_173005_initial from './20261113_173005_initial';
import * as migration_20261121_082208_studio_foundation from './20261121_082208_studio_foundation';
import * as migration_20261121_120228_studio_designs from './20261121_120228_studio_designs';
import * as migration_20261123_152735_studio_inches from './20261123_152735_studio_inches';
import * as migration_20261125_140452_customers from './20261125_140452_customers';

export const migrations = [
  {
    up: migration_20261113_173005_initial.up,
    down: migration_20261113_173005_initial.down,
    name: '20261113_173005_initial',
  },
  {
    up: migration_20261121_082208_studio_foundation.up,
    down: migration_20261121_082208_studio_foundation.down,
    name: '20261121_082208_studio_foundation',
  },
  {
    up: migration_20261121_120228_studio_designs.up,
    down: migration_20261121_120228_studio_designs.down,
    name: '20261121_120228_studio_designs',
  },
  {
    up: migration_20261123_152735_studio_inches.up,
    down: migration_20261123_152735_studio_inches.down,
    name: '20261123_152735_studio_inches',
  },
  {
    up: migration_20261125_140452_customers.up,
    down: migration_20261125_140452_customers.down,
    name: '20261125_140452_customers'
  },
];
