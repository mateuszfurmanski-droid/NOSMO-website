# NOSMO public website scope

Updated: 2026-09-21

## Primary public navigation
- Home
- Software
- Hardware
- Recycling
- R&D
- Team

## Public software architecture

### NOSMO Nexus
Connective construction operating layer.

### NOSMO Workforce
One workforce package. Do not present NOSMO Work and NOSMO Agency as separate product families.

Built into NOSMO Workforce:
- Worker App
- Agency Desk
- Person Card / Worker identity
- Emergency

Worker App and Agency Desk may remain technically separate deployments/interfaces, but public architecture treats them as parts of NOSMO Workforce.

### NOSMO WorkSuite
Separate specialist construction application family. Do not confuse WorkSuite with Workforce.

Current named modules:
- DoorSuite — new public name replacing DoorFlow
- NOSMO Electrical Commissioning
- NOSMO Fire Door Register & Inspection

The old DoorFlow name and routes remain only for technical compatibility and historical source continuity.

## Canonical public pages
- index.html
- software.html
- nexus.html
- workforce.html
- work.html — Worker App module page
- agency.html — Agency Desk module page
- emergency.html — Workforce Emergency module page
- worksuite.html
- doorsuite.html
- construction-hardware.html
- greenloop.html
- innovation-lab.html
- team.html

## Product-status rule
Clearly distinguish active build, public prototype, demonstrator, prototype, R&D and planned work.

## Private SKANSKA review surfaces
Keep direct-link only and noindex,nofollow,noarchive:
- /skanska.html
- /skanska-property.html
- /nexus/spark/
- /nexus/skanska-property/

Do not add these to homepage, public Software navigation or sitemap.

## Archive
Older Person Card iterations, Nexus previews, DoorFlow-named source, apps/, demos/ and previews/ remain for history, QA, compatibility and recovery. Do not delete them just because public naming changed.

## Domain
CNAME remains nosmotechnology.co.uk. Do not change DNS, CNAME or @nosmo.tech mail configuration without explicit approval.
