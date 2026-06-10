import React from 'react';

const MetricCard = ({ title, value, icon: Icon, colorClass, borderClass, subtext }) => {
  return (
    <div className={`glass-panel glass-panel-hover rounded-2xl p-6 flex items-center justify-between border ${borderClass || 'border-glassBorder'}`}>
      <div className="space-y-1">
        <span className="text-xs font-semibold tracking-wider uppercase text-secondaryText">{title}</span>
        <h3 className="text-3xl font-extrabold tracking-tight text-primaryText">{value}</h3>
        {subtext && <p className="text-xs text-secondaryText font-medium mt-1">{subtext}</p>}
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass || 'bg-accentBlue/10 text-accentBlue'}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
};

export default MetricCard;
