// Fake data — in-memory only

/** Catégories d'incidents — sidebar + filtres inbox (TI) */
const CATEGORIES = [
  { id: 'hardware',  label: 'Hardware',         icon: 'printer',  hint: 'Printers, computers, scanners' },
  { id: 'avd',       label: 'AVD',              icon: 'monitor',  hint: 'Azure Virtual Desktop' },
  { id: 'kroll',     label: 'KROLL',            icon: 'pill',     hint: 'Telus Health pharmacy system' },
  { id: 'apps',      label: 'In-house apps',    icon: 'box',      hint: 'Internal tools and dashboards' },
  { id: 'access',    label: 'Access',           icon: 'key',      hint: 'Apps, drives, distribution lists' },
  { id: 'materials', label: 'Materials',        icon: 'package',  hint: 'Equipment, supplies' },
];

/**
 * Cartes portail « Support et incidents » — une carte = un parcours direct (sans re-choisir la catégorie).
 * Ordre = ordre d'affichage et séquence des questions du formulaire.
 */
const PORTAL_INCIDENT_ITEMS = [
  { id: 'avd',           icon: 'monitor',    ticketCategory: 'avd',       portalFlow: 'avd' },
  { id: 'kroll',         icon: 'pill',       ticketCategory: 'kroll',     prefillProblemArea: 'Kroll' },
  { id: 'dsq',           icon: 'box',        ticketCategory: 'apps',      prefillProblemArea: 'DSQ' },
  { id: 'parcours-crm',  icon: 'users',      ticketCategory: 'apps',      prefillProblemArea: 'Parcours CRM' },
  { id: 'biometrx',      icon: 'box',        ticketCategory: 'apps',      prefillProblemArea: 'BioMetrx' },
  { id: 'excel',         icon: 'file-text',  ticketCategory: 'apps',      prefillProblemArea: 'Excel' },
  { id: 'powerbi',       icon: 'clipboard',  ticketCategory: 'apps',      prefillProblemArea: 'Power BI' },
  { id: 'imprimante',    icon: 'printer',    ticketCategory: 'hardware',  prefillProblemArea: 'Imprimante' },
  { id: 'ringcentral',   icon: 'phone',      ticketCategory: 'hardware',  prefillProblemArea: 'RingCentral' },
  { id: 'audio',         icon: 'headphones', ticketCategory: 'hardware',  prefillProblemArea: 'Audio / Casque' },
  { id: 'access',        icon: 'key',        ticketCategory: 'access',    portalFlow: 'access' },
  { id: 'materials',     icon: 'package',    ticketCategory: 'materials', portalFlow: 'materials' },
  { id: 'autre-app',     icon: 'help',       ticketCategory: 'apps',      prefillProblemArea: 'Autre' },
];

/** Regroupement visuel des cartes portail (accueil). */
const PORTAL_INCIDENT_GROUPS = [
  { id: 'virtual',       itemIds: ['avd'] },
  { id: 'pharmacy',      itemIds: ['kroll', 'dsq'] },
  { id: 'applications',  itemIds: ['parcours-crm', 'biometrx', 'excel', 'powerbi', 'autre-app'] },
  { id: 'equipment',     itemIds: ['imprimante', 'ringcentral', 'audio'] },
  { id: 'access',        itemIds: ['access', 'materials'] },
];

/** Processus TI (IT uniquement — pas dans le portail employé) */
const IT_PROCESS_CATEGORIES = [
  { id: 'onboard',   label: 'Onboarding',       icon: 'user-plus', hint: 'New starter setup' },
  { id: 'offboard',  label: 'Offboarding',      icon: 'user-minus',hint: 'Leaver checklist' },
];

/** Catalogue de services — demandes, pas incidents */
const SERVICE_CATALOG = [
  {
    id: 'special-it',
    icon: 'clipboard',
    hint: 'Reports, BI, supply chain — for supervisors and management',
  },
  {
    id: 'employee-arrival',
    icon: 'user-plus',
    hint: 'New employee arrival — access, equipment, and onboarding',
  },
  {
    id: 'employee-departure',
    icon: 'user-minus',
    hint: 'Employee departure — revoke access, recover equipment, deactivate accounts',
  },
  {
    id: 'it-equipment',
    icon: 'package',
    hint: 'Laptops, peripherals, replacements, loans, and upgrades',
  },
];

