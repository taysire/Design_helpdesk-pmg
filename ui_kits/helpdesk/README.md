# Helpdesk UI Kit

Interactive recreation of the PMG Helpdesk product. Click-through prototype, not production code.

## Run
Open `index.html`. Babel transpiles JSX inline.

## What's here
- `index.html` — wires everything together: Sidebar + Topbar + main view, fake routing between Home / Inbox / Ticket detail / New ticket.
- `data.jsx` — fake tickets, categories, people. Edit to change demo content.
- `components.jsx` — atoms: `Button`, `Badge`, `Priority`, `Avatar`, `Icon`, `Field`, `Input`, `Select`, `Textarea`.
- `Sidebar.jsx` — left nav with categories + counts.
- `Topbar.jsx` — search, notifications, current user.
- `Home.jsx` — dashboard: my tickets, by category, recent activity.
- `Inbox.jsx` — full ticket list with filter bar and table.
- `TicketDetail.jsx` — single ticket: activity log, comment composer, side panel with assignment + linked Jira issue + Slack channel.
- `NewTicket.jsx` — multi-step "report something" form (category → details → review) — vue admin.
- `report-form-schema.jsx` — schéma + JSON des dépendances du formulaire Microsoft Forms.
- `DynamicReportForm.jsx` — formulaire dynamique une question à la fois (vue employé).
- `form-dependencies.json` — export de l'arborescence conditionnelle.

## Interactive flows that work
- Click any ticket in Home or Inbox → opens detail.
- Click "Report something" (employé) → formulaire dynamique conditionnel → résumé → ticket mock.
- Click "New ticket" (admin) → formulaire classique en 3 étapes.
- Sidebar nav switches views.
- "Mark resolved" on a ticket updates its status in the local state.

## What's missing / faked
- All data is in-memory; nothing persists across reload.
- Search input doesn't actually filter.
- Jira / Slack links are visual mocks.
