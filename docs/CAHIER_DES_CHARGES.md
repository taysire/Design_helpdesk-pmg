# Cahier des charges — PMG Helpdesk

**Version :** 1.0  
**Date :** juin 2026  
**Statut :** Prototype UI validé → implémentation backend en cours (Phase 0)

---

## 1. Contexte et objectifs

### 1.1 Contexte

PMG souhaite remplacer ou compléter une solution type ServiceNow par un **portail helpdesk interne** adapté à ses réalités :

- incidents applicatifs et infrastructure ;
- systèmes pharmacie (Kroll, DSQ) ;
- bureaux virtuels (AVD) ;
- demandes de services TI (arrivée/départ employé, matériel, demandes spéciales).

Un **prototype UI** existe déjà (`ui_kits/helpdesk/`) avec design system PMG, formulaires dynamiques, cycle de vie tickets, KPI et reporting.

### 1.2 Objectifs

| Objectif | Description |
|----------|-------------|
| **Centraliser** | Un seul portail pour signaler incidents et demander des services |
| **Accélérer** | Formulaires guidés par type de problème (une question à la fois) |
| **Mesurer** | SLA, MTTFR, MTTR, tendances, rapport hebdomadaire |
| **Intégrer** | Jira, Slack/Teams, courriel Microsoft |
| **Sécuriser** | Authentification Entra ID (SSO Microsoft), rôles et traçabilité |

### 1.3 Périmètre

**Inclus :**

