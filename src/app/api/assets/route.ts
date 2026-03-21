import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rate-limit';
import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const checkRateLimit = createRateLimiter(20, 60_000, 'assets');

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspace_id');
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('Assets fetch error:', error);
    return NextResponse.json({ error: 'Failed to load assets' }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const workspaceId = formData.get('workspace_id') as string | null;
    const tags = (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(Boolean);

    if (!file || !workspaceId) {
      return NextResponse.json({ error: 'file and workspace_id are required' }, { status: 400 });
    }

    // Validate file
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const isVideo = file.type.startsWith('video/');
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${workspaceId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const supabase = await createClient();

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '31536000',
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(fileName);

    // Insert into assets table
    const { data: asset, error: insertError } = await supabase
      .from('assets')
      .insert({
        workspace_id: workspaceId,
        uploaded_by: user.userId,
        file_name: file.name,
        file_type: isVideo ? 'video' : 'image',
        mime_type: file.type,
        file_size: file.size,
        storage_path: fileName,
        public_url: urlData.publicUrl,
        tags,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Asset insert error:', insertError);
      // Try to clean up uploaded file
      await supabase.storage.from('assets').remove([fileName]);
      return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });
    }

    return NextResponse.json(asset, { status: 201 });
  } catch (err) {
    console.error('Asset upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const assetId = searchParams.get('id');
  if (!assetId) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = await createClient();

  // Get asset to find storage path
  const { data: asset } = await supabase
    .from('assets')
    .select('storage_path')
    .eq('id', assetId)
    .single();

  if (asset?.storage_path) {
    await supabase.storage.from('assets').remove([asset.storage_path]);
  }

  const { error } = await supabase.from('assets').delete().eq('id', assetId);
  if (error) {
    console.error('Asset delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
