# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server (ng serve)
npm run build      # Production build
npm test           # Run unit tests (Karma/Jasmine)
npm run lint       # ESLint
npx ng test --include=src/app/services/api.service.spec.ts  # Run a single test file
```

For native mobile targets, after `npm run build`:
```bash
npx cap sync       # Sync web assets to iOS/Android
npx cap open ios   # Open Xcode
npx cap open android  # Open Android Studio
```

## Architecture

**Stack**: Angular 19 (standalone components) + Ionic 8 + Capacitor 7. All components use the standalone pattern — there are no NgModules.

### Two backend targets

All HTTP is done through `CapacitorHttp` (not Angular's `HttpClient`). This is intentional: `CapacitorHttp` bypasses CORS restrictions on native mobile. Never switch to `HttpClient`.

1. **IoT backend** (`ApiService` `*Render` methods) — Node.js REST API at `http://localhost:3000/api` (dev) or `https://iot-services-rd-ww45.onrender.com/api` (prod). JWT token stored in `localStorage.tk`. Toggle via `localStorage.remoteServer` (`'false'` = local, anything else = remote).

2. **Oracle Fusion ERP** (`ApiService` `*Fusion` methods) — REST API using Basic auth. Host and credentials come from `CredentialsService.Fusion()`, which reads `userData.Company.Settings` from `localStorage.userData`. All Fusion endpoints are defined in `EndpointsService` using `{0}`, `{1}` placeholders resolved by `Path(key, ...args)`. Fusion responses are paginated at 500 items; `GetRequestFusion` auto-pages through all results.

### Authentication

`AuthGuard` checks `localStorage.isLogged === 'true'`. On 401/440 HTTP responses, `ApiService.RequestStatusCode()` clears the login state and redirects to `/login`. All routes except `/login`, `/setup-page`, `/select-location-modal`, `dispatch_transaction`, and `costs` are guarded.

### Services

| Service | Responsibility |
|---|---|
| `ApiService` | All HTTP to both backends; handles pagination, error codes, loading |
| `WebSocketService` | Real-time sensor subscriptions; toggled between local/remote via same `remoteServer` flag |
| `AlertsService` | Unified toasts (PrimeNG `MessageService`) + Ionic loading spinners + confirm dialogs |
| `CredentialsService` | Extracts Fusion host/credentials from `localStorage.userData` |
| `EndpointsService` | All Oracle Fusion REST endpoint strings with `{n}` parameter placeholders |
| `PermissionsService` | Role/permission checks for UI visibility |

### Widget-based monitoring dashboard

`MonitoringPage` (`/monitoring/:groupId`) renders a dynamic dashboard of IoT widgets. Each widget is a standalone component receiving configuration via `@Input() data`. The monitoring page uses Angular CDK drag-drop and `angular-resizable-element` for layout.

Widget components in `src/app/components/`:
- `ChartsComponent` — ApexCharts time-series (area/line/bar); subscribes to sensor WebSocket for live updates; supports custom date ranges and Y-axis annotations
- `GaugeComponent`, `ThermometerComponent`, `WaterTankComponent` — visual analog displays
- `CounterComponent`, `NumericComponent` — numeric readouts
- `HeatmapComponent`, `OnoffComponent` — state indicators
- `SimpleColumnBar`, `SimpleDonut`, `SimpleHeatmap`, `SimpleStackedColumns`, `SimpleTimeline` — chart-only components without live WebSocket

### Integration modules (`src/app/integrations/`)

- `fusion/` — Oracle Fusion ERP integration: connection setup, modules (organizations, shifts, resources, items, WO, WC, production-campaign), monitoring (production, costs), dispatch transactions
- `modules/` — Cross-platform modules: alerts, alert-history, failures, KPIs

### Settings (`src/app/settings/`)

User management, verification codes, and "registros" (data registry pages): machines, organizations, shifts, work-centers, work-orders, items, grid-data.

### Models / utilities (`src/app/models/`)

- `design.ts` — `ToggleMenu()` for split-pane sidebar behavior
- `date.format.ts` — date formatting helpers
- `math.operations.ts` — math utilities
- `tables.prime.ts` — PrimeNG table configuration helpers

### Theming

Global styles: `src/global.scss` imports from `src/theme/`. Ionic variables in `src/theme/variables.scss`. PrimeNG theme via `@primeng/themes` configured in `src/main.ts`. Leaflet map styles in `src/theme/leaflet.scss`.
