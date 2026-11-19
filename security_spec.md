# iBless Security Specification (Phase 0: Payload-First Security TDD)

## 1. Core Data Invariants
1. **PII Isolation**: User email addresses reside exclusively in `/userPrivate/{userId}` and are readable/writable only by `userId`. `/users/{userId}` contains zero PII.
2. **Sender Authenticity**: No user may create a blessing, request, connection request, or notification impersonating another `uid` (`senderId == request.auth.uid`, `actorId == request.auth.uid`).
3. **Private Blessing Confidentiality**: Blessings default to `visibility == 'private'`. Private blessings are readable ONLY by `senderId` and `recipientId`. Unrelated users receive `PERMISSION_DENIED`.
4. **Block Enforcement**: If `recipientId` has blocked `senderId` (`/blocks/{recipientId}_{senderId}` exists), `senderId` cannot create blessings, private requests, or connection requests targeting `recipientId`.
5. **Cross-User Stat Integrity**: Users cannot update another user's `/users/{otherUid}` statistics, streaks, or level.
6. **Terminal & Action-Gated Transitions**: Blessing recipients can update only status/acknowledgement/thank-you fields; senders can toggle visibility; closed/fulfilled requests cannot be reopened arbitrarily.
7. **Server Timestamps & Bounded Payloads**: All `createdAt` / `updatedAt` timestamps must equal `request.time`. Every string and array is strictly size-bounded.
8. **Query Enforcement**: Every `allow list` rule evaluates `resource.data` directly (never blanket `isSignedIn()`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection on Profile**: Update `/users/{uid}` with `{ isAdmin: true }` -> `PERMISSION_DENIED` (`hasOnly` / `affectedKeys`).
2. **PII Read Leak**: User B attempts `get` on `/userPrivate/{userA}` -> `PERMISSION_DENIED`.
3. **Sender Spoofing on Blessing**: User B creates `/blessings/b1` with `senderId: userA` -> `PERMISSION_DENIED`.
4. **Private Blessing Snooping**: User C reads `/blessings/privateB1` (between A and B) -> `PERMISSION_DENIED`.
5. **Blocked User Harassment**: Blocked User A creates `/blessings/b2` with `recipientId: userB` -> `PERMISSION_DENIED`.
6. **Cross-User Stat Tampering**: User A updates `/users/{userB}` `statistics.sentCount` -> `PERMISSION_DENIED`.
7. **Timestamp Forgery**: User A creates `/blessings/b3` with backdated `createdAt` (`!= request.time`) -> `PERMISSION_DENIED`.
8. **ID Poisoning**: User A creates `/blessings/{200-char-junk}` -> `PERMISSION_DENIED` (`isValidId`).
9. **Blanket User List Scrape**: User A queries `/users` without `discoverable == true` filter -> `PERMISSION_DENIED`.
10. **Notification Spoofing**: User A reads `/notifications` belonging to User B -> `PERMISSION_DENIED`.
11. **Duplicate Connection Hijack**: User C creates `/connections/{A}_{B}` without being in `participants` -> `PERMISSION_DENIED`.
12. **Recipient Message Tampering**: Recipient User B attempts to rewrite `message` of a received blessing -> `PERMISSION_DENIED` (`affectedKeys().hasOnly`).
