// Moteur de formulaire dynamique — schéma + dépendances (équivalent Microsoft Forms)

const ENDING_STEP_IDS = ['department', 'office_number', 'link', 'attachments', 'detailed_description'];

const PRINTER_KROLL_STEPS = [
  'printer_kroll_help',
  'printer_connected',
  'printer_diagnostic',
  'printer_power_cycle',
];

/** Toutes les définitions de questions (libellés et réponses = Microsoft Forms). */
const FORM_STEP_DEFS = {
  users_affected: {
    id: 'users_affected',
    type: 'choice',
    label: 'Combien d\'utilisateurs sont affectés ?',
    required: true,
    options: ['Juste moi', 'Mon équipe', 'Tout le monde'],
  },
  problem_area: {
    id: 'problem_area',
    type: 'choice',
    label: 'Veuillez situer votre problème',
    required: true,
    options: [
      'Parcours CRM',
      'BioMetrx',
      'Kroll',
      'DSQ',
      'Excel',
      'Power BI',
      'Imprimante',
      'RingCentral',
      'Audio / Casque',
      'Autre',
    ],
  },

  excel_issue: {
    id: 'excel_issue',
    type: 'choice',
    label: 'Application Excel',
    required: true,
    options: ['Problème de connexion', 'Other'],
  },
  excel_other_desc: {
    id: 'excel_other_desc',
    type: 'text',
    label: 'Veuillez décrire le problème rencontré',
    required: true,
    placeholder: 'Décrivez le problème Excel…',
  },

  pbi_issue: {
    id: 'pbi_issue',
    type: 'choice',
    label: 'Power BI',
    required: true,
    options: ['Problème de connexion', 'Other'],
  },
  pbi_other_desc: {
    id: 'pbi_other_desc',
    type: 'text',
    label: 'Veuillez décrire le problème rencontré',
    required: true,
    placeholder: 'Décrivez le problème Power BI…',
  },

  crm_issue: {
    id: 'crm_issue',
    type: 'choice',
    label: 'Parcours CRM',
    required: true,
    options: ['Problème de connexion', 'Autre'],
  },
  crm_other_desc: {
    id: 'crm_other_desc',
    type: 'text',
    label: 'Décrivez le problème rencontré avec Parcours CRM',
    required: true,
    placeholder: 'Décrivez le problème…',
  },

  biometrx_issue: {
    id: 'biometrx_issue',
    type: 'choice',
    label: 'BioMetrx',
    required: true,
    options: ['Problème de connexion', 'Erreur de lecture / scan', 'Autre'],
  },
  biometrx_other_desc: {
    id: 'biometrx_other_desc',
    type: 'text',
    label: 'Décrivez le problème rencontré avec BioMetrx',
    required: true,
    placeholder: 'Décrivez le problème…',
  },

  kroll_issue: {
    id: 'kroll_issue',
    type: 'choice',
    label: 'KROLL',
    required: true,
    options: [
      'Problème de connexion',
      'Lent ou gelé',
      'Erreur à l\'ouverture d\'un dossier patient',
      'Problème d\'impression depuis Kroll',
      'Autre',
    ],
  },
  kroll_other_desc: {
    id: 'kroll_other_desc',
    type: 'text',
    label: 'Décrivez le problème rencontré avec KROLL',
    required: true,
    placeholder: 'Décrivez le problème…',
  },

  dsq_error: {
    id: 'dsq_error',
    type: 'choice',
    label: 'Quelle erreur DSQ ?',
    required: true,
    options: [
      'Problème de connexion / impossible de se connecter',
      'Message d\'erreur à l\'écran (code ou texte)',
      'Session expirée ou déconnexion fréquente',
      'Application lente ou gelée',
      'Impossible d\'ouvrir un dossier patient',
      'Problème avec une prescription / ordonnance',
      'Problème de facturation dans DSQ',
      'Problème d\'impression depuis DSQ',
      'Synchronisation ou données manquantes',
      'Accès refusé / permissions insuffisantes',
      'Erreur RAMQ ou tiers payant',
      'Module clinique indisponible',
      'Autre',
    ],
  },
  dsq_other_desc: {
    id: 'dsq_other_desc',
    type: 'text',
    label: 'Précisez l\'erreur DSQ',
    required: true,
    placeholder: 'Décrivez l\'erreur…',
  },

  printer_problem: {
    id: 'printer_problem',
    type: 'choice',
    label: 'Sélectionner le problème d\'imprimante',
    required: true,
    options: [
      'Connexion avec Kroll',
      'Impression mauvais bac',
      'Impression décalée',
      'Impression caractères aléatoires',
      'Cartouche d\'encre',
      'Bourrage papier',
    ],
  },
  printer_type: {
    id: 'printer_type',
    type: 'choice',
    label: 'Type d\'imprimante',
    required: true,
    options: ['Laser / multifonction', 'Étiquettes pharmacie', 'Imprimante reçu', 'Autre'],
  },
  printer_type_other: {
    id: 'printer_type_other',
    type: 'text',
    label: 'Précisez le type d\'imprimante',
    required: true,
    placeholder: 'Marque ou modèle…',
  },
  printer_kroll_help: {
    id: 'printer_kroll_help',
    type: 'choice',
    label: 'Connexion imprimante avec Kroll',
    required: true,
    options: [
      'Comment connecter mon imprimante sur Kroll',
      'Je trouve pas mon imprimante dans Kroll',
    ],
  },
  printer_connected: {
    id: 'printer_connected',
    type: 'choice',
    label: 'Imprimante connectée ?',
    required: true,
    options: ['Oui', 'Non'],
  },
  printer_diagnostic: {
    id: 'printer_diagnostic',
    type: 'choice',
    label: 'Étapes de diagnostic',
    required: true,
    options: [
      'Fermer station configuration Kroll',
      'Fermer Kroll complètement',
      'Déconnexion AVD',
      'Non résolu',
    ],
  },
  printer_power_cycle: {
    id: 'printer_power_cycle',
    type: 'choice',
    label: 'Avez-vous débranché et rebranché l\'alimentation ?',
    required: true,
    options: ['Oui'],
  },

  ringcentral_issue: {
    id: 'ringcentral_issue',
    type: 'choice',
    label: 'RingCentral',
    required: true,
    options: [
      'Problème de connexion',
      'Pas de tonalité / impossible de passer des appels',
      'Qualité audio mauvaise (écho, coupure)',
      'Application mobile ou softphone',
      'Messagerie vocale / réception appels',
      'Other',
    ],
  },
  ringcentral_other_desc: {
    id: 'ringcentral_other_desc',
    type: 'text',
    label: 'Veuillez décrire le problème rencontré',
    required: true,
    placeholder: 'Décrivez le problème RingCentral…',
  },

  audio_mic_out: {
    id: 'audio_mic_out',
    type: 'choice',
    label: 'Micro sorti ?',
    required: true,
    options: ['Oui', 'Non'],
  },
  audio_situation: {
    id: 'audio_situation',
    type: 'choice',
    label: 'Situation ?',
    required: true,
    options: [
      'Je n\'entends rien',
      'Le patient ne m\'entend pas bien',
      'Le patient ne m\'entend pas du tout',
      'Other',
    ],
  },
  audio_other_desc: {
    id: 'audio_other_desc',
    type: 'text',
    label: 'Précisez la situation audio',
    required: true,
    placeholder: 'Décrivez la situation…',
  },
  audio_volume_60: {
    id: 'audio_volume_60',
    type: 'choice',
    label: 'Configuration son 60 % ?',
    required: true,
    options: ['Oui', 'Non'],
  },
  audio_headset_charged: {
    id: 'audio_headset_charged',
    type: 'choice',
    label: 'Headset chargé ?',
    required: true,
    options: ['Oui', 'Non'],
  },

  other_area_desc: {
    id: 'other_area_desc',
    type: 'text',
    label: 'Précisez votre problème',
    required: true,
    placeholder: 'Décrivez le problème…',
  },

  department: {
    id: 'department',
    type: 'choice',
    label: 'Département',
    required: true,
    options: [
      'Administration',
      'Clinique et Domicile',
      'Compte à recevoir',
      'Facturation',
      'Parcours Logistique',
      'Ophtalmo',
      'Pharmacien',
      'Shipping',
      'Comptabilité',
    ],
  },
  office_number: {
    id: 'office_number',
    type: 'text',
    label: 'Numéro de bureau',
    required: false,
    placeholder: 'ex. 312 ou A-12',
  },
  link: {
    id: 'link',
    type: 'text',
    label: 'Lien',
    required: false,
    placeholder: 'URL ou référence (optionnel)',
  },
  attachments: {
    id: 'attachments',
    type: 'file',
    label: 'Pièces jointes',
    required: false,
    hint: 'Captures d\'écran ou photos — optionnel pour le prototype.',
  },
  detailed_description: {
    id: 'detailed_description',
    type: 'textarea',
    label: 'Description détaillée du problème',
    required: true,
    placeholder: 'Tout ce qui peut aider le TI à résoudre plus vite…',
    rows: 5,
  },

  avd_issue: {
    id: 'avd_issue',
    type: 'choice',
    label: 'Quel problème rencontrez-vous avec AVD ?',
    required: true,
    options: [
      'Impossible de se connecter',
      'Déconnexion fréquente',
      'Session lente ou gelée',
      'Application ne s\'ouvre pas dans AVD',
      'Autre',
    ],
  },
  avd_other_desc: {
    id: 'avd_other_desc',
    type: 'text',
    label: 'Décrivez le problème AVD',
    required: true,
    placeholder: 'Décrivez le problème…',
  },

  access_issue: {
    id: 'access_issue',
    type: 'choice',
    label: 'Quel type d\'accès est concerné ?',
    required: true,
    options: [
      'SharePoint / lecteur réseau',
      'Courriel',
      'Application interne',
      'VPN',
      'Liste de distribution',
      'Autre',
    ],
  },
  access_other_desc: {
    id: 'access_other_desc',
    type: 'text',
    label: 'Précisez l\'accès demandé',
    required: true,
    placeholder: 'Application, dossier, permission…',
  },

  materials_request: {
    id: 'materials_request',
    type: 'choice',
    label: 'De quoi avez-vous besoin ?',
    required: true,
    options: [
      'Fournitures de bureau',
      'Équipement / mobilier',
      'Cartouches / consommables',
      'Autre',
    ],
  },
  materials_other_desc: {
    id: 'materials_other_desc',
    type: 'text',
    label: 'Décrivez votre demande',
    required: true,
    placeholder: 'Article, quantité, urgence…',
  },
};

