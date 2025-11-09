'use client';

import { useState } from 'react';

type QuickLinkButtonProps = {
  label: string;
  description: string;
  value: string;
  href?: string;
};

export function QuickLinkButton({ label, description, value, href }: QuickLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy automation command', error);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-zinc-900">{label}</span>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-blue-600 hover:border-blue-500 hover:text-blue-700"
          >
            Open
          </a>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-blue-600 hover:border-blue-500 hover:text-blue-700"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
      <p>{description}</p>
      {!href && (
        <code className="mt-1 block overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-50">{value}</code>
      )}
    </div>
  );
}
