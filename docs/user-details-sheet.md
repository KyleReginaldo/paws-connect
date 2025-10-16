# User Details Sheet

This slide-over sheet appears from the right when you click "View details" in the user tables (`UserTable` and `UserTableFiltered`). It shows:

- Profile summary (avatar, username, email, role, status, user ID)
- Identification (ID status, name fields, birth date, address, ID attachment viewer)
- Home assessment photos (click to zoom)
- Violations list with add/remove (admin only)
- Quick actions (Fully verify, Semi verify, Indefinite, Edit, Delete)

Data source:

- Fetches `/api/v1/users/[id]` which returns `users` with `user_identification(*)` per `USER_QUERY_WITH_ID`.

Permissions:

- Admin-only actions are gated by `currentUserRole === 1` and route-level checks.

Files:

- `src/components/UserDetailsSheet.tsx`
- Wired into `src/components/UserTable.tsx` and `src/components/UserTableFiltered.tsx`
