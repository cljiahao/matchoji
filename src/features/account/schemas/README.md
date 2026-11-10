# account/schemas

Zod schemas for the account feature's forms and writes.

- `profile-details.schema.ts`: `profileDetailsSchema` for the Instagram handle (no `@`, letters,
  digits, `.` and `_`, up to 30) and bio (up to 280 characters). A blank value becomes `null`.
  `isInstagramHandle` is the same check, for readers that render a stored handle as a link.
