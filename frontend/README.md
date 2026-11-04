# SabiCheck frontend

Next.js (App Router) implementation of the SabiCheck authentication, company onboarding, and dashboard screens. The layout, states, and components are shared so additional authenticated or marketing pages can reuse the same primitives.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/signin`.

Copy `.env.example` to `.env.local` if you need a different API host. Sign-in and sign-up call the FastAPI backend at `NEXT_PUBLIC_API_URL` (default `http://127.0.0.1:8000`); start it from `backend/` before using those forms.

```bash
npm run build     # production build
npm run lint      # eslint
npm run typecheck # tsc --noEmit
```

## Routes

| Route              | Screen                                         |
| ------------------ | ---------------------------------------------- |
| `/`                | Redirects to `/signin`                         |
| `/signin`          | Sign in                                        |
| `/signup`          | Create account                                 |
| `/forgot-password` | Password reset request                         |
| `/onboarding`      | Company onboarding and regulatory verification |
| `/dashboard`       | Manufacturer workspace overview                |

Footer legal links are intentionally `#` placeholders until the policy/help pages exist.

## Authentication

The client talks to `/api/v1/auth/*` on the backend:

| Request            | Used for                                    |
| ------------------ | ------------------------------------------- |
| `POST /register`   | Create an account, then continue onboarding |
| `POST /login`      | Sign in from `/signin`                      |
| `POST /refresh`    | Renew an expired access token               |
| `GET /me`          | Restore the session on page load            |

- `lib/api/client.ts` is the request interceptor. It attaches the bearer access token, refreshes once on a `401` (concurrent calls share one refresh), retries the original request, and throws `ApiError` with the backend's `detail` message.
- `lib/auth/session.ts` stores the token pair in `SameSite=Lax` cookies (`sabicheck_access`, `sabicheck_refresh`). The refresh cookie lives for 5 days, matching the backend.
- `components/auth/session-provider.tsx` exposes `useSession()` (`user`, `status`, `signIn`, `signUp`, `signOut`).
- `proxy.ts` redirects requests to `/dashboard` and `/onboarding` to `/signin` when no refresh cookie is present; `RequireSession` covers sessions that expire while a page is open.
- `Sign out` in the dashboard workspace menu clears the cookies and returns to `/signin`.

Sign-up asks for a first and last name because the API stores them separately.

## Structure

```
app/
  layout.tsx           Fonts, metadata, providers, global styles
  globals.css          Tailwind theme tokens (brand, surfaces, type)
  signin/page.tsx
  signup/page.tsx
  forgot-password/page.tsx
  onboarding/page.tsx  Portal header, intro, onboarding form
  dashboard/page.tsx   Responsive workspace overview
proxy.ts               Cookie gate for /dashboard and /onboarding
components/
  brand/logo.tsx       Mark + typeset wordmark lockup (optional tagline)
  auth/
    session-provider.tsx  Session context, sign-in/sign-up/out, restore
    require-session.tsx   Loading + redirect guard for private pages
    auth-shell.tsx     Responsive page frame (logo, card, footer)
    auth-heading.tsx
    auth-switch.tsx
    auth-footer.tsx    Status strip, trust strip, legal footer
    sign-in-form.tsx
    sign-up-form.tsx
    forgot-password-form.tsx
  onboarding/
    session-portal-header.tsx  Portal header fed by the session user
    portal-header.tsx       Portal header, status pill, user block
    verification-steps.tsx  Desktop sidebar + compact mobile stepper
    onboarding-form.tsx     State, validation, draft, submit
    section-card.tsx        Shared card shell for each step
    business-information.tsx
    contact-information.tsx
    regulatory-information.tsx
    file-dropzone.tsx       Drag/drop upload with type + size checks
  dashboard/
    dashboard-sidebar.tsx       Fixed desktop sidebar (logo, switcher, review note)
    dashboard-topbar.tsx        Desktop breadcrumb + alerts shortcut
    mobile-dashboard-header.tsx Mobile header, inline switcher, dialog drawer
    workspace-menu.tsx          Workspace disclosure menu (sidebar + drawer)
    dashboard-nav.tsx           Shared navigation list
    review-note.tsx             "Designed for careful review" note
    dashboard-actions.tsx       Period control + CSV export
    stat-cards.tsx              2-up mobile / 4-up desktop stat grid
    overview-notice.tsx         "Matched is not authentic" notice
    trend-card.tsx              CSS bar chart + screen-reader data table
    reporting-card.tsx          Products / distributors tables
    recent-alerts.tsx           Desktop table + mobile alert list
    status-badge.tsx            Alert status pill
  ui/                  Button, fields, selects, textarea, notices, divider
lib/
  cn.ts                Tiny class-name helper
  api/
    client.ts          Fetch interceptor: auth header, refresh, ApiError
    auth.ts            Auth endpoint calls
    types.ts           Session user, token pair, payload types
  auth/
    cookies.ts         Cookie names + session event shared with proxy
    session.ts         Read/write/clear the token cookies
  validation.ts        Form validators and shared types
  onboarding.ts        Onboarding types, options, validators, step data
  dashboard.ts         Dashboard data, navigation, alert CSV builder
public/brand/
  mark.svg             Shield mark extracted from the supplied logo
  logo-full.svg        Full supplied lockup (mark + wordmark + tagline)
```

