// Schéma — Demande spéciale TI (assistant intelligent)

const SERVICE_CATEGORIES = [
  { id: 'reports', labelKey: 'serviceForm.categories.reports' },
  { id: 'supply', labelKey: 'serviceForm.categories.supply' },
  { id: 'software', labelKey: 'serviceForm.categories.software' },
  { id: 'access', labelKey: 'serviceForm.categories.access' },
  { id: 'process', labelKey: 'serviceForm.categories.process' },
  { id: 'information', labelKey: 'serviceForm.categories.information' },
  { id: 'other', labelKey: 'serviceForm.categories.other' },
];

const SERVICE_CATEGORY_FIELDS = {
  reports: ['request_title', 'objective', 'info_needed', 'desired_date', 'urgency', 'detailed_description'],
  supply: ['process_concerned', 'operational_impact', 'expected_outcome', 'desired_date', 'detailed_description'],
  access: ['application', 'access_type', 'affected_user', 'justification', 'desired_date'],
  software: ['software_name', 'software_usefulness', 'users_count', 'justification', 'detailed_description'],
  process: ['process_concerned', 'operational_impact', 'expected_outcome', 'desired_date', 'detailed_description'],
  information: ['request_title', 'info_needed', 'desired_date', 'detailed_description'],
  other: ['request_title', 'detailed_description', 'expected_outcome'],
};

const SERVICE_COMMON_TAIL = ['department', 'attachments'];

const SERVICE_FIELD_DEFS = {
  request_title: {
    id: 'request_title', type: 'text', required: true,
    labelKey: 'serviceForm.fields.requestTitle', placeholderKey: 'serviceForm.placeholders.requestTitle',
  },
  objective: {
    id: 'objective', type: 'textarea', required: true, rows: 3,
    labelKey: 'serviceForm.fields.objective', placeholderKey: 'serviceForm.placeholders.objective',
  },
  info_needed: {
    id: 'info_needed', type: 'textarea', required: true, rows: 3,
    labelKey: 'serviceForm.fields.infoNeeded', placeholderKey: 'serviceForm.placeholders.infoNeeded',
  },
  desired_date: {
    id: 'desired_date', type: 'text', required: true,
    labelKey: 'serviceForm.fields.desiredDate', placeholderKey: 'serviceForm.placeholders.desiredDate',
  },
  urgency: {
    id: 'urgency', type: 'choice', required: true,
    labelKey: 'serviceForm.fields.urgency',
    optionsKey: 'serviceForm.urgencyOptions',
  },
  detailed_description: {
    id: 'detailed_description', type: 'textarea', required: true, rows: 5,
    labelKey: 'serviceForm.fields.detailedDescription', placeholderKey: 'serviceForm.placeholders.detailedDescription',
  },
  process_concerned: {
    id: 'process_concerned', type: 'text', required: true,
    labelKey: 'serviceForm.fields.processConcerned', placeholderKey: 'serviceForm.placeholders.processConcerned',
  },
  operational_impact: {
    id: 'operational_impact', type: 'textarea', required: true, rows: 3,
    labelKey: 'serviceForm.fields.operationalImpact', placeholderKey: 'serviceForm.placeholders.operationalImpact',
  },
  expected_outcome: {
    id: 'expected_outcome', type: 'textarea', required: true, rows: 3,
    labelKey: 'serviceForm.fields.expectedOutcome', placeholderKey: 'serviceForm.placeholders.expectedOutcome',
  },
  application: {
    id: 'application', type: 'text', required: true,
    labelKey: 'serviceForm.fields.application', placeholderKey: 'serviceForm.placeholders.application',
  },
  access_type: {
    id: 'access_type', type: 'choice', required: true,
    labelKey: 'serviceForm.fields.accessType',
    optionsKey: 'serviceForm.accessTypeOptions',
  },
  affected_user: {
    id: 'affected_user', type: 'text', required: true,
    labelKey: 'serviceForm.fields.affectedUser', placeholderKey: 'serviceForm.placeholders.affectedUser',
  },
  justification: {
    id: 'justification', type: 'textarea', required: true, rows: 3,
    labelKey: 'serviceForm.fields.justification', placeholderKey: 'serviceForm.placeholders.justification',
  },
  software_name: {
    id: 'software_name', type: 'text', required: true,
    labelKey: 'serviceForm.fields.softwareName', placeholderKey: 'serviceForm.placeholders.softwareName',
  },
  software_usefulness: {
    id: 'software_usefulness', type: 'textarea', required: true, rows: 3,
    labelKey: 'serviceForm.fields.softwareUsefulness', placeholderKey: 'serviceForm.placeholders.softwareUsefulness',
  },
  users_count: {
    id: 'users_count', type: 'text', required: true,
    labelKey: 'serviceForm.fields.usersCount', placeholderKey: 'serviceForm.placeholders.usersCount',
  },
};

