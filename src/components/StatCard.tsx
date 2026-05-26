'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: 'blue' | 'pink' | 'yellow' | 'purple' | 'green';
}

export function StatCard({ label, value, icon, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300',
    pink: 'bg-gradient-to-br from-pink-100 to-pink-200 border-pink-300',
    yellow: 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300',
    purple: 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300',
    green: 'bg-gradient-to-br from-green-100 to-green-200 border-green-300',
  };

  return (
    <div
      className={`rounded-2xl p-3 border-2 flex items-center gap-3 ${colorClasses[color]}`}
    >
      <div className="text-3xl">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-2xl font-bold text-gray-800">{value}</span>
      </div>
    </div>
  );
}
