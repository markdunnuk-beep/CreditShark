# CreditShark App Shell and Search

## What Was Scaffolded

This slice turns the documentation and TypeScript foundation into a deployable Next.js App Router web app.

Added:

- Minimal Next.js configuration.
- Root app layout.
- Global CreditShark brand tokens and styling.
- Public landing page.
- Server-rendered `/search` route.
- Placeholder company profile route for safe search-result links.
- Optional Companies House smoke-test script.

No authentication, Supabase UI, database writes, PDF export, score persistence, watchlist or monitoring UI were added.

## Route Map

- `/` - lightweight landing page with primary CTA to search.
- `/search` - first functional product route for Companies House company search.
- `/companies/[companyNumber]` - placeholder route explaining that company profile/snapshot build is next.

## How `/search` Works

The search page is a server-rendered GET form:

- User submits `/search?query=...`.
- The server component reads the query from `searchParams`.
- The page creates the existing Companies House client server-side.
- The client reads `COMPANIES_HOUSE_API_KEY` at runtime.
- Results are rendered as branded cards with company identity fields.
- No API key is exposed to the browser.
- No database records are created.
- No company snapshots or score runs are created.

Displayed result fields:

- Company name.
- Company number.
- Status.
- Company type.
- Incorporation/date created.
- Address snippet/locality where available.
- Exact company-number match indicator.

## Environment Variables Required

Runtime search:

- `COMPANIES_HOUSE_API_KEY`

Not required at build time:

- `DATABASE_URL`
- `COMPANIES_HOUSE_API_KEY`

The Next.js build should not make live Companies House calls or database connections.

## How To Run Local Dev

```powershell
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## How To Run Validation

```powershell
npm run lint
npm run test
npm run build
```

## Companies House Smoke Test

The smoke test is optional and does not run in the unit test suite.

```powershell
npm run smoke:companies-house
npm run smoke:companies-house -- TESCO
npm run smoke:companies-house -- 00445790
```

The script loads `.env.local`, calls Companies House search, prints a small result summary and never prints the API key.

## Known Limitations

- `/search` is server-rendered and does not show a client-side loading spinner.
- Search results are not persisted.
- Result links go to a placeholder company profile route.
- No company snapshot is created yet.
- No score is run yet.
- No Supabase connection is used by the UI yet.
- No PDF report is generated yet.

## Next Build Task Recommendation

Build the company snapshot/profile slice:

1. Add server-side Companies House profile/filings/charges/officers/PSC ingestion.
2. Persist durable company identity and immutable company snapshot.
3. Render `/companies/[companyNumber]` first viewport with company identity, source timestamps and guardrails.
4. Add audit events for search and snapshot creation once user identity strategy is defined.

