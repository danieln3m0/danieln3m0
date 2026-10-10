# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: other developers and the dev community (peers, hackathon teammates, open-source contributors) who land on github.com/danieln3m0 from a repo, a commit, a hackathon or a link. They are deciding whether this person is worth following, whose repos are worth opening, and whether to collaborate. They want code and projects first, CV second.

Secondary: recruiters, served by the link to the portfolio and CV rather than by the README itself.

## Product Purpose

The GitHub profile README is the front door of Francis Daniel Mamani Silva's GitHub account (`danieln3m0`). It says who he is in one glance, routes visitors to the repos and projects that matter, and shows that the account is alive. Success: a visiting dev opens a featured repo or the portfolio, follows, or reaches out.

## Positioning

A full-stack developer and Software Engineering student at UPC (Lima, Perú) who ships under pressure: 2.º puesto nacional en el Build with Gemma Hackathon (GDG Callao, 2026) with OratorIA, built in under 24 hours; KeyReu, a voice-meeting-to-agent pipeline built at the Sundai Latam x OpenBase hack (2026-08-16); Ayni, ML detection of coffee-leaf disease, as thesis work in the `ayni-tesis` org. Roles he claims: Desarrollador Full-Stack, Front-End, Creative Coding.

## Operating Context

- Rendered by github.com on the profile page, in GitHub's light or dark theme, desktop and mobile app/web.
- Visitors skim; most arrive mid-task from somewhere else on GitHub.
- The rest of the profile page (avatar, pinned repos, contribution graph) is GitHub chrome around the README and cannot be styled.

## Capabilities and Constraints

- Medium: GitHub-Flavored Markdown with GitHub's HTML sanitizer. No CSS, no JS, no `style` attributes, no custom web fonts in text. Allowed: headings, tables, `<div align>`, `<p align>`, `<img>`, `<picture>` with `prefers-color-scheme` sources (follows GitHub's theme), `<details>`, `<sub>`, `<sup>`, `<kbd>`.
- Visual design beyond Markdown lives in SVG/raster assets committed to this repo; SVG rendered via `<img>` may carry internal CSS, animation and embedded (data URI) fonts but cannot load external resources or be interactive.
- Dynamic data (stats, languages, contribution snake) must be generated inside this repo by GitHub Actions, not by third-party image services (decision 2026-10-10; several third-party services returned `402 DEPLOYMENT_DISABLED`).
- Language: Spanish.
- Owner account: `danieln3m0`. Commits/PRs carry no AI attribution.

## Brand Commitments

- Name: Francis Daniel Mamani Silva (shown as Francis Daniel); handle `danieln3m0`; Discord `darkn3m0`.
- Voice: professional, built from the CV, with one brief line of personality (anime).
- The personal site `Portafolio` (https://danieln3m0.github.io/Portafolio/) has its own visual world ("Minimalismo Interactivo / Creative Coding"); the README need not copy it but should not contradict it.

## Evidence on Hand

Source of truth: `danieln3m0/Portafolio` → `src/data/portfolio.ts` (from the CV).

- Award: 2.º puesto nacional · Build with Gemma Hackathon · GDG Callao · 2026 · OratorIA.
- Projects: OratorIA (2026, IA on-device, Gemma), Ayni (2025, ML móvil y web, FastAPI + Spring Boot + Docker; public repos in github.com/ayni-tesis), D'Taquito (2025), 4EverBodas (2025), Crypto & Product Dashboard (2025), Transportify (2024).
- Public repos of his own: Portafolio (live site), KeyReu (Python), POSLas4as (Spring Boot DDD API), seminario (Next.js academic poster), html-to-figma (active fork).
- Experience: Practicante de Sistemas · EFC (Sep 2025 – actualidad); Software Developer Intern · iTLand Perú (Abr – Jun 2025); Practicante de Sistemas · A&S Soluciones Generales (Ago 2024 – Abr 2025).
- Education: Ingeniería de Software, UPC, egreso Diciembre 2026.
- Contact: francisdani143@gmail.com; LinkedIn https://www.linkedin.com/in/francis-daniel-mamani-silva-562ab6307/; Instagram @francis_daniel029.
- Absent, never fabricate: public repos for OratorIA, D'Taquito, 4EverBodas, Crypto Dashboard and Transportify; screenshots of projects; star counts or user numbers.

## Product Principles

1. Code first: every featured item leads to something a dev can open.
2. Nothing on the page may break: no element depends on a third-party server.
3. Truth from the CV only; no invented skills, claims or repos.
4. Readable in both GitHub themes and on the mobile app.
