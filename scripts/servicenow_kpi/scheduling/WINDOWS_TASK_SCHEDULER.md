# Planification Task Scheduler — instructions
#
# ═══════════════════════════════════════════════════════════════════════════════
# OPTION A — Interface graphique
# ═══════════════════════════════════════════════════════════════════════════════
#
# 1. Ouvrir « Planificateur de tâches » (taskschd.msc)
# 2. Créer une tâche de base
# 3. Nom : PMG Helpdesk — Rapport KPI ServiceNow
# 4. Declencheur : Hebdomadaire, Lundi, 09:00
# 5. Action : powershell.exe -File scheduling/run_monday.ps1
# 5. Action : Démarrer un programme
#    Programme : powershell.exe
#    Arguments : -ExecutionPolicy Bypass -File "C:\chemin\scripts\servicenow_kpi\scheduling\run_friday.ps1"
#    Démarrer dans : C:\chemin\scripts\servicenow_kpi
# 6. Cocher « Exécuter même si l'utilisateur n'est pas connecté »
# 7. Compte : service account avec accès réseau
#
# ═══════════════════════════════════════════════════════════════════════════════
# OPTION B — PowerShell (admin)
# ═══════════════════════════════════════════════════════════════════════════════
#
# Adapter $KpiPath ci-dessous, puis exécuter en administrateur :
#
# $KpiPath = "C:\Users\cmbaye\Documents\New folder\PMG Helpdesk Design System\scripts\servicenow_kpi"
# $Action = New-ScheduledTaskAction `
#   -Execute "powershell.exe" `
#   -Argument "-ExecutionPolicy Bypass -File `"$KpiPath\scheduling\run_monday.ps1`"" `
#   -WorkingDirectory $KpiPath
# $Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 09:00
# $Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
# Register-ScheduledTask `
#   -TaskName "PMG-KPI-ServiceNow-Weekly" `
#   -Action $Action -Trigger $Trigger -Settings $Settings `
#   -Description "Rapport KPI ServiceNow bi-hebdomadaire + email"
#
# ═══════════════════════════════════════════════════════════════════════════════
# Logs
# ═══════════════════════════════════════════════════════════════════════════════
#
# Fichiers : scripts/servicenow_kpi/logs/weekly-kpi-YYYY-MM-DD.log
#
# En cas d'échec, le script retourne le code 1 et n'envoie PAS l'email.
