interface StatCardProps {
  label: string;
  value: number | string;
  loading?: boolean;
}

export default function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <div className="rounded-cards bg-surface shadow-surface p-5">
      <p className="text-[12px] text-muted mb-2">{label}</p>
      {loading ? (
        <div className="h-8 w-12 rounded bg-default animate-pulse" />
      ) : (
        <p className="text-[32px] font-semibold text-foreground leading-none tracking-tight">{value}</p>
      )}
    </div>
  );
}
