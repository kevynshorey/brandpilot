import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  published: 'bg-green-50 text-green-700',
  archived: 'bg-gray-100 text-gray-500',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full capitalize', styles[status] || styles.draft)}>
      {status}
    </span>
  );
}
