# Optional mobile identity

The application remains guest-first: browsing, playback, live sessions, search,
recommendations, support, and giving do not require an account.

The screens in this directory provide the optional identity layer for users who
want cross-device state or account privacy controls. Expo Router entry files live
under `app/` and delegate to these feature modules, while `AuthProvider` is the
single source of mobile identity state for every route.

OAuth exchanges provider credentials through the ClaudyGod backend and persists
only the resulting ClaudyGod session. Password, email-code, recovery, profile,
and account-security screens use the same session service.

Mobile clients do not receive general-purpose content upload URLs. Ministry
content publishing remains restricted to the authenticated admin workflow. Any
future user-media feature must use a purpose-specific endpoint with bounded MIME
types, size limits, ownership checks, malware scanning, and attachment state.
