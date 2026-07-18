# SoberPath Habit Recovery & Addiction Support Companion
A secure, privacy-by-design, server-isolated web application designed to help adults reduce or overcome harmful habits and addictions. Built with robust data minimization, transparent consents, and personalized generative AI recovery coaching.

---

## 1. Locked Architectural Decisions

SoberPath is engineered around **Security by Design** and **Privacy by Design**. Every technical choice enforces a strict server-authoritative trust boundary.

| Technology Component | Selection | Primary Architectural Rationale |
| :--- | :--- | :--- |
| **Framework & Build** | React 19 (SPA) + Vite | Native modern UI performance, fast bundling, and highly responsive transitions. |
| **Backend Runtime** | Node.js Express Server | Serves as the single, authoritative trust boundary. Direct client-side Firestore access is **disabled** to prevent BOLA and data harvesting. |
| **Database & Auth** | Firebase (Firestore + Auth) | Real-time structured data storage with secure server-side verification of client tokens. |
| **AI Processing** | `@google/genai` (Gemini 3.5 Flash) | Real-time, server-isolated Cognitive Behavioral Therapy (CBT) and Motivational Interviewing coaching. |
| **Styling Engine** | Tailwind CSS v4 | Rapid, responsive, highly accessible interface styling without CSS bloating. |
| **Deployment Platform**| Vercel | End-to-end continuous Git deployment, serverless runtime stability, and isolated environment variables. |

---

## 2. Comprehensive Data Model & Schema

All records are tied strictly to an authenticated user ID (`userId`) and are completely isolated on the server.

```
                  +-------------------+
                  |    UserProfile    |
                  +---------+---------+
                            | (1 to many)
         +------------------+------------------+
         |                                     |
+--------v--------+                   +--------v--------+
|      Habit      |                   |     Journal     |
+--------+--------+                   +-----------------+
         | (1 to many)
+--------v--------+                   +-----------------+
|   Log Entry     |                   |   ChatMessage   |
| (urge/relapse/  |                   +-----------------+
|    clean_day)   |
+-----------------+                   +-----------------+
                                      |  ConsentRecord  |
                                      +-----------------+
```

### 2.1 User Profile (`UserProfile`)
* **Collection:** `/users/{userId}`
* **Fields:**
  * `uid`: `string` (Primary Key, matches Firebase Auth User UID)
  * `displayName`: `string` (Anonymized pseudonym, e.g. "SoberRunner")
  * `createdAt`: `string` (ISO timestamp)
  * `ageConfirmed`: `boolean` (Mandatory adult gate, must be true)
  * `aiPersonalizationEnabled`: `boolean` (Optional, controls AI access)
  * `analyticsEnabled`: `boolean` (Optional)

### 2.2 Active Habits & Recovery Goals (`Habit`)
* **Collection:** `/users/{userId}/habits/{habitId}`
* **Fields:**
  * `id`: `string` (Primary Key)
  * `userId`: `string` (Foreign Key -> UserProfile)
  * `name`: `string` (e.g. "Smoking Vapes")
  * `category`: `string` (Alcohol | Smoking/Vaping | Substances | Gambling | Digital/Screen Time | Other)
  * `goal`: `string` (Core motivation or reason for quitting, e.g. "Save $200/mo")
  * `triggers`: `string[]` (Identified trigger environments)
  * `createdAt`: `string` (ISO timestamp)
  * `streak`: `number` (Current consecutive clean days count)
  * `lastCleanDate`: `string` (YYYY-MM-DD tracking)

### 2.3 Tracking Logs (`Entry`)
* **Collection:** `/users/{userId}/entries/{entryId}`
* **Fields:**
  * `id`: `string` (Primary Key)
  * `userId`: `string` (Foreign Key -> UserProfile)
  * `habitId`: `string` (Foreign Key -> Habit)
  * `timestamp`: `string` (ISO timestamp)
  * `type`: `string` (urge | relapse | clean_day)
  * `intensity`: `number` (Scale 1-10, nullable)
  * `notes`: `string` (Encrypted/Confidential observations, max 1000 chars)
  * `trigger`: `string` (Specific environment active during log)
  * `mood`: `string` (Emotional state)

### 2.4 Confidential Journal (`Journal`)
* **Collection:** `/users/{userId}/journal/{journalId}`
* **Fields:**
  * `id`: `string` (Primary Key)
  * `userId`: `string` (Foreign Key -> UserProfile)
  * `title`: `string` (Optional)
  * `content`: `string` (Text entry, field-level encrypted/isolated)
  * `mood`: `string` (Emotion tag)
  * `createdAt`: `string` (ISO timestamp)

