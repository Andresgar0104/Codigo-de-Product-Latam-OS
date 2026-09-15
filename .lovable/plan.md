## Problem

CSV import fails with:
- `contacts_company_fk` violation on new contacts
- `event_contacts_contactId_fkey` violation on event links

## Root cause

In `src/components/csv-import-modal.tsx`, the Contacts phase builds each new contact with:

```
companyId: coName ? (companyByName.get(norm(coName)) ?? "") : ""
```

When the row has no company (or the name doesn't resolve), `companyId` is sent as `""`. Postgres treats that as a real value and enforces `contacts_company_fk` — empty string is never a matching row, so the entire `contacts` batch insert is rejected. Since Supabase inserts are atomic per call, zero new contacts land. The follow-up `event_contacts` batch then references `contactId`s that were never persisted, so its FK fails too.

The visible summary matches this exactly: 0 new contacts, 1 updated (email-matched existing rows via UPDATE, which doesn't touch FK), 2 companies created (their own insert ran before contacts), 0 event links.

## Fix (single file: `src/components/csv-import-modal.tsx`)

1. In the contacts loop (~line 300), send `null` instead of `""` for missing FKs:
   - `companyId: coName ? (companyByName.get(norm(coName)) ?? null) : null`
2. Same treatment for the `update` patch — only include `companyId` in the patch if a real id resolved (don't overwrite an existing company with `""`/null unless intentional; keep current "only set if empty" guard, but pass a real id or omit).
3. Audit the rest of the `Contact` payload for other empty-string fields that back FKs. `title`, `email`, `linkedin`, `firstName`, `lastName`, `tags`, `lastTouch` are plain text/array columns (no FK) — safe to leave as `""`/`[]`. Only `companyId` needs the null fix.
4. For robustness, when a contact insert batch still errors, surface the count so users see "0 nuevos" isn't silently caused by one bad row.

No schema change, no migration. Store code and other routes stay untouched.

## Verification

After the edit, re-run the same CSV import:
- Rows without company should insert with `companyId = null`.
- `event_contacts` should then succeed because contact ids now exist.
- Summary should show non-zero "contactos nuevos" and "vínculos a eventos".