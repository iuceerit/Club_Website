import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as FaIcons from "react-icons/fa";
import * as SiIcons from "react-icons/si";
import * as LuIcons from "react-icons/lu";
import { motion } from 'framer-motion';

/* ======================================================================
   REGION 1: UTILITIES & HELPERS
   ====================================================================== */

/** Constants for placeholders */
const PLACEHOLDERS = {
    IMAGE: 'https://placehold.co/400x300/e2e8f0/1e293b?text=No+Image',
    INSTAGRAM: 'https://placehold.co/600x400/E1306C/FFFFFF?text=Instagram+Reel'
};

/** Safely retrieves the first image or returns a fallback */
const getFirstImage = (images, fallback = PLACEHOLDERS.IMAGE) => {
    if (!images || !Array.isArray(images) || images.length === 0) return fallback;
    return images[0] || fallback;
};

/** Safely accesses nested object properties */
const safeGet = (obj, path, fallback = 'Data not available') => obj?.[path] ?? fallback;

/** Parses video URLs to identify type (YouTube/Instagram) */
const getVideoDetails = (url) => {
    if (!url || typeof url !== 'string') return { type: 'unknown', id: null };

    // YouTube Match
    const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    if (ytMatch && ytMatch[2].length === 11) return { type: 'youtube', id: ytMatch[2] };

    // Instagram Match
    const igMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
    if (igMatch && igMatch[1]) return { type: 'instagram', id: igMatch[1] };

    return { type: 'unknown', id: null };
};

/** Generates a thumbnail URL based on media type */
const getMediaThumbnail = (item) => {
    const url = typeof item === 'string' ? item : item.src;
    const { type, id } = getVideoDetails(url);

    if (type === 'youtube') return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    if (type === 'instagram') return PLACEHOLDERS.INSTAGRAM;

    return url;
};

/* ======================================================================
   REGION 2: CUSTOM HOOKS
   ====================================================================== */

/** * Hook to enable "Drag to Scroll" behavior for desktops.
 * Does not interfere with native touch scrolling on mobile.
 */
const useDraggableScroll = (ref, speedMultiplier = 1.5) => {
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const isDraggingRef = useRef(false);

    const onMouseDown = (e) => {
        if (!ref.current) return;
        setIsDown(true);
        isDraggingRef.current = false;
        setStartX(e.pageX - ref.current.offsetLeft);
        setScrollLeft(ref.current.scrollLeft);
    };

    const onMouseLeave = () => setIsDown(false);

    const onMouseUp = () => {
        setIsDown(false);
        // Note: isDraggingRef is reset in onClickCapture to handle click blocking
    };

    const onMouseMove = (e) => {
        if (!isDown || !ref.current) return;
        e.preventDefault();
        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - startX) * speedMultiplier;

        if (Math.abs(walk) > 5) {
            isDraggingRef.current = true;
        }
        ref.current.scrollLeft = scrollLeft - walk;
    };

    const onClickCapture = (e) => {
        if (isDraggingRef.current) {
            e.preventDefault();
            e.stopPropagation();
            isDraggingRef.current = false;
        }
    };

    return {
        events: {
            onMouseDown,
            onMouseLeave,
            onMouseUp,
            onMouseMove,
            onClickCapture
        },
        isDown
    };
};

/* ======================================================================
   REGION 3: UI PRIMITIVES
   ====================================================================== */

/** Dynamic Icon Loader */
const Icon = ({ name, className = "" }) => {
    if (!name) return null;

    const pascalName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    const iconMap = {
        users: FaIcons.FaUsers,
        target: FaIcons.FaBullseye,
        award: FaIcons.FaTrophy,
        globe: FaIcons.FaGlobe,
        calendar: FaIcons.FaCalendarAlt,
        location: FaIcons.FaMapMarkerAlt,
        github: FaIcons.FaGithub,
        linkedin: FaIcons.FaLinkedin,
        images: FaIcons.FaImages,
    };

    if (iconMap[name.toLowerCase()]) {
        const IconComponent = iconMap[name.toLowerCase()];
        return <IconComponent className={className} />;
    }

    const IconComponent =
        FaIcons[`Fa${pascalName}`] ||
        SiIcons[`Si${pascalName}`] ||
        LuIcons[`Lu${pascalName}`] ||
        FaIcons[name] ||
        FaIcons.FaQuestionCircle;

    return <IconComponent className={className} />;
};