- Portail employé + espace équipe TI
- Gestion tickets (incidents + demandes)
- Formulaires dynamiques configurables
- Boîte de réception, assignation, commentaires
- Dashboard KPI et reporting
- Base de connaissances (articles d'aide)
- API REST Python + PostgreSQL

**Hors périmètre (v1) :**

- Chatbot / IA
- Gestion de parc inventaire complète (CMDB)
- Facturation / coûts par département
- Application mobile native

---

## 2. Utilisateurs et rôles

| Rôle | Profil | Droits principaux |
|------|--------|-------------------|
| **Employé** | Utilisateur final | Signaler incident, demander service, voir ses tickets, lire articles d'aide |
| **Agent TI** | Helpdesk L1/L2 | Inbox équipe, assignation, changement statut, commentaires, catégories |
| **Superviseur / gestion** | Direction, RH, pharmacie | Demandes spéciales TI, rapports, tableaux de bord |
| **Administrateur TI** | Config système | Schémas formulaires, catalogue portail, SLA, utilisateurs |

**Authentification :** Microsoft Entra ID (SSO). Pas de mot de passe local en production.

---

## 3. Exigences fonctionnelles

### 3.1 Portail d'accueil

| ID | Exigence | Priorité |
|----|----------|----------|
| P-01 | Page d'accueil avec hero, recherche, accès rapide | Must |
| P-02 | Onglets **Incidents** / **Services TI** | Must |
| P-03 | Cartes portail par catégorie (AVD, Kroll, Imprimante, etc.) | Must |
| P-04 | Suggestions de recherche + articles d'aide | Should |
| P-05 | Bandeau annonces / maintenance | Could |
| P-06 | Statut des services (page statut) | Could |

### 3.2 Incidents — formulaires dynamiques

| ID | Exigence | Priorité |
|----|----------|----------|
| I-01 | Parcours **une question à la fois** selon réponses | Must |
| I-02 | Pré-remplissage par carte portail (sans re-choisir catégorie) | Must |
| I-03 | Catégories : AVD, Kroll, DSQ, Apps, Imprimante, Accès, Matériel, etc. | Must |
| I-04 | Priorité estimée selon impact (utilisateurs affectés) | Must |
| I-05 | Pièces jointes (captures, logs) | Must |
| I-06 | Récapitulatif avant envoi + confirmation ticket | Must |
| I-07 | Schémas formulaires versionnés et administrables | Should |

### 3.3 Services TI — demandes planifiées

| ID | Exigence | Priorité |
|----|----------|----------|
| S-01 | **Demande spéciale TI** (rapports, logiciels, accès, processus) | Must |
| S-02 | **Arrivée d'employé** (onboarding) | Must |
| S-03 | **Départ d'employé** (offboarding) | Must |
| S-04 | **Demande de matériel informatique** | Must |
| S-05 | Tickets type REQ (distincts des INC) | Must |
| S-06 | Assistants multi-étapes avec validation par phase | Must |

### 3.4 Gestion des tickets

| ID | Exigence | Priorité |
|----|----------|----------|
| T-01 | Création, lecture, mise à jour, recherche | Must |
| T-02 | Statuts : nouveau, en cours, en attente (utilisateur/fournisseur), résolu, fermé | Must |
| T-03 | Priorités P1 à P4 | Must |
| T-04 | Assignation à un agent / équipe | Must |
| T-05 | Fil de commentaires + historique d'activité | Must |
| T-06 | Réouverture ticket résolu | Must |
| T-07 | Vues : Mes tickets, Tous, En attente de moi | Must |
| T-08 | Filtres inbox (statut, priorité, catégorie, recherche) | Must |
| T-09 | Liaison Jira (clé + lien) | Should |
| T-10 | Notification Slack/Teams sur changement statut | Should |

### 3.5 SLA et conformité

| ID | Exigence | Priorité |
|----|----------|----------|
| L-01 | Délais première réponse par priorité | Must |
| L-02 | Délais résolution par priorité | Must |
| L-03 | Calcul % conformité SLA | Must |
| L-04 | Tickets en retard visibles (dashboard + alertes) | Must |
| L-05 | MTTFR et MTTR agrégés | Must |

### 3.6 Reporting et analytics

| ID | Exigence | Priorité |
|----|----------|----------|
| R-01 | Dashboard KPI temps réel (volume, statuts, SLA) | Must |
| R-02 | Graphiques : priorité, catégorie, département, top incidents | Must |
| R-03 | Tendance 8 semaines (créés / résolus) | Must |
| R-04 | Rapport hebdomadaire par courriel (direction + TI) | Should |
| R-05 | Export CSV/PDF | Could |

### 3.7 Base de connaissances

| ID | Exigence | Priorité |
|----|----------|----------|
| K-01 | Articles d'aide consultables depuis la recherche | Should |
| K-02 | Lien article → formulaire incident associé | Should |
| K-03 | Administration articles (CRUD) | Could |

### 3.8 Internationalisation

| ID | Exigence | Priorité |
|----|----------|----------|
| I18N-01 | Interface **français** (langue principale) | Must |
| I18N-02 | Interface **anglais** | Should |

---

## 4. Architecture technique cible

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND                                                │
│  React 18 + TypeScript + Vite                           │
│  Design System PMG (tokens, composants)                 │
│  MSAL.js (Entra ID) · TanStack Query                    │
├─────────────────────────────────────────────────────────┤
│  BACKEND                                                 │
│  Python 3.12 · FastAPI · Uvicorn                        │
│  Pydantic v2 · SQLAlchemy 2.0 · Alembic                 │
├─────────────────────────────────────────────────────────┤
│  DONNÉES                                                 │
│  PostgreSQL 16 (Docker)                                 │
│  Redis (files d'attente / cache)                        │
│  Azure Blob Storage (pièces jointes — prod)               │
├─────────────────────────────────────────────────────────┤
│  INTÉGRATIONS                                            │
│  Microsoft Entra ID · Graph API · Jira · Slack/Teams     │
├─────────────────────────────────────────────────────────┤
│  DÉPLOIEMENT                                             │
│  Docker Compose (dev) · Azure (prod)                    │
└─────────────────────────────────────────────────────────┘
```

### 4.1 Ports et services (environnement dev Docker)

| Service | URL / port |
|---------|------------|
| API FastAPI | `http://127.0.0.1:8001` |
| Swagger | `http://127.0.0.1:8001/docs` |
| PostgreSQL | `localhost:5433` |
| Prototype UI | `http://127.0.0.1:8888/ui_kits/helpdesk/` |
| Redis | interne Docker (pas exposé) |

**Démarrage :**

- Prototype UI : `start-helpdesk.bat` ou `start-helpdesk.ps1`
- Backend API : `start-api.bat` ou `start-api.ps1` (nécessite Docker Desktop)

### 4.2 API REST (principaux endpoints prévus)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/health`, `/api/health` | Santé API + BDD |
| GET/POST | `/api/tickets` | Liste / création |
| GET/PATCH | `/api/tickets/{id}` | Détail / mise à jour |
| POST | `/api/tickets/{id}/comments` | Commentaire |
| GET | `/api/portal/incidents` | Catalogue incidents |
| GET | `/api/portal/services` | Catalogue services |
| GET | `/api/forms/{portal_id}` | Schéma formulaire |
| GET | `/api/search?q=` | Recherche unifiée |
| GET | `/api/analytics/dashboard` | KPI |
| GET | `/api/analytics/weekly-report` | Rapport hebdo |
| POST | `/api/attachments` | Upload fichier |
| GET | `/api/me` | Profil utilisateur connecté |

### 4.3 Structure du dépôt

```
pmg-helpdesk/
├── docs/
│   └── CAHIER_DES_CHARGES.md
├── backend/                  # FastAPI + Alembic
│   ├── app/
│   ├── alembic/
│   └── tests/
├── ui_kits/helpdesk/         # Prototype UI (React, mock)
├── docker-compose.yml
├── start-api.ps1
└── start-helpdesk.ps1
```

---

## 5. Modèle de données (aperçu)

### 5.1 Entités principales

| Entité | Description |
|--------|-------------|
| **User** | Utilisateur (sync Entra ID) |
| **Ticket** | Incident (INC) ou demande (REQ) |
| **Comment** | Commentaire sur ticket |
| **Activity** | Événement (ouverture, changement statut, etc.) |
| **Attachment** | Pièce jointe |
| **FormSchema** | Schéma JSON formulaire dynamique |
| **PortalItem** | Carte portail (incident ou service) |
| **HelpArticle** | Article base de connaissances |
| **SlaPolicy** | Règles SLA par priorité |

### 5.2 Ticket (champs clés — Phase 0 amorcée)

```
id, ticket_type, title, category, service_id, priority, status,
reporter_id, assignee_id, department, body, form_answers (JSONB),
jira_key, created_at, first_response_at, resolved_at, closed_at
```

### 5.3 Mapping prototype → production

| Prototype (`ui_kits/helpdesk/`) | Module production |
|--------------------------------|-------------------|
| `data.jsx` | Modèles SQLAlchemy + seeds |
| `ticket-lifecycle.jsx` | `app/services/lifecycle.py` |
| `report-form-schema.jsx` | `app/services/form_engine.py` |
| `helpdesk-analytics.jsx` | `app/services/analytics.py` |
| `Home.jsx` | `GET /api/portal/*` + front React |
| `i18n.jsx` | Front (i18next ou JSON) |

---

## 6. Exigences non fonctionnelles

| Catégorie | Exigence |
|-----------|----------|
| **Performance** | Page accueil < 2 s ; API liste tickets < 500 ms (1000 tickets) |
| **Disponibilité** | 99,5 % en heures ouvrables |
| **Sécurité** | HTTPS, JWT Entra ID, RBAC, pas de secrets en code |
| **Conformité** | Données employés au Québec — hébergement et accès contrôlés |
| **Sauvegarde** | Backup PostgreSQL quotidien, rétention 30 jours |
| **Accessibilité** | WCAG 2.1 niveau AA (objectif) |
| **Navigateurs** | Chrome, Edge, Firefox (versions récentes) |
| **Logs** | Traçabilité actions TI + erreurs API |

---

## 7. Intégrations

| Système | Usage | Priorité |
|---------|-------|----------|
| **Microsoft Entra ID** | SSO, profils | Must |
| **Microsoft Graph** | Courriels notification | Should |
| **Jira** | Création/sync tickets pharmacie & TI | Should |
| **Slack / Teams** | Alertes P1/P2, canal #ithelp | Should |
| **Telus Health (Kroll)** | Escalade externe (manuelle v1) | Could |

---

## 8. Plan de livraison par phases

| Phase | Durée estimée | Livrable |
|-------|---------------|----------|
| **0 — Fondations** | 2 sem. | FastAPI + PostgreSQL Docker + modèle Ticket |
| **1 — Auth** | 2 sem. | SSO Entra ID, RBAC, `/api/me` |
| **2 — Tickets** | 4 sem. | CRUD complet, cycle de vie, recherche |
| **3 — Formulaires** | 3 sem. | Portail + 4 services + incidents dynamiques |
| **4 — Notifications** | 3 sem. | Email, Slack, Jira |
| **5 — SLA & KPI** | 3 sem. | Dashboard live, rapport hebdo |
| **6 — KB & portail** | 2 sem. | Articles, annonces, statut services |
| **7 — Admin** | 2 sem. | Config formulaires et catalogue |
| **8 — Production** | 2 sem. | Tests E2E, déploiement Azure, formation |

**Durée totale estimée :** 5 à 6 mois (1 développeur) · 3 à 4 mois (équipe 2–3 personnes)

### 8.1 Ordre de démarrage recommandé

1. Phase 0 — FastAPI + Postgres + Docker
2. Phase 1 — Auth Entra ID
3. Phase 2 — CRUD tickets
4. Phase 3 — Premier parcours bout-en-bout (Imprimante + 1 service)
5. Phase 5 — KPI (UI déjà prête)
6. Phase 4 — Notifications
7. Phases 6–8 — Enrichissement et production

---

## 9. Critères d'acceptation MVP

Le MVP est accepté lorsque :

1. Un employé se connecte via **Microsoft Entra ID**.
2. Il signale un incident **Imprimante** via le portail → ticket **INC** persisté en base.
3. Il soumet une **Demande spéciale TI** → ticket **REQ** persisté en base.
4. Un agent TI voit les tickets dans **Inbox**, change le statut, commente.
5. L'employé reçoit une **notification** (courriel) au changement de statut.
6. Le dashboard KPI affiche des **données réelles** (volume, SLA).
7. L'interface est en **français** et respecte le **design system PMG**.

---

## 10. Contraintes et hypothèses

### 10.1 Contraintes

- Budget et équipe limités au départ (approche incrémentale).
- Intégration Jira dépend des accès API internes / Telus Health.
- Données pharmacie sensibles — minimiser les informations patients dans les tickets.
- Backend choisi : **Python (FastAPI)** — pas de .NET pour l'API.

### 10.2 Hypothèses

- Docker Desktop disponible en environnement de développement.
- Tenant Microsoft Entra ID PMG accessible pour enregistrer l'application.
- PostgreSQL hébergé sur Azure en production.
- Le prototype UI sert de **référence UX** — pas de refonte majeure prévue.

---

## 11. Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Dépendance au prototype JSX (pas de build) | Retard migration front | Phase 0 : migration Vite + TypeScript |
| Ports Docker occupés en local | Blocage dev | Ports alternatifs (8001, 5433) |
| Complexité formulaires dynamiques | Bugs parcours | Schémas versionnés + tests E2E |
| Intégration Jira indisponible | Processus manuel | Lien Jira optionnel en v1 |
| Données mock encore utilisées en front | Incohérence prod | Brancher React Query sur API par phase |

---

## 12. État d'avancement (juin 2026)

| Composant | Statut |
|-----------|--------|
| Prototype UI (portail, formulaires, KPI) | Fait (données mock) |
| Design system PMG (`colors_and_type.css`) | Fait |
| Backend FastAPI Phase 0 | Amorcé |
| PostgreSQL + Docker Compose | Configuré |
| Modèle `Ticket` + migration Alembic | Fait |
| Endpoints `/health`, `/api/tickets` | Fait |
| Auth Entra ID | À faire |
| API tickets complète (CRUD, lifecycle) | À faire |
| Front branché sur API | À faire |
| Intégrations (Jira, Slack, Graph) | À faire |
| Déploiement Azure production | À faire |

---

## 13. Glossaire

| Terme | Définition |
|-------|------------|
| **INC** | Ticket incident (quelque chose est brisé) |
| **REQ** | Ticket demande de service (besoin planifié) |
| **MTTFR** | Mean Time To First Response — délai moyen première réponse |
| **MTTR** | Mean Time To Resolution — délai moyen de résolution |
| **SLA** | Service Level Agreement — objectifs de délai par priorité |
| **AVD** | Azure Virtual Desktop |
| **DSQ** | Dossier Santé Québec |
| **Kroll** | Système pharmacie Telus Health |
| **Portail** | Page d'accueil avec cartes incidents et services |

---

*Document maintenu dans `docs/CAHIER_DES_CHARGES.md`. Mettre à jour la version et la section 12 à chaque jalon majeur.*
