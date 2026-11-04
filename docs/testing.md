# CYBEROSH PARIKSHA – Testing & Verification Strategy

## 1. Test Coverage Scope

1. **Unit Verification**:
   - Marking scheme formula calculation: `Score = (CorrectCount * MarksPerQuestion) - (IncorrectCount * NegativePenalty)`
   - Percentile formula: `Percentile = (CountOfScoresBelow / TotalAttemptCount) * 100`
   - Question validation (requires options, correct key matching option set, bilingual text).
   - Razorpay HMAC SHA256 signature verification.

2. **Integration Verification**:
   - Authentication flow: User registration -> password hashing -> JWT token generation -> protected route access.
   - Examination CBT Lifecycle:
     - Test initiation creates session with server-authoritative timestamp.
     - Answers persist on server during autosave events.
     - Submitting test freezes attempt, scores questions on server, and prevents subsequent mutations.
     - Results dashboard displays correct breakdown, negative marks, and answer key explanations.
   - Subscription & Entitlement:
     - Order creation -> Razorpay signature verification -> entitlement entry added -> student unlocked for premium mock tests.

3. **Security Testing**:
   - Prevention of answer leaks in CBT test retrieval payload.
   - Rejection of out-of-order or expired submissions (`now() > server_deadline`).
   - Rejection of unauthorized admin API calls.