export const LoadingScreen = ({ isLoading, progress = 0 }) => {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900">
            <div className="text-center animate-fadeIn">
                {/* Logo or Title */}
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
                    IUCEE-RIT
                </h1>

                {/* Loading Text */}
                <p className="text-xl text-emerald-300 mb-6 font-medium">
                    Loading Experience
                </p>

                {/* Progress Bar */}
                <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mx-auto border border-gray-700">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Progress Percentage */}
                <p className="text-sm text-gray-400 mt-4 font-mono">
                    {Math.round(progress)}%
                </p>
            </div>
        </div>
    );
};

/** Scroll To Top Button */
export const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => setIsVisible(window.scrollY > 300);
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
            aria-label="Scroll to top"
        >
            ↑
        </button>
    );
};

/** Theme Toggler */
const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = () => {
        const root = document.documentElement;
        const newIsDark = !isDark;
        if (newIsDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        setIsDark(newIsDark);
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xl"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDark ? '🌙' : '☀️'}
        </button>
    );
};

/* ======================================================================
   REGION 4: SCROLLERS & LAYOUT
   ====================================================================== */

/** Continuous Infinite Scroll Marquee */
const MarqueeScroller = ({ items, direction = 'left', renderItem, speed = 1 }) => {
    const scrollerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const requestRef = useRef();
    const scrollPosRef = useRef(0);
    const isInitializedRef = useRef(false);
    const dragTimeoutRef = useRef(null);

    const safeItems = items && items.length > 0 ? items : [];
    // Duplicate items to ensure smooth infinite loop
    const duplicatedItems = [...safeItems, ...safeItems, ...safeItems, ...safeItems];

    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        isInitializedRef.current = false;
        scrollPosRef.current = scroller.scrollLeft;

        const animate = () => {
            if (!isDragging) {
                const maxScroll = scroller.scrollWidth;
                const clientWidth = scroller.clientWidth;
                const resetPoint = maxScroll / 2;

                if (maxScroll <= clientWidth) {
                    requestRef.current = requestAnimationFrame(animate);
                    return;
                }

                if (direction === 'left') {
                    scrollPosRef.current += speed;
                    if (scrollPosRef.current >= resetPoint) scrollPosRef.current = 0;
                } else {
                    if (!isInitializedRef.current && scrollPosRef.current < 1) {
                        scrollPosRef.current = resetPoint;
                        scroller.scrollLeft = resetPoint;
                        isInitializedRef.current = true;
                    }
                    scrollPosRef.current -= speed;
                    if (scrollPosRef.current <= 0) scrollPosRef.current = resetPoint;
                }
                scroller.scrollLeft = scrollPosRef.current;
            } else {
                scrollPosRef.current = scroller.scrollLeft;
            }
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [direction, isDragging, speed, safeItems.length]);

    const handleInteractStart = () => {
        if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
        setIsDragging(true);
    };

    const handleInteractEnd = () => {
        dragTimeoutRef.current = setTimeout(() => setIsDragging(false), 2000);
    };

    return (
        <div
            className="marquee-container py-1"
            ref={scrollerRef}
            onMouseDown={handleInteractStart}
            onMouseUp={handleInteractEnd}
            onMouseLeave={handleInteractEnd}
            onTouchStart={handleInteractStart}
            onTouchEnd={handleInteractEnd}
        >
            <div className="marquee-content">
                {duplicatedItems.map((item, index) => (
                    <div key={`${index}-${item.id || index}`} className="marquee-card">
                        {renderItem(item)}
                    </div>
                ))}
            </div>
        </div>
    );
};

/** Horizontal Scroll Snap Wrapper with Auto-Scroll */
const Scroller = ({ children, autoScroll = false, scrollInterval = 3000 }) => {
    const scrollRef = useRef(null);
    const { events, isDown } = useDraggableScroll(scrollRef);
    const [isPaused, setIsPaused] = useState(false);

    // Auto Scroll Logic
    useEffect(() => {
        if (!autoScroll || isPaused || isDown) return;
        const interval = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                }
            }
        }, scrollInterval);
        return () => clearInterval(interval);
    }, [autoScroll, isPaused, scrollInterval, isDown]);

    return (
        <div
            className="scroll-section-container"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => { setIsPaused(false); events.onMouseLeave(); }}
        >
            <div
                className={`scroll-wrapper ${isDown ? 'is-dragging' : ''}`}
                ref={scrollRef}
                {...events}
            >
                {children}
            </div>
        </div>
    );
};

/* ======================================================================
   REGION 5: NAVIGATION
   ====================================================================== */

