import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../Redux/slices/authSlice';
import { setSearchQuery } from '../../Redux/slices/taskSlice';

export default function Navbar() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { searchQuery } = useSelector((state) => state.tasks);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto h-16 px-margin flex items-center justify-between">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[20px] font-bold">task_alt</span>
          </div>
          <h1 className="font-semibold text-title-md text-on-surface tracking-tight">
            DigitalSelf
          </h1>
        </div>

        {/* Right: Search & Profile Avatar */}
        <div className="flex items-center gap-space-xs relative">
          <button
            type="button"
            aria-label="Toggle Search"
            onClick={() => setShowSearch(!showSearch)}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full transition-colors ${
              showSearch ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {showSearch ? 'close' : 'search'}
            </span>
          </button>

          {/* Profile Avatar Button */}
          <button
            type="button"
            aria-label="User Profile"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm border-2 border-surface shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-12 w-52 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-high p-2 z-50">
              <div className="px-3 py-2 border-b border-surface-container-low mb-1">
                <p className="font-semibold text-sm text-on-surface truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-error hover:bg-error-container/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Search Input */}
      {showSearch && (
        <div className="max-w-md mx-auto px-margin pb-3 pt-1">
          <div className="relative flex items-center bg-surface-container-low rounded-xl px-3 py-1.5 border border-outline-variant/40">
            <span className="material-symbols-outlined text-outline text-[20px] mr-2">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              placeholder="Search tasks, descriptions..."
              className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => dispatch(setSearchQuery(''))}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
