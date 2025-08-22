import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    const { userId } = await auth();

    // 从 prompts 表中获取所有标签
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('tags')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // 提取并去重所有标签
    const allTags = new Set();
    prompts.forEach(prompt => {
      if (prompt.tags) {
        const tags = prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        tags.forEach(tag => allTags.add(tag));
      }
    });

    return NextResponse.json([...allTags].sort());
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('tags')
      .insert([{ name }])
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
} 