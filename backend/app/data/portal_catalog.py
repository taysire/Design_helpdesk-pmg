"""Catalogue portail — source de vérité backend (Phase 3)."""

PORTAL_INCIDENT_ITEMS = [
    {"id": "avd", "icon": "monitor", "ticket_category": "avd", "portal_flow": "avd"},
    {"id": "kroll", "icon": "pill", "ticket_category": "kroll", "prefill_problem_area": "Kroll"},
    {"id": "dsq", "icon": "box", "ticket_category": "apps", "prefill_problem_area": "DSQ"},
    {"id": "parcours-crm", "icon": "users", "ticket_category": "apps", "prefill_problem_area": "Parcours CRM"},
    {"id": "biometrx", "icon": "box", "ticket_category": "apps", "prefill_problem_area": "BioMetrx"},
    {"id": "excel", "icon": "file-text", "ticket_category": "apps", "prefill_problem_area": "Excel"},
    {"id": "powerbi", "icon": "clipboard", "ticket_category": "apps", "prefill_problem_area": "Power BI"},
    {"id": "imprimante", "icon": "printer", "ticket_category": "hardware", "prefill_problem_area": "Imprimante"},
    {"id": "ringcentral", "icon": "phone", "ticket_category": "hardware", "prefill_problem_area": "RingCentral"},
    {"id": "audio", "icon": "headphones", "ticket_category": "hardware", "prefill_problem_area": "Audio / Casque"},
    {"id": "access", "icon": "key", "ticket_category": "access", "portal_flow": "access"},
    {"id": "materials", "icon": "package", "ticket_category": "materials", "portal_flow": "materials"},
    {"id": "autre-app", "icon": "help", "ticket_category": "apps", "prefill_problem_area": "Autre"},
]

PORTAL_INCIDENT_GROUPS = [
    {"id": "virtual", "item_ids": ["avd"]},
    {"id": "pharmacy", "item_ids": ["kroll", "dsq"]},
    {"id": "applications", "item_ids": ["parcours-crm", "biometrx", "excel", "powerbi", "autre-app"]},
    {"id": "equipment", "item_ids": ["imprimante", "ringcentral", "audio"]},
    {"id": "access", "item_ids": ["access", "materials"]},
]

SERVICE_CATALOG = [
    {"id": "special-it", "icon": "clipboard", "request_type": "service", "ticket_category": "service"},
    {"id": "employee-arrival", "icon": "user-plus", "request_type": "onboarding", "ticket_category": "onboard"},
    {"id": "employee-departure", "icon": "user-minus", "request_type": "offboarding", "ticket_category": "offboard"},
    {"id": "it-equipment", "icon": "package", "request_type": "equipment", "ticket_category": "service"},
]

INCIDENT_FORM_TYPES = {
    "avd": "dynamic_incident",
    "access": "dynamic_incident",
    "materials": "dynamic_incident",
}

SERVICE_FORM_TYPES = {
    "special-it": "service_wizard",
    "employee-arrival": "onboarding_wizard",
    "employee-departure": "offboarding_wizard",
    "it-equipment": "equipment_wizard",
}

SERVICE_ID_PREFIX = {
    "special-it": "REQ",
    "employee-arrival": "ONB",
    "employee-departure": "OFF",
    "it-equipment": "EQP",
}


def get_incident_item(portal_id: str) -> dict | None:
    return next((i for i in PORTAL_INCIDENT_ITEMS if i["id"] == portal_id), None)


def get_service_item(service_id: str) -> dict | None:
    return next((s for s in SERVICE_CATALOG if s["id"] == service_id), None)


def get_form_schema(portal_id: str) -> dict | None:
    incident = get_incident_item(portal_id)
    if incident:
        return {
            "portal_id": portal_id,
            "form_type": INCIDENT_FORM_TYPES.get(portal_id, "dynamic_incident"),
            "ticket_type": "incident",
            "ticket_category": incident["ticket_category"],
            "portal_flow": incident.get("portal_flow"),
            "prefill_problem_area": incident.get("prefill_problem_area"),
            "route": f"new:{portal_id}",
        }

    service = get_service_item(portal_id)
    if service:
        return {
            "portal_id": portal_id,
            "form_type": SERVICE_FORM_TYPES[portal_id],
            "ticket_type": "service",
            "ticket_category": service["ticket_category"],
            "service_id": portal_id,
            "request_type": service["request_type"],
            "route": f"service:{portal_id}",
        }

    return None
