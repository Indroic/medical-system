interface StatCardProps {
  label: string;
  value: number | string;
  loading?: boolean;
}

export default function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <div className="rounded-[14px] border border-hairline bg-chalk p-4">
      <p className="text-[12px] font-medium text-concrete mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-12 rounded-[4px] bg-mist animate-pulse" />
      ) : (
        <p className="text-[32px] font-semibold text-graphite leading-none tracking-tight">
          {value}
        </p>
      )}
    </div>
  );
}
