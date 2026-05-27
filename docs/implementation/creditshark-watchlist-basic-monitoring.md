# CreditShark Watchlist and Basic Monitoring Foundation

## What was built

This slice adds a basic operational watchlist for companies that users are actively reviewing. It adds:

- `/watchlist` for active watched companies;
- add/remove watchlist controls on the company profile;
- watchlist context derived from existing snapshots, score runs, decisions, reports and manual adverse data;
- a lightweight monitoring-event service foundation for future event display;
- a smoke script for validating the workflow.

The watchlist is a workflow aid. It does not run scheduled checks, subscribe to Companies House streaming updates, send alerts or claim continuous monitoring.

## Database tables used

The original foundation migration did not include the expected watchlist tables, so a narrow migration was added:

- `watchlists`
- `monitoring_events`

`watchlists` supports soft removal through `is_active`, `removed_by` and `removed_at`. A partial unique index prevents more than one active watchlist row per company.

`monitoring_events` is present for future event display and acknowledgement. This slice does not generate background monitoring events.

## Watchlist behaviour

Users can add a company to the watchlist only after the durable `companies` row exists. If a company has not been opened and checked yet, the service returns a clear error asking the user to open/check the company first.

Removing a company marks the watchlist row inactive. It does not delete historical watchlist records.

If a previously removed company is added again, the latest removed row is reactivated. This keeps the table simple for the MVP while preserving inactive rows where they already exist.

## Monitoring limitations

The watchlist page shows monitoring context from existing app records:

- latest score run;
- latest risk band and confidence;
- recommended limit;
- last checked timestamp;
- score movement summary;
- latest recorded commercial decision;
- latest report export status;
- active manual adverse event count.

It does not detect Companies House source changes by itself. Future monitoring can add source-diff events for accounts, filing history, charges, officers, PSCs, manual adverse data and licensed adverse data.

## Audit events

The watchlist service writes:

- `watchlist.added`
- `watchlist.removed`

Audit metadata includes company number, watchlist id, whether a watch reason was present and source route/action. It does not store full watch reason text, database URLs, API keys or raw payloads.

## Smoke test

Run:

```powershell
npm run smoke:watchlist -- 00445790
```

The script creates or refreshes a snapshot and score run, adds the company to the watchlist, prints a non-sensitive summary, then deactivates the smoke watchlist row. It does not delete immutable historical records.

## Known limitations

- No scheduled background checks.
- No Companies House Streaming API.
- No email alerts.
- No watchlist ownership/auth model yet.
- Monitoring events are read/display foundation only for this slice.
- Search results do not write watchlist state.

## Next task recommendation

Add source-change event creation after a deliberate source-diff design is agreed. The likely next slice is detecting differences between the latest and previous snapshot for watched companies and recording safe `monitoring_events` without introducing scheduled jobs yet.