/** Présets legacy (sidebar / liens anciens). */
const PORTAL_CATEGORY_PRESET = {
  hardware: {
    ticketCategory: 'hardware',
    problemAreaOptions: ['Imprimante', 'RingCentral', 'Audio / Casque'],
    problemAreaLabel: 'Quel équipement est concerné ?',
  },
  apps: {
    ticketCategory: 'apps',
    problemAreaOptions: ['Parcours CRM', 'BioMetrx', 'DSQ', 'Excel', 'Power BI', 'Autre'],
    problemAreaLabel: 'Quelle application est concernée ?',
  },
};

/** Fallback statique — chaque carte portail = parcours direct (sans re-choisir la catégorie). */
const PORTAL_STATIC_PRESETS = {
  avd: { ticketCategory: 'avd', portalFlow: 'avd' },
  kroll: { ticketCategory: 'kroll', prefillProblemArea: 'Kroll' },
  dsq: { ticketCategory: 'apps', prefillProblemArea: 'DSQ' },
  'parcours-crm': { ticketCategory: 'apps', prefillProblemArea: 'Parcours CRM' },
  biometrx: { ticketCategory: 'apps', prefillProblemArea: 'BioMetrx' },
  excel: { ticketCategory: 'apps', prefillProblemArea: 'Excel' },
  powerbi: { ticketCategory: 'apps', prefillProblemArea: 'Power BI' },
  imprimante: { ticketCategory: 'hardware', prefillProblemArea: 'Imprimante' },
  ringcentral: { ticketCategory: 'hardware', prefillProblemArea: 'RingCentral' },
  audio: { ticketCategory: 'hardware', prefillProblemArea: 'Audio / Casque' },
  access: { ticketCategory: 'access', portalFlow: 'access' },
  materials: { ticketCategory: 'materials', portalFlow: 'materials' },
  'autre-app': { ticketCategory: 'apps', prefillProblemArea: 'Autre' },
};

