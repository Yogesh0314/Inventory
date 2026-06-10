import React from 'react';

const SkeletonRow = ({ columns }) => {
  return (
    <tr className="animate-pulse border-b border-glassBorder bg-white/2">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4.5">
          <div className="h-4 bg-white/10 rounded w-full"></div>
        </td>
      ))}
    </tr>
  );
};

export default SkeletonRow;