const PEOPLE = [
  { id: 'mt', name: 'Mara Tremblay',     team: 'Pharmacy systems', color: 'linear-gradient(135deg,#16A37E,#0F8B66)', init: 'MT' },
  { id: 'al', name: 'Alex Larose',       team: 'Infra',            color: 'linear-gradient(135deg,#2563EB,#1D4ED8)', init: 'AL' },
  { id: 'pr', name: 'Priya Rao',         team: 'Facilities',       color: 'linear-gradient(135deg,#D97706,#92400E)', init: 'PR' },
  { id: 'jd', name: 'Jordan Dubois',     team: 'Helpdesk L1',      color: 'linear-gradient(135deg,#9333EA,#6B21A8)', init: 'JD' },
  { id: 'sc', name: 'Sam Côté',          team: 'Helpdesk L1',      color: 'linear-gradient(135deg,#0891B2,#0E7490)', init: 'SC' },
  { id: 'me', name: 'You',               team: 'Helpdesk L1',      color: 'linear-gradient(135deg,#16A37E,#0F8B66)', init: 'YO' },
];

function daysAgo(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const TICKETS = [
  {
    id: 'INC-2041', title: 'KROLL unresponsive on the pharmacy floor',
    category: 'kroll', priority: 'P1', status: 'inprog',
    reporter: 'pr', assignee: 'mt',
    department: 'Pharmacien',
    createdAt: daysAgo(0, 9), firstResponseAt: daysAgo(0, 9),
    opened: '14 min ago', updated: '2 min ago',
    body: "Pharmacists on the dispensing floor can't log in to KROLL. Called at 9:42 ET. Team is switching to paper. Vendor (Telus Health) has been pinged.",
    jira: 'PHARM-3127', slack: '#ithelp-pharmacy',
    activity: [
      { who:'pr', kind:'opened', text:'Opened the ticket', at:'9:44 AM' },
      { who:'jd', kind:'triaged', text:'Triaged → P1, routing to Mara', at:'9:46 AM' },
      { who:'mt', kind:'comment', text:"On it. I've got Telus on the phone. Try clearing cache + restart — instructions in #ithelp-pharmacy.", at:'9:51 AM' },
      { who:'mt', kind:'linked', text:'Linked Jira PHARM-3127', at:'9:53 AM' },
    ],
  },
  {
    id: 'INC-2039', title: 'Printer offline — 3rd floor copier',
    category: 'hardware', priority: 'P3', status: 'waiting_vendor',
    reporter: 'me', assignee: 'pr',
    department: 'Administration',
    createdAt: daysAgo(0, 7), firstResponseAt: daysAgo(0, 8),
    formAnswers: { users_affected: 'Juste moi', problem_area: 'Imprimante', printer_problem: 'Connexion avec Kroll', department: 'Administration' },
    opened: '2 hours ago', updated: '47 min ago',
    body: "The big Konica on 3 is showing 'offline' on Windows but the panel says it's ready. Already power-cycled.",
    jira: null, slack: '#ithelp',
    activity: [
      { who:'me', kind:'opened', text:'Opened the ticket', at:'12:08 PM' },
      { who:'pr', kind:'comment', text:'Looks like the print server lost it. Can you try printing again in ~5 min?', at:'1:21 PM' },
    ],
  },
  {
    id: 'REQ-0817', title: 'Access to the SharePoint /finance folder',
    category: 'access', priority: 'P4', status: 'waiting_info',
    reporter: 'me', assignee: 'jd',
    department: 'Comptabilité',
    createdAt: daysAgo(1, 14), firstResponseAt: daysAgo(0, 11),
    formAnswers: { users_affected: 'Juste moi', access_issue: 'SharePoint / lecteur réseau', department: 'Comptabilité' },
    opened: 'yesterday', updated: '3 hours ago',
    body: 'For the Q2 close I need read access to /finance/closings.',
    jira: null, slack: null,
    activity: [
      { who:'me', kind:'opened', text:'Opened the ticket', at:'Yesterday 4:30 PM' },
      { who:'jd', kind:'triaged', text:'Approved by manager → granting now', at:'Today 11:10 AM' },
    ],
  },
  {
    id: 'ONB-0042', title: 'Onboard new pharmacist — Léa Bouchard',
    category: 'onboard', priority: 'P3', status: 'new',
    reporter: 'pr', assignee: null,
    opened: '3 hours ago', updated: '3 hours ago',
    body: 'Starts Mon May 25. Needs: AVD session, KROLL account, badge, laptop. Manager: Priya R.',
    jira: null, slack: null,
    activity: [
      { who:'pr', kind:'opened', text:'Opened the ticket', at:'11:02 AM' },
    ],
  },
  {
    id: 'INC-2037', title: 'AVD session disconnects every ~20 min',
    category: 'avd', priority: 'P2', status: 'inprog',
    reporter: 'sc', assignee: 'al',
    department: 'Clinique et Domicile',
    createdAt: daysAgo(1, 15), firstResponseAt: daysAgo(1, 15),
    formAnswers: { users_affected: 'Mon équipe', avd_issue: 'Déconnexion fréquente', department: 'Clinique et Domicile' },
    opened: 'yesterday', updated: '4 hours ago',
    body: "Multiple users in the HQ office are getting kicked from AVD. Pattern: ~20 min idle then disconnect. Started yesterday afternoon.",
    jira: 'INFRA-882', slack: '#ithelp-infra',
    activity: [
      { who:'sc', kind:'opened', text:'Opened the ticket', at:'Yesterday 3:14 PM' },
      { who:'al', kind:'triaged', text:'Triaged → P2, looking at session host config', at:'Yesterday 3:30 PM' },
      { who:'al', kind:'linked', text:'Linked Jira INFRA-882', at:'Yesterday 3:32 PM' },
      { who:'al', kind:'comment', text:"Found it — idle timeout was set to 20 min on the host pool. Rolling out fix.", at:'9:10 AM' },
    ],
  },
  {
    id: 'REQ-0815', title: 'Spare scanner for the warehouse',
    category: 'materials', priority: 'P4', status: 'resolved',
    reporter: 'me', assignee: 'pr',
    resolvedAt: daysAgo(1, 17), createdAt: daysAgo(2, 9), firstResponseAt: daysAgo(2, 10),
    department: 'Shipping',
    formAnswers: { users_affected: 'Juste moi', materials_request: 'Équipement / mobilier', department: 'Shipping' },
    opened: '2 days ago', updated: 'yesterday',
    body: 'Warehouse needs a spare barcode scanner. Theirs cracked.',
    jira: null, slack: null,
    activity: [
      { who:'pr', kind:'opened', text:'Opened the ticket', at:'2 days ago' },
      { who:'pr', kind:'resolved', text:'Shipped from depot. Tracking emailed.', at:'Yesterday 5:20 PM' },
    ],
  },
  {
    id: 'EQP-0842', title: 'Demande de matériel informatique — Remplacement d\'équipement',
    category: 'service', serviceId: 'it-equipment', requestType: 'equipment', priority: 'P4', status: 'resolved',
    resolvedAt: new Date().toISOString(),
    reporter: 'me', assignee: null,
    opened: '2 hours ago', updated: '2 hours ago',
    body: '',
    formAnswers: {
      _equipmentWizard: true,
      requesterName: 'Marie Gagnon',
      department: 'Clinique et Domicile',
      requestType: 'replacement',
      equipmentItems: ['laptop', 'mouse', 'headset'],
      requestReason: 'Ordinateur portable ne démarre plus après une mise à jour Windows.',
      workImpact: 'Impossible de consulter les dossiers patients à domicile cette semaine.',
      additionalInfo: 'De préférence livraison au 450 rue Principale, bureau 12.',
      attachments: [{ name: 'photo-ecran-erreur.jpg', size: '240 Ko', type: 'image/jpeg' }],
    },
    jira: null, slack: null,
    activity: [{ who: 'me', kind: 'opened', text: 'Demande de matériel informatique', at: '2 hours ago' }],
  },
  {
    id: 'OFF-0011', title: 'Offboard — Tomás Rivera (last day Fri)',
    category: 'offboard', priority: 'P3', status: 'new',
    reporter: 'jd', assignee: null,
    opened: '4 hours ago', updated: '4 hours ago',
    body: 'Last day Fri May 23. Disable AVD + KROLL + email at EOD. Collect laptop and badge.',
    jira: null, slack: null,
    activity: [{ who:'jd', kind:'opened', text:'Opened the ticket', at:'10:00 AM' }],
  },
  {
    id: 'OFF-0093', title: 'Demande de départ d\'employé — Sophie Martin',
    category: 'offboard', serviceId: 'employee-departure', requestType: 'offboarding', priority: 'P3', status: 'new',
    reporter: 'pr', assignee: null,
    opened: '1 hour ago', updated: '1 hour ago',
    body: '',
    formAnswers: {
      _offboardingWizard: true,
      employeeName: 'Sophie Martin',
      jobTitle: 'Technicienne en pharmacie',
      department: 'Clinique et Domicile',
      manager: 'Priya Rao',
      departureDate: '2026-06-20',
      departureType: 'voluntary',
      accessToRemove: ['kroll', 'email', 'sharepoint', 'vpn'],
      equipmentToRecover: ['laptop', 'headset', 'access_card'],
      comments: 'Dernier jour confirmé avec la gestionnaire.',
      specialInstructions: 'Récupérer le laptop au comptoir de la pharmacie avant 16 h.',
      importantInfo: 'Transférer les dossiers actifs à Marc L. avant fermeture des accès.',
      attachments: [{ name: 'liste-acces.pdf', size: '88 Ko', type: 'application/pdf' }],
    },
    jira: null, slack: null,
    activity: [{ who: 'pr', kind: 'opened', text: 'Demande de départ d\'employé', at: '1 hour ago' }],
  },
  // Historique démo — analytics (12 semaines)
  { id: 'INC-2028', title: 'DSQ — session expirée fréquemment', category: 'apps', priority: 'P2', status: 'closed',
    reporter: 'sc', assignee: 'mt', department: 'Clinique et Domicile',
    createdAt: daysAgo(3, 10), firstResponseAt: daysAgo(3, 10), resolvedAt: daysAgo(2, 16), closedAt: daysAgo(2, 17),
    formAnswers: { users_affected: 'Mon équipe', problem_area: 'DSQ', dsq_error: 'Session expirée ou déconnexion fréquente', department: 'Clinique et Domicile' },
    opened: '3 days ago', updated: '2 days ago', body: '', activity: [] },
  { id: 'INC-2025', title: 'Imprimante étiquettes pharmacie — mauvais bac', category: 'hardware', priority: 'P3', status: 'resolved',
    reporter: 'pr', assignee: 'pr', department: 'Pharmacien',
    createdAt: daysAgo(4, 11), firstResponseAt: daysAgo(4, 12), resolvedAt: daysAgo(3, 15),
    formAnswers: { users_affected: 'Juste moi', problem_area: 'Imprimante', printer_problem: 'Impression mauvais bac', department: 'Pharmacien' },
    opened: '4 days ago', updated: '3 days ago', body: '', activity: [] },
  { id: 'INC-2020', title: 'RingCentral — pas de tonalité', category: 'hardware', priority: 'P2', status: 'closed',
    reporter: 'jd', assignee: 'jd', department: 'Administration',
    createdAt: daysAgo(5, 9), firstResponseAt: daysAgo(5, 9), resolvedAt: daysAgo(4, 14), closedAt: daysAgo(4, 16),
    formAnswers: { users_affected: 'Juste moi', problem_area: 'RingCentral', ringcentral_issue: 'Pas de tonalité / impossible de passer des appels', department: 'Administration' },
    opened: '5 days ago', updated: '4 days ago', body: '', activity: [] },
  { id: 'INC-2015', title: 'Excel — problème de connexion', category: 'apps', priority: 'P4', status: 'resolved',
    reporter: 'me', assignee: 'jd', department: 'Facturation',
    createdAt: daysAgo(7, 14), firstResponseAt: daysAgo(6, 9), resolvedAt: daysAgo(5, 11),
    formAnswers: { users_affected: 'Juste moi', problem_area: 'Excel', excel_issue: 'Problème de connexion', department: 'Facturation' },
    opened: '1 week ago', updated: '5 days ago', body: '', activity: [] },
  { id: 'INC-2010', title: 'BioMetrx — erreur de lecture', category: 'apps', priority: 'P3', status: 'closed',
    reporter: 'al', assignee: 'mt', department: 'Ophtalmo',
    createdAt: daysAgo(10, 8), firstResponseAt: daysAgo(10, 9), resolvedAt: daysAgo(8, 16), closedAt: daysAgo(8, 17),
    formAnswers: { users_affected: 'Juste moi', problem_area: 'BioMetrx', biometrx_issue: 'Erreur de lecture / scan', department: 'Ophtalmo' },
    opened: '10 days ago', updated: '8 days ago', body: '', activity: [] },
  { id: 'INC-2005', title: 'Parcours CRM — problème de connexion', category: 'apps', priority: 'P3', status: 'resolved',
    reporter: 'sc', assignee: 'jd', department: 'Parcours Logistique',
    createdAt: daysAgo(14, 10), firstResponseAt: daysAgo(14, 11), resolvedAt: daysAgo(12, 15),
    formAnswers: { users_affected: 'Mon équipe', problem_area: 'Parcours CRM', crm_issue: 'Problème de connexion', department: 'Parcours Logistique' },
    opened: '2 weeks ago', updated: '12 days ago', body: '', activity: [] },
  { id: 'INC-1998', title: 'Power BI — rapport ne charge pas', category: 'apps', priority: 'P4', status: 'closed',
    reporter: 'pr', assignee: 'al', department: 'Compte à recevoir',
    createdAt: daysAgo(21, 9), firstResponseAt: daysAgo(20, 14), resolvedAt: daysAgo(18, 10), closedAt: daysAgo(18, 11),
    formAnswers: { users_affected: 'Juste moi', problem_area: 'Power BI', pbi_issue: 'Problème de connexion', department: 'Compte à recevoir' },
    opened: '3 weeks ago', updated: '18 days ago', body: '', activity: [] },
  { id: 'INC-1990', title: 'KROLL — lent ou gelé', category: 'kroll', priority: 'P1', status: 'resolved',
    reporter: 'pr', assignee: 'mt', department: 'Pharmacien',
    createdAt: daysAgo(28, 8), firstResponseAt: daysAgo(28, 8), resolvedAt: daysAgo(27, 18),
    formAnswers: { users_affected: 'Tout le monde', problem_area: 'Kroll', kroll_issue: 'Lent ou gelé', department: 'Pharmacien' },
    opened: '4 weeks ago', updated: '27 days ago', body: '', activity: [] },
  { id: 'INC-1982', title: 'Audio casque — patient ne m\'entend pas', category: 'hardware', priority: 'P3', status: 'closed',
    reporter: 'sc', assignee: 'pr', department: 'Clinique et Domicile',
    createdAt: daysAgo(35, 11), firstResponseAt: daysAgo(35, 12), resolvedAt: daysAgo(33, 16), closedAt: daysAgo(33, 17),
    formAnswers: { users_affected: 'Juste moi', problem_area: 'Audio / Casque', audio_situation: 'Le patient ne m\'entend pas du tout', department: 'Clinique et Domicile' },
    opened: '5 weeks ago', updated: '33 days ago', body: '', activity: [] },
  { id: 'INC-1975', title: 'AVD — impossible de se connecter', category: 'avd', priority: 'P2', status: 'resolved',
    reporter: 'me', assignee: 'al', department: 'Facturation',
    createdAt: daysAgo(42, 7), firstResponseAt: daysAgo(42, 7), resolvedAt: daysAgo(40, 14),
    formAnswers: { users_affected: 'Mon équipe', avd_issue: 'Impossible de se connecter', department: 'Facturation' },
    opened: '6 weeks ago', updated: '40 days ago', body: '', activity: [] },
  { id: 'INC-1968', title: 'DSQ — application lente', category: 'apps', priority: 'P3', status: 'closed',
    reporter: 'jd', assignee: 'mt', department: 'Pharmacien',
    createdAt: daysAgo(49, 10), firstResponseAt: daysAgo(49, 11), resolvedAt: daysAgo(47, 15), closedAt: daysAgo(47, 16),
    formAnswers: { users_affected: 'Juste moi', problem_area: 'DSQ', dsq_error: 'Application lente ou gelée', department: 'Pharmacien' },
    opened: '7 weeks ago', updated: '47 days ago', body: '', activity: [] },
  { id: 'INC-1960', title: 'Imprimante — bourrage papier', category: 'hardware', priority: 'P4', status: 'resolved',
    reporter: 'pr', assignee: 'pr', department: 'Shipping',
    createdAt: daysAgo(56, 13), firstResponseAt: daysAgo(55, 9), resolvedAt: daysAgo(54, 11),
    formAnswers: { users_affected: 'Juste moi', problem_area: 'Imprimante', printer_problem: 'Bourrage papier', department: 'Shipping' },
    opened: '8 weeks ago', updated: '54 days ago', body: '', activity: [] },
];

/** Articles d'aide — base de connaissances (démo, recherche hero). */
const HELP_ARTICLES = [
  { id: 'printer-offline', icon: 'printer', portalId: 'imprimante', popular: true },
  { id: 'password-reset', icon: 'key', portalId: 'access', popular: true },
  { id: 'avd-home', icon: 'monitor', portalId: 'avd', popular: true },
  { id: 'kroll-slow', icon: 'pill', portalId: 'kroll', popular: false },
  { id: 'access-request', icon: 'key', portalId: 'access', popular: false },
  { id: 'ringcentral-setup', icon: 'phone', portalId: 'ringcentral', popular: false },
];

window.PMG_DATA = {
  CATEGORIES, PORTAL_INCIDENT_ITEMS, PORTAL_INCIDENT_GROUPS, IT_PROCESS_CATEGORIES,
  SERVICE_CATALOG, HELP_ARTICLES, PEOPLE, TICKETS,
};
