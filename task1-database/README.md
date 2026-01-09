# Task 1: Database Design

MongoDB schemas for a notification system with per-channel delivery tracking.

## Collections

### users
- `_id`: ObjectId (PK)
- `email`: string, required, unique
- `name`: string, required
- `createdAt`: date
- `updatedAt`: date

### notifications
- `_id`: ObjectId (PK)
- `userId`: ObjectId (ref users), required
- `type`: string enum [`transactional`, `marketing`, `alert`, `system`], required
- `title`: string, required
- `body`: string, required
- `priority`: string enum [`low`, `medium`, `high`], default `medium`
- `channels`: object
  - `push`: `{ status, provider, attempts, sentAt, deliveredAt, error }`
  - `email`: `{ status, provider, attempts, sentAt, deliveredAt, error }`
  - `inApp`: `{ status, readAt }`
  - `status`: enum per channel [`pending`, `sent`, `delivered`, `failed`, `unread`/`read` for inApp]
- `metadata`: object (arbitrary)
- `createdAt`: date
- `updatedAt`: date

## Rationale
- Each notification stores per-channel status so a push can fail while email succeeds.
- `channels.*.attempts` and `error` enable retries and auditing.
- `metadata` allows campaign/source IDs without schema churn.

## Indexes
1) `{ userId: 1, createdAt: -1 }`
	- Fast user feed queries and pagination by recency.
2) `{ "channels.inApp.status": 1, createdAt: -1 }`
	- Quickly fetch unread/read subsets; supports badge counts.
3) Text index `{ title: "text", body: "text" }`
	- Enables search over notification content (used by mobile search).
4) (Optional) `{ type: 1, priority: 1, createdAt: -1 }`
	- Efficient filtering for dashboards/analytics.

## Notes
- Ensure `userId` is stored as ObjectId for joins and counting.
- TTL is not used so historical analytics remain available; purge/archival can be added with a TTL on `metadata.archivedAt` if needed.
