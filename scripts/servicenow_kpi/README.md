# ServiceNow Weekly KPI Reporting

Génère un rapport HTML bi-hebdomadaire avec KPIs, graphiques et envoi email automatique.

## Pipeline automatisé (production — chaque lundi 9h)

```
ServiceNow REST API (sys_created_on, pagination)
        ↓
Exclusion weekends (samedi/dimanche)
        ↓
Contrôle qualité (totaux journaliers lun-ven)
        ↓
Rapport KPI HTML (applications / équipements séparés)
        ↓
Email automatique (Microsoft Graph sendMail)
```

### 1. Installation

```powershell
cd scripts/servicenow_kpi
pip install -r requirements.txt
copy .env.example .env
# Éditer .env : SNOW_*, MS_*, EMAIL
```

### 2. Lancer manuellement

```powershell
# Production (API ServiceNow + email)
python run_automated.py

# Test sans email
python run_automated.py --dry-run

# Test local avec CSV
python run_automated.py --source csv --csv Tickets_5.csv --from-date 2026-06-01 --to-date 2026-06-14 --dry-run
```

### 3. Planification

| Plateforme | Fichier |
|------------|---------|
| **Windows Task Scheduler** | `scheduling/run_monday.ps1` + `scheduling/WINDOWS_TASK_SCHEDULER.md` |
| **Linux cron** | `scheduling/cron.example` |
| **GitHub Actions** | `.github/workflows/weekly-kpi-report.yml` |

**Windows (lundi 09:00)** :

```powershell
powershell -ExecutionPolicy Bypass -File scheduling/run_monday.ps1
```

**Cron** :

```cron
0 9 * * 1 cd /chemin/servicenow_kpi && python3 run_automated.py >> logs/cron.log 2>&1
```

### 4. Période analysée (automatique)

Chaque **lundi**, le script analyse les **2 semaines ISO complètes** se terminant le dimanche précédant la semaine courante. Les tickets créés **samedi et dimanche sont exclus** du rapport.

Override via `.env` : `SNOW_PERIOD_START`, `SNOW_PERIOD_END`

### 5. Logs

- Console + fichier : `logs/weekly-kpi-YYYY-MM-DD.log`
- Contenu : période, requête ServiceNow, total tickets, pages, tickets/jour

### 6. Contrôle qualité

Le rapport **n'est pas envoyé** si :
- somme journalière ≠ total
- pagination ServiceNow incomplète
- écart avec `--expected-daily` JSON

---

## Mode développement (CLI manuel)

```powershell
python generate_report.py --csv Tickets_5.csv --from-date 2026-06-01 --to-date 2026-06-14 --volume-only --email
```

## Variables d'environnement

Voir `.env.example` :

| Variable | Description |
|----------|-------------|
| `SNOW_INSTANCE` | Instance ServiceNow |
| `SNOW_USER` / `SNOW_PASSWORD` | Credentials API |
| `SNOW_TABLE` | Table (défaut `incident`) |
| `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET` | Azure Graph |
| `GRAPH_SENDER_UPN`, `EMAIL` | Email automatique |
| `EMAIL_SUBJECT` | Sujet (défaut : Rapport hebdomadaire KPI — PMG Helpdesk) |

## Architecture

```
run_automated.py            # Pipeline vendredi (API → QA → rapport → email)
generate_report.py          # CLI manuel
period_utils.py             # Calcul période bi-hebdomadaire
logging_setup.py            # Journaux fichier + console
data_quality.py             # Validation avant envoi
ticket_classifier.py        # Applications vs équipements
data_sources/servicenow_api.py  # API + pagination sys_created_on
```