## Reusing the auth frame

`AuthShell` owns the page background, logo position, responsive card behaviour, and footer placement:

```tsx
<AuthShell
  width="signin"          // or "signup" for the wider card
  mobileCard              // keep the card on small screens
  footer={<SignInFooter />}
>
  <AuthHeading title="..." description="..." />
  {/* form */}
  <Divider className="my-7" />
  <AuthSwitch prompt="..." action="..." href="/..." />
</AuthShell>
```

Sign-in is full-bleed on mobile; sign-up keeps its card on mobile, matching the supplied designs. Both collapse to a single column below `768px`.

## Company onboarding

`/onboarding` follows the supplied 1440px desktop design and collapses to a single-column card layout on smaller screens. The verification sidebar becomes a three-up compact stepper below `1024px`.

- Only Business Information is required, matching the card's `REQUIRED` badge. Contact and regulatory values are format-checked when filled.
- Submit validates the form, focuses the first invalid field, and shows a summary alert.
- The step list scrolls to each section, and the active step follows focus inside a section.
- Save Draft stores the text fields in `localStorage` under `sabicheck:onboarding-draft` and restores them on mount. Uploaded files are not persisted, since browser storage cannot hold `File` objects.
- Uploads accept PDF, PNG, and JPG up to 10MB, with drag/drop or the file picker.

Stub integration points are marked with `TODO`:

- `components/onboarding/onboarding-form.tsx` — the submit request is simulated and then clears the draft; connect it to the organization API when that exists.
- `Cancel` returns to `/dashboard`; point it at the previous page once real routing exists.

The portal header shows the signed-in user (`SessionPortalHeader`).

## Dashboard

`/dashboard` follows the supplied desktop and mobile overview designs.

- The desktop shell starts at `xl` (1280px): a fixed 247px sidebar, a 79px sticky top bar, and four stat columns. Below `xl` it switches to the mobile header, a 2-column stat grid, stacked reporting cards, and a `<dialog>` navigation drawer.
- The drawer supports the close button, `Escape`, backdrop dismissal, and scroll locking. Focus moves into the drawer and returns to the trigger when it closes.
- The trend chart is drawn with CSS bars; its values are also exposed in a visually hidden table for assistive technology. Status badges use text, not colour alone.
- `Most-reported products` and `Most-reported distributors` link their footer actions to the recent alerts section. Navigation anchors map to `#products`, `#distribution`, `#verification-trend`, and `#recent-alerts`.

Demo controls (all marked with comments in the source):

- The workspace switcher lists the single demo workspace. Switching is not implemented.
- The reporting-period and trend-interval selects offer only the current demo values.
- `Export overview` builds a CSV from `lib/dashboard.ts` and downloads it client-side; no request is made.
- `Sign out` in the workspace menu clears the session and returns to `/signin`.
- `Company settings` links to `/onboarding` until a settings route exists, and help/legal links remain `#` placeholders.

The demo workspace (`Abeni Foods Ltd`) and user (`Teni Adewale`) live in `lib/dashboard.ts` and should be replaced with session data.

## Brand assets

The supplied `logo.svg` contains the full brand lockup on light and dark backgrounds. The light artwork was extracted into:

- `public/brand/mark.svg` for the compact shield.
- `public/brand/logo-full.svg` for places that need the tagline lockup.

The UI header uses the shield plus a live text wordmark (`Logo`), which stays crisp and keeps the header height consistent at every breakpoint. The dashboard uses `logo-full.svg` directly to match the reference tagline lockup. Change the wordmark copy or add the full lockup in one place.

## Form behaviour

Forms are client components with inline validation, focus management, password visibility toggles, and loading states.

- Sign-in and sign-up post to the backend. API failures appear in a `role="alert"` banner; a duplicate email is attached to the email field.
- Sign-in redirects to `/dashboard`; sign-up redirects to `/onboarding`.
- `forgot-password` and the onboarding submit still simulate a request and are marked with `TODO` in `components/auth/forgot-password-form.tsx` and `components/onboarding/onboarding-form.tsx`.

`lib/validation.ts` stays framework-agnostic and mirrors the API's field rules (a full name needs a first and last name, passwords are at least 8 characters).
