export interface RecentActivity {
  id: string;
  title: string;
  reference: string;
  at: string;
}

export interface HomeSummary {
  transactionsToday: number;
  receiptsMtd: number;
  disbursementsMtd: number;
  cashBalance: number;
  recentActivities: RecentActivity[];
}
