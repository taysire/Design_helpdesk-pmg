// ServiceView — route unique vers les formulaires de demande de service

function resolveServiceForm(serviceId) {
  const map = {
    'special-it': 'SpecialServiceForm',
    'employee-arrival': 'OnboardingArrivalForm',
    'employee-departure': 'EmployeeDepartureForm',
    'it-equipment': 'ITEquipmentRequestForm',
  };
  const key = map[serviceId];
  return key ? window[key] : null;
}

function ServiceView({ serviceId, onCancel, onSubmit }) {
  const { t } = useI18n();
  const Form = resolveServiceForm(serviceId);

  if (!Form) {
    return (
      <div className="hd-page-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
        <EmptyState icon="help">{t('home.serviceNotFound')}</EmptyState>
        <Button variant="secondary" size="md" onClick={onCancel}>{t('home.articleModalClose')}</Button>
      </div>
    );
  }

  return <Form onCancel={onCancel} onSubmit={onSubmit}/>;
}

Object.assign(window, { ServiceView, resolveServiceForm });
