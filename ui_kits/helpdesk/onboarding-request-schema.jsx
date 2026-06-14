// Schéma — Demande d'arrivée d'employé (onboarding)

const ONBOARDING_ACCESS_OPTIONS = [
  { id: 'kroll', labelKey: 'onboardingForm.access.kroll' },
  { id: 'mgp_parcours', labelKey: 'onboardingForm.access.mgpParcours' },
  { id: 'ringcentral', labelKey: 'onboardingForm.access.ringCentral' },
  { id: 'other', labelKey: 'onboardingForm.access.other' },
];

const ONBOARDING_EQUIPMENT_OPTIONS = [
  { id: 'laptop', labelKey: 'onboardingForm.equipment.laptop' },
  { id: 'desktop_dual', labelKey: 'onboardingForm.equipment.desktopDual' },
  { id: 'printer', labelKey: 'onboardingForm.equipment.printer' },
  { id: 'scanner', labelKey: 'onboardingForm.equipment.scanner' },
  { id: 'other', labelKey: 'onboardingForm.equipment.other' },
];

const ONBOARDING_PHASES = ['employee', 'access', 'equipment', 'comments', 'summary'];

function getOnboardingDepartmentOptions() {
  return window.FORM_STEP_DEFS?.department?.options || [
    'Administration', 'Clinique et Domicile', 'Pharmacien', 'Comptabilité',
  ];
}

function onboardingHasValue(v) {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim() !== '';
}

function toggleOnboardingList(list, id, checked) {
  const arr = Array.isArray(list) ? [...list] : [];
  if (checked) return arr.includes(id) ? arr : [...arr, id];
  return arr.filter(x => x !== id);
}

function formatOnboardingAccessList(answers, t) {
  const ids = answers.accessRequested || [];
  return ids.map(id => {
    const opt = ONBOARDING_ACCESS_OPTIONS.find(o => o.id === id);
    if (id === 'other' && answers.otherAccessApp) {
      const type = answers.otherAccessType ? ` (${answers.otherAccessType})` : '';
      return `${answers.otherAccessApp}${type}`;
    }
    return opt ? t(opt.labelKey) : id;
  });
}

function formatOnboardingEquipmentList(answers, t) {
  const ids = answers.equipmentRequired || [];
  return ids.map(id => {
    const opt = ONBOARDING_EQUIPMENT_OPTIONS.find(o => o.id === id);
    if (id === 'other' && answers.otherEquipmentDesc) return answers.otherEquipmentDesc;
    return opt ? t(opt.labelKey) : id;
  });
}

function formatOnboardingDate(raw, lang) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long' });
  }
  return raw;
}

function validateOnboardingPhase(phase, answers, t) {
  if (phase === 'employee') {
    return onboardingHasValue(answers.arrivalDate)
      && onboardingHasValue(answers.employeeName)
      && onboardingHasValue(answers.jobTitle)
      && onboardingHasValue(answers.department);
  }
  if (phase === 'access') {
    if (!onboardingHasValue(answers.accessRequested)) return false;
    if ((answers.accessRequested || []).includes('other')) {
      return onboardingHasValue(answers.otherAccessApp) && onboardingHasValue(answers.otherAccessType);
    }
    return true;
  }
  if (phase === 'equipment') {
    if (!onboardingHasValue(answers.equipmentRequired)) return false;
    if ((answers.equipmentRequired || []).includes('other')) {
      return onboardingHasValue(answers.otherEquipmentDesc);
    }
    return true;
  }
  return true;
}

function buildOnboardingRequestBody(answers, t) {
  const lines = [
    `**${t('onboardingForm.fields.arrivalDate')}:** ${answers.arrivalDate}`,
    `**${t('onboardingForm.fields.employeeName')}:** ${answers.employeeName}`,
    `**${t('onboardingForm.fields.jobTitle')}:** ${answers.jobTitle}`,
    `**${t('onboardingForm.fields.department')}:** ${answers.department}`,
    `**${t('onboardingForm.sections.access')}:** ${formatOnboardingAccessList(answers, t).join(', ') || '—'}`,
    `**${t('onboardingForm.sections.equipment')}:** ${formatOnboardingEquipmentList(answers, t).join(', ') || '—'}`,
  ];
  if (answers.comments) lines.push(`**${t('onboardingForm.fields.comments')}:** ${answers.comments}`);
  if (answers.specialInstructions) {
    lines.push(`**${t('onboardingForm.fields.specialInstructions')}:** ${answers.specialInstructions}`);
  }
  return lines.join('\n');
}

function buildOnboardingTicket(answers, t, lang) {
  const name = answers.employeeName || t('onboardingForm.untitledEmployee');
  const title = `${t('services.employeeArrival.label')} — ${name}`.slice(0, 120);
  const formAnswers = { _onboardingWizard: true, ...answers };

  return {
    ticketType: 'service',
    title,
    category: 'onboard',
    serviceId: 'employee-arrival',
    requestType: 'onboarding',
    priority: 'P3',
    status: 'new',
    reporter: 'me',
    assignee: null,
    opened: 'just now',
    updated: 'just now',
    body: buildOnboardingRequestBody(answers, t),
    formAnswers,
    jira: null,
    slack: null,
    activity: [{ who: 'me', kind: 'opened', text: t('services.employeeArrival.label'), at: 'just now' }],
  };
}

Object.assign(window, {
  ONBOARDING_ACCESS_OPTIONS,
  ONBOARDING_EQUIPMENT_OPTIONS,
  ONBOARDING_PHASES,
  getOnboardingDepartmentOptions,
  toggleOnboardingList,
  formatOnboardingAccessList,
  formatOnboardingEquipmentList,
  formatOnboardingDate,
  validateOnboardingPhase,
  buildOnboardingTicket,
  buildOnboardingRequestBody,
});
