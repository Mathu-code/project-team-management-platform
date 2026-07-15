'use client';

import { use, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import {
  Project,
  Task,
  User,
  Comment,
  Attachment,
  TaskStatus,
  TaskPriority,
  TASK_STATUSES,
  TASK_PRIORITIES,
  MemberRole,
} from '@/lib/types';
import { Badge } from '@/components/badges';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const user = getStoredUser<User>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [available, setAvailable] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showOverdue, setShowOverdue] = useState(false);
  const [showAttachForm, setShowAttachForm] = useState(false);
  const [attachFile, setAttachFile] = useState<File | null>(null);

  const isManager =
    user?.role === 'ADMIN' || project?.createdById === user?.id;

  async function loadProject() {
    try {
      const data = await api.get<{ project: Project }>(`/projects/${projectId}`);
      setProject(data.project);
      setTasks(data.project.tasks ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load project');
    }
  }

  async function loadTasks() {
    try {
      const q: Record<string, string> = {};
      if (statusFilter) q.status = statusFilter;
      if (priorityFilter) q.priority = priorityFilter;
      if (searchFilter) q.search = searchFilter;
      if (sortBy) q.sortBy = sortBy;
      if (sortOrder) q.sortOrder = sortOrder;
      if (showOverdue) q.overdue = 'true';
      const data = await api.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`, q);
      setTasks(data.tasks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load tasks');
    }
  }

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (project) loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, searchFilter, sortBy, sortOrder, showOverdue]);

  async function loadAvailable() {
    if (!isManager) return;
    try {
      const data = await api.get<{ users: User[] }>(`/projects/${projectId}/available-users`);
      setAvailable(data.users);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (isManager) loadAvailable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager, projectId]);

  async function addMember(userId: string) {
    try {
      await api.post(`/projects/${projectId}/members`, { userId, role: 'MEMBER' as MemberRole });
      await loadProject();
      await loadAvailable();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to add member');
    }
  }

  async function removeMember(userId: string) {
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      await loadProject();
      await loadAvailable();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to remove member');
    }
  }

  async function createTask(form: { title: string; priority: TaskPriority; assigneeId: string | null }) {
    try {
      await api.post(`/projects/${projectId}/tasks`, {
        title: form.title,
        priority: form.priority,
        assigneeId: form.assigneeId || null,
      });
      await loadTasks();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create task');
    }
  }

  async function openTask(task: Task) {
    setSelectedTask(task);
    setShowAttachForm(false);
    setAttachFile(null);
    try {
      const data = await api.get<{ task: Task }>(`/tasks/${task.id}`);
      setSelectedTask(data.task);
      setComments(data.task.comments ?? []);
      setAttachments(data.task.attachments ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load task');
    }
  }

  async function updateTaskStatus(status: TaskStatus) {
    if (!selectedTask) return;
    try {
      const data = await api.patch<{ task: Task }>(`/tasks/${selectedTask.id}`, { status });
      setSelectedTask(data.task);
      await loadTasks();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update task');
    }
  }

  async function addComment(content: string) {
    if (!selectedTask) return;
    try {
      await api.post(`/tasks/${selectedTask.id}/comments`, { content });
      const data = await api.get<{ task: Task }>(`/tasks/${selectedTask.id}`);
      setSelectedTask(data.task);
      setComments(data.task.comments ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to add comment');
    }
  }

  async function addAttachment() {
    if (!selectedTask || !attachForm.filename || !attachForm.url) return;
    try {
      await api.post(`/tasks/${selectedTask.id}/attachments`, attachForm);
      setShowAttachForm(false);
      setAttachForm({ filename: '', mimeType: 'image/png', size: 0, url: '' });
      const data = await api.get<{ task: Task }>(`/tasks/${selectedTask.id}`);
      setSelectedTask(data.task);
      setAttachments(data.task.attachments ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to add attachment');
    }
  }

  async function deleteAttachment(attachmentId: string) {
    if (!selectedTask) return;
    try {
      await api.delete(`/tasks/${selectedTask.id}/attachments/${attachmentId}`);
      const data = await api.get<{ task: Task }>(`/tasks/${selectedTask.id}`);
      setSelectedTask(data.task);
      setAttachments(data.task.attachments ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to delete attachment');
    }
  }

  const isOverdue = (dueDate: string | null, status: TaskStatus) => {
    if (!dueDate || status === 'DONE') return false;
    return new Date(dueDate) < new Date();
  };

  const statusCounts: Record<string, number> = {};
  for (const t of tasks) {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  }

  if (error) return <div className="rounded-md bg-red-50 p-3 text-red-700">{error}</div>;
  if (!project) return <div className="text-slate-400">Loading…</div>;

  return (
    <div>
      <Link href="/projects" className="text-sm text-brand-600 hover:underline">
        ← Back to projects
      </Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{project.description ?? 'No description'}</p>
        </div>
        <Badge label={project.status} kind="project" />
      </div>

      {/* Status Summary */}
      <div className="mt-4 flex flex-wrap gap-2">
        {TASK_STATUSES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {s}: {statusCounts[s] || 0}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Members */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Members ({project.members?.length ?? 0})</h2>
          <ul className="mt-3 space-y-2">
            {project.members?.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span>
                  {m.user.name}{' '}
                  <span className="text-xs text-slate-400">({m.role})</span>
                </span>
                {isManager && m.user.id !== project.createdById && (
                  <button onClick={() => removeMember(m.user.id)}
                    className="text-xs text-red-600 hover:underline">Remove</button>
                )}
              </li>
            ))}
          </ul>

          {isManager && available.length > 0 && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-slate-600">Add member</label>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) addMember(e.target.value);
                }}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm">
                <option value="" disabled>Select a user…</option>
                {available.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          )}
        </section>

        {/* Tasks */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-slate-800">Tasks ({tasks.length})</h2>

          {/* Filters */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">All Statuses</option>
              {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">All Priorities</option>
              {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search tasks..."
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="createdAt">Sort: Created</option>
              <option value="dueDate">Sort: Due Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="status">Sort: Status</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <label className="flex items-center gap-1 text-sm text-slate-600">
              <input type="checkbox" checked={showOverdue} onChange={(e) => setShowOverdue(e.target.checked)} />
              Overdue
            </label>
          </div>

          {isManager && (
            <CreateTaskForm
              members={project.members ?? []}
              onCreate={createTask}
            />
          )}

          <ul className="mt-4 divide-y divide-slate-100">
            {tasks.map((t) => (
              <li key={t.id}>
                <button onClick={() => openTask(t)}
                  className="flex w-full items-center justify-between py-3 text-left text-sm hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{t.title}</span>
                    {isOverdue(t.dueDate, t.status) && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Overdue</span>
                    )}
                  </div>
                  <span className="flex items-center gap-2">
                    <Badge label={t.priority} kind="priority" />
                    <Badge label={t.status} kind="task" />
                  </span>
                </button>
              </li>
            ))}
            {tasks.length === 0 && <li className="py-3 text-sm text-slate-500">No tasks match the current filters.</li>}
          </ul>
        </section>
      </div>

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          comments={comments}
          attachments={attachments}
          isManager={!!isManager}
          canUpdate={isManager || selectedTask.assigneeId === user?.id}
          onClose={() => { setSelectedTask(null); setShowAttachForm(false); }}
          onStatus={updateTaskStatus}
          onComment={addComment}
          onAddAttachment={addAttachment}
          onDeleteAttachment={deleteAttachment}
          showAttachForm={showAttachForm}
          setShowAttachForm={setShowAttachForm}
          attachForm={attachForm}
          setAttachForm={setAttachForm}
        />
      )}
    </div>
  );
}

function CreateTaskForm({
  members,
  onCreate,
}: {
  members: { user: User }[];
  onCreate: (f: { title: string; priority: TaskPriority; assigneeId: string | null }) => void;
}) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title) return;
        onCreate({ title, priority, assigneeId: assigneeId || null });
        setTitle('');
        setAssigneeId('');
      }}
      className="mt-3 flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-3"
    >
      <div className="flex-1">
        <input required placeholder="Task title"
          value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none" />
      </div>
      <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
        <option value="">Unassigned</option>
        {members.map((m) => (
          <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
        ))}
      </select>
      <button className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
        Add
      </button>
    </form>
  );
}

function TaskDrawer({
  task,
  comments,
  attachments,
  isManager,
  canUpdate,
  onClose,
  onStatus,
  onComment,
  onAddAttachment,
  onDeleteAttachment,
  showAttachForm,
  setShowAttachForm,
  attachForm,
  setAttachForm,
}: {
  task: Task;
  comments: Comment[];
  attachments: Attachment[];
  isManager: boolean;
  canUpdate: boolean;
  onClose: () => void;
  onStatus: (s: TaskStatus) => void;
  onComment: (c: string) => void;
  onAddAttachment: () => void;
  onDeleteAttachment: (id: string) => void;
  showAttachForm: boolean;
  setShowAttachForm: (v: boolean) => void;
  attachForm: { filename: string; mimeType: string; size: number; url: string };
  setAttachForm: (f: { filename: string; mimeType: string; size: number; url: string }) => void;
}) {
  const [text, setText] = useState('');
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-800">{task.title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <p className="mt-2 text-sm text-slate-500">{task.description ?? 'No description'}</p>

        {isOverdue && (
          <div className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">Overdue — due {new Date(task.dueDate!).toLocaleDateString()}</div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-slate-600">Status:</span>
          {canUpdate ? (
            <select value={task.status}
              onChange={(e) => onStatus(e.target.value as TaskStatus)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm">
              {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <Badge label={task.status} kind="task" />
          )}
          <Badge label={task.priority} kind="priority" />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Assignee: {task.assignee?.name ?? 'Unassigned'}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}
        </p>

        <h4 className="mt-6 font-semibold text-slate-700">Attachments</h4>
        <ul className="mt-2 space-y-2">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-md bg-slate-50 p-2 text-sm">
              <a href={a.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline truncate">
                {a.filename}
              </a>
              <span className="text-xs text-slate-400">{a.uploadedBy?.name}</span>
              {(isManager || a.uploadedById === task.assigneeId) && (
                <button onClick={() => onDeleteAttachment(a.id)} className="text-xs text-red-600 hover:underline">Delete</button>
              )}
            </li>
          ))}
          {attachments.length === 0 && <li className="text-sm text-slate-400">No attachments.</li>}
        </ul>

        {(isManager || task.assigneeId === task.createdById) && (
          <div className="mt-3">
            {!showAttachForm ? (
              <button onClick={() => setShowAttachForm(true)} className="text-sm text-brand-600 hover:underline">+ Add attachment</button>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); onAddAttachment(); }}
                className="mt-2 flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-3">
                <input required placeholder="Filename" value={attachForm.filename}
                  onChange={(e) => setAttachForm({ ...attachForm, filename: e.target.value })}
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                <input required placeholder="URL" value={attachForm.url}
                  onChange={(e) => setAttachForm({ ...attachForm, url: e.target.value })}
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                <input type="number" required placeholder="Size (bytes)" value={attachForm.size}
                  onChange={(e) => setAttachForm({ ...attachForm, size: parseInt(e.target.value) || 0 })}
                  className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                <button className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">Save</button>
              </form>
            )}
          </div>
        )}

        <h4 className="mt-6 font-semibold text-slate-700">Comments</h4>
        <ul className="mt-2 space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md bg-slate-50 p-2 text-sm">
              <span className="font-medium text-slate-700">{c.user.name}</span>
              <p className="text-slate-600">{c.content}</p>
            </li>
          ))}
          {comments.length === 0 && <li className="text-sm text-slate-400">No comments yet.</li>}
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text) return;
            onComment(text);
            setText('');
          }}
          className="mt-3 flex gap-2"
        >
          <input value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none" />
          <button className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
