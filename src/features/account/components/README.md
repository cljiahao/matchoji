# components

## Purpose

`DisplayNameForm` saves a changed, non-blank name of up to 40 characters. `ExportDataButton`
downloads `matchoji-data.json`. `DeleteAccountSection` explains what goes and what stays, and
needs the word "delete" typed before it acts. The name form counts characters and shows an inline "Saved"; both forms say why their button is off. Every field and button is at least 44px tall.

`ProfileDetailsForm` edits the Instagram handle and bio on the account page: it checks them with `profileDetailsSchema` before saving, shows the first problem inline, and counts the bio against 280.

## Contents

- `account-sections.test.tsx`
- `account-sections.tsx`
- `index.ts`

## Parent

[account](../README.md)
