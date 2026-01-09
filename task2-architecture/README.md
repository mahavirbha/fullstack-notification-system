# Task 2: System Architecture

High-level flow for notification creation to delivery, optimized for scale and real-time updates.

## Diagram (text)
```
[Client (Web/Mobile)]
	|
	v
[API Gateway / Express]
	|
	v
[Job Queue (e.g., Bull/Redis)] <-- slow/unreliable push/email happen here
	|
	v
[Workers]
  |    |
  |    +--> Push Provider (FCM/APNs)
  |
  +--> Email Provider (SendGrid)

Data plane (MongoDB):
- Users
- Notifications (per-channel status)

Real-time updates:
- WebSockets/Server-Sent Events from API to Web client for in-app updates
- Mobile uses push when app closed; in-app fetch when foreground
```

## Flow
1) Client calls POST /notifications → API validates, persists notification (status pending per channel), enqueues jobs.
2) Workers pop jobs, call push/email providers, update `channels.*` status (+ attempts/error) in Mongo.
3) In-app channel stays `unread` until user opens; marking read updates `channels.inApp.status`.
4) Web client receives real-time status updates via WS/SSE; mobile receives push when backgrounded.
5) Spike handling: queue absorbs bursts; workers can scale horizontally; Mongo indexed by `userId`/`createdAt`.

## Components
- API (Express): auth/validation, enqueue, read feeds, stats, list users.
- Queue: Redis-backed for retries/backoff; decouples provider latency.
- Workers: idempotent; update statuses; emit events to WS hub.
- Realtime: WS/SSE gateway publishes notification/status updates to web; optional fanout via Redis pub/sub.
- Storage: MongoDB with indexes from Task 1; optional timeseries/TTL for telemetry.

## Offline / Mobile
- When app closed: push notification; deep-link to detail; in-app fetch on open.
- When foreground: optional WS channel for live updates; fallback to periodic fetch.

## Scaling Notes
- Separate read/write DB roles (primary/replica) if needed for heavy analytics.
- Apply circuit breakers and retries in workers for flaky providers.
- Instrument metrics (enqueue latency, delivery success, retry counts) and alerts.
