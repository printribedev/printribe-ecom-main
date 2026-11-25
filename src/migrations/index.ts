import * as migration_20261113_173005_initial from './20261113_173005_initial';
import * as migration_20261121_082208_studio_foundation from './20261121_082208_studio_foundation';
import * as migration_20261121_120228_studio_designs from './20261121_120228_studio_designs';
import * as migration_20261123_152735_studio_inches from './20261123_152735_studio_inches';
import * as migration_20261125_140452_customers from './20261125_140452_customers';
import * as migration_20261125_144105_studio_checkout from './20261125_144105_studio_checkout';
import * as migration_20261125_193254_contact_page from './20261125_193254_contact_page';
import * as migration_20261125_200308_bulk_and_quote from './20261125_200308_bulk_and_quote';

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
    name: '20261125_140452_customers',
  },
  {
    up: migration_20261125_144105_studio_checkout.up,
    down: migration_20261125_144105_studio_checkout.down,
    name: '20261125_144105_studio_checkout',
  },
  {
    up: migration_20261125_193254_contact_page.up,
    down: migration_20261125_193254_contact_page.down,
    name: '20261125_193254_contact_page',
  },
  {
    up: migration_20261125_200308_bulk_and_quote.up,
    down: migration_20261125_200308_bulk_and_quote.down,
    name: '20261125_200308_bulk_and_quote'
  },
];
