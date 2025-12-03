import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        const body = await request.json();

        // Destructure fields to ensure we only insert what we expect
        const { name, email, phone, prn, branch, year, motivation, experience } = body;

        // Basic Validation
        if (!name || !email || !prn || !branch) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('applications')
            .insert([
                { name, email, phone, prn, branch, year, motivation, experience }
            ])
            .select();

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(
            { message: 'Application submitted successfully', data },
            { status: 200 }
        );

    } catch (err) {
        console.error('Server Error:', err);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}