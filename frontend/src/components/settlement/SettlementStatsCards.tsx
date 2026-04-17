import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Clock } from 'lucide-react';

interface Props {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  pendingAmount: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export default function SettlementStatsCards({ totalIncome, totalExpense, netProfit, pendingAmount }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <p className="text-sm text-white/80">총 수입</p>
        <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
        <p className="text-sm text-white/80">총 지출</p>
        <p className="text-2xl font-bold">{formatCurrency(totalExpense)}</p>
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
        <p className="text-sm text-white/80">순이익</p>
        <p className="text-2xl font-bold">{formatCurrency(netProfit)}</p>
      </div>

      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <p className="text-sm text-white/80">미처리 금액</p>
        <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
      </div>
    </div>
  );
}
