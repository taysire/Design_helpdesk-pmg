// Schéma — Demande de départ d'employé (offboarding)

const OFFBOARDING_PHASES = [
  'employee', 'departureType', 'access', 'equipment', 'comments', 'attachments', 'summary',
];

const OFFBOARDING_DEPARTURE_TYPES = [
  { id: 'voluntary', labelKey: 'offboardingForm.departureTypes.voluntary' },
  { id: 'termination', labelKey: 'offboardingForm.departureTypes.termination' },
  { id: 'contract_end', labelKey: 'offboardingForm.departureTypes.contractEnd' },
  { id: 'internal_transfer', labelKey: 'offboardingForm.departureTypes.internalTransfer' },
  { id: 'retirement', labelKey: 'offboardingForm.departureTypes.retirement' },
  { id: 'other', labelKey: 'offboardingForm.departureTypes.other' },
];

const OFFBOARDING_ACCESS_OPTIONS = [
  { id: 'kroll', labelKey: 'offboardingForm.access.kroll' },
  { id: 'mgp_parcours', labelKey: 'offboardingForm.access.mgpParcours' },
  { id: 'ringcentral', labelKey: 'offboardingForm.access.ringCentral' },
  { id: 'sharepoint', labelKey: 'offboardingForm.access.sharepoint' },
  { id: 'email', labelKey: 'offboardingForm.access.email' },
  { id: 'internal_apps', labelKey: 'offboardingForm.access.internalApps' },
  { id: 'network_drives', labelKey: 'offboardingForm.access.networkDrives' },
  { id: 'vpn', labelKey: 'offboardingForm.access.vpn' },
  { id: 'other', labelKey: 'offboardingForm.access.other' },
];

const OFFBOARDING_EQUIPMENT_OPTIONS = [
  { id: 'laptop', labelKey: 'offboardingForm.equipment.laptop' },
  { id: 'desktop', labelKey: 'offboardingForm.equipment.desktop' },
  { id: 'monitor', labelKey: 'offboardingForm.equipment.monitor' },
  { id: 'keyboard', labelKey: 'offboardingForm.equipment.keyboard' },
  { id: 'mouse', labelKey: 'offboardingForm.equipment.mouse' },
  { id: 'headset', labelKey: 'offboardingForm.equipment.headset' },
  { id: 'printer', labelKey: 'offboardingForm.equipment.printer' },
  { id: 'phone', labelKey: 'offboardingForm.equipment.phone' },
  { id: 'access_card', labelKey: 'offboardingForm.equipment.accessCard' },
  { id: 'other', labelKey: 'offboardingForm.equipment.other' },
];

function getOffboardingDepartmentOptions() {
  return window.FORM_STEP_DEFS?.department?.options || [
    'Administration', 'Clinique et Domicile', 'Pharmacien', 'Comptabilité',
  ];
}

function offboardingHasValue(v) {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim() !== '';
}

function toggleOffboardingList(list, id, checked) {
  const arr = Array.isArray(list) ? [...list] : [];
  if (checked) return arr.includes(id) ? arr : [...arr, id];
  return arr.filter(x => x !== id);
}

function getDepartureTypeLabel(typeId, t) {
  const opt = OFFBOARDING_DEPARTURE_TYPES.find(o => o.id === typeId);
  return opt ? t(opt.labelKey) : typeId || '—';
}

function formatOffboardingAccessList(answers, t) {
  const ids = answers.accessToRemove || [];
  return ids.map(id => {
    if (id === 'other' && answers.otherAccessApp) {
      const comment = answers.otherAccessComment ? ` — ${answers.otherAccessComment}` : '';
      return `${answers.otherAccessApp}${comment}`;
    }
    const opt = OFFBOARDING_ACCESS_OPTIONS.find(o => o.id === id);
    return opt ? t(opt.labelKey) : id;
  });
}

function formatOffboardingEquipmentList(answers, t) {
  const ids = answers.equipmentToRecover || [];
  return ids.map(id => {
    if (id === 'other' && answers.otherEquipmentDesc) return answers.otherEquipmentDesc;
    const opt = OFFBOARDING_EQUIPMENT_OPTIONS.find(o => o.id === id);
    return opt ? t(opt.labelKey) : id;
  });
}

