// Schéma — Demande de matériel informatique

const IT_EQUIPMENT_PHASES = ['requester', 'requestType', 'equipment', 'justification', 'attachments', 'summary'];

const IT_EQUIPMENT_REQUEST_TYPES = [
  { id: 'new_equipment', labelKey: 'equipmentForm.requestTypes.newEquipment' },
  { id: 'replacement', labelKey: 'equipmentForm.requestTypes.replacement' },
  { id: 'loan', labelKey: 'equipmentForm.requestTypes.loan' },
  { id: 'upgrade', labelKey: 'equipmentForm.requestTypes.upgrade' },
];

const IT_EQUIPMENT_ITEMS = [
  { id: 'laptop', icon: 'monitor', labelKey: 'equipmentForm.items.laptop' },
  { id: 'desktop', icon: 'monitor', labelKey: 'equipmentForm.items.desktop' },
  { id: 'monitor', icon: 'monitor', labelKey: 'equipmentForm.items.monitor' },
  { id: 'keyboard', icon: 'keyboard', labelKey: 'equipmentForm.items.keyboard' },
  { id: 'mouse', icon: 'mouse', labelKey: 'equipmentForm.items.mouse' },
  { id: 'headset', icon: 'headphones', labelKey: 'equipmentForm.items.headset' },
  { id: 'printer', icon: 'printer', labelKey: 'equipmentForm.items.printer' },
  { id: 'tablet', icon: 'box', labelKey: 'equipmentForm.items.tablet' },
  { id: 'cables', icon: 'link', labelKey: 'equipmentForm.items.cables' },
  { id: 'other', icon: 'plus', labelKey: 'equipmentForm.items.other' },
];

function getEquipmentDepartmentOptions() {
  return window.FORM_STEP_DEFS?.department?.options || [
    'Administration', 'Clinique et Domicile', 'Pharmacien', 'Comptabilité',
  ];
}

function equipmentHasValue(v) {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim() !== '';
}

function toggleEquipmentList(list, id, checked) {
  const arr = Array.isArray(list) ? [...list] : [];
  if (checked) return arr.includes(id) ? arr : [...arr, id];
  return arr.filter(x => x !== id);
}

function getRequestTypeLabel(typeId, t) {
  const opt = IT_EQUIPMENT_REQUEST_TYPES.find(o => o.id === typeId);
  return opt ? t(opt.labelKey) : typeId || '—';
}

function formatEquipmentItemsList(answers, t) {
  const ids = answers.equipmentItems || [];
  return ids.map(id => {
    if (id === 'other' && answers.otherEquipmentDesc) return answers.otherEquipmentDesc;
    const opt = IT_EQUIPMENT_ITEMS.find(o => o.id === id);
    return opt ? t(opt.labelKey) : id;
  });
}

function validateEquipmentPhase(phase, answers, t) {
  if (phase === 'requester') {
    return equipmentHasValue(answers.requesterName) && equipmentHasValue(answers.department);
  }
  if (phase === 'requestType') return equipmentHasValue(answers.requestType);
  if (phase === 'equipment') {
    if (!equipmentHasValue(answers.equipmentItems)) return false;
    if ((answers.equipmentItems || []).includes('other')) {
      return equipmentHasValue(answers.otherEquipmentDesc);
    }
    return true;
  }
  if (phase === 'justification') return equipmentHasValue(answers.requestReason);
  return true;
}

function buildITEquipmentRequestBody(answers, t) {
  const lines = [
    `**${t('equipmentForm.fields.requesterName')}:** ${answers.requesterName}`,
    `**${t('equipmentForm.fields.department')}:** ${answers.department}`,
    `**${t('equipmentForm.fields.requestType')}:** ${getRequestTypeLabel(answers.requestType, t)}`,
    `**${t('equipmentForm.sections.equipment')}:** ${formatEquipmentItemsList(answers, t).join(', ') || '—'}`,
    `**${t('equipmentForm.fields.requestReason')}:** ${answers.requestReason}`,
  ];
  if (answers.workImpact) lines.push(`**${t('equipmentForm.fields.workImpact')}:** ${answers.workImpact}`);
  if (answers.additionalInfo) lines.push(`**${t('equipmentForm.fields.additionalInfo')}:** ${answers.additionalInfo}`);
  return lines.join('\n');
}

function buildITEquipmentTicket(answers, t) {
  const name = answers.requesterName || t('equipmentForm.untitledRequester');
  const typeLabel = getRequestTypeLabel(answers.requestType, t);
  const title = `${t('services.itEquipment.label')} — ${typeLabel}`.slice(0, 120);

  return {
    ticketType: 'service',
    title,
    category: 'service',
    serviceId: 'it-equipment',
    requestType: 'equipment',
    priority: 'P4',
    status: 'new',
    reporter: 'me',
    assignee: null,
    opened: 'just now',
    updated: 'just now',
    body: buildITEquipmentRequestBody(answers, t),
    formAnswers: { _equipmentWizard: true, ...answers },
    jira: null,
    slack: null,
    activity: [{ who: 'me', kind: 'opened', text: t('services.itEquipment.label'), at: 'just now' }],
  };
}

Object.assign(window, {
  IT_EQUIPMENT_PHASES,
  IT_EQUIPMENT_REQUEST_TYPES,
  IT_EQUIPMENT_ITEMS,
  getEquipmentDepartmentOptions,
  equipmentHasValue,
  toggleEquipmentList,
  getRequestTypeLabel,
  formatEquipmentItemsList,
  validateEquipmentPhase,
  buildITEquipmentTicket,
});
