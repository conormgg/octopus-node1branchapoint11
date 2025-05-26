
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PersistentPageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const PersistentPageNavigation: React.FC<PersistentPageNavigationProps> = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
      <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 border border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreviousPage}
          disabled={currentPage === 0}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <span className="text-sm font-medium text-gray-700 px-2">
          {currentPage + 1} / {totalPages}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNextPage}
          disabled={currentPage === totalPages - 1}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PersistentPageNavigation;
