import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
    try {
        // FIX: Query 'site_config' table instead of 'enrollment_status'
        const { data, error } = await supabase
            .from('site_config')
            .select('value_boolean')
            .eq('key_name', 'enrollment_open')
            .single();

        if (error) {
            // If the row doesn't exist yet, just log it and return false (don't crash)
            console.error('Button Status DB Error (Table or Row missing):', error.message);
            return NextResponse.json({ enabled: false });
        }

        return NextResponse.json({ enabled: data?.value_boolean ?? false });

    } catch (error) {
        console.error('Button Status API Error:', error);
        return NextResponse.json({ enabled: false }, { status: 500 });
    }
}