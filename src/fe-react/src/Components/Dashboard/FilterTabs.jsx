import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter } from '../../Redux/slices/taskSlice';

export default function FilterTabs() {
  const dispatch = useDispatch();
  const { filter, items } = useSelector((state) => state.tasks);

  // Compute live counts
  const totalCount = items.length;
  const highCount = items.filter((t) => t.priority === 'High').length;
  const todayCount = items.filter((t) => {
    const today = new Date().toISOString().split('T')[0];
    return t.task_date === today;
  }).length;
  const completedCount = items.filter((t) => t.status === 'completed').length;

  const tabs = [
    { id: 'all', label: `All (${totalCount})` },
    { id: 'high', label: `High Priority (${highCount})` },
    { id: 'today', label: `Today (${todayCount})` },
    { id: 'completed', label: `Completed (${completedCount})` },
  ];

  return (
    <div className="flex items-center gap-space-sm overflow-x-auto no-scrollbar py-1">
      {tabs.map((tab) => {
        const isActive = filter === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => dispatch(setFilter(tab.id))}
            className={`px-space-lg h-9 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shadow-sm ${
              isActive
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-surface-container-high/40'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
