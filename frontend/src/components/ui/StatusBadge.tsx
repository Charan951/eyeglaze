const colors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-purple-500/20 text-purple-400',
  shipped: 'bg-cyan-500/20 text-cyan-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
  returned: 'bg-orange-500/20 text-orange-400',
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = colors[status] || 'bg-gray-500/20 text-gray-400';
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase ${cls}`}>
      {status}
    </span>
  );
}
