# ComplianceTwin 360

Integrated AICTE Approval Workflow, Compliance Monitoring and Intelligent Alert Management System (AICTE Hackathon 2025 Prototype).

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, Lucide Icons
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic 2, python-jose (JWT), passlib (Bcrypt)
- **Database**: PostgreSQL / SQLite (zero-dependency automatic switch configured via `DATABASE_URL`)
- **Storage**: Local filesystem versioned document repository / S3-compatible

---

## 🎨 Consistent Government-Tech Visual Palette
- **Warm Parchment**: `#F5F0E8` (Main page background)
- **Soft Beige**: `#E8DED0` (Panels, secondary backgrounds)
- **Sand**: `#D6C5AE` (Borders, structural dividers)
- **Taupe**: `#A89580` (Muted labels & secondary elements)
- **Dark Brown**: `#40372F` (Primary readable headings & text)
- **Muted Burgundy**: `#8B3A3A` (Primary action buttons & alerts)
- **Deep Navy**: `#263B50` (Administrative accents & active navigation tabs)
- **White Surface**: `#FFFEFC` (Cards, dossiers, form surfaces)
- **Success Green**: `#48745A` (Verified / Approved)
- **Warning Amber**: `#B77932` (Pending reviews / approaching deadlines)
- **Error Red**: `#B33A3A` (Overdue items & deficiencies)

---

## 🚀 Running the Application

### 1. Start the Backend API (FastAPI)
In a terminal at the project root (`c:\Users\Admin\Desktop\compliance 360`):
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend initializes the database and automatically seeds baseline records with institutions, applications, deficiencies, and audit logs.
- Interactive Swagger docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Start the Frontend (Vite)
In a second terminal:
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 🔑 Demonstration Accounts (Pre-configured)

You can click any demo credential card on the login screen for instant 1-click pre-fill:

| Role | Email | Password | Scope & Organization |
| :--- | :--- | :--- | :--- |
| **AICTE Admin** | `admin@aicte.gov.in` | `Admin@123` | Central Approval Bureau, full permissions |
| **AICTE Officer** | `officer@aicte.gov.in` | `Officer@123` | Scrutiny review, return deficiencies, verify |
| **Institution 1** | `institution@vits.edu.in` | `College@123` | Vivekananda Institute of Tech & Science (Pune) |
| **Institution 2** | `institution@apex.ac.in` | `College@123` | Apex College of Advanced Computing (Bengaluru) |

---

## 🔄 Dual-Portal Continuity Demonstration Guide

1. **Open Institution Portal**:
   - Log in as `institution@vits.edu.in`.
   - Go to **My Applications** -> Open `AICTE-2025-0015` (*Establishment of High-Performance Central Computing & IoT Facility*).
   - Observe that the Architectural Layout document has status **CORRECTION REQUIRED** with the official officer reason visible: *"The submitted layout plan does not clearly show emergency fire exit passageways or server room earthing pit layout as per AICTE Norms 2024-25 Table 4.2."*
   - Click **Upload Replacement (v2)**, select a replacement file, add an explanatory note, and submit.
   - The document updates to version 2 and the status changes to **RESUBMITTED**.

2. **Open AICTE Admin Portal**:
   - Log out and log in as `officer@aicte.gov.in`.
   - On the **Admin Dashboard**, notice the **Re-Scrutiny Queue** metric and click **Unified Applications**.
   - Open `AICTE-2025-0015`. Notice the replacement document version with timestamp and institution remarks.
   - Click **Accept** to verify the replacement document.
   - Click **Transition Stage / Decision** to move the application forward to EVC or Sanction.

3. **Intelligence Centre & Simulation**:
   - Navigate to **Intelligence & Simulation** in the Admin Portal.
   - Inspect average stage dwell times and primary deficiency causes.
   - Adjust the **What-If Simulation** sliders (Surge volume, capacity changes, EVC delay) and click **Calculate Simulated Outcome** to forecast application turnaround SLAs and automated mitigation recommendations.

