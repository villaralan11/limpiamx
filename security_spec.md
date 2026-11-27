# LimpiaMX Security Specification & Dirty Dozen Audit

## 1. Data Invariants
1. **Cleaner Listing Integrity**: Every `/cleaners/{cleanerId}` document must have `ownerId == request.auth.uid`, valid city/service enums, bounded string lengths, numeric bounds (`120 <= hourlyRateMxn <= 1500`), and NO PII (no email, phone, or street address).
2. **Booking Relational & Privacy Invariant**: Every `/bookings/{bookingId}` document must have `clientId == request.auth.uid` on create. If `listingSource == 'community'`, the referenced `/cleaners/{cleanerId}` document must exist and its `ownerId` must match `cleanerOwnerId`. Only `clientId` or `cleanerOwnerId` may read/list the booking.
3. **Booking Terminal State Lock**: Once a booking reaches `completed` or `cancelled`, no further updates are permitted.
4. **Review Authorship Invariant**: Every `/reviews/{reviewId}` document must have `authorId == request.auth.uid`, `rating` between 1 and 5, and `createdAt == request.time`.
5. **Private Preferences Isolation**: `/users/{userId}/private/preferences` is strictly accessible only when `request.auth.uid == userId`.

## 2. The "Dirty Dozen" Attack Payloads
1. **Ghost Field Injection on Cleaner**: `{ ..., "isVerified": true }` -> Rejected by `hasOnly(...)`.
2. **Owner Spoofing on Cleaner**: `{ "ownerId": "victim_uid", ... }` -> Rejected by `ownerId == request.auth.uid`.
3. **Rate Manipulation / Negative Pricing**: `{ "hourlyRateMxn": -50, ... }` -> Rejected by `>= 120 && <= 1500`.
4. **Oversized Bio / Denial of Wallet**: `{ "bio": "<2000 chars>", ... }` -> Rejected by `bio.size() <= 600`.
5. **Path ID Poisoning**: Document ID `../../etc/passwd` or 500-char ID -> Rejected by `isValidId()`.
6. **Unverified Email Write**: Authenticated user with `email_verified: false` -> Rejected by `isVerifiedUser()`.
7. **Orphaned Community Booking**: `{ "listingSource": "community", "cleanerId": "non_existent", ... }` -> Rejected by `exists(...)`.
8. **Cross-Client PII Read**: User B attempting `get(/bookings/booking_of_user_A)` -> Rejected by `resource.data.clientId == request.auth.uid || resource.data.cleanerOwnerId == request.auth.uid`.
9. **Terminal Booking Tampering**: Updating a `completed` booking back to `pending` -> Rejected by terminal lock `!(existing().status in ['completed', 'cancelled'])`.
10. **Client Hijacking Status to Confirmed**: Client (not cleaner owner) trying to set `status: 'confirmed'` on a `pending` booking -> Rejected by action-based role gate.
11. **Timestamp Forgery**: Sending `createdAt: Timestamp(2020-01-01)` -> Rejected by `incoming().createdAt == request.time`.
12. **Blanket Preferences Read**: User B attempting `get(/users/userA/private/preferences)` -> Rejected by `request.auth.uid == userId`.
