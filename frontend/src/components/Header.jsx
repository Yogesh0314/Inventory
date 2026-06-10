import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Cloud, Database } from 'lucide-react';

const Header = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('Welcome');
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    // Generate greeting based on local clock hours
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Dynamic Clock ticking
    const updateTime = () => {
      const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      setTimeStr(new Date().toLocaleDateString('en-US', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between px-8 border-b border-glassBorder bg-darkBg/20 backdrop-blur-md sticky top-0 z-10">
      {/* Welcome Greeting */}
      <div className="animate-fade-in">
        <h2 className="text-xl font-bold tracking-tight text-primaryText">
          {greeting}, <span className="text-accentBlue font-extrabold">{user?.username || 'User'}</span>!
        </h2>
        <p className="text-xs text-secondaryText font-medium">Keep track of your operations and inventory levels.</p>
      </div>

      {/* Date clock */}
      <div className="flex items-center gap-4">
        {/* Date Time Indicator */}
        <div className="flex items-center gap-2 rounded-xl px-4.5 py-1.5 text-xs font-medium text-secondaryText glass-panel">
          <Calendar className="h-3.5 w-3.5 text-accentBlue" />
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
