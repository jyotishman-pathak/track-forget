import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

const MARKDOWNS_DIR = path.join(process.cwd(), 'public', 'markdowns');

export async function GET() {
  try {
    const files = await readdir(MARKDOWNS_DIR);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    const result = mdFiles.map((filename) => ({
      filename,
      label: filename
        .replace('.md', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Could not read markdowns directory' }, { status: 500 });
  }
}
