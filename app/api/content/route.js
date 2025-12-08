import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const id = searchParams.get('id');

        // --- BRANCH 1: DETAILS (Fetching images) ---
        if (type && id) {
            let entityType = '';
            if (type.includes('project')) entityType = 'PROJECT';
            else if (type.includes('event')) entityType = 'EVENT';
            else if (type.includes('gallery')) entityType = 'GALLERY';

            const { data: mediaData } = await supabase
                .from('media_gallery')
                .select('image_url')
                .eq('entity_type', entityType)
                .eq('entity_id', id)
                .order('is_primary', { ascending: false });

            return NextResponse.json({
                images: mediaData?.map(m => {
                    const url = m.image_url;
                    if (url && url.includes('supabase.co') && !url.includes('?')) {
                        return `${url}?width=1920&quality=90`;
                    }
                    return url;
                }) || []
            });
        }

        // --- BRANCH 2: MAIN DATA LOAD ---

        // 1. Run Queries
        // UPDATED: All main queries now use 'sort_order' as the primary sort key
        const [
            projectsRes,
            eventsRes,
            galleryRes,
            teamRes,
            alumniRes,
            timelineRes,
            achievementsRes,
            partnersRes,
            mediaRes
        ] = await Promise.all([
            supabase.from('projects').select('*').order('sort_order', { ascending: true }),
            supabase.from('events').select('*').order('sort_order', { ascending: true }), // Was event_date
            supabase.from('gallery_albums').select('*').order('event_date', { ascending: false }), // Keep gallery by date
            supabase.from('team_members').select('*').order('sort_order', { ascending: true }),
            supabase.from('alumni').select('*').order('sort_order', { ascending: true }), // Was graduation_year
            supabase.from('timeline_events').select('*').order('sort_order', { ascending: true }),
            supabase.from('achievements').select('*').order('sort_order', { ascending: true }),
            supabase.from('partners').select('*').order('sort_order', { ascending: true }),

            supabase.from('media_gallery').select('entity_type, entity_id, image_url, is_primary')
        ]);

        // 2. Extract Data
        const projectsData = projectsRes.data || [];
        const eventsData = eventsRes.data || [];
        const galleryData = galleryRes.data || [];
        const teamData = teamRes.data || [];
        const alumniData = alumniRes.data || [];
        const timelineData = timelineRes.data || [];
        const achievementsData = achievementsRes.data || [];
        const partnersData = partnersRes.data || [];
        const allMedia = mediaRes.data || [];

        // 3. Helper to attach images
        const attachMedia = (item, entityType) => {
            const itemMedia = allMedia.filter(m => m.entity_type === entityType && m.entity_id === item.id);

            const rawUrl = itemMedia.find(m => m.is_primary)?.image_url
                || itemMedia[0]?.image_url
                || 'https://placehold.co/600x400/1f2937/FFFFFF?text=No+Image';

            const thumbnail = (rawUrl.includes('supabase.co') && !rawUrl.includes('?'))
                ? `${rawUrl}?width=600&resize=contain&quality=80`
                : rawUrl;

            return {
                ...item,
                images: [thumbnail],
                totalImages: itemMedia.length,
                detailsLoaded: itemMedia.length <= 1
            };
        };

        // 4. Map Data
        const finalProjects = projectsData.map(p => ({
            ...attachMedia(p, 'PROJECT'),
            year: p.project_year,
            technologies: p.technologies || [],
            teamMembers: p.contributors || []
        }));

        const processedEvents = eventsData.map(e => ({
            ...attachMedia(e, 'EVENT'),
            date: e.event_date
        }));

        const today = new Date().toISOString();

        return NextResponse.json({
            projectsData: finalProjects,
            gallery: galleryData.map(g => attachMedia(g, 'GALLERY')),
            events: {
                upcoming: processedEvents.filter(e => e.date >= today),
                past: processedEvents.filter(e => e.date < today)
            },
            team: teamData.map(t => ({ ...t, role: t.team_role, image: t.image_url })),
            alumni: alumniData.map(a => ({ ...a, currentRole: a.job_title, year: a.graduation_year, image: a.image_url, link: a.linkedin_url })),
            timelineEvents: timelineData,
            achievements: achievementsData.map(a => ({ ...a, icon: a.icon || 'award' })),
            partnersData: partnersData.map(p => ({ ...p, logoUrl: p.logo_url, websiteUrl: p.website_url }))
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}