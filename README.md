# MOSA Alumni Management System
### Mandela Secondary School Hoima (MASSH) • Established 1997
**Mandela Old Students Association (MOSA) Official Web Platform**

![MASSH Colors](https://img.shields.io/badge/School-MASSH%20Hoima-0B203E?style=for-the-badge)
![Alumni Association](https://img.shields.io/badge/Association-MOSA-D97706?style=for-the-badge)
![Established](https://img.shields.io/badge/Est.-1997-0B203E?style=for-the-badge)
![Tests](https://img.shields.io/badge/Automated%20Tests-242%20Passing-10B981?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge)

---

## 1. Project Identity & Purpose

**Mandela Secondary School Hoima (MASSH)** was founded in 1997 in Hoima, Bunyoro Sub-Region, Uganda, offering both **O-Level (UCE)** and **A-Level (UACE)** education. Over the past three decades, thousands of scholars have graduated from MASSH into leadership, medicine, engineering, law, public administration, and entrepreneurship.

The **Mandela Old Students Association (MOSA)** digital platform serves as the central digital registry to:
- Formally register and verify alumni.
- Assign the permanent, sequential, tamper-proof **Alumni Number (`MA. 0001` – `MA. 9999`)**.
- Maintain searchable alumni directories with granular privacy controls.
- Coordinate university and regional chapters (**MUMASA**, **KYUMASA**, **MBUMASA**, etc.).
- Organize alumni conventions, reunions, and school mentorship days with **Digital QR Gate Passes**.
- Collect annual membership dues (UGX 50,000/yr) and mobilize school development philanthropy via **MTN MoMo**, **Airtel Money**, and **Bank Transfer** with official receipts (`MOSA-RCP-YYYY-XXXX`).
- Deliver multi-channel targeted circulars and broadcasts.
- Provide real-time demographic analytics and generate official printable **AGM Executive Reports**.

---

## 2. Platform Architecture & Capabilities

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MOSA PORTAL (REACT 18 + TS)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  DIRECTORY   │             │   CHAPTERS   │             │    EVENTS    │
│  & PROFILES  │             │  MANAGEMENT  │             │ & QR PASSES  │
└──────┬───────┘             └──────┬───────┘             └──────┬───────┘
       │                            │                            │
       ├────────────────────────────┼────────────────────────────┤
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│ GIVING, DUES │             │ BROADCASTS & │             │  EXECUTIVE   │
│ & RECEIPTS   │             │ CIRCULARS    │             │  ANALYTICS   │
└──────┬───────┘             └──────┬───────┘             └──────┬───────┘
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │                 DUAL DATA ACCESS LAYER                  │
       │                                                         │
       │  [Mode A] Zero-Config Local High-Fidelity Simulation     │
       │  [Mode B] Google Firebase Firestore Cloud Database      │
       └─────────────────────────────────────────────────────────┘
```

### Module Highlights

| Module | Core Functionality |
| :--- | :--- |
| **Official MA Number** | Atomic sequential numbering starting at `MA. 0001`. Never manually chosen, strictly verified by administrators, immutable, and permanently attached to school records. |
| **Alumni Directory** | Search by name, alumni number, year of completion, house, combination, or university. Features telephone/email masking according to each alumnus's privacy settings. |
| **University Chapters** | Active chapters for Makerere (**MUMASA**), Kyambogo (**KYUMASA**), Mbarara (**MBUMASA**), UCU (**UDSMASA**), and Gulu (**GUMASA**), with support for dynamic chapter creation and delegation of chapter administrators. |
| **Events & Digital QR Passes** | Automated gate pass issuance with unique verification hashes (`QR-evt-id-MA.0001-...`). Features an administrative Gate Desk supporting live QR camera scanner check-in, manual alumni search, and duplicate attendance prevention. |
| **Giving & Dues Treasury** | Submissions for Annual Membership Dues (UGX 50,000/yr) and School Infrastructure Campaigns (Science Complex, ICT Labs, Sports Pavilion). Treasurer verification queue issues sequential receipts (`MOSA-RCP-YYYY-XXXX`). |
| **Communications & Circulars** | Targeted broadcasts filtered by audience scope (All Alumni, Specific Chapters, Pioneers, etc.) with simulated multi-channel delivery (SMS Broadcast, Email Digest, Pinned Circulars) and in-portal Notification Center. |
| **Strategic Analytics & AGM** | Real-time demographic breakdown (Both O & A-Level vs Single Level), Generational Cohorts (Pioneers 1997–2005 through 2021+), chapter leaderboards, financial solvency metrics, printable AGM Executive Report, and CSV Master Registry export. |

---

## 3. Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation
```bash
# Clone the repository (or navigate to project folder)
cd mosa-alumni-system

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Production Build
```bash
# Run TypeScript type check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

### Deployment (Firebase Hosting & GitHub)
```bash
# Automated 1-step deployment script (Windows PowerShell):
.\deploy.ps1

# Or double-click deploy.bat in Windows Explorer

# Manual step-by-step commands:
npm run build
firebase deploy
git add .
git commit -m "feat: deploy latest MOSA portal updates"
git push origin main
```

---

## 4. Evaluation Credentials & Quick Test Roles

The system comes pre-loaded with sample seed data reflecting the history of MASSH since 1997. Use the following credentials to explore different roles:

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **MOSA Super Administrator** | `admin@massh.ac.ug` | `admin123` | Application Verification Queue, MA Number Issuance, Gate Desk QR Scanner, Treasurer Dues Verification, Chapter Creation, Pinned Broadcasts, Audit Logs |
| **Verified Alumnus (President)** | `muhammad.z@alumni.massh.ac.ug` | `alumni123` | Permanent Number `MA. 0001`, Profile Management, Event QR Passes, Membership Dues Submission, Chapter Rosters |
| **Verified Alumna** | `grace.akiiki@alumni.massh.ac.ug` | `alumni123` | Permanent Number `MA. 0002`, Class of 2004 (PEM), MUMASA Chapter Member |
| **New Candidate** | *Click "Register Alumni" on homepage* | *Self-selected* | Submits candidate application to MASSH Secretariat for vetting |

*Tip: The sign-in modal (`AuthModal.tsx`) features one-click "Fill Demo Admin" and "Fill Demo Alumnus" buttons for rapid testing.*

---

## 5. Automated Test Suite (205 Tests)

The system includes 6 comprehensive automated test suites covering all business invariants:

```bash
# Run all automated test suites sequentially
npx tsx src/tests/test_milestone1.ts
npx tsx src/tests/test_phase3.ts
npx tsx src/tests/test_phase4.ts
npx tsx src/tests/test_phase5.ts
npx tsx src/tests/test_phase6.ts
npx tsx src/tests/test_phase7.ts
npx tsx src/tests/test_security_rbac_hardening.ts
```

### Test Coverage Breakdown
- **`test_milestone1.ts` (35 Tests)**: Candidate deduplication, review queue, atomic sequential `MA. XXXX` allocation, directory filtering, audit logging.
- **`test_phase3.ts` (28 Tests)**: University chapter creation, code auto-generation, membership roster limits, chapter switching, admin delegation.
- **`test_phase4.ts` (34 Tests)**: Event scheduling, deterministic QR tokens, gate scanner check-in, duplicate prevention, attendance counters.
- **`test_phase5.ts` (37 Tests)**: MTN MoMo, Airtel, and Bank transfer logging, dues verification, receipt numbering (`MOSA-RCP-YYYY-XXXX`), campaign donor tracking.
- **`test_phase6.ts` (31 Tests)**: Broadcast audience targeting, multi-channel dispatch, announcement pinning, view telemetry, notification center.
- **`test_phase7.ts` (40 Tests)**: System analytics aggregation, O/A level distributions, generational cohorts, solvency ratios, AGM report structure, CSV export integrity.
- **`test_security_rbac_hardening.ts` (37 Tests)**: Role-based boundary isolation, anti-tampering verification guards on `MA. XXXX` numbers, single-vote constitutional secret ballots, treasury receipt integrity, smart meeting state locking, and forensic audit immutability.

---

## 6. Cloud Database Configuration (Google Firebase)

By default, the application runs on **Local High-Fidelity Simulation Mode** (using persistent localStorage and simulated delays), requiring zero configuration.

To connect the application to a live Google Cloud Firebase Firestore database:
1. In the navigation bar, click the database status badge (**"Demo Local"**).
2. Enter your Firebase project credentials:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
3. Click **"Save Configuration & Connect"**. The portal will reload and automatically switch to **"Firebase Live"** mode.

---

## 7. School History & Identity Reference

- **Institution**: Mandela Secondary School Hoima (MASSH)
- **Founding Year**: 1997
- **Location**: Hoima City, Bunyoro Sub-Region, Western Uganda
- **Alumni Body**: Mandela Old Students Association (MOSA)
- **Motto**: *Education for Liberation and Development*
- **School Houses**: Mandela, Kabalega, Bunyoro, Nile
- **Official Colours**: MASSH Deep Navy Blue (`#0B203E`) & Ochre Gold (`#D97706`)

---

*Mandela Old Students Association (MOSA) • P.O. Box 412, Hoima, Uganda • info@mosa.massh.ac.ug*
