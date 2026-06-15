"""Base de connaissances et portail — contenu seed (Phase 6)."""

HELP_ARTICLES = [
    {
        "id": "printer-offline",
        "icon": "printer",
        "portal_id": "imprimante",
        "popular": True,
        "content": {
            "fr": {
                "title": "Imprimante hors ligne — que faire",
                "excerpt": "Vérifiez l'alimentation, le réseau et la file d'impression avant d'ouvrir un ticket.",
                "keywords": "imprimante offline hors ligne print file kroll",
                "body": "1. Confirmez que l'imprimante est allumée et affiche Prête sur le panneau.\n2. Redémarrez le spouleur d'impression ou déconnectez-vous de Windows.\n3. Essayez une page test depuis les paramètres Windows.\n4. Si le problème touche l'impression Kroll, indiquez le poste et l'étage dans votre ticket.",
            },
            "en": {
                "title": "Printer offline — what to do",
                "excerpt": "Check power, network, and the print queue before opening a ticket.",
                "keywords": "printer imprimante offline hors ligne print queue file",
                "body": "1. Confirm the printer is on and shows Ready on its panel.\n2. Restart the print spooler or sign out and back into Windows.\n3. Try printing a test page from Windows Settings.\n4. If the issue affects Kroll printing, note the workstation and floor in your ticket.",
            },
        },
    },
    {
        "id": "password-reset",
        "icon": "key",
        "portal_id": "access",
        "popular": True,
        "content": {
            "fr": {
                "title": "Réinitialiser votre mot de passe Windows",
                "excerpt": "Options libre-service et helpdesk pour comptes verrouillés ou expirés.",
                "keywords": "mot de passe password windows connexion reset",
                "body": "Utilisez le portail libre-service si vous êtes sur le VPN ou sur site.\nSi vous êtes bloqué, contactez le helpdesk avec votre ID employé et département.\nNe partagez jamais votre mot de passe par courriel ou clavardage.",
            },
            "en": {
                "title": "Reset your Windows password",
                "excerpt": "Self-service and helpdesk options for locked or expired passwords.",
                "keywords": "password mot de passe windows login connexion reset",
                "body": "Use the company self-service portal if you are on VPN or on-site.\nIf you are locked out, contact the helpdesk with your employee ID and department.\nNever share your password by email or chat.",
            },
        },
    },
    {
        "id": "avd-home",
        "icon": "monitor",
        "portal_id": "avd",
        "popular": True,
        "content": {
            "fr": {
                "title": "Se connecter à l'AVD depuis la maison",
                "excerpt": "Client Bureau à distance, MFA et erreurs de connexion courantes.",
                "keywords": "avd remote bureau virtuel maison rdp mfa",
                "body": "Installez Microsoft Remote Desktop depuis le catalogue logiciel.\nOuvrez le flux AVD publié et connectez-vous avec MFA.\nSi la session se fige, déconnectez-vous et reconnectez-vous avant d'ouvrir un ticket.",
            },
            "en": {
                "title": "Connect to AVD from home",
                "excerpt": "Remote Desktop client, MFA, and common connection errors.",
                "keywords": "avd remote bureau virtuel home maison rdp mfa",
                "body": "Install Microsoft Remote Desktop from the company software catalog.\nOpen the published AVD feed URL and sign in with MFA.\nIf the session freezes, disconnect and reconnect before opening a ticket.",
            },
        },
    },
    {
        "id": "kroll-slow",
        "icon": "pill",
        "portal_id": "kroll",
        "popular": False,
        "content": {
            "fr": {
                "title": "Kroll est lent ou gelé",
                "excerpt": "Premières vérifications avant d'escalader au support pharmacie.",
                "keywords": "kroll slow lent frozen gelé pharmacy pharmacie",
                "body": "Fermez les autres applications lourdes sur le poste.\nVidez le cache du navigateur si vous utilisez le client web.\nIndiquez si le problème touche un utilisateur ou tout l'étage — cela définit la priorité.",
            },
            "en": {
                "title": "Kroll is slow or frozen",
                "excerpt": "First checks before escalating to pharmacy systems support.",
                "keywords": "kroll slow lent frozen gelé pharmacy pharmacie",
                "body": "Close other heavy applications on the workstation.\nClear browser cache if using the web client.\nNote whether the issue affects one user or the whole floor — this sets priority.",
            },
        },
    },
    {
        "id": "access-request",
        "icon": "key",
        "portal_id": "access",
        "popular": False,
        "content": {
            "fr": {
                "title": "Demander un accès applicatif",
                "excerpt": "SharePoint, lecteurs réseau, listes de distribution et apps tierces.",
                "keywords": "accès access sharepoint email liste distribution permission",
                "body": "Utilisez le formulaire Accès du portail de services.\nIncluez le nom de l'application, la justification métier et votre gestionnaire.\nL'accès est accordé après approbation — prévoir 1 à 2 jours ouvrables.",
            },
            "en": {
                "title": "Request application access",
                "excerpt": "SharePoint, drives, distribution lists, and third-party apps.",
                "keywords": "access accès sharepoint email liste distribution permission",
                "body": "Use the Access request form from the service portal.\nInclude the application name, business justification, and your manager.\nAccess is provisioned after approval — allow 1–2 business days.",
            },
        },
    },
    {
        "id": "ringcentral-setup",
        "icon": "phone",
        "portal_id": "ringcentral",
        "popular": False,
        "content": {
            "fr": {
                "title": "Configurer RingCentral",
                "excerpt": "Casque, périphériques audio et première connexion.",
                "keywords": "ringcentral phone téléphone softphone audio casque",
                "body": "Installez RingCentral depuis le catalogue et connectez-vous avec SSO.\nDéfinissez le micro et haut-parleur par défaut dans les paramètres.\nTestez avec un collègue avant les appels patients.",
            },
            "en": {
                "title": "Set up RingCentral softphone",
                "excerpt": "Headset, audio devices, and first-time login.",
                "keywords": "ringcentral phone téléphone softphone audio casque",
                "body": "Install RingCentral from the software catalog and sign in with SSO.\nSet your default microphone and speaker in RingCentral settings.\nTest with a colleague before patient-facing calls.",
            },
        },
    },
]

