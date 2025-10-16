import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum NotificationType {
  EMPLOYEE_ADDED = 'employee_added',
  ABSENCE_ADDED = 'absence_added',
  PAYROLL_PROCESSED = 'payroll_processed',
  PRODUCTIVITY_REPORT = 'productivity_report',
  CATEGORY_UPDATE = 'category_update',
  EVALUATION_REMINDER = 'evaluation_reminder',
  HOLIDAY_REMINDER = 'holiday_reminder',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  BIRTHDAY_REMINDER = 'birthday_reminder',
  CUSTOM_NOTIFICATION = 'custom_notification'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType
  })
  type: NotificationType;

  @Column({ default: false })
  is_read: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ nullable: true })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  created_at: Date;
}