const PORTAL_META_KEYS = ['_portalCategory', 'problem_area'];

function portalItemToPreset(item) {
  if (!item) return null;
  const preset = { ticketCategory: item.ticketCategory };
  if (item.portalFlow) preset.portalFlow = item.portalFlow;
  if (item.prefillProblemArea) preset.prefillProblemArea = item.prefillProblemArea;
  return preset;
}

function resolvePortalKey(answers, portalCategoryFallback) {
  return answers?._portalCategory || portalCategoryFallback || null;
}

function getPortalPreset(portalCategory) {
  if (!portalCategory) return null;
  const fromItems = window.PMG_DATA?.PORTAL_INCIDENT_ITEMS?.find(i => i.id === portalCategory);
  if (fromItems) return portalItemToPreset(fromItems);
  if (PORTAL_STATIC_PRESETS[portalCategory]) return PORTAL_STATIC_PRESETS[portalCategory];
  return PORTAL_CATEGORY_PRESET[portalCategory] || null;
}

function applyPortalMeta(answers, portalCategory) {
  if (!portalCategory) return answers;
  const preset = getPortalPreset(portalCategory);
  const next = { ...answers, _portalCategory: portalCategory };
  if (preset?.prefillProblemArea) next.problem_area = preset.prefillProblemArea;
  return next;
}

