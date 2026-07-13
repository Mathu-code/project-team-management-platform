import {
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  Role,
} from '@/lib/types';

function cls(...c: string[]) {
  return c.join(' ');
}

const statusStyles: Record<string, string> = {
  PLANNING: 'bg-slate-100 text-slate-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  REVIEW: 'bg-purple-100 text-purple-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-sky-100 text-sky-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export function Badge({
  label,
  kind,
}: {
  label: string;
  kind: 'project' | 'task' | 'priority' | 'role' | 'plain';
}) {
  let style = 'bg-slate-100 text-slate-600';
  if (kind === 'project') style = statusStyles[label as ProjectStatus] ?? style;
  if (kind === 'task') style = statusStyles[label as TaskStatus] ?? style;
  if (kind === 'priority') style = statusStyles[label as TaskPriority] ?? style;
  if (kind === 'role') {
    style =
      label === 'ADMIN'
        ? 'bg-rose-100 text-rose-700'
        : label === 'PROJECT_MANAGER'
          ? 'bg-brand-100 text-brand-700'
          : 'bg-teal-100 text-teal-700';
  }
  return (
    <span className={cls('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', style)}>
      {label.replace(/_/g, ' ')}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge label={role} kind="role" />;
}
