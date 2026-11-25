# HirePath Security Specification (Payload-First TDD)

## 1. Data Invariants
1. **Identity Isolation**: Users may only create or mutate personal records (`users_private`, `roadmaps`, `quizAttempts`, `resumes`, `interviewSessions`, `projectProgress`, `bookmarks`, `notifications`, `aiConversations`) where `uid == request.auth.uid`.
2. **PII Split Collection**: `email`, `phone`, and `location` live exclusively in `users_private/{userId}` and are never readable by other learners or recruiters.
3. **Zero Privilege Escalation**: Users cannot set `role: "admin"` on `users_public/{userId}` unless their verified token email matches the bootstrapped admin (`sadhana.s2025cse@sece.ac.in`).
4. **Verified Users Only**: All writes require `request.auth != null && request.auth.token.email_verified == true`.
5. **Immutable Audit & Scores**: `quizAttempts` and `interviewSessions` are immutable once created (`allow update: if false`).
6. **Temporal Integrity**: All `createdAt` and `updatedAt` fields must equal `request.time` via Firestore `serverTimestamp()`.
7. **Application Access Boundary**: `applications/{id}` are readable only by the `applicantUid`, the `recruiterUid` of that job, or an admin. Applicants can only create with `status == "submitted"`. Only the owning `recruiterUid` or admin can transition `status`.
8. **Parent Gate & Atomicity**: Comments and likes live in subcollections under `communityPosts/{postId}` and verify parent post existence via `exists(...)`.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Shadow Field Injection**: Creating `users_public/{uid}` with extra field `isVerified: true` -> rejected by `keys().hasOnly(...)`.
2. **Privilege Escalation**: Creating/updating `users_public/{uid}` with `role: "admin"` as a non-admin email -> rejected.
3. **Unverified Email Spoof**: Request with `email_verified: false` -> rejected by `isVerifiedUser()`.
4. **PII Blanket Read**: Learner A calling `get` on `users_private/{learnerB}` -> rejected.
5. **Cross-Tenant Roadmap Write**: Learner A creating `roadmaps/{id}` with `uid: learnerB` -> rejected by `incoming().uid == request.auth.uid`.
6. **Score Tampering**: Learner updating `quizAttempts/{id}` to raise `score` from 40 to 100 -> rejected (`allow update: if false`).
7. **Application Status Self-Approval**: Applicant updating `applications/{id}` `status` to `"accepted"` -> rejected (only `recruiterUid` can update `status`).
8. **Client-Forged Timestamp**: Sending `createdAt: "2020-01-01"` instead of `request.time` -> rejected.
9. **ID Poisoning**: Document ID > 128 chars or containing `../` -> rejected by `isValidId()`.
10. **Denial of Wallet String Flood**: Sending 100KB `bio` or `content` string -> rejected by `.size() <= MAX`.
11. **Unbounded Array Flood**: Sending 500 elements in `skillNames` or `requiredSkills` -> rejected by `.size() <= MAX`.
12. **Orphaned Comment Write**: Creating a comment under a non-existent `communityPosts/{fakePostId}` -> rejected by `exists(...)`.