function buildInitialReportAnswers(portalCategory) {
  if (!portalCategory) return {};
  return applyPortalMeta({}, portalCategory);
}

const FORM_DEPENDENCY_JSON = {
  version: 2,
  source: 'Microsoft Forms — PMG Helpdesk',
  root: 'users_affected',
  nodes: {
    users_affected: { next: ['problem_area'] },
    problem_area: {
      branches: {
        Excel: ['excel_issue', 'excel_other_desc?'],
        'Power BI': ['pbi_issue', 'pbi_other_desc?'],
        'Parcours CRM': ['crm_issue', 'crm_other_desc?'],
        BioMetrx: ['biometrx_issue', 'biometrx_other_desc?'],
        Kroll: ['kroll_issue', 'kroll_other_desc?'],
        DSQ: ['dsq_error', 'dsq_other_desc?'],
        Imprimante: [
          'printer_problem',
          'printer_type',
          'printer_type_other?',
          'printer_kroll_help?',
          'printer_connected?',
          'printer_diagnostic?',
          'printer_power_cycle?',
        ],
        RingCentral: ['ringcentral_issue', 'ringcentral_other_desc?'],
        'Audio / Casque': [
          'audio_mic_out',
          'audio_situation',
          'audio_other_desc?',
          'audio_volume_60',
          'audio_headset_charged',
        ],
        Autre: ['other_area_desc'],
      },
      then: ENDING_STEP_IDS,
    },
  },
  conditional: [
    { if: { problem_area: 'Excel', excel_issue: 'Other' }, show: ['excel_other_desc'] },
    { if: { problem_area: 'Power BI', pbi_issue: 'Other' }, show: ['pbi_other_desc'] },
    { if: { problem_area: 'Parcours CRM', crm_issue: 'Autre' }, show: ['crm_other_desc'] },
    { if: { problem_area: 'BioMetrx', biometrx_issue: 'Autre' }, show: ['biometrx_other_desc'] },
    { if: { problem_area: 'Kroll', kroll_issue: 'Autre' }, show: ['kroll_other_desc'] },
    { if: { problem_area: 'DSQ', dsq_error: 'Autre' }, show: ['dsq_other_desc'] },
    { if: { problem_area: 'RingCentral', ringcentral_issue: 'Other' }, show: ['ringcentral_other_desc'] },
    { if: { problem_area: 'Audio / Casque', audio_situation: 'Other' }, show: ['audio_other_desc'] },
    {
      if: { problem_area: 'Imprimante', printer_problem: 'Connexion avec Kroll' },
      show: PRINTER_KROLL_STEPS,
    },
    { if: { problem_area: 'Imprimante', printer_type: 'Autre' }, show: ['printer_type_other'] },
  ],
};

