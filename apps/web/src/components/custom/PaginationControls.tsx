import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const halfMaxPagesToShow = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, page - halfMaxPagesToShow);
    let endPage = Math.min(totalPages, page + halfMaxPagesToShow);

    // Adjust if we're near the beginning
    if (page <= halfMaxPagesToShow) {
      endPage = Math.min(totalPages, maxPagesToShow);
    }

    // Adjust if we're near the end
    if (page > totalPages - halfMaxPagesToShow) {
      startPage = Math.max(1, totalPages - maxPagesToShow + 1);
    }

    // Always show first page
    if (startPage > 1) {
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={(e) => {
              e.preventDefault();
              onPageChange(1);
            }}
            href="#"
            size="default"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        pages.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={(e) => {
              e.preventDefault();
              onPageChange(i);
            }}
            href="#"
            isActive={i === page}
            size="default"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Always show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={(e) => {
              e.preventDefault();
              onPageChange(totalPages);
            }}
            href="#"
            size="default"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) onPageChange(page - 1);
            }}
            href="#"
            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            size="default"
          />
        </PaginationItem>
        {renderPageNumbers()}
        <PaginationItem>
          <PaginationNext
            onClick={(e) => {
              e.preventDefault();
              if (page < totalPages) onPageChange(page + 1);
            }}
            href="#"
            className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            size="default"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}