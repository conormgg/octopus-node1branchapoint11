
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PersistentPageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  isVisible?: boolean;
}

const PersistentPageNavigation: React.FC<PersistentPageNavigationProps> = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  isVisible = true,
}) => {
  if (totalPages <= 1 || !isVisible) return null;

  return (
    <>
      {/* Left Navigation */}
      {currentPage > 0 && (
        <div className="fixed left-2 top-1/2 transform -translate-y-1/2 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-300 hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Right Navigation */}
      {currentPage < totalPages - 1 && (
        <div className="fixed right-2 top-1/2 transform -translate-y-1/2 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-300 hover:bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Page Indicator */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-gray-300 rounded-lg px-3 py-1">
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </span>
        </div>
      </div>
    </>
  );
};

export default PersistentPageNavigation;
