export interface PendingChange {
  id: string;
  deviceId: string;
  appUserId: string;
  changeSet: any;
  createdAt: Date;
  deliveredAt?: Date;
}