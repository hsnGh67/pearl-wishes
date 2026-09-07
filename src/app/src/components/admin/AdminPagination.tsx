import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

interface AdminPaginationProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function AdminPagination({
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  isLoading = false,
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from =
    totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);

  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-t-2"
      style={{ borderColor: "#DCD4CD" }}
    >
      <p className="text-sm text-gray-500">
        {totalCount > 0
          ? `Showing ${from}–${to} of ${totalCount}`
          : "No results"}
      </p>
      <div className="flex items-center gap-3">
        <Button
          className="h-8 px-3 border-2 text-xs"
          style={{
            borderColor: "#DCD4CD",
            color: "#3D3935",
            backgroundColor: "transparent",
          }}
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span
          className="text-sm font-medium"
          style={{ color: "#3D3935" }}
        >
          Page {currentPage} of {totalPages}
        </span>
        <Button
          className="h-8 px-3 border-2 text-xs"
          style={{
            borderColor: "#DCD4CD",
            color: "#3D3935",
            backgroundColor: "transparent",
          }}
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
