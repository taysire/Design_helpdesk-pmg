// notifications-client — toasts et libellés notifications API (Phase 4)

const NOTIFICATION_CHANNEL_LABELS = {
  fr: { email: 'Courriel', slack: 'Slack', jira: 'Jira' },
  en: { email: 'Email', slack: 'Slack', jira: 'Jira' },
};

function notificationChannelLabel(channel, lang = 'fr') {
  return NOTIFICATION_CHANNEL_LABELS[lang]?.[channel] || channel;
}

function summarizeNotifications(notifications, lang = 'fr') {
  const sent = (notifications || []).filter(n => n.status === 'sent');
  if (!sent.length) return null;
  const channels = [...new Set(sent.map(n => notificationChannelLabel(n.channel, lang)))];
  return channels.join(', ');
}

function showNotificationToasts(notifications, showToast, t, lang = 'fr') {
  const sent = (notifications || []).filter(n => n.status === 'sent');
  if (!sent.length) return;
  const summary = summarizeNotifications(sent, lang);
  showToast('success', t('toast.notifySentTitle'), t('toast.notifySentBody', { channels: summary }));
}

Object.assign(window, {
  notificationChannelLabel,
  summarizeNotifications,
  showNotificationToasts,
});
