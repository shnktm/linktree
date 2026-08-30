export interface ActivityItem {
  id: string;
  source: string;
  title: string;
  url?: string;
  occurredAt?: string;
}

export interface ActivityAdapter {
  source: string;
  listRecent(userId: string): Promise<ActivityItem[]>;
}

// Adapters serão registrados quando as integrações sociais forem implementadas.
export const activityAdapters: ActivityAdapter[] = [];