### 2.5 Coaching Chats (`ChatMessage`)
* **Collection:** `/users/{userId}/chat/{messageId}`
* **Fields:**
  * `id`: `string` (Primary Key)
  * `userId`: `string` (Foreign Key -> UserProfile)
  * `sender`: `string` (user | ai)
  * `message`: `string` (Message transcript)
  * `timestamp`: `string` (ISO timestamp)

### 2.6 Consent Logs (`ConsentRecord`)
* **Collection:** `/users/{userId}/consents/{consentId}`
* **Fields:**
  * `id`: `string` (Primary Key)
  * `userId`: `string` (Foreign Key -> UserProfile)
  * `consentCategory`: `string` (essential | ai_personalization | analytics)
  * `status`: `boolean` (Active or Withdrawn)
  * `noticeVersion`: `string` (e.g. "1.0")
  * `timestamp`: `string` (ISO timestamp)

---

## 3. Secure AI Contracts & Crisis Safeguards

Coaching is structured as an interactive feedback loop running on protected server endpoints.

```
[User Message] 
   |
   v
[Server-Side Pre-filter / Keyword Regex] ---(Flagged crisis)---> [Crisis Resource Injector]
   | (Safe)
   v
[Gemini API + Structured System Prompts] ---(Generate response)---> [CBT Feedback to Client]
```

### 3.1 AI Input/Output Data Contracts
* **Endpoint:** `/api/chat`
* **Input Context Shape:**
  * `message`: `string` (Client input, max 1000 characters)
  * `habitsContext`: `string` (Anonymized markdown representation of active streaks)
  * `chatHistory`: `Array<{sender, message}>` (Strictly limited to the 6 most recent messages for context pruning)
* **Zod Output Validation Contract:**
  ```typescript
  {
    message: z.string().max(3000),
    suggestedCopingStrategy: z.string().optional(),
    safetyTriggered: z.boolean()
  }
  ```
* **AI Configuration Bounds:**
  * **Model:** `gemini-3.5-flash` (balanced speed, reasoning, and security parameters)
  * **Temperature:** `0.7` (encourages creative empathy while maintaining analytical safety boundaries)
  * **Max Output Tokens:** `1000` (prevents model-cost exhaustion and overly long outputs)
  * **Server Timeout:** `8000ms`
  * **Fallback Behavior:** If the model fails or times out, the server gracefully returns a helpful, pre-verified CBT grounding text and does not fabricate fake AI outputs.

### 3.2 Two-Layer Crisis Detection Safeguard
To guarantee immediate assistance for vulnerable individuals, SoberPath integrates a fail-safe crisis classifier:
1. **Layer 1: Pre-Filter Pre-check:** A regex engine parses incoming messages for trigger words: `suicide`, `self-harm`, `kill myself`, `ending my life`, `want to die`, `overdose`. If matched, Layer 2 is bypassed, and verified national crisis lifelines are instantly pre-pended to the response.
2. **Layer 2: Model-Based Classifier:** The system instruction commands the model to constantly monitor context and prioritize safety numbers over conversation.

---

## 4. Phased Implementation & Deployment Pipeline

Development is organized as standalone vertical slices:

* **Phase 1: Secure Auth & Onboarding Gate (Completed)**
  * Firebase Authenticated logins with zero database leakage.
  * Mandatory adult age gate & configurable consents on-screen before any tracking begins.
* **Phase 2: Habits Tracking & Self-Awareness Dashboard (Completed)**
  * Secure endpoints for managing recovery plans, active streaks, and connuous clean days.
  * Mindful logs of cravings (scale 1-10) with trigger details.
* **Phase 3: CBT AI Coach & Crisis Interventions (Completed)**
  * Server-to-server integration with Gemini API.
  * Two-layer safety mechanism returning 988 emergency lines.
  * 24-hour rate limiters protecting against endpoint credit exhaustion.
* **Phase 4: Privacy Center, Portability & Deletion (Completed)**
  * Instant raw JSON file download of user history.
  * One-click irreversible account and data deletion purging all collection documents.
* **Phase 5: Automated Testing & Smoke Evaluation (Completed)**
  * Static type-checking and full development build validation.

---

## 5. Security Threat Matrix & Controls

SoberPath mitigates OWASP Top 10 risks natively:

* **Direct Object Reference (BOLA):** Authenticated user IDs are derived exclusively from verified server-side session tokens, not client-provided arguments.
* **Data Harvesting / Scraping:** All direct Firestore reads/writes are blocked via `firestore.rules`. Access is mediated exclusively through Node endpoints.
* **Cross-Site Scripting (XSS):** Custom CSP headers deny unauthorized content injection, while input fields are verified and restricted.
* **Model Cost Exhaustion:** Users are restricted to a maximum of 20 coaching queries per rolling 24-hour period.
