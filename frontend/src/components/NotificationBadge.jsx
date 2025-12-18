// frontend/src/components/NotificationBadge.jsx
// ✅ Reusable notification badge component

import React from 'react';

const NotificationBadge = ({ count = 0, className = '' }) => {
  if (count <= 0) return null;

  // ✅ Show max 99+ if over 99
  const displayCount = count > 99 ? '99+' : count;

  return (
    <div
      className={`
        flex items-center justify-center 
        w-5 h-5 rounded-full 
        bg-red-500 text-white 
        text-xs font-bold 
        absolute -top-2 -right-2 
        ${className}
      `}
      title={`${count} new notification${count !== 1 ? 's' : ''}`}
    >
      {displayCount}
    </div>
  );
};

export default NotificationBadge;
