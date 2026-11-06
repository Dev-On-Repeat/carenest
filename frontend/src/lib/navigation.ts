import { Home, Pill, CalendarClock, Camera, ScanSearch, MessageCircleQuestion, ScrollText, Users, Settings } from 'lucide-react';

/** One navigation inventory for the sidebar and the mobile disclosure. */
export const NAVIGATION = [
  { labelKey: 'navGroupToday', items: [
    { to: '/', labelKey: 'navHome', enLabel: 'Overview', icon: Home },
    { to: '/medicines', labelKey: 'navMedicines', enLabel: 'Medicines', icon: Pill },
    { to: '/schedule', labelKey: 'navSchedule', enLabel: 'Schedule', icon: CalendarClock },
  ] },
  { labelKey: 'navGroupTools', items: [
    { to: '/scan', labelKey: 'navScan', enLabel: 'Scan prescription', icon: Camera },
    { to: '/identify', labelKey: 'navIdentify', enLabel: 'Pill identifier', icon: ScanSearch },
    { to: '/assistant', labelKey: 'navAsk', enLabel: 'Ask CareNest', icon: MessageCircleQuestion },
  ] },
  { labelKey: 'navGroupAccount', items: [
    { to: '/history', labelKey: 'navHistory', enLabel: 'Dose history', icon: ScrollText },
    { to: '/caregiver', labelKey: 'navCaregiver', enLabel: 'Care circle', icon: Users },
    { to: '/settings', labelKey: 'navSettings', enLabel: 'Settings', icon: Settings },
  ] },
] as const;