export const Navbar = ({ isScrolled }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navLinks = [
        { href: '#hero', title: 'Join' },
        { href: '#projects', title: 'Projects' },
        { href: '#events', title: 'Events' },
        { href: '#sdg', title: 'SDGs' },
        { href: '#team', title: 'Team' },
    ];

    return (
        <>
            <nav id="navbar" className={`fixed top-0 w-full z-40 ${isScrolled ? 'scrolled' : ''}`}>
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-[var(--primary-color)] tracking-tight whitespace-nowrap">
                            IUCEE-RIT
                        </h1>
                        <div className="hidden sm:flex items-center gap-3 border-l border-gray-400 pl-4 h-8">
                            <img src="/logos/iucee.jpg" alt="IUCEE Logo" className="h-full w-auto object-contain" />
                            <img src="/logos/rit.jpg" alt="RIT Logo" className="h-full w-auto object-contain" />
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map(link => (
                            <a key={link.href} href={link.href} className="nav-link">{link.title}</a>
                        ))}
                        <div className="border-l border-gray-500 h-6 mx-2"></div>
                        <ThemeToggle />
                    </div>

                    <div className="md:hidden flex items-center gap-4">
                        <ThemeToggle />
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[var(--text-primary)] text-2xl">
                            ☰
                        </button>
                    </div>
                </div>
            </nav>
            {isMenuOpen && (
                <div className="fixed inset-0 bg-[var(--bg-primary)] z-50 flex flex-col items-center justify-center space-y-8 animate-fadeInUp">
                    <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-3xl text-[var(--text-primary)]">&times;</button>
                    {navLinks.map(link => (
                        <a key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-[var(--text-primary)] hover:text-[var(--primary-color)]">{link.title}</a>
                    ))}
                    <div className="flex items-center gap-4 mt-8 opacity-80">
                        <img src="/logos/iucee.jpg" alt="IUCEE" className="h-10 w-auto" />
                        <img src="/logos/rit.jpg" alt="RIT" className="h-10 w-auto" />
                    </div>
                </div>
            )}
        </>
    );
};

/* ======================================================================
   REGION 6: PAGE SECTIONS
   ====================================================================== */

export const HeroSection = ({ onJoinClick, isEnrollmentOpen }) => (
    <section className="min-h-screen flex items-center justify-center text-center relative pt-20" id="hero">
        <div className="container mx-auto px-6 relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                IUCEE RIT <br /> Student Chapter
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-[var(--text-secondary)] max-w-3xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                Providing a platform for engineering students to showcase and enhance their skills and making them Global Leaders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                <a href="#projects" className="btn-primary px-8 py-4">View Projects</a>
                <button
                    onClick={onJoinClick}
                    disabled={!isEnrollmentOpen}
                    className="btn-secondary px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEnrollmentOpen === null ? 'Checking...' : isEnrollmentOpen ? 'Join Chapter' : 'Applications Closed'}
                </button>
            </div>
        </div>
    </section>
);

