interface StatCardProps {
  label: string;
  value: number | string;
  loading?: boolean;
}

export default function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-charcoal bg-ash p-5">
      <p className="text-[12px] text-smoke mb-2">{label}</p>
      {loading ? (
        <div className="h-8 w-12 rounded bg-slate animate-pulse" />
      ) : (
        <p className="text-[32px] font-normal text-snow leading-none tracking-tight">{value}</p>
      )}
    </div>
  );
}
