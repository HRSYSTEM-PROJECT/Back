import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum RecipientType {
  ALL = 'all',
  EMPLOYEES = 'employees',
  SPECIFIC = 'specific'
}

@Entity('scheduled_notifications')
export class ScheduledNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: RecipientType,
    default: RecipientType.ALL
  })
  recipient_type: RecipientType;

  @Column('text', { nullable: true })
  recipient_emails: string; // JSON array of emails

  @Column('text', { nullable: true })
  recipient_employee_ids: string; // JSON array of employee IDs

  @Column({ type: 'timestamp' })
  scheduled_date: Date;

  @Column({ default: false })
  is_executed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  executed_at: Date;

  @Column({ default: false })
  email_sent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  email_sent_at: Date;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ type: 'uuid' })
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn()
  created_at: Date;
}