function hasValue(answers, stepId) {
  const v = answers[stepId];
  if (v == null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function appendPrinterBranch(path, answers) {
  path.push('printer_problem');
  if (!hasValue(answers, 'printer_problem')) return;

  path.push('printer_type');
  if (!hasValue(answers, 'printer_type')) return;

  if (answers.printer_type === 'Autre') {
    path.push('printer_type_other');
    if (!hasValue(answers, 'printer_type_other')) return;
  }

  if (answers.printer_problem === 'Connexion avec Kroll') {
    path.push(...PRINTER_KROLL_STEPS);
  }
}

/** Étapes qui invalident les réponses en aval si modifiées. */
const BRANCH_RESET_KEYS = {
  problem_area: true,
  printer_problem: true,
  printer_type: true,
  excel_issue: true,
  pbi_issue: true,
  crm_issue: true,
  biometrx_issue: true,
  kroll_issue: true,
  dsq_error: true,
  ringcentral_issue: true,
  audio_situation: true,
  avd_issue: true,
  access_issue: true,
  materials_request: true,
};

function pruneAnswersToPath(answers, portalCategoryFallback) {
  const portalKey = resolvePortalKey(answers, portalCategoryFallback);
  const path = resolveFormPath(answers, portalCategoryFallback);
  const allowed = new Set(path);
  const next = {};
  Object.keys(answers).forEach(k => {
    if (allowed.has(k) || PORTAL_META_KEYS.includes(k)) next[k] = answers[k];
  });
  return portalKey ? applyPortalMeta(next, portalKey) : next;
}

function appendProblemAreaBranch(path, answers, area) {
  if (area === 'Excel') {
    path.push('excel_issue');
    if (answers.excel_issue === 'Other') path.push('excel_other_desc');
  } else if (area === 'Power BI') {
    path.push('pbi_issue');
    if (answers.pbi_issue === 'Other') path.push('pbi_other_desc');
  } else if (area === 'Parcours CRM') {
    path.push('crm_issue');
    if (answers.crm_issue === 'Autre') path.push('crm_other_desc');
  } else if (area === 'BioMetrx') {
    path.push('biometrx_issue');
    if (answers.biometrx_issue === 'Autre') path.push('biometrx_other_desc');
  } else if (area === 'Kroll') {
    path.push('kroll_issue');
    if (answers.kroll_issue === 'Autre') path.push('kroll_other_desc');
  } else if (area === 'DSQ') {
    path.push('dsq_error');
    if (answers.dsq_error === 'Autre') path.push('dsq_other_desc');
  } else if (area === 'Imprimante') {
    appendPrinterBranch(path, answers);
  } else if (area === 'RingCentral') {
    path.push('ringcentral_issue');
    if (answers.ringcentral_issue === 'Other') path.push('ringcentral_other_desc');
  } else if (area === 'Audio / Casque') {
    path.push('audio_mic_out', 'audio_situation');
    if (answers.audio_situation === 'Other') path.push('audio_other_desc');
    path.push('audio_volume_60', 'audio_headset_charged');
  } else if (area === 'Autre') {
    path.push('other_area_desc');
  }
}

function appendPortalFlowBranch(path, answers, flow) {
  if (flow === 'avd') {
    path.push('avd_issue');
    if (answers.avd_issue === 'Autre') path.push('avd_other_desc');
  } else if (flow === 'access') {
    path.push('access_issue');
    if (answers.access_issue === 'Autre') path.push('access_other_desc');
  } else if (flow === 'materials') {
    path.push('materials_request');
    if (answers.materials_request === 'Autre') path.push('materials_other_desc');
  }
}

function resolveFormPath(answers, portalCategoryFallback) {
  const path = ['users_affected'];
  if (!hasValue(answers, 'users_affected')) return path;

  const portalKey = resolvePortalKey(answers, portalCategoryFallback);
  const preset = getPortalPreset(portalKey);

  if (preset?.portalFlow) {
    appendPortalFlowBranch(path, answers, preset.portalFlow);
  } else if (preset?.prefillProblemArea) {
    appendProblemAreaBranch(path, answers, preset.prefillProblemArea);
  } else if (preset?.problemAreaOptions) {
    path.push('problem_area');
    if (!hasValue(answers, 'problem_area')) return path;
    appendProblemAreaBranch(path, answers, answers.problem_area);
  } else {
    path.push('problem_area');
    if (!hasValue(answers, 'problem_area')) return path;
    appendProblemAreaBranch(path, answers, answers.problem_area);
  }

  const skipKeys = new Set(['users_affected', 'problem_area', '_portalCategory']);
  const branchIds = path.filter(id => !ENDING_STEP_IDS.includes(id) && !skipKeys.has(id));
  const branchComplete = branchIds.length > 0 && branchIds.every(id => hasValue(answers, id));

  if (branchComplete) {
    path.push(...ENDING_STEP_IDS);
  }

  return path;
}

function applyAnswer(answers, stepId, value, portalCategoryFallback) {
  let next = { ...answers, [stepId]: value };
  if (BRANCH_RESET_KEYS[stepId]) {
    next = pruneAnswersToPath(next, portalCategoryFallback);
  }
  return next;
}

function getStepDef(stepId, answers, portalCategoryFallback) {
  const def = FORM_STEP_DEFS[stepId];
  if (!def) return def;
  const portalKey = resolvePortalKey(answers, portalCategoryFallback);
  if (stepId === 'problem_area' && portalKey) {
    const preset = getPortalPreset(portalKey);
    if (preset?.problemAreaOptions) {
      return {
        ...def,
        options: preset.problemAreaOptions,
        label: preset.problemAreaLabel || def.label,
      };
    }
  }
  return def;
}

function formatAnswerLabel(stepId, value) {
  if (value == null) return '—';
  if (Array.isArray(value)) return value.map(f => f.name || f).join(', ');
  return String(value);
}

function getAllAnswerRows(answers) {
  const path = resolveFormPath(answers);
  return path
    .filter(id => hasValue(answers, id) && id !== '_portalCategory')
    .map(id => ({
      id,
      label: getStepDef(id, answers)?.label || id,
      value: formatAnswerLabel(id, answers[id]),
    }));
}

function mapProblemAreaToCategory(area) {
  const m = {
    'Parcours CRM': 'apps',
    BioMetrx: 'apps',
    Kroll: 'kroll',
    DSQ: 'apps',
    Excel: 'apps',
    'Power BI': 'apps',
    Imprimante: 'hardware',
    RingCentral: 'hardware',
    'Audio / Casque': 'hardware',
    Autre: 'apps',
  };
  return m[area] || 'apps';
}

function mapUsersAffectedToPriority(users) {
  if (users === 'Tout le monde') return 'P1';
  if (users === 'Mon équipe') return 'P2';
  return 'P4';
}

function buildTicketFromAnswers(answers, t, portalCategoryFallback) {
  const portalKey = resolvePortalKey(answers, portalCategoryFallback);
  const preset = getPortalPreset(portalKey);
  const area = answers.problem_area
    || (preset?.portalFlow === 'avd' ? 'AVD' : null)
    || (preset?.portalFlow === 'access' ? 'Accès' : null)
    || (preset?.portalFlow === 'materials' ? 'Matériel bureau' : null)
    || 'Problème TI';
  const extra = answers.printer_problem || answers.dsq_error || answers.kroll_issue
    || answers.avd_issue || answers.access_issue || answers.materials_request || '';
  const title = `${area}${extra ? ' — ' + extra : ''}`.slice(0, 120);
  const bodyLines = getAllAnswerRows(answers)
    .filter(r => r.id !== '_portalCategory')
    .map(r => `**${r.label}:** ${r.value}`);
  const body = bodyLines.join('\n');
  const category = preset?.ticketCategory || mapProblemAreaToCategory(answers.problem_area);

  return {
    id: 'INC-' + String(Math.floor(2050 + Math.random() * 100)).padStart(4, '0'),
    title: title || t('newTicket.untitled'),
    category,
    priority: mapUsersAffectedToPriority(answers.users_affected),
    status: 'new',
    reporter: 'me',
    assignee: null,
    opened: 'just now',
    updated: 'just now',
    body,
    jira: null,
    slack: null,
    formAnswers: { ...answers },
    activity: [{ who: 'me', kind: 'opened', text: 'Signalement via formulaire dynamique', at: 'just now' }],
  };
}

Object.assign(window, {
  FORM_STEP_DEFS,
  FORM_DEPENDENCY_JSON,
  ENDING_STEP_IDS,
  PRINTER_KROLL_STEPS,
  PORTAL_CATEGORY_PRESET,
  PORTAL_STATIC_PRESETS,
  getPortalPreset,
  resolvePortalKey,
  applyPortalMeta,
  buildInitialReportAnswers,
  resolveFormPath,
  getStepDef,
  getAllAnswerRows,
  buildTicketFromAnswers,
  applyAnswer,
  pruneAnswersToPath,
  hasValue,
  formatAnswerLabel,
});