function formatOffboardingDate(raw, lang) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long' });
  }
  return raw;
}

function validateOffboardingPhase(phase, answers, t) {
  if (phase === 'employee') {
    return offboardingHasValue(answers.employeeName)
      && offboardingHasValue(answers.jobTitle)
      && offboardingHasValue(answers.department)
      && offboardingHasValue(answers.manager)
      && offboardingHasValue(answers.departureDate);
  }
  if (phase === 'departureType') {
    if (!offboardingHasValue(answers.departureType)) return false;
    if (answers.departureType === 'other') {
      return offboardingHasValue(answers.otherDepartureDesc);
    }
    return true;
  }
  if (phase === 'access') {
    if (!offboardingHasValue(answers.accessToRemove)) return false;
    if ((answers.accessToRemove || []).includes('other')) {
      return offboardingHasValue(answers.otherAccessApp) && offboardingHasValue(answers.otherAccessComment);
    }
    return true;
  }
  if (phase === 'equipment') {
    if (!offboardingHasValue(answers.equipmentToRecover)) return false;
    if ((answers.equipmentToRecover || []).includes('other')) {
      return offboardingHasValue(answers.otherEquipmentDesc);
    }
    return true;
  }
  return true;
}

function buildOffboardingRequestBody(answers, t) {
  const lines = [
    `**${t('offboardingForm.fields.employeeName')}:** ${answers.employeeName}`,
    `**${t('offboardingForm.fields.jobTitle')}:** ${answers.jobTitle}`,
    `**${t('offboardingForm.fields.department')}:** ${answers.department}`,
    `**${t('offboardingForm.fields.manager')}:** ${answers.manager}`,
    `**${t('offboardingForm.fields.departureDate')}:** ${answers.departureDate}`,
    `**${t('offboardingForm.fields.departureType')}:** ${getDepartureTypeLabel(answers.departureType, t)}`,
    `**${t('offboardingForm.sections.access')}:** ${formatOffboardingAccessList(answers, t).join(', ') || '—'}`,
    `**${t('offboardingForm.sections.equipment')}:** ${formatOffboardingEquipmentList(answers, t).join(', ') || '—'}`,
  ];
  if (answers.comments) lines.push(`**${t('offboardingForm.fields.comments')}:** ${answers.comments}`);
  if (answers.specialInstructions) {
    lines.push(`**${t('offboardingForm.fields.specialInstructions')}:** ${answers.specialInstructions}`);
  }
  if (answers.importantInfo) {
    lines.push(`**${t('offboardingForm.fields.importantInfo')}:** ${answers.importantInfo}`);
  }
  return lines.join('\n');
}

function buildOffboardingTicket(answers, t, lang) {
  const name = answers.employeeName || t('offboardingForm.untitledEmployee');
  const title = `${t('services.employeeDeparture.label')} — ${name}`.slice(0, 120);
  const formAnswers = { _offboardingWizard: true, ...answers };

  return {
    id: 'OFF-' + String(Math.floor(9000 + Math.random() * 100)).padStart(4, '0'),
    title,
    category: 'offboard',
    serviceId: 'employee-departure',
    requestType: 'offboarding',
    priority: 'P3',
    status: 'new',
    reporter: 'me',
    assignee: null,
    opened: 'just now',
    updated: 'just now',
    body: buildOffboardingRequestBody(answers, t),
    formAnswers,
    jira: null,
    slack: null,
    activity: [{ who: 'me', kind: 'opened', text: t('services.employeeDeparture.label'), at: 'just now' }],
  };
}

Object.assign(window, {
  OFFBOARDING_PHASES,
  OFFBOARDING_DEPARTURE_TYPES,
  OFFBOARDING_ACCESS_OPTIONS,
  OFFBOARDING_EQUIPMENT_OPTIONS,
  getOffboardingDepartmentOptions,
  offboardingHasValue,
  toggleOffboardingList,
  getDepartureTypeLabel,
  formatOffboardingAccessList,
  formatOffboardingEquipmentList,
  formatOffboardingDate,
  validateOffboardingPhase,
  buildOffboardingTicket,
  buildOffboardingRequestBody,
});
