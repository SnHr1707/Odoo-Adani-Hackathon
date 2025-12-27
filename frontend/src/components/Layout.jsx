import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen w-screen bg-[#1a1a1a] overflow-hidden text-gray-100">
      {/* Sidebar: Fixed width, full height */}
      <Sidebar />
      
      {/* Main Content: Flex grow, scrolls independently */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative">
        {children}
      </main>
    </div>
  );
};

export default Layout;