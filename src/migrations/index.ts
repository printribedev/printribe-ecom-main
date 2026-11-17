import * as migration_20261113_173005_initial from './20261113_173005_initial';

export const migrations = [
  {
    up: migration_20261113_173005_initial.up,
    down: migration_20261113_173005_initial.down,
    name: '20261113_173005_initial'
  },
];
