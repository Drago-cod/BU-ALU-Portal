# BU Alumni Portal

A centralized digital platform connecting Bugema University graduates with professional opportunities, institutional news, and community initiatives.

## Overview

The BU Alumni Portal is built around three core pillars:

- Professional Advancement: job listings, internships, bursaries, and mentorship
- Financial Sustainability: tiered memberships, fundraising, and donation tracking
- Transparent Governance: visible leadership, board profiles, and alumni stats

## Project Structure

```text
BU ALU Portal/
|-- index.html
|-- about.html
|-- activities.html
|-- events.html
|-- memberships.html
|-- opportunities.html
|-- legal.html
|-- styles.css
|-- animations.js
|-- home.js
|-- server.js
|-- database/
|   |-- stats.js
|   `-- stats.json
`-- image/
```

## Pages

### 1.0 Home

- Hero section with a strong call-to-action
- Quick links for networking, news, and donations
- Alumni stats sourced from the local stats data file

### 2.0 About / Leadership

- Portal mission and focus areas
- Leadership section with contact links

### 3.0 Activities

- Career resources
- Fundraising progress
- Charity and chapter activity

### 4.0 Events & News

- Upcoming events list
- Portal blog updates
- Sidebar widgets for network and fundraising highlights

### 5.0 Memberships & Subscriptions

- Tiered memberships
- FAQ and signup flow

### 6.0 Opportunities & Job Givers Portal

- Filtered jobs, internships, and bursaries
- Recruiter registration form

## Previewing The Site

The homepage now works directly from the local files. Open:

- `index.html` for normal preview

You do not need `localhost` just to view the site in the browser.

## Stats Data

Homepage stats are seeded from:

- `database/stats.js` for browser preview
- `database/stats.json` for the optional API-backed store

If you want to run the optional local API, use:

```bash
cd "BU ALU Portal"
node server.js
```

That starts:

- `GET /api/stats`
- `POST /api/stats`

## Functional Requirements

- Authentication: Grads Links are gated to logged-in alumni
- Search and Filter: Opportunities support filtering by type and location
- Responsive Design: Multi-column layouts collapse cleanly on mobile
- Forms: Signup and feedback forms validate and show success states

## Roadmap

- AI-driven mentor matching
- Automated insurance certificate generation
- Live partnership dashboard
- Alumni chapter map with geographic filtering
