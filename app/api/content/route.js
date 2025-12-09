import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to optimize image URLs
const optimizeImageUrl = (url, width = 600, quality = 80) => {
    if (!url || url.includes('placehold.co')) return url;
    if (url.includes('supabase.co') && !url.includes('?')) {
        return `${url}?width=${width}&resize=contain&quality=${quality}`;
    }
    return url;
};

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const id = searchParams.get('id');

        // --- BRANCH 1: DETAILS (Fetch remaining images for specific entity) ---
        if (type && id) {
            let entityType = '';
            if (type.includes('project')) entityType = 'PROJECT';
            else if (type.includes('event')) entityType = 'EVENT';
            else if (type.includes('gallery')) entityType = 'GALLERY';
            else if (type.includes('timeline')) entityType = 'TIMELINE';

            const { data: mediaData } = await supabase
                .from('media_gallery')
                .select('image_url, is_primary')
                .eq('entity_type', entityType)
                .eq('entity_id', id)
                .order('is_primary', { ascending: false });

            return NextResponse.json({
                images: mediaData?.map(m => optimizeImageUrl(m.image_url, 1920, 90)) || []
            });
        }

        // --- BRANCH 2: MAIN DATA LOAD (Optimized) ---

        // OPTIMIZATION 1: Single query to get all primary thumbnails only
        const { data: primaryMedia } = await supabase
            .from('media_gallery')
            .select('entity_type, entity_id, image_url')
            .eq('is_primary', true);

        // OPTIMIZATION 2: Count total images per entity (for lazy loading indicator)
        const { data: mediaCounts } = await supabase
            .from('media_gallery')
            .select('entity_type, entity_id')
            .neq('is_primary', true);

        // Build lookup maps
        const primaryMediaMap = {};
        const mediaCountMap = {};

        (primaryMedia || []).forEach(m => {
            const key = `${m.entity_type}_${m.entity_id}`;
            primaryMediaMap[key] = optimizeImageUrl(m.image_url);
        });

        (mediaCounts || []).forEach(m => {
            const key = `${m.entity_type}_${m.entity_id}`;
            mediaCountMap[key] = (mediaCountMap[key] || 0) + 1;
        });

        // OPTIMIZATION 3: Parallel queries for actual data
        const [
            projectsRes,
            eventsRes,
            galleryRes,
            teamRes,
            alumniRes,
            timelineRes,
            achievementsRes,
            partnersRes
        ] = await Promise.all([
            supabase.from('projects').select('*').order('sort_order', { ascending: true }),
            supabase.from('events').select('*').order('sort_order', { ascending: true }),
            supabase.from('gallery_albums').select('*').order('event_date', { ascending: false }),
            supabase.from('team_members').select('*').order('sort_order', { ascending: true }),
            supabase.from('alumni').select('*').order('sort_order', { ascending: true }),
            supabase.from('timeline_events').select('*').order('sort_order', { ascending: true }),
            supabase.from('achievements').select('*').order('sort_order', { ascending: true }),
            supabase.from('partners').select('*').order('sort_order', { ascending: true })
        ]);

        // Helper to attach thumbnail and metadata
        const attachThumbnail = (item, entityType) => {
            const key = `${entityType}_${item.id}`;
            const thumbnail = primaryMediaMap[key] || 'https://placehold.co/600x400/1f2937/FFFFFF?text=No+Image';
            const additionalCount = mediaCountMap[key] || 0;

            return {
                ...item,
                images: [thumbnail],
                totalImages: additionalCount + 1, // +1 for primary
                detailsLoaded: additionalCount === 0
            };
        };

        // Map data with thumbnails
        const projectsData = (projectsRes.data || []).map(p => ({
            ...attachThumbnail(p, 'PROJECT'),
            year: p.project_year,
            technologies: p.technologies || [],
            teamMembers: p.contributors || []
        }));

        const processedEvents = (eventsRes.data || []).map(e => ({
            ...attachThumbnail(e, 'EVENT'),
            date: e.event_date
        }));

        const galleryData = (galleryRes.data || []).map(g =>
            attachThumbnail(g, 'GALLERY')
        );

        const timelineData = (timelineRes.data || []).map(t =>
            attachThumbnail(t, 'TIMELINE')
        );

        const today = new Date().toISOString();

        return NextResponse.json({
            projectsData,
            gallery: galleryData,
            events: {
                upcoming: processedEvents.filter(e => e.date >= today),
                past: processedEvents.filter(e => e.date < today)
            },
            team: (teamRes.data || []).map(t => ({
                ...t,
                role: t.team_role,
                image: optimizeImageUrl(t.image_url, 400, 85)
            })),
            alumni: (alumniRes.data || []).map(a => ({
                ...a,
                currentRole: a.job_title,
                year: a.graduation_year,
                image: optimizeImageUrl(a.image_url, 400, 85),
                link: a.linkedin_url
            })),
            timelineEvents: timelineData,
            achievements: (achievementsRes.data || []).map(a => ({
                ...a,
                icon: a.icon || 'award'
            })),
            partnersData: (partnersRes.data || []).map(p => ({
                ...p,
                logoUrl: optimizeImageUrl(p.logo_url, 300, 90),
                websiteUrl: p.website_url
            }))
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}