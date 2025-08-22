'use client';
import { useState, useEffect, useCallback } from 'react';
import PromptList from '@/app/components/prompt/PromptList';
import { Input } from "@/components/ui/input"
import { Spinner } from '@/app/components/ui/Spinner';
import TagFilter from '@/app/components/prompt/TagFilter';
import { Button } from "@/components/ui/button"
import { Search, PlusCircle } from "lucide-react"
import SmartPagination from '@/app/components/ui/SmartPagination';

async function getPrompts(page = 1, limit = 12, search = '', tag = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (search) params.append('search', search);
  if (tag) params.append('tag', tag);

  const res = await fetch(`/api/prompts?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch prompts');
  }
  return res.json();
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 12,
    has_next: false,
    has_prev: false
  });
  const [allTags, setAllTags] = useState([]);

  // 获取所有标签（用于过滤器）
  const fetchAllTags = useCallback(async () => {
    try {
      // 获取所有提示词来提取标签
      const response = await fetch('/api/tags');
      if (response.ok) {
        const tags = await response.json();
        setAllTags(tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, []);

  // 获取提示词数据
  const fetchPrompts = useCallback(async (page = 1, search = '', tag = '') => {
    try {
      setIsLoading(true);
      const response = await getPrompts(page, 12, search, tag);
      
      const processedPrompts = response.data.map(prompt => ({
        ...prompt,
        version: prompt.version || '1.0',
        cover_img: prompt.cover_img || '/default-cover.jpg',
        tags: prompt.tags?.split(',') || []
      }));
      
      setPrompts(processedPrompts);
      setPagination(response.pagination);
      setCurrentPage(response.pagination.current_page);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    fetchPrompts();
    fetchAllTags();
  }, [fetchPrompts, fetchAllTags]);

  // 当搜索或标签改变时重新获取数据
  useEffect(() => {
    const selectedTag = selectedTags.length > 0 ? selectedTags[0] : '';
    fetchPrompts(1, searchQuery, selectedTag);
  }, [searchQuery, selectedTags, fetchPrompts]);

  // 页码改变时获取数据
  const handlePageChange = useCallback((page) => {
    const selectedTag = selectedTags.length > 0 ? selectedTags[0] : '';
    fetchPrompts(page, searchQuery, selectedTag);
  }, [searchQuery, selectedTags, fetchPrompts]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container px-4 py-4 sm:py-16 mx-auto max-w-7xl">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索提示词..."
                  className="w-full h-12 pl-10 transition-all border rounded focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <Button
              className="h-12 px-6 active:scale-95 transition-transform touch-manipulation md:active:scale-100 gap-2"
              onClick={() => window.location.href = '/prompts/new'}
            >
              <PlusCircle className="h-5 w-5" />
              新建提示词
            </Button>
          </div>
          <TagFilter 
            allTags={allTags}
            selectedTags={selectedTags}
            onTagSelect={setSelectedTags}
            className="pb-4 touch-manipulation"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <div className="mt-4 space-y-8">
            <PromptList prompts={prompts} />
            
            {/* 分页信息和控件 */}
            {pagination.total_count > 0 && (
              <div className="space-y-4">
                {/* 分页信息 */}
                <div className="text-center text-sm text-muted-foreground">
                  显示第 {((currentPage - 1) * pagination.per_page) + 1} - {Math.min(currentPage * pagination.per_page, pagination.total_count)} 项，
                  共 {pagination.total_count} 项结果
                </div>
                
                {/* 分页控件 */}
                <SmartPagination
                  currentPage={currentPage}
                  totalPages={pagination.total_pages}
                  onPageChange={handlePageChange}
                  className="justify-center"
                />
              </div>
            )}
            
            {/* 无数据提示 */}
            {!isLoading && prompts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  {searchQuery || selectedTags.length > 0 ? '没有找到匹配的提示词' : '暂无提示词'}
                </div>
                <Button
                  onClick={() => window.location.href = '/prompts/new'}
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  创建第一个提示词
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 