import { useEffect, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Clock,
  Mail,
  Star,
  Trash2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEmail } from '../services/api';
import type { EmailJob } from '../types';

export default function EmailDetailView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [email, setEmail] = useState<EmailJob | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const u = JSON.parse(
      localStorage.getItem('reachinbox_user') || 'null'
    );
    if (id && u) {
      getEmail(id, u.id)
        .then(setEmail)
        .catch((e) =>
          setError(e?.response?.data?.error || 'Email not found.')
        );
    }
  }, [id]);

  if (error) {
    return (
      <div className="p-8">
        <button
          onClick={() => nav('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← Back
        </button>
        <p className="mt-8 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!email) {
    return <div className="p-8 text-sm text-gray-400">Loading email…</div>;
  }

  const status = email.status;

  return (
    <div className="mx-auto max-w-4xl p-5 md:p-8">
      {/* Navigation & Action Bar */}
      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-5">
        <button
          onClick={() => nav('/dashboard')}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="flex items-center gap-2 text-gray-300">
          <button className="p-1 hover:text-gray-500">
            <Star size={18} />
          </button>
          <button className="p-1 hover:text-gray-500">
            <Archive size={18} />
          </button>
          <button className="p-1 hover:text-gray-500">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <article className="card p-6 md:p-8">
        {/* Recipient Header */}
        <div className="flex flex-col gap-5 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500 font-semibold text-white">
              {email.recipientEmail.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {email.recipientEmail}
              </p>
              <p className="text-xs text-gray-400">
                from sender account · ReachInbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`pill ${
                status === 'SENT'
                  ? 'bg-emerald-50 text-emerald-700'
                  : status === 'FAILED'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Subject & Timing Meta */}
        <div className="mt-7">
          <h1 className="text-xl font-semibold text-gray-900">
            {email.subject}
          </h1>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              Scheduled {new Date(email.scheduledAt).toLocaleString()}
            </span>
            {email.sentAt && (
              <span className="flex items-center gap-1.5">
                <Mail size={14} />
                Sent {new Date(email.sentAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-gray-700">
          {email.body}
        </div>

        {/* Delivery Errors */}
        {email.errorMessage && (
          <div className="mt-7 rounded-xl border border-red-100 bg-red-50 p-4 text-xs text-red-700">
            <b>Delivery error:</b> {email.errorMessage}
          </div>
        )}
      </article>
    </div>
  );
}