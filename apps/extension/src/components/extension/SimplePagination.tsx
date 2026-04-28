import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false
}: SimplePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="h-8 px-2"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous</span>
      </Button>
      
      <span className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="h-8 px-2"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next</span>
      </Button>
    </div>
  );
}