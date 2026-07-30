# Admin Web Architecture

## System boundary

The admin contains two explicit workspaces. Mobile Studio manages the mobile application through the Claudy admin API. Web Studio manages public-website records through the same admin API's `/v1/website/*` gateway. The browser must never call CGM-Backend directly or receive its gateway credential.

```text
Admin browser -> Claudy admin API -> CGM-Backend -> PostgreSQL
                       |                  ^
                       | x-api-key        |
                       + actor claims ----+

Public website -----------------------> CGM-Backend -> PostgreSQL
```

PostgreSQL behind CGM-Backend is the durable source of truth for Web Studio. Pinia is view state only. A successful write is followed by reconciliation from the server where the screen requires canonical values.

## Dependency rules

1. Views depend on workspace stores; views do not issue HTTP calls.
2. Stores depend on typed API modules and own view/query state.
3. API modules depend on the shared transport and DTO contracts.
4. The transport may depend on the session module, but never on Pinia or Vue Router.
5. Session expiration crosses the boundary through an event subscription owned by the auth store.
6. Web Studio modules remain under `api/website*`, `stores/website`, and `views/website`; Mobile Studio cannot import those stores.

## Failure contract

- Every admin request has a unique `X-Request-ID` for log correlation.
- Network, timeout, RFC 7807, and ordinary API errors normalize to `ApiError`.
- Only one refresh-token request can run at a time. Refresh tokens rotate after success.
- A failed refresh clears credentials once and notifies the application boundary.
- Replaceable list requests use `useLatestRequest`; an older response cannot overwrite a newer filter or page.
- List screens render an explicit error state with retry. Failures must not appear as an empty successful response.
- The gateway translates upstream authentication failures into a gateway/deployment error. It must not incorrectly log the admin out.

## Production configuration invariant

The gateway secrets are server-only and must be identical:

```text
Claudy admin API: CGM_API_BASE_URL=https://<cgm-backend-host>
Claudy admin API: CGM_API_KEY=<at-least-32-byte-random-secret>
CGM-Backend:      AdminGateway__ApiKey=<same-secret>
```

Never expose `CGM_API_KEY` through a `VITE_*` variable. Secret changes require coordinated rotation/redeployment of both APIs. A mismatch presents as a Web Studio 502; inspect the correlated request in both API logs.

## Release gate

Before signing off a release:

1. Run admin production build and admin API typecheck/lint.
2. Verify login, refresh rotation, logout, and expired-session redirect.
3. Exercise one create/update/delete/read cycle for each Web Studio aggregate.
4. Confirm the changed record appears through the public website API, not only in admin state.
5. Verify 401, 403, 404, validation, timeout, and unavailable-upstream responses are visible and actionable.
6. Confirm PostgreSQL migrations are current and gateway credentials pass readiness checks.
7. Search logs using `X-Request-ID` across both API services for the smoke-test requests.

Compilation proves structural compatibility; the cross-service smoke tests prove deployed connectivity and persistence.
