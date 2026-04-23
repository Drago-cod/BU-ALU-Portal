# BU Alumni Portal

A centralized digital platform connecting Bugema University graduates with professional opportunities, institutional news, and community initiatives.

---

## Overview

The BU Alumni Portal is built around three core pillars:

- **Professional Advancement** — job listings, internships, bursaries, and mentorship
- **Financial Sustainability** — tiered memberships, fundraising, and donation tracking
- **Transparent Governance** — visible leadership, board profiles, and alumni stats

---

## Project Structure

```
BU ALU Portal/
├── index.html       # Home page
├── about.html       # About & Leadership page
├── styles.css       # Shared stylesheet
└── image/
    └── Bugema_logo.png
```

---

## Pages

### 1.0 Home
Entry point for all users (Alumni, Students, Guests).

- Hero section with a strong call-to-action
- Quick Links grid — direct access to Networking, News, and Donations
- Alumni Stats box showcasing network scale (389,000+ members, 72 chapters, etc.)

### 2.0 About / Leadership
Builds trust through transparency.

- Portal mission and focus areas
- Leadership section: Patron, President, General Secretary, Finance Officer
- Each leader card includes role, bio, WhatsApp, LinkedIn, and direct contact links

### 3.0 Activities
Engagement hub with modular activity cards.

- Career Guide — PDF resource repository
- Fundraising — visual thermometer progress bar to gamify donation goals
- Charity — gallery layout showcasing community impact

### 4.0 Events & News (The "Plog")
Chronological information feed with an asymmetric layout.

- Primary column: events list and Portal Blog (Plog) posts — every event includes a Grads Link for registration
- Secondary column: sticky widgets for the Business Network and active fundraising spotlights

### 5.0 Memberships & Subscriptions
Revenue and member commitment tiers.

| Tier | Access | Notes |
|------|--------|-------|
| Ordinary | Basic portal access | — |
| VP | Premium access + networking privileges | — |
| VVP | Elite tier | Qualifies for Insurance badge (primary upgrade driver) |

Includes a feedback form to capture alumni sentiment on financial initiatives.

### 6.0 Opportunities & Job Givers Portal
Professional marketplace with two user paths.

- **Alumni/Students** — filtered listings (Jobs / Internships / Bursaries) with Apply and Grads Link CTAs
- **Recruiters** — dedicated Job Givers Portal for partner registration and talent pool feedback

---

## Functional Requirements

| Feature | Requirement |
|---------|-------------|
| Authentication | Grads Links are gated — only logged-in alumni can access registration and application forms |
| Search & Filter | Opportunities page requires real-time filtering by type and location |
| Responsive Design | All multi-column grids collapse to a vertical stack on mobile |
| Forms | All feedback and signup forms include validation and a success confirmation state |

---

## Design Guidelines

- **Style** — Clean, professional, monochromatic base with a blue primary (`#1140d9`)
- **Typography** — Inter font; bold hierarchy for tier titles and primary CTAs
- **Navigation** — Consistent global header (Login / Donate) and footer (social links) on every page
- **Responsive** — Mobile hamburger menu at ≤680px; all grids stack at ≤680px

---

## Roadmap

- [ ] AI-driven mentor matching based on leadership and alumni profiles
- [ ] Automated insurance certificate generation for VVP members on payment confirmation
- [ ] Live partnership dashboard for the Business Network section
- [ ] Alumni chapter map with geographic filtering
