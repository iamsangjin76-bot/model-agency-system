import React, { useEffect, useState } from 'react';
import { settlementsAPI } from '@/services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

interface MonthlyItem {
  label: string;
  income: number;
  expense: number;
}

interface BreakdownItem {
  name: string;
  percentage: number;
}

export default function SettlementCharts() {
  const [monthly, setMonthly] = useState<MonthlyItem[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);

  useEffect(() => {
    settlementsAPI.monthlyStats(5)
      .then(r => setMonthly(r.items.map(i => ({ label: i.label, income: i.income, expense: i.expense }))))
      .catch(() => {});

    settlementsAPI.expenseBreakdown()
      .then(r => setBreakdown(r.items))
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-6">월별 수입/지출</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${v / 1000000}M`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Bar dataKey="income" name="수입" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="지출" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-6">지출 구성</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={breakdown}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="percentage"
            >
              {breakdown.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 mt-4">
          {breakdown.map((cat, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-gray-600">{cat.name}</span>
              </div>
              <span className="font-medium">{cat.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
