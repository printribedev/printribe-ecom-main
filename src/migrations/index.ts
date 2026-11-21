import * as migration_20261113_173005_initial from './20261113_173005_initial';
import * as migration_20261121_082208_studio_foundation from './20261121_082208_studio_foundation';

export const migrations = [
  {
    up: migration_20261113_173005_initial.up,
    down: migration_20261113_173005_initial.down,
    name: '20261113_173005_initial',
  },
  {
    up: migration_20261121_082208_studio_foundation.up,
    down: migration_20261121_082208_studio_foundation.down,
    name: '20261121_082208_studio_foundation'
  },
];
