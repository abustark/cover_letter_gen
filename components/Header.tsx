
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="py-6 text-center shadow-lg bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
      <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
        AI Cover Letter Builder
      </h1>
      <p className="text-sm text-yellow-400 mt-2">
  DISCLAIMER: AI is used in generating the cover letter...continue if you acknowledge this....
</p>
    </header>
  );
};
