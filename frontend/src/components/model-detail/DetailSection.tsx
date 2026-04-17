import React from 'react';

interface DetailSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

// Read-only section card matching the FormSection visual style in ModelFormPage
export default function DetailSection({ title, icon: Icon, children }: DetailSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Icon className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
