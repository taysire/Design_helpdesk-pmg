# ServiceNow Weekly KPI Reporting

Génère un rapport HTML hebdomadaire avec KPIs, graphiques matplotlib et recommandations management.

## Pipeline automatisé (production)

```
Microsoft Lists / SharePoint
        ↓  Microsoft Graph API
        ↓  Script KPI (run_weekly.py)
        ↓  Email automatique (Graph sendMail)
```

### 1. Inscription Azure AD

Créer une **App registration** dans le portail Azure :

| Permission (Application) | Usage |
|--------------------------|-------|
| `Sites.Read.All` | Lire la liste SharePoint |
| `Mail.Send` | Envoyer le rapport par email |

Accorder le **consentement administrateur**, puis créer un **client secret**.

### 2. Configuration

```powershell
cd scripts/servicenow_kpi
pip install -r requirements.txt
copy .env.example .env
# Éditer .env avec tenant, client, site SharePoint, destinataires
```

### 3. Lancer le pipeline

```powershell
python run_weekly.py
```

Le script :
1. Lit les tickets depuis la Microsoft List via Graph
2. Calcule les KPIs et génère le HTML dans `reports/weekly/`
3. Envoie l'email via `POST /users/{sender}/sendMail`

### 4. Planification (Task Scheduler)

- **Programme** : chaque lundi 08:00
- **Action** : `python.exe` avec argument `run_weekly.py`
- **Répertoire** : `scripts/servicenow_kpi`
- **Variables** : charger via fichier `.env` (python-dotenv)

---

## Mode développement (CSV local)

```powershell
python generate_report.py --csv Tickets.csv
```

Avec envoi email :

```powershell
python generate_report.py --csv Tickets.csv --email --email-to manager@example.com
```

## Options CLI

| Option | Description |
|--------|-------------|
| `--source csv\|graph\|api` | Source de données |
| `--csv` | Export CSV local |
| `--output` | Dossier de sortie (`reports/weekly/`) |
| `--date YYYY-MM-DD` | Semaine de référence |
| `--email` | Envoyer le rapport après génération |
| `--email-to` | Destinataires (virgules) |

## Colonnes attendues (List / CSV)

`Requérant`, `Catégorie de Ticket`, `Date du signalement`, `Titre`, `Description du problème`, `Priorité`, `Attribuée à`, `Statut`, `Commentaire`, `Source du problème`, `Created`, `Superviseur`

La source Graph résout automatiquement les noms internes SharePoint via les **display names** des colonnes.

## Architecture

```
run_weekly.py               # Pipeline automatisé (Graph → KPI → Email)
generate_report.py          # CLI manuel (CSV / Graph / API)
├── graph_client.py         # Auth MSAL + requêtes Graph
├── data_sources/
│   ├── base.py             # TicketDataSource (interface)
│   ├── csv_source.py       # Export CSV
│   ├── sharepoint_list.py  # Microsoft Lists via Graph
│   └── servicenow_api.py   # Stub ServiceNow REST
├── kpi_calculator.py
├── charts.py
├── recommendations.py
├── report_builder.py
└── email_sender.py         # Graph sendMail + SMTP fallback
```

## Variables d'environnement

Voir `.env.example` pour la liste complète.

**Graph (recommandé)** : `AZURE_*`, `GRAPH_SITE_*`, `GRAPH_LIST_NAME`, `GRAPH_SENDER_UPN`, `GRAPH_EMAIL_TO`

**SMTP (fallback)** : `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_TO`
