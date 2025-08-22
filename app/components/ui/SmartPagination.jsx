'use client';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function SmartPagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className = "" 
}) {
  // 如果只有一页或没有页面，不显示分页
  if (totalPages <= 1) return null;

  // 生成要显示的页码数组
  const getPageNumbers = () => {
    const delta = 2; // 当前页前后显示的页数
    const range = [];
    const rangeWithDots = [];

    // 计算显示范围
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, currentPage + delta);

    // 如果开始范围太小，扩展结束范围
    if (currentPage - delta <= 1) {
      end = Math.min(totalPages, 1 + delta * 2);
    }

    // 如果结束范围太大，扩展开始范围
    if (currentPage + delta >= totalPages) {
      start = Math.max(1, totalPages - delta * 2);
    }

    // 生成基本范围
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // 添加第一页和省略号
    if (start > 1) {
      if (start > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }
    }

    // 添加中间页码
    rangeWithDots.push(...range);

    // 添加最后一页和省略号
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination className={className}>
      <PaginationContent>
        {/* 上一页按钮 */}
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>

        {/* 页码 */}
        {pageNumbers.map((page, index) => (
          <PaginationItem key={index}>
            {page === '...' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        {/* 下一页按钮 */}
        <PaginationItem>
          <PaginationNext 
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
