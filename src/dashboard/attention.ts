import type { AttentionItem } from './types'

type AttentionInput = {
  overdueTasks: number
  absentEmployees: number
  expiredTraining: number
  expiredDocuments: number
  pendingLeave: number
  trainingExpiringSoon: number
  documentsExpiringSoon: number
  lateEmployees: number
}

export function getAttentionItems(input: AttentionInput): AttentionItem[] {
  const items: AttentionItem[] = []

  if (input.overdueTasks > 0) {
    items.push({
      severity: 'urgent',
      label: 'Tasks overdue',
      count: input.overdueTasks,
      href: '/tasks',
      actionLabel: 'View Tasks',
    })
  }

  if (input.absentEmployees > 0) {
    items.push({
      severity: 'urgent',
      label: 'Absent employees',
      count: input.absentEmployees,
      href: '/attendance',
      actionLabel: 'View Attendance',
    })
  }

  if (input.expiredTraining > 0) {
    items.push({
      severity: 'urgent',
      label: 'Training records expired',
      count: input.expiredTraining,
      href: '/training',
      actionLabel: 'View Training',
    })
  }

  if (input.expiredDocuments > 0) {
    items.push({
      severity: 'urgent',
      label: 'Documents expired',
      count: input.expiredDocuments,
      href: '/documents',
      actionLabel: 'View Documents',
    })
  }

  if (input.pendingLeave > 0) {
    items.push({
      severity: 'attention',
      label: 'Leave requests awaiting approval',
      count: input.pendingLeave,
      href: '/leave',
      actionLabel: 'View Leave',
    })
  }

  if (input.trainingExpiringSoon > 0) {
    items.push({
      severity: 'attention',
      label: 'Training expiring soon',
      count: input.trainingExpiringSoon,
      href: '/training',
      actionLabel: 'View Training',
    })
  }

  if (input.documentsExpiringSoon > 0) {
    items.push({
      severity: 'attention',
      label: 'Documents expiring soon',
      count: input.documentsExpiringSoon,
      href: '/documents',
      actionLabel: 'View Documents',
    })
  }

  if (input.lateEmployees > 0) {
    items.push({
      severity: 'attention',
      label: 'Late employees',
      count: input.lateEmployees,
      href: '/attendance',
      actionLabel: 'View Attendance',
    })
  }

  return items
}