function resolveServiceFieldPath(category) {
  if (!category) return [];
  const specific = SERVICE_CATEGORY_FIELDS[category] || [];
  return [...specific, ...SERVICE_COMMON_TAIL];
}

function getServiceFieldDef(fieldId, t) {
  if (fieldId === 'department' || fieldId === 'attachments') {
    const base = window.FORM_STEP_DEFS?.[fieldId];
    if (base) return { ...base, label: base.label };
  }
  const def = SERVICE_FIELD_DEFS[fieldId];
  if (!def) return null;
  const out = {
    id: def.id,
    type: def.type,
    required: def.required !== false,
    label: t(def.labelKey),
    rows: def.rows,
    placeholder: def.placeholderKey ? t(def.placeholderKey) : undefined,
  };
  if (fieldId === 'urgency') {
    out.options = [
      t('serviceForm.urgencyLow'), t('serviceForm.urgencyNormal'),
      t('serviceForm.urgencyHigh'), t('serviceForm.urgencyUrgent'),
    ];
  }
  if (fieldId === 'access_type') {
    out.options = [
      t('serviceForm.accessRead'), t('serviceForm.accessWrite'),
      t('serviceForm.accessAdmin'), t('serviceForm.accessOther'),
    ];
  }
  if (fieldId === 'attachments') {
    out.hint = t('serviceForm.attachmentsHint');
    out.accept = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.xls,.xlsx,.doc,.docx';
  }
  return out;
}

function serviceHasValue(answers, fieldId) {
  const v = answers[fieldId];
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim() !== '';
}

function formatServiceValue(fieldId, value, t) {
  if (value == null) return '—';
  if (Array.isArray(value)) {
    return value.map(f => f.name || f).join(', ');
  }
  return String(value);
}

function getServiceCategoryLabel(categoryId, t) {
  const legacy = { bi: 'information' };
  const id = legacy[categoryId] || categoryId;
  const cat = SERVICE_CATEGORIES.find(c => c.id === id);
  return cat ? t(cat.labelKey) : categoryId || '—';
}

function getServiceAnswerRows(answers, t) {
  const cat = answers.serviceCategory;
  if (!cat) return [];
  const path = resolveServiceFieldPath(cat);
  return path
    .filter(id => serviceHasValue(answers, id))
    .map(id => {
      const def = getServiceFieldDef(id, t);
      return {
        id,
        label: def?.label || id,
        value: formatServiceValue(id, answers[id], t),
      };
    });
}

function mapServiceUrgencyToPriority(urgency) {
  const u = String(urgency || '').toLowerCase();
  if (u.includes('urgent') || u === 'urgent') return 'P2';
  if (u.includes('élev') || u.includes('elev') || u.includes('high')) return 'P3';
  return 'P4';
}

function buildServiceRequestBody(answers, t) {
  const lines = [`**${t('serviceForm.categoryLabel')}:** ${getServiceCategoryLabel(answers.serviceCategory, t)}`];
  getServiceAnswerRows(answers, t).forEach(r => {
    if (r.value && r.value !== '—') lines.push(`**${r.label}:** ${r.value}`);
  });
  return lines.join('\n');
}

function buildSpecialItTicket(answers, t) {
  const catLabel = getServiceCategoryLabel(answers.serviceCategory, t);
  const titleSrc = answers.request_title || answers.software_name || answers.application || catLabel;
  const title = `${t('services.specialIt.label')} — ${titleSrc}`.slice(0, 120);
  const priority = answers.urgency ? mapServiceUrgencyToPriority(answers.urgency) : 'P4';

  const formAnswers = {
    _serviceWizard: true,
    serviceCategory: answers.serviceCategory,
    ...answers,
  };

  return {
    id: 'REQ-' + String(Math.floor(8100 + Math.random() * 100)).padStart(4, '0'),
    title,
    category: 'service',
    serviceId: 'special-it',
    requestType: 'service',
    priority,
    status: 'new',
    reporter: 'me',
    assignee: null,
    opened: 'just now',
    updated: 'just now',
    body: buildServiceRequestBody(answers, t),
    formAnswers,
    jira: null,
    slack: null,
    activity: [{ who: 'me', kind: 'opened', text: t('services.specialIt.label'), at: 'just now' }],
  };
}

Object.assign(window, {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_FIELDS,
  SERVICE_FIELD_DEFS,
  resolveServiceFieldPath,
  getServiceFieldDef,
  serviceHasValue,
  getServiceAnswerRows,
  buildSpecialItTicket,
  getServiceCategoryLabel,
  mapServiceUrgencyToPriority,
});
