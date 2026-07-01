interface StatCardProps {
  label: string;
  value: number | string;
  loading?: boolean;
}

export default function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-[12px] text-muted mb-2">{label}</p>
      {loading ? (
        <div className="h-8 w-12 rounded bg-muted/20 animate-pulse" />
      ) : (
        <p className="text-[32px] font-normal text-foreground leading-none tracking-tight">{value}</p>
      )}
    </div>
  );
}
