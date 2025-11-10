import dynamic from 'next/dynamic';

type DailyPoint = {
  date: string;
  income: number;
  expense: number;
};

type DailySpendCardProps = {
  data: DailyPoint[];
};

const DailySpendChart = dynamic(() => import('@/components/daily-spend-chart'), {
  loading: () => (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white text-sm text-zinc-500">
      Loading trend...
    </div>
  ),
  ssr: false,
});

export function DailySpendCard({ data }: DailySpendCardProps) {
  return <DailySpendChart data={data} />;
}
