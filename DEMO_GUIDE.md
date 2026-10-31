# COMPLIANCETWIN 360 — DEMONSTRATION & SCREEN RECORDING GUIDE

This guide provides a structured walkthrough for recording the **Smart India Hackathon (SIH)** selection video using the populated demonstration dataset.

---

## 1. Credentials for Demonstration

All demo accounts are pre-seeded with encrypted passwords:

| Portal & Role | Login Email | Password | Scope & Organization |
| :--- | :--- | :--- | :--- |
| **AICTE Bureau Admin** | `admin@aicte.gov.in` | `Admin@123` | Full Approval Bureau Oversight & Policy Simulators |
| **Scrutiny Officer** | `officer@aicte.gov.in` | `Officer@123` | Document Verification, Deficiency Returns, Stage Moves |
| **EVC Coordinator** | `evc@aicte.gov.in` | `Evc@123` | Expert Committee Inspections & Panel Allocation |
| **Auditor / Vigilance** | `auditor@aicte.gov.in` | `Auditor@123` | Read-only Audit Trail & Inspection Compliance |
| **VITS Pune (Inst 1)** | `institution@vits.edu.in` | `College@123` | Engineering & Tech, Multiple Applications |
| **Apex AI (Inst 2)** | `institution@apex.ac.in` | `College@123` | Technical Campus, AI/ML Degree & EoA |
| **NIMR Noida (Inst 3)** | `institution@nimr.edu.in` | `College@123` | Management Campus with Overdue Tasks |
| **Sahyadri Engg (Inst 4)** | `institution@sahyadri.edu.in` | `College@123` | Robotics & Intake Expansion |

---

## 2. Seeded Dataset Profile (12 Institutions, 26 Applications)

The environment has a realistic spread of speeds, stages, risk profiles, and obligations:

### A. Low-Risk / Fast Applications (Progressing Smoothly)
- `AICTE-2025-0001` (VITS Pune): EoA Approved, zero deficiencies, 20/100 risk.
- `AICTE-2025-0002` (Apex AI): New B.Tech Data Science, EVC Completed & Recommended, Approved.
- `AICTE-2025-0003` (Sahyadri): Intake increase, 5/100 risk, submitted on schedule.
- `AICTE-2025-0004` (Coromandel): Marine technical sanction, approved.
- `AICTE-2025-0005` (Brahmaputra): New M.Tech Structural Engg, 5/100 risk.

### B. Moderate-Risk Applications (Approaching Deadlines or EVC Active)
- `AICTE-2025-0008` (Apex AI): EoA 2025-26 under scheduled EVC inspection (Panel lead: Dr. P. Venkatraman).
- `AICTE-2025-0010` (Heritage Valley School of Arch): Re-scrutiny queue, revised layout uploaded.
- `AICTE-2025-0011` (Konkan Cyber Campus): Cyber forensics degree, 5 days to deadline.
- `AICTE-2025-0018` (Sahyadri): Heavy vehicle testing workshop expansion, EVC unscheduled.

### C. High-Risk / Delayed Applications (Explainable Delays & Blockers)
- `AICTE-2025-0013` (NIMR Noida): New campus sanction, **69.0/100 HIGH RISK**, 2 mandatory documents missing, **overdue by 6 days**.
- `AICTE-2025-0014` (Malwa Pharmacy): Animal house facility, **57.0/100 HIGH RISK**, EVC scheduling overdue by 3 days.
- `AICTE-2025-0015` (VITS Pune): Central Computing Lab, **Deficiency Flagged** on emergency fire exit passageways.
- `AICTE-2025-0016` (Kalinga Poly-Engg): Automation diploma, **65.0/100 HIGH RISK**, overdue with unresolved deficiency.
- `AICTE-2025-0017` (Vindhya Renewable): Solar intake expansion, **55.0/100 HIGH RISK**, unassigned orphan task.

---

## 3. Recommended Screen Recording Script

### Scene 1: Public Portal & Dual-Portal Architecture (0:00 - 0:45)
1. Open [http://localhost:5173](http://localhost:5173).
2. Highlight the warm government-tech visual design (Parchment, Sand, Muted Burgundy, Deep Navy).
3. Explain the single-source persistent database: actions in the Institution Portal reflect live in the AICTE Admin Bureau.

### Scene 2: Institutional Experience & Deficiency Correction (0:45 - 2:00)
1. Click **Sign In** -> Click pre-fill button **VITS Pune** (`institution@vits.edu.in`).
2. Show the **Institution Dashboard** with live metric counters, approaching document expiries, and notifications.
3. Open **My Applications** -> Open `AICTE-2025-0015` (*High-Performance Central Computing & IoT Facility*).
4. Point out the **CORRECTION REQUIRED** badge on *Architectural Layout & Floor Area Certificate*.
5. Show the official scrutiny deficiency observation: *"The submitted layout plan does not clearly show emergency fire exit passageways..."*
6. Click **Upload Replacement (v2)**, select a file, enter remarks *"Dual fire exit corridors added"*, and click submit.
7. Show that the document updates to version 2 and status transitions to **RESUBMITTED**.

### Scene 3: Pre-Submission Approval Rehearsal (2:00 - 2:45)
1. Navigate to **New Application** (`/institution/new-application`).
2. Demonstrate **Approval Rehearsal**: show that without submitting, institutions can run an automated check to verify whether required files or fields are missing.

### Scene 4: AICTE Admin Portal & Alert Intelligence Centre (2:45 - 4:00)
1. Sign out and sign in as **Scrutiny Officer** (`officer@aicte.gov.in`).
2. Click **Alert Intelligence Centre** (`/admin/alerts`):
   - Show live alerts (overdue applications, EVC scheduling pending, expiring lease deeds).
   - Click an alert to inspect trigger reason, SLA policy code, and recommended actions.
   - Show the **Escalation & SLA Policies** tab explaining warning periods and escalation rules.
3. Open **Unified Obligation Clock** (`/admin/obligations`):
   - Show how the system clearly separates institutional obligations from officer verification tasks.

### Scene 5: Grounded AI Assistant ("Ask the Pipeline") (4:00 - 5:15)
1. Click the floating **AI Pipeline Assistant** button in the bottom right corner (or open the AI tab in Alerts).
2. Ask: *"Which applications are overdue?"*
   - Show that it returns the exact 5 overdue applications from the database with clickable links.
3. Ask: *"Why is AICTE-2025-0013 at risk?"*
   - Show that it explains the 69.0 score with exact reasons: 2 missing mandatory documents and 6 days overdue.
4. Ask: *"Which tasks are waiting for assignment?"*
   - Show the unassigned cases identified for regional bureau allocation.

### Scene 6: Review Case & Policy Impact Simulation (5:15 - 6:00)
1. Go to **Unified Applications** -> Open `AICTE-2025-0015`.
2. Notice the replacement document uploaded in Scene 2 is waiting for review.
3. Click **Accept** to verify the replacement.
4. Go to **Alert Intelligence Centre** -> **Policy Change Impact Simulator**:
   - Preview changing scrutiny target from 7 to 5 days.
   - Show the simulation findings identifying affected cases with the clear disclaimer that live data remains unchanged.

