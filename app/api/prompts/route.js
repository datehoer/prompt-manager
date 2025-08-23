import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server'

export async function GET(request) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { userId } = await auth()
  
  // 从 URL 中获取参数
  const { searchParams } = new URL(request.url);
  const tags = searchParams.getAll('tags');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const search = searchParams.get('search');

  // 计算偏移量
  const offset = (page - 1) * limit;

  let query = supabase
    .from('prompts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  // 如果存在 tags 参数，添加过滤条件
  if (tags && tags.length > 0) {
    // 为每个标签创建多个条件，匹配逗号分隔的标签字符串
    // 使用 or 组合多个 ilike 条件
    // 条件包括：完全匹配、开头匹配、结尾匹配、中间匹配
    const conditions = [];
    tags.forEach(tag => {
      conditions.push(
        `tags.eq.${tag}`,           // 完全匹配（只有一个标签）
        `tags.ilike.${tag},%`,      // 开头匹配
        `tags.ilike.%,${tag}`,      // 结尾匹配
        `tags.ilike.%,${tag},%`     // 中间匹配
      );
    });
    query = query.or(conditions.join(','));
  }

  // 如果存在搜索参数，添加搜索条件
  if (search) {
    query = query.or(`title.ilike.%${search}%, content.ilike.%${search}%`);
  }

  // 添加分页和排序
  const { data: prompts, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 计算分页信息
  const totalPages = Math.ceil(count / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return NextResponse.json({
    data: prompts,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_count: count,
      per_page: limit,
      has_next: hasNext,
      has_prev: hasPrev
    }
  });
}

export async function POST(request) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { userId } = await auth()

  const data = await request.json();
  // 使用authToken作为user_id
  data.user_id = userId;

  const { data: newPrompt, error } = await supabase
    .from('prompts')
    .insert([data])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(newPrompt[0]);
} 