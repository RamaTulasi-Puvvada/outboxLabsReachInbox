import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  ArrowLeft,
  Clock,
  FileText,
  Mail,
  Send,
  Upload,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { scheduleEmails } from '../services/api';
import type { SchedulePayload } from '../types';

function user() {
  return JSON.parse(localStorage.getItem('reachinbox_user') || 'null');
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ComposeView() {
  const nav = useNavigate();
  const u = user();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [start, setStart] = useState('');
  const [delay, setDelay] = useState(2000);
  const [limit, setLimit] = useState(200);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const detected = useMemo(() => recipients.length, [recipients]);

  const handleFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<string[]>(file, {
      complete: (result) => {
        const found: string[] = [];
        for (const row of result.data as any[]) {
          const cells = Array.isArray(row) ? row : Object.values(row || {});
          for (const value of cells) {
            if (typeof value === 'string') {
              for (const token of value.split(/[\s,;]+/)) {
                const v = token.trim().replace(/^['"]|['"]$/g, '');
                if (emailRe.test(v)) found.push(v.toLowerCase());
              }
            }
          }
        }
        setRecipients([...new Set(found)]);
      },
      error: () => setMessage('Could not read that file.'),
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!u) {
      nav('/login');
      return;
    }

    if (!start || new Date(start).getTime() < Date.now()) {
      return setMessage('Choose a future start time.');
    }

    if (!recipients.length) {
      return setMessage(
        'Upload a CSV or TXT file containing at least one valid email address.'
      );
    }

    try {
      setLoading(true);
      const payload: SchedulePayload = {
        userId: u.id,
        recipients,
        subject,
        body,
        startTime: new Date(start).toISOString(),
        delayBetweenEmailsMs: Number(delay),
        hourlyLimit: Number(limit),
      };

      const result = await scheduleEmails(payload);
      setMessage(
        `Scheduled ${result.count} email${
          result.count === 1 ? '' : 's'
        } successfully.`
      );
      setTimeout(() => nav('/dashboard/scheduled'), 700);
    } catch (err: any) {
      setMessage(
        err?.response?.data?.error ||
          'Scheduling failed. Check that the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-5 md:p-8">
      <button
        onClick={() => nav('/dashboard/scheduled')}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft size={16} />
        Back to scheduled
      </button>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-600">
          New campaign
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">
          Compose email campaign
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Build a batch, choose the start time and let BullMQ handle delivery.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Message Section */}
        <section className="card p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Mail size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Message</h2>
              <p className="text-xs text-gray-400">
                The same message is sent to every lead.
              </p>
            </div>
          </div>

          <label className="label">Subject</label>
          <input
            className="field mb-4"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="e.g. Quick intro from ReachInbox"
          />

          <label className="label">Body</label>
          <textarea
            className="field min-h-44 resize-y leading-6"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            placeholder="Write your email message…"
          />
        </section>

        {/* Lead List Section */}
        <section className="card p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Lead list</h2>
              <p className="text-xs text-gray-400">
                CSV or TXT files are parsed locally before upload.
              </p>
            </div>
          </div>

          <input
            id="lead-file"
            className="hidden"
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          <label
            htmlFor="lead-file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60 px-5 py-10 text-center hover:border-emerald-300 hover:bg-emerald-50/30"
          >
            <Upload className="text-emerald-500" size={23} />
            <span className="mt-3 text-sm font-semibold text-gray-700">
              Upload lead list
            </span>
            <span className="mt-1 text-xs text-gray-400">
              CSV or TXT · email addresses anywhere in the file
            </span>
          </label>

          {fileName && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
              <FileText size={17} className="text-emerald-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-emerald-800">
                  {fileName}
                </p>
                <p className="text-xs text-emerald-600">
                  Detected {detected} unique email address
                  {detected === 1 ? '' : 'es'}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Delivery Settings Section */}
        <section className="card p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Clock size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Delivery settings</h2>
              <p className="text-xs text-gray-400">
                Controls are persisted with each scheduled campaign.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Start time</label>
              <input
                className="field"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Delay between emails</label>
              <div className="relative">
                <input
                  className="field pr-16"
                  type="number"
                  min="0"
                  step="100"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                />
                <span className="absolute right-3 top-3 text-xs text-gray-400">
                  ms
                </span>
              </div>
            </div>

            <div>
              <label className="label">Hourly sender limit</label>
              <input
                className="field"
                type="number"
                min="1"
                max="100000"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`rounded-xl border p-3 text-sm ${
              message.startsWith('Scheduled')
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-amber-100 bg-amber-50 text-amber-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => nav('/dashboard/scheduled')}
          >
            Cancel
          </button>

          <button className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="animate-pulse">Scheduling…</span>
            ) : (
              <>
                <Send size={16} />
                Schedule campaign
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}