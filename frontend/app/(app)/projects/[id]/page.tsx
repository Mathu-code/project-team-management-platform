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

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

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
      await loadProject();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create task');
    }
  }

  async function openTask(task: Task) {
    setSelectedTask(task);
    try {
      const data = await api.get<{ task: Task }>(`/tasks/${task.id}`);
      setSelectedTask(data.task);
      setComments(data.task.comments ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load task');
    }
  }

  async function updateTaskStatus(status: TaskStatus) {
    if (!selectedTask) return;
    try {
      const data = await api.patch<{ task: Task }>(`/tasks/${selectedTask.id}`, { status });
      setSelectedTask(data.task);
      await loadProject();
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
                  <span className="font-medium text-slate-800">{t.title}</span>
                  <span className="flex items-center gap-2">
                    <Badge label={t.priority} kind="priority" />
                    <Badge label={t.status} kind="task" />
                  </span>
                </button>
              </li>
            ))}
            {tasks.length === 0 && <li className="py-3 text-sm text-slate-500">No tasks yet.</li>}
          </ul>
        </section>
      </div>

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          comments={comments}
          isManager={!!isManager}
          canUpdate={isManager || selectedTask.assigneeId === user?.id}
          onClose={() => setSelectedTask(null)}
          onStatus={updateTaskStatus}
          onComment={addComment}
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
  isManager,
  canUpdate,
  onClose,
  onStatus,
  onComment,
}: {
  task: Task;
  comments: Comment[];
  isManager: boolean;
  canUpdate: boolean;
  onClose: () => void;
  onStatus: (s: TaskStatus) => void;
  onComment: (c: string) => void;
}) {
  const [text, setText] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-800">{task.title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <p className="mt-2 text-sm text-slate-500">{task.description ?? 'No description'}</p>

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
