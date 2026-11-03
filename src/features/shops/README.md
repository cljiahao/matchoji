# shops

## Purpose

Shop locations: real shops (maker stores, stockists, cafés) with an address, coordinates and the official page the address was read from. The `/shops` page, the tea page's in-person link and the admin Shops form use it; `shopSchema` validates input (latitude ±90, longitude ±180, https source). Linked to teas by maker name only: products keep no foreign key to it. Until the migration is applied the read functions return no shops.

## Contents

- `api/`
- `components/`
- `index.ts`
- `lib/`
- `schemas/`
- `types.ts`

## Parent

[features](../README.md)