export const VisionSection = () => (
    <section className="py-20 bg-[var(--bg-secondary)]" id="vision">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-12 text-[var(--text-primary)]">Our Core Pillars</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { t: 'Innovation', d: 'Aspire every engineering student to enhance skills and inspire to be creative and innovative.' },
                    { t: 'Sustainability', d: 'Focused on long-term impact aligned with SDGs.' },
                    { t: 'Community', d: 'Able to recognize problems in the society and solve them willingly.' }
                ].map((item, i) => (
                    <div key={i} className="section-card">
                        <h3 className="text-2xl font-bold text-[var(--primary-color)] mb-3">{item.t}</h3>
                        <p className="text-[var(--text-secondary)]">{item.d}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export const SdgSection = ({ sdgs }) => {
    const renderSdgCard = (goal) => (
        <div
            className="sdg-card compact"
            style={{ borderTop: `4px solid var(--sdg-${goal.id})` }}
        >
            <div className="text-2xl">{goal.icon}</div>
            <h3 className="text-xs font-bold text-[var(--text-primary)] truncate" style={{ color: `var(--sdg-${goal.id})` }}>
                {goal.id}. {goal.title}
            </h3>
        </div>
    );

    return (
        <section className="py-20" id="sdg">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-[var(--text-primary)]">Sustainable Development Goals</h2>
                </div>
                {/* Desktop: Auto Scroller */}
                <div className="hidden md:block">
                    <Scroller autoScroll={true} scrollInterval={1500}>
                        {sdgs && sdgs.map(goal => (
                            <div key={goal.id} className="sdg-card cursor-pointer" style={{ borderTop: `6px solid var(--sdg-${goal.id})` }} onClick={() => window.open(`https://sdgs.un.org/goals/goal${goal.id}`, "_blank")}>
                                <div className="text-4xl mb-4 text-center">{goal.icon}</div>
                                <h3 className="font-bold text-[var(--text-primary)]" style={{ color: `var(--sdg-${goal.id})` }}>{goal.id}. {goal.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-2">{goal.description}</p>
                            </div>
                        ))}
                    </Scroller>
                </div>
                {/* Mobile: Double Stack Marquee */}
                <div className="block md:hidden space-y-4">
                    <MarqueeScroller items={sdgs || []} direction="left" speed={2.5} renderItem={renderSdgCard} />
                    <MarqueeScroller items={sdgs || []} direction="right" speed={2.5} renderItem={renderSdgCard} />
                </div>
            </div>
        </section>
    );
};

export const ProjectsSection = ({ projects, onShowDetails }) => {
    return (
        <section className="py-20 bg-[var(--bg-secondary)]" id="projects">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold text-center mb-12 text-[var(--text-primary)]">Projects</h2>
                <Scroller>
                    {projects && projects.map(project => (
                        <div key={project.id} className="project-card cursor-pointer" onClick={() => onShowDetails('project', project)}>
                            <img src={getFirstImage(project?.images)} alt={project?.title} />
                            <div className="badge-3d mb-2">{safeGet(project, 'category', 'General')}</div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{safeGet(project, 'title')}</h3>
                            <p className="text-[var(--text-muted)] line-clamp-2 text-sm">{safeGet(project, 'description')}</p>
                        </div>
                    ))}
                </Scroller>
            </div>
        </section>
    );
};

export const TimelineSection = ({ timelineEvents, onShowDetails }) => ( // Added prop
    <section className="py-20" id="timeline">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16 text-[var(--text-primary)]">Our Journey</h2>
            <div className="relative max-w-4xl mx-auto">
                <div className="timeline-line absolute left-4 md:left-1/2 top-0 bottom-0 w-1 transform md:-translate-x-1/2"></div>
                {timelineEvents && timelineEvents.map((event, index) => (
                    <div
                        key={index}
                        className={`relative flex items-center justify-between mb-8 group cursor-pointer ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'}`}
                        onClick={() => onShowDetails('timeline', event)} // Added Click Handler
                    >
                        <div className="hidden md:block w-5/12"></div>
                        <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 timeline-dot w-4 h-4 rounded-full z-10 transition-transform group-hover:scale-125"></div>
                        <div className="ml-12 md:ml-0 w-full md:w-5/12 timeline-content p-6 rounded-lg transition-transform group-hover:-translate-y-1">
                            <span className="text-[var(--primary-color)] font-bold">{event.year}</span>
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">{event.title}</h3>
                            <p className="text-sm text-[var(--text-secondary)] line-clamp-3">{event.description}</p>
                            {event.totalImages > 0 && (
                                <div className="mt-2 text-xs text-[var(--text-muted)] flex items-center gap-1">
                                    <Icon name="images" /> View Gallery ({event.totalImages})
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export const EventsSection = ({ events, onShowDetails }) => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const displayEvents = activeTab === 'upcoming' ? events.upcoming : events.past;

    return (
        <section className="py-10" id="events">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold text-center mb-8 text-[var(--text-primary)]">Events</h2>
                <div className="flex justify-center gap-4 mb-12">
                    {['upcoming', 'past'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-full font-semibold transition-all ${activeTab === tab ? 'bg-[var(--primary-color)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <Scroller>
                    {displayEvents?.length > 0 ? displayEvents.map((e, i) => (
                        <div key={i} className="event-card cursor-pointer" onClick={() => onShowDetails(`${activeTab}_event`, e)}>
                            <img src={getFirstImage(e?.images)} alt={e.title} />
                            <div className="text-sm text-[var(--accent-color)] font-bold mb-1">
                                {e.date ? new Date(e.date).toDateString() : 'TBA'}
                            </div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{e.title}</h3>
                            <p className="text-sm text-[var(--text-muted)] line-clamp-2">{e.description}</p>
                        </div>
                    )) : <p className="text-center w-full text-[var(--text-secondary)]">No events found.</p>}
                </Scroller>
            </div>
        </section>
    );
};

/* --- NEW PROFILE CARD COMPONENT --- */
const ProfileCard = ({ image, name, role, subtext, link, quote, isAlumni = false }) => {
    const hasLink = link && link !== "#";
    const hasQuote = isAlumni && quote && quote.length > 0;

    return (
        <div
            className={`profile-card group ${hasQuote ? 'has-quote' : ''}`}
            tabIndex={0}
        >
            <img
                src={image || `https://placehold.co/400x500?text=${name}`}
                alt={name}
                className="profile-img"
                loading="lazy"
            />
            {hasQuote && (
                <div className="profile-quote-overlay animate-fadeIn">
                    <span className="quote-icon">❝</span>
                    <p className="quote-text">{quote}</p>
                </div>
            )}
            <div className="profile-overlay">
                <h3 className="profile-name truncate">{name}</h3>
                <p className="profile-role">{role}</p>

                <div className="profile-footer">
                    <div className="profile-stats">
                        <Icon name={isAlumni ? "award" : "users"} className="text-white/80 text-xs" />
                        <span className="truncate max-w-[80px] text-white/90">
                            {subtext}
                        </span>
                    </div>

                    {hasLink ? (
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="profile-btn"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            {isAlumni ? 'Follow' : 'Connect'}
                        </a>
                    ) : (
                        <span className="text-[10px] text-white/50 italic px-1">Member</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export const TeamSection = ({ teamMembers }) => {
    const safeMembers = teamMembers || [];
    if (safeMembers.length === 0) return null;

    const leaders = safeMembers.filter(m => m.is_static);
    const regularMembers = safeMembers.filter(m => !m.is_static);

    const mid = Math.ceil(regularMembers.length / 2);
    const row1 = regularMembers.slice(0, mid);
    const row2 = regularMembers.slice(mid);

    const MarqueeItem = ({ member }) => (
        <div className="w-[220px] mx-2 h-full">
            <ProfileCard
                image={member.image}
                name={member.name}
                role={member.role}
                subtext={member.department}
                link={member.linkedin_url || member.link}
                isAlumni={false}
            />
        </div>
    );

    return (
        <section className="py-12 bg-[var(--bg-secondary)] overflow-hidden" id="team">
            <div className="container mx-auto px-6 mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-center text-[var(--text-primary)]">Team</h2>
            </div>
            {leaders.length > 0 && (
                <div className="container mx-auto px-6 mb-12">
                    <div className="flex flex-wrap justify-center gap-6">
                        {leaders.map((leader) => (
                            <div key={leader.id} className="w-[220px] shrink-0">
                                <ProfileCard
                                    image={leader.image}
                                    name={leader.name}
                                    role={leader.role}
                                    subtext={leader.department}
                                    link={leader.linkedin_url || leader.link}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {regularMembers.length > 0 && (
                <div className="space-y-4">
                    <MarqueeScroller items={row1} direction="left" renderItem={(m) => <MarqueeItem member={m} />} speed={0.8} />
                    <MarqueeScroller items={row2} direction="right" renderItem={(m) => <MarqueeItem member={m} />} speed={0.8} />
                </div>
            )}
        </section>
    );
};

export const AlumniSection = ({ alumni }) => {
    const safeAlumni = alumni || [];
    if (safeAlumni.length === 0) return null;

    const mid = Math.ceil(safeAlumni.length / 2);
    const row1 = safeAlumni.slice(0, mid);
    const row2 = safeAlumni.slice(mid);

    const MarqueeItem = ({ alum }) => (
        <div className="w-[220px] mx-2 h-full">
            <ProfileCard
                image={alum.image}
                name={alum.name}
                role={alum.currentRole || alum.current_role}
                subtext={`Batch '${alum.year}`}
                link={alum.linkedin_url || alum.link}
                quote={alum.quote || alum.description}
                isAlumni={true}
            />
        </div>
    );

    return (
        <section className="py-12 overflow-hidden" id="alumni">
            <div className="container mx-auto px-6 mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-center text-[var(--text-primary)]">Alumni</h2>
            </div>
            <div className="space-y-4">
                <MarqueeScroller items={row1.length > 0 ? row1 : safeAlumni} direction="left" renderItem={(a) => <MarqueeItem alum={a} />} speed={0.6} />
                <MarqueeScroller items={row2.length > 0 ? row2 : safeAlumni} direction="right" renderItem={(a) => <MarqueeItem alum={a} />} speed={0.6} />
            </div>
        </section>
    );
};

export const AchievementsSection = ({ achievements }) => (
    <section className="py-20" id="achievements">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {achievements.map((a, i) => (
                    <a key={i} href={a.link} className="section-card flex flex-col items-center text-center hover:bg-[var(--bg-secondary)]">
                        <span className="text-4xl text-[var(--primary-color)] mb-2"><Icon name={a.icon} /></span>
                        <h3 className="font-bold text-[var(--text-primary)]">{a.title}</h3>
                        <p className="text-xs text-[var(--text-muted)]">{a.description}</p>
                    </a>
                ))}
            </div>
        </div>
    </section>
);

export const PartnersSection = ({ partners }) => {
    if (!partners || partners.length === 0) return null;
    const renderPartner = (p) => (
        <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center px-4">
            <img src={p.logoUrl} alt={p.name} className="partner-logo" />
        </a>
    );

    return (
        <section className="py-16 bg-[var(--bg-secondary)] border-y border-[var(--border-color)] overflow-hidden">
            <div className="container mx-auto px-6 text-center mb-8">
                <p className="text-[var(--text-muted)] uppercase tracking-widest text-sm font-semibold">In Collaboration With</p>
            </div>
            <MarqueeScroller items={partners} direction="left" renderItem={renderPartner} speed={0.5} />
        </section>
    );
};

export const GalleryComponent = ({ galleryItems, onGalleryClick }) => {
    const scrollRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // 1. Handle Active Slide Detection (Scroll Spy)
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number(entry.target.getAttribute('data-index'));
                        setActiveIndex(index);
                    }
                });
            },
            {
                root: container,
                threshold: 0.5,
            }
        );

        const slides = container.querySelectorAll('.gallery-slide');
        slides.forEach((slide) => observer.observe(slide));

        return () => observer.disconnect();
    }, [galleryItems]);

    // 2. Smooth Scroll Function
    const scrollToSlide = (index) => {
        const container = scrollRef.current;
        if (!container || !galleryItems) return;

        // Ensure index is within bounds
        const safeIndex = Math.max(0, Math.min(index, galleryItems.length - 1));

        const slides = container.querySelectorAll('.gallery-slide');
        if (slides[safeIndex]) {
            slides[safeIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        scrollToSlide(activeIndex - 1);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        scrollToSlide(activeIndex + 1);
    };

    if (!galleryItems || galleryItems.length === 0) return null;

    return (
        <section className="py-20 bg-[var(--bg-primary)] overflow-hidden group" id="gallery">
            <div className="container mx-auto px-6 mb-8">
                <h2 className="text-3xl font-bold text-center text-[var(--text-primary)]">Gallery</h2>
            </div>

            <div className="w-full relative">
                {/* Navigation Buttons */}
                <button
                    className={`gallery-nav-btn ${activeIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handlePrev}
                    disabled={activeIndex === 0}
                    aria-label="Previous image"
                >
                    <Icon name="FaChevronLeft" />
                </button>

                <button
                    className={`gallery-nav-btn next ${activeIndex === galleryItems.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleNext}
                    disabled={activeIndex === galleryItems.length - 1}
                    aria-label="Next image"
                >
                    <Icon name="FaChevronRight" />
                </button>

                {/* Slider Container - No Drag Events attached */}
                <div
                    ref={scrollRef}
                    className="gallery-slider custom-scrollbar"
                >
                    {galleryItems.map((item, index) => {
                        const totalCount = item.totalImages || (item.images ? item.images.length : 0);
                        const hasMoreImages = totalCount > 1;
                        const thumbnail = getMediaThumbnail(item.images ? item.images[0] : null);
                        const isVideo = typeof item.images?.[0] === 'string' && (item.images[0].includes('youtube') || item.images[0].includes('youtu.be'));
                        const isFocused = index === activeIndex;

                        return (
                            <div
                                key={index}
                                data-index={index}
                                className={`gallery-slide group/slide ${isFocused ? 'focused' : ''}`}
                                // Clicking a non-focused slide scrolls to it; clicking focused opens details
                                onClick={() => isFocused ? onGalleryClick(item) : scrollToSlide(index)}
                            >
                                <img src={thumbnail} alt={item.title} loading="lazy" />

                                {isVideo && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/90 p-3 rounded-full z-20 pointer-events-none shadow-lg">
                                        <span className="text-white text-xl">▶</span>
                                    </div>
                                )}

                                {hasMoreImages && (
                                    <div className="gallery-count-badge">
                                        <Icon name="images" className="inline mr-1 text-[12px]" />
                                        +{totalCount - 1}
                                    </div>
                                )}

                                <div className="gallery-slide-overlay pointer-events-none">
                                    <h3 className="text-2xl font-bold text-white mb-2 translate-y-4 transition-transform duration-500 group-hover/slide:translate-y-0">{item.title}</h3>
                                    <p className="text-gray-200 text-sm line-clamp-2 translate-y-4 transition-transform duration-500 delay-75 group-hover/slide:translate-y-0">{item.description}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
};

/* ======================================================================
   REGION 7: MODALS & FOOTER
   ====================================================================== */

export const FullscreenViewer = ({ gallery, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);
    const minSwipeDistance = 50;

    const handleNext = () => setCurrentIndex(prev => (prev + 1) % gallery.length);
    const handlePrev = () => setCurrentIndex(prev => (prev - 1 + gallery.length) % gallery.length);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, gallery.length]);

    const onTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
        touchEndX.current = null;
    };
    const onTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };
    const onTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const distance = touchStartX.current - touchEndX.current;
        if (distance > minSwipeDistance) handleNext();
        if (distance < -minSwipeDistance) handlePrev();
    };

    if (!gallery || gallery.length === 0) return null;
    const currentItem = gallery[currentIndex];
    const { type, id } = getVideoDetails(currentItem);

    return (
        <div
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center touch-none"
            onClick={onClose}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <button className="absolute top-4 right-4 text-white text-4xl z-20 hover:text-red-500 transition-colors p-2" onClick={onClose}>&times;</button>
            <button className="absolute left-2 md:left-4 text-white text-4xl md:text-5xl z-20 hover:scale-110 transition-transform p-4" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>&#x2039;</button>

            <div className="max-h-[90vh] max-w-[90vw] w-full flex justify-center items-center pointer-events-none" >
                {type === 'youtube' && (
                    <iframe
                        className="w-full max-w-4xl aspect-video pointer-events-auto"
                        src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                )}
                {type === 'instagram' && (
                    <iframe
                        className="w-full max-w-[400px] aspect-[9/16] rounded-lg bg-white pointer-events-auto"
                        src={`https://www.instagram.com/reel/${id}/embed/`}
                        frameBorder="0"
                        scrolling="no"
                        allowtransparency="true"
                    ></iframe>
                )}
                {type === 'unknown' && (
                    <img
                        src={currentItem}
                        alt="Fullscreen"
                        className="max-h-[90vh] max-w-[90vw] object-contain animate-scaleIn pointer-events-auto"
                    />
                )}
            </div>
            <button className="absolute right-2 md:right-4 text-white text-4xl md:text-5xl z-20 hover:scale-110 transition-transform p-4" onClick={(e) => { e.stopPropagation(); handleNext(); }}>&#x203A;</button>
            <div className="absolute bottom-8 text-white bg-black/50 px-4 py-1 rounded-full text-sm backdrop-blur-sm">
                {currentIndex + 1} / {gallery.length}
            </div>
        </div>
    );
};

const GalleryScroller = ({ images, title, onImageClick }) => {
    const safeImages = images && Array.isArray(images) && images.length > 0
        ? images
        : ['https://placehold.co/600x400/1f2937/FFFFFF?text=No+Image'];

    const [idx, setIdx] = useState(0);

    const next = (e) => { e.stopPropagation(); setIdx((prev) => (prev + 1) % safeImages.length); };
    const prev = (e) => { e.stopPropagation(); setIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length); };

    return (
        <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden mb-6 group shrink-0">
            <img
                src={safeImages[idx]}
                alt={`${title} - view ${idx + 1}`}
                className="w-full h-full object-cover cursor-pointer transition-transform duration-500 hover:scale-105"
                onClick={() => onImageClick(safeImages[idx], safeImages, idx)}
            />
            {safeImages.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">&#8249;</button>
                    <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">&#8250;</button>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {idx + 1} / {safeImages.length}
                    </div>
                </>
            )}
        </div>
    );
};

export const ApplicationModal = ({ isOpen, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Submission failed');
            alert("Application Submitted Successfully!");
            onClose();
        } catch (error) {
            console.error('Submission error:', error);
            alert(`Error: ${error.message}. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-4">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">Membership Application</h3>
                    <button onClick={onClose} className="text-2xl hover:text-[var(--primary-color)]">&times;</button>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-[var(--text-secondary)]">Full Name</label>
                            <input required name="name" placeholder="John Doe" className="input-3d w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2 rounded border border-[var(--border-color)]" disabled={isSubmitting} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-[var(--text-secondary)]">Email</label>
                            <input required type="email" name="email" placeholder="john@example.com" className="input-3d w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2 rounded border border-[var(--border-color)]" disabled={isSubmitting} />
                        </div>
                    </div>
                    {/* Simplified fields for brevity but form structure remains */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-[var(--text-secondary)]">Branch</label>
                            <select required name="branch" className="input-3d w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2 rounded border border-[var(--border-color)]" disabled={isSubmitting}>
                                <option value="">Select Branch</option>
                                <option value="CS">Computer Science</option>
                                <option value="IT">Information Technology</option>
                                <option value="ENTC">E&TC</option>
                                <option value="MECH">Mechanical</option>
                                <option value="CIVIL">Civil</option>
                                <option value="AIDS">AI & DS</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`btn-primary w-full py-3 mt-4 text-lg flex justify-center items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export const DetailsModal = ({ isOpen, onClose, type, data, onImageClick }) => {
    if (!isOpen || !data) return null;
    const get = (key, fallback) => data[key] || fallback;

    const renderContent = () => {
        switch (type) {
            case 'project':
                return (
                    <div className="flex flex-col gap-4">
                        <GalleryScroller images={data.images} title={data.title} onImageClick={onImageClick} />
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-4">
                                <h4 className="font-bold text-[var(--primary-color)]">Description</h4>
                                <p className="text-[var(--text-secondary)]">{get('description')}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                                    <div className="mb-2"><span className="font-bold">Year:</span> {get('project_year') || get('year') || 'N/A'}</div>
                                    <div className="mb-2"><span className="font-bold">Category:</span> {get('category', 'General')}</div>
                                </div>
                                {(data.github_url || data.links?.github) && (
                                    <a href={data.github_url || data.links?.github} target="_blank" rel="noopener noreferrer" className="btn-secondary block text-center py-2 text-sm">
                                        View on GitHub <Icon name="github" className="inline ml-1" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'upcoming_event':
            case 'past_event':
                return (
                    <div>
                        <GalleryScroller images={data.images} title={data.title} onImageClick={onImageClick} />
                        <div className="space-y-4">
                            <p className="text-[var(--text-secondary)]">{data.description}</p>
                            <div className="grid grid-cols-2 gap-4 bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)] text-sm">
                                <div><span className="font-bold">Date:</span> {new Date(data.date).toDateString()}</div>
                                <div><span className="font-bold">Time:</span> {get('time', 'TBA')}</div>
                            </div>
                        </div>
                    </div>
                );
            case 'timeline':
                return (
                    <div>
                        <GalleryScroller images={data.images} title={data.title} onImageClick={onImageClick} />
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl font-bold text-[var(--primary-color)]">{data.year}</span>
                            </div>
                            <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{data.description}</p>
                        </div>
                    </div>
                );
            default:
                return <p>No details available.</p>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-[var(--bg-primary)] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-primary)] z-10">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                        {data.title || 'Details'}
                    </h3>
                    <button onClick={onClose} className="text-2xl text-[var(--text-muted)] hover:text-[var(--primary-color)] w-8 h-8 flex items-center justify-center rounded-full transition-colors">&times;</button>
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export const Footer = ({ socialLinks }) => {
    const getDisplayHandle = (url) => {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname.split('/').filter(Boolean).pop();
            return `@${path}` || urlObj.hostname;
        } catch {
            return 'Visit Link';
        }
    };

    return (
        <footer className="bg-[var(--bg-primary)] border-t border-[var(--border-color)] pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Connect With Us</h2>
                </div>
                <div className="footer-grid mb-16">
                    {socialLinks && socialLinks.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="footer-card group">
                            <div className="footer-icon-wrapper group-hover:scale-110 transition-transform duration-300">
                                <Icon name={s.icon} />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-bold text-[var(--text-primary)] text-sm truncate group-hover:text-[var(--primary-color)] transition-colors">
                                    {s.name || s.icon}
                                </span>
                                <span className="text-xs text-[var(--text-muted)] truncate font-mono block w-full">
                                    {getDisplayHandle(s.url)}
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
                <div className="border-t border-[var(--border-color)] pt-8 text-center">
                    <p className="text-[var(--text-muted)] font-medium text-sm">
                        Made with <span className="text-red-500">♥</span> by Technical Department IUCEE-RIT
                    </p>
                </div>
            </div>
        </footer>
    );
};