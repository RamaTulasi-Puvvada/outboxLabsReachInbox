import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Clock,
  Inbox,
  LogOut,
  Mail,
  Menu,
  Plus,
  Search,
  Send,
  Settings,
  Slack,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { EmailJob, User } from '../types';
import { connectSlack, getScheduled, getSent } from '../services/api';

function getUser(): User | null {
  try {
    const raw = localStorage.getItem('reachinbox_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function List({ mode }: { mode: 'scheduled' | 'sent' }) {
  const user = getUser()!;
  const [emails, setEmails] = useState<EmailJob[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    let live = true;
    setLoading(true);

    const fetchTask =
      mode === 'scheduled' ? getScheduled(user.id, q) : getSent(user.id, q);

    fetchTask
      .then((d) => live && setEmails(d))
      .catch(
        (e) =>
          live && setError(e?.response?.data?.error || 'Unable to load emails.')
      )
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
  }, [mode, q, user.id]);

  return (
    <div className="p-5 md:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-emerald-600">
            {mode === 'scheduled' ? 'Queue' : 'Mailbox'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            {mode === 'scheduled' ? 'Scheduled emails' : 'Sent emails'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {mode === 'scheduled'
              ? 'Review upcoming deliveries and rate-limit status.'
              : 'Search your delivered and failed email history.'}
          </p>
        </div>
        <button
          className="btn-primary sm:ml-auto"
          onClick={() => nav('/dashboard/compose')}
        >
          <Plus size={17} />
          Compose New Email
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-100 bg-white p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={17}
            />
            <input
              className="field rounded-full bg-gray-50 pl-10"
              placeholder="Search recipient, subject or body…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="text-xs text-gray-400">
            {emails.length} result{emails.length === 1 ? '' : 's'}
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-gray-50"
              />
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="p-14 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-500">
              {mode === 'scheduled' ? (
                <Clock size={21} />
              ) : (
                <Send size={21} />
              )}
            </div>
            <h3 className="mt-4 text-sm font-semibold text-gray-800">
              No {mode} emails
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {q ? 'Try a different search.' : 'Create a campaign to see it here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {emails.map((e) => (
              <button
                key={e.id}
                onClick={() => nav(`/dashboard/email/${e.id}`)}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-gray-50"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-sm font-semibold text-gray-500">
                  {e.recipientEmail.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {e.subject}
                    </p>
                    <Status status={e.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-400">
                    {e.recipientEmail} ·{' '}
                    {mode === 'scheduled'
                      ? new Date(e.scheduledAt).toLocaleString()
                      : e.sentAt
                      ? new Date(e.sentAt).toLocaleString()
                      : '—'}
                  </p>
                </div>
                <span className="hidden max-w-[280px] truncate text-xs text-gray-400 md:block">
                  {e.body}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Status({ status }: { status: string }) {
  const cls =
    status === 'SENT'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'FAILED'
      ? 'bg-red-50 text-red-700'
      : status === 'RATE_LIMITED'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-blue-50 text-blue-700';

  return <span className={`pill ${cls}`}>{status.replace('_', ' ')}</span>;
}

export default function DashboardLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const user = getUser();

  const [mobile, setMobile] = useState(false);
  const [slackOpen, setSlackOpen] = useState(false);
  const [webhook, setWebhook] = useState('');
  const [slackMsg, setSlackMsg] = useState('');

  useEffect(() => {
    if (!user) nav('/login', { replace: true });
  }, [user, nav]);

  if (!user) return null;

  const active = loc.pathname.includes('/sent')
    ? 'sent'
    : loc.pathname.includes('/compose')
    ? 'compose'
    : 'scheduled';

  const logout = () => {
    localStorage.removeItem('reachinbox_user');
    nav('/login', { replace: true });
  };

  const saveSlack = async () => {
    try {
      await connectSlack(user.id, webhook);
      setSlackMsg('Slack webhook connected.');
      setTimeout(() => setSlackMsg(''), 2500);
    } catch {
      setSlackMsg('Could not connect Slack.');
    }
  };

  const Sidebar = () => (
    <aside
      className={`${
        mobile ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'
      } w-64 shrink-0 flex-col border-r border-gray-100 bg-white lg:relative lg:flex`}
    >
      <div className="flex h-20 items-center gap-2 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500 text-white">
          <Mail size={17} />
        </div>
        <span className="font-semibold text-gray-900">ReachInbox</span>
        {mobile && (
          <button
            className="ml-auto text-gray-400"
            onClick={() => setMobile(false)}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="px-4">
        <button
          className="btn-secondary w-full border-emerald-300 text-emerald-700"
          onClick={() => {
            nav('/dashboard/compose');
            setMobile(false);
          }}
        >
          <Plus size={16} />
          Compose
        </button>
      </div>

      <div className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-gray-400">
        Mailbox
      </div>

      <nav className="mt-2 space-y-1 px-3">
        <button
          onClick={() => {
            nav('/dashboard/scheduled');
            setMobile(false);
          }}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium ${
            active === 'scheduled'
              ? 'bg-emerald-50 text-emerald-800'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-3">
            <Clock size={17} />
            Scheduled
          </span>
          <span className="text-[10px]">Queue</span>
        </button>

        <button
          onClick={() => {
            nav('/dashboard/sent');
            setMobile(false);
          }}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium ${
            active === 'sent'
              ? 'bg-emerald-50 text-emerald-800'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-3">
            <Send size={17} />
            Sent
          </span>
        </button>
      </nav>

      <div className="mt-auto border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
          <img
            src={
              user.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.name
              )}&background=d1fae5&color=047857`
            }
            className="h-9 w-9 rounded-full"
            alt={user.name}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-800">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-gray-400">{user.email}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="text-gray-400 hover:text-gray-700"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8faf9]">
      <Sidebar />

      {mobile && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/20 lg:hidden"
          onClick={() => setMobile(false)}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-gray-100 bg-white/90 px-4 backdrop-blur md:px-7">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-gray-500 lg:hidden"
              onClick={() => setMobile(true)}
            >
              <Menu size={19} />
            </button>
            <div className="hidden items-center gap-2 rounded-full bg-gray-50 px-3 py-2 text-xs text-gray-400 md:flex">
              <Inbox size={15} />
              Workspace / {active}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSlackOpen((v) => !v)}
              className="btn-secondary px-3 py-2 text-xs"
            >
              <Slack size={15} className="text-emerald-600" />
              <span className="hidden sm:inline">Connect Slack</span>
            </button>

            <div className="ml-1 flex items-center gap-2 border-l border-gray-100 pl-3">
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name
                  )}&background=d1fae5&color=047857`
                }
                className="h-8 w-8 rounded-full"
                alt={user.name}
              />
              <div className="hidden text-left sm:block">
                <p className="max-w-[150px] truncate text-xs font-semibold text-gray-800">
                  {user.name}
                </p>
                <p className="max-w-[150px] truncate text-[10px] text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </header>

        {slackOpen && (
          <div className="absolute right-5 top-[72px] z-20 w-[330px] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Settings size={16} />
              Slack alerts
            </div>
            <p className="mt-1 text-xs leading-5 text-gray-400">
              Paste a Slack Incoming Webhook URL to receive a live alert when
              an hourly sender limit is reached.
            </p>
            <input
              className="field mt-3"
              placeholder="https://hooks.slack.com/services/..."
              value={webhook}
              onChange={(e) => setWebhook(e.target.value)}
            />
            <button className="btn-primary mt-3 w-full" onClick={saveSlack}>
              Save webhook
            </button>
            {slackMsg && (
              <p className="mt-2 text-xs text-emerald-600">{slackMsg}</p>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

DashboardLayout.List = List;