PORTAL_ANNOUNCEMENTS = [
    {
        "id": "maint-avd",
        "severity": "info",
        "active": True,
        "sort_order": 1,
        "content": {
            "fr": {
                "title": "Maintenance AVD planifiée",
                "body": "Fenêtre de maintenance samedi 22 h – dimanche 2 h. Déconnexions possibles.",
            },
            "en": {
                "title": "Scheduled AVD maintenance",
                "body": "Maintenance window Saturday 10 PM – Sunday 2 AM. Brief disconnects possible.",
            },
        },
    },
    {
        "id": "kroll-patch",
        "severity": "warning",
        "active": True,
        "sort_order": 2,
        "content": {
            "fr": {
                "title": "Correctif Kroll en déploiement",
                "body": "L'équipe pharmacie déploie un correctif cette semaine. Signalez tout comportement inhabituel.",
            },
            "en": {
                "title": "Kroll patch rolling out",
                "body": "Pharmacy systems is deploying a patch this week. Report any unusual behaviour.",
            },
        },
    },
]

SERVICE_STATUS_ITEMS = [
    {
        "id": "kroll",
        "icon": "pill",
        "status": "degraded",
        "content": {
            "fr": {"label": "Kroll", "message": "Lenteurs signalées — équipe en investigation"},
            "en": {"label": "Kroll", "message": "Slowness reported — team investigating"},
        },
    },
    {
        "id": "avd",
        "icon": "monitor",
        "status": "operational",
        "content": {
            "fr": {"label": "AVD", "message": "Opérationnel"},
            "en": {"label": "AVD", "message": "Operational"},
        },
    },
    {
        "id": "email",
        "icon": "mail",
        "status": "operational",
        "content": {
            "fr": {"label": "Courriel", "message": "Opérationnel"},
            "en": {"label": "Email", "message": "Operational"},
        },
    },
    {
        "id": "vpn",
        "icon": "shield",
        "status": "operational",
        "content": {
            "fr": {"label": "VPN", "message": "Opérationnel"},
            "en": {"label": "VPN", "message": "Operational"},
        },
    },
]


def localize_article(article: dict, lang: str) -> dict:
    loc = article["content"].get(lang) or article["content"]["en"]
    return {
        "id": article["id"],
        "icon": article["icon"],
        "portal_id": article.get("portal_id"),
        "popular": article.get("popular", False),
        "title": loc["title"],
        "excerpt": loc["excerpt"],
        "body": loc["body"],
        "keywords": loc.get("keywords", ""),
    }


def localize_announcement(item: dict, lang: str) -> dict:
    loc = item["content"].get(lang) or item["content"]["en"]
    return {
        "id": item["id"],
        "severity": item["severity"],
        "title": loc["title"],
        "body": loc["body"],
    }


def localize_service_status(item: dict, lang: str) -> dict:
    loc = item["content"].get(lang) or item["content"]["en"]
    return {
        "id": item["id"],
        "icon": item["icon"],
        "status": item["status"],
        "label": loc["label"],
        "message": loc["message"],
    }
