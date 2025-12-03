import React, { useState, useEffect, useRef } from 'react';

// ---------- Helpers ----------
const getFirstImage = (images, fallback = 'https://placehold.co/400x300/e2e8f0/1e293b?text=No+Image') => {
    if (!images || !Array.isArray(images) || images.length === 0) return fallback;
    return images[0] || fallback;
};

const safeGet = (obj, path, fallback = 'Data not available') => obj?.[path] ?? fallback;

// ---------- Scroll To Top Component ----------
export const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
            aria-label="Scroll to top"
        >
            ↑
        </button>
    );
};

// ---------- Theme Toggle Component ----------
const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const hasDarkClass = document.documentElement.classList.contains('dark');
        setIsDark(hasDarkClass);
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
            aria-label="Toggle Theme"
        >
            {isDark ? '🌙' : '☀️'}
        </button>
    );
};

// ---------- Marquee Scroller Component ----------
const MarqueeScroller = ({ items, direction = 'left', renderItem, speed = 1 }) => {
    const scrollerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const requestRef = useRef();
    const scrollPosRef = useRef(0);
    const isInitializedRef = useRef(false);

    // Duplicate items to ensure seamless loop
    const safeItems = items && items.length > 0 ? items : [];
    const duplicatedItems = [...safeItems, ...safeItems, ...safeItems, ...safeItems, ...safeItems, ...safeItems];

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
                    if (scrollPosRef.current >= resetPoint) {
                        scrollPosRef.current = 0;
                    }
                } else {
                    if (!isInitializedRef.current && scrollPosRef.current < 1) {
                        scrollPosRef.current = resetPoint;
                        scroller.scrollLeft = resetPoint;
                        isInitializedRef.current = true;
                    }
                    scrollPosRef.current -= speed;
                    if (scrollPosRef.current <= 0) {
                        scrollPosRef.current = resetPoint;
                    }
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

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);
    const handleTouchStart = () => setIsDragging(true);
    const handleTouchEnd = () => setIsDragging(false);

    return (
        <div
            className="marquee-container py-4"
            ref={scrollerRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="marquee-content">
                {duplicatedItems.map((item, index) => (
                    <div key={`${index}-${item.id || item.name || Math.random()}`} className="marquee-card">
                        {renderItem(item)}
                    </div>
                ))}
            </div>
        </div>
    );
};
// ---------- FullscreenViewer ----------
export const FullscreenViewer = ({ gallery, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleNext = () => setCurrentIndex(prev => (prev + 1) % gallery.length);
    const handlePrev = () => setCurrentIndex(prev => (prev - 1 + gallery.length) % gallery.length);

    if (!gallery || gallery.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center" onClick={onClose}>
            <button className="absolute top-4 right-4 text-white text-4xl z-20 hover:text-red-500 transition-colors" onClick={onClose}>&times;</button>
            <button className="absolute left-4 text-white text-5xl hidden md:block z-20 hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>&#x2039;</button>

            <img
                src={gallery[currentIndex]}
                alt="Fullscreen"
                className="max-h-[90vh] max-w-[90vw] object-contain animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            />

            <button className="absolute right-4 text-white text-5xl hidden md:block z-20 hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); handleNext(); }}>&#x203A;</button>
            <div className="absolute bottom-8 text-white bg-black/50 px-4 py-1 rounded-full text-sm backdrop-blur-sm">
                {currentIndex + 1} / {gallery.length}
            </div>
        </div>
    );
};

// ---------- GalleryScroller ----------
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
                    <button
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        &#8249;
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        &#8250;
                    </button>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {idx + 1} / {safeImages.length}
                    </div>
                </>
            )}
        </div>
    );
};

// ---------- Shared Icon Component ----------
const Icon = ({ name, className = "" }) => {
    if (!name) return null;
    const key = name.toLowerCase();

    const icons = {
        github: (
            <svg fill="currentColor" viewBox="0 0 24 24" className={className || "w-full h-full"} height="1em" width="1em">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-1.455-3.795-1.455-.54-1.38-1.335-1.755-1.335-1.755-1.095-.75.09-.735.09-.735 1.2.09 1.83 1.23 1.83 1.23 1.08 1.83 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
        ),
        linkedin: (
            <svg fill="currentColor" viewBox="0 0 24 24" className={className || "w-full h-full"} height="1em" width="1em">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
        instagram: (
            <svg fill="currentColor" viewBox="0 0 24 24" className={className || "w-full h-full"} height="1em" width="1em">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
        ),
        users: <span className="text-4xl">👥</span>,
        target: <span className="text-4xl">🎯</span>,
        award: <span className="text-4xl">🏆</span>,
        globe: <span className="text-4xl">🌍</span>
    };

    return icons[key] || <span className="text-xl">🔹</span>;
};

// ---------- Scroller Utility (Updated for centering) ----------
const Scroller = ({ children, autoScroll = false }) => {
    const scrollRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const scrollAmount = 300;

            if (direction === 1 && scrollLeft + clientWidth >= scrollWidth - 10) {
                scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scrollRef.current.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
            }
        }
    };

    useEffect(() => {
        if (!autoScroll || isPaused) return;
        const interval = setInterval(() => scroll(1), 3000);
        return () => clearInterval(interval);
    }, [autoScroll, isPaused]);

    return (
        <div
            className="scroll-section-container group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <button onClick={() => scroll(-1)} className="scroll-nav-btn left-0 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100" aria-label="Scroll Left">&lt;</button>
            <div className="scroll-wrapper" ref={scrollRef}>
                {children}
            </div>
            <button onClick={() => scroll(1)} className="scroll-nav-btn right-0 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100" aria-label="Scroll Right">&gt;</button>
        </div>
    );
};

// ---------- Component: LoadingScreen ----------
export const LoadingScreen = ({ isLoading }) => (
    <div id="loading-screen" className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-500 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[var(--primary-color)] mx-auto mb-4" />
            <h2 className="text-xl font-bold">Loading Experience...</h2>
        </div>
    </div>
);

// ---------- Component: Navbar ----------
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
                    {/* Logo Section */}
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-[var(--primary-color)] tracking-tight whitespace-nowrap">
                            IUCEE-RIT
                        </h1>
                        <div className="hidden sm:flex items-center gap-3 border-l border-gray-400 pl-4 h-8">

                            <img
                                src="/logos/iucee.jpg"
                                alt="Logo 1"
                                className="h-full w-auto object-contain"
                            />
                            <img
                                src="/logos/rit.jpg"
                                alt="Logo 2"
                                className="h-full w-auto object-contain"
                            />
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map(link => (
                            <a key={link.href} href={link.href} className="nav-link">{link.title}</a>
                        ))}
                        <div className="border-l border-gray-500 h-6 mx-2"></div>
                        <ThemeToggle />
                    </div>

                    {/* Mobile Menu Button */}
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
                        <img src="/logos/iucee.jpg" alt="Logo 1" className="h-10 w-auto" />
                        <img src="/logos/rit.jpg" alt="Logo 2" className="h-10 w-auto" />
                    </div>
                </div>
            )}
        </>
    );
};

// ---------- Component: HeroSection ----------
export const HeroSection = ({ onJoinClick, isEnrollmentOpen }) => (
    <section className="min-h-screen flex items-center justify-center text-center relative pt-20" id="hero">
        <div className="container mx-auto px-6 relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
                IUCEE RIT <br />  Student Chapter
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

// ---------- Component: VisionSection ----------
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

// ---------- Component: SdgSection ----------
export const SdgSection = ({ sdgs }) => (
    <section className="py-20" id="sdg">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">Sustainable Development Goals</h2>
                <p className="text-[var(--text-muted)] mt-2">We align every project with these global objectives.</p>
            </div>
            <Scroller autoScroll={true}>
                {sdgs && sdgs.map(goal => {
                    const colorVar = `var(--sdg-${goal.id})`;
                    return (
                        <div
                            key={goal.id}
                            className="sdg-card cursor-pointer"
                            style={{ borderTop: `6px solid ${colorVar}` }}
                            onClick={() => window.open(`https://sdgs.un.org/goals/goal${goal.id}`, "_blank")}
                        >
                            <div className="text-4xl mb-4 text-center">{goal.icon}</div>
                            <h3 className="font-bold text-[var(--text-primary)]" style={{ color: colorVar }}>
                                {goal.id}. {goal.title}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-2">{goal.description}</p>
                        </div>
                    );
                })}
            </Scroller>
        </div>
    </section>
);

// ---------- Component: ProjectsSection ----------
export const ProjectsSection = ({ projects, onShowDetails }) => (
    <section className="py-20 bg-[var(--bg-secondary)]" id="projects">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12 text-[var(--text-primary)]">Projects</h2>
            <Scroller>
                {projects && projects.map(project => (
                    <div key={project.id} className="project-card cursor-pointer" onClick={() => onShowDetails('project', project)}>
                        <img src={getFirstImage(project?.images)} alt={project?.title} loading="lazy" />
                        <div className="badge-3d mb-2">{safeGet(project, 'category', 'General')}</div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{safeGet(project, 'title')}</h3>
                        <p className="text-[var(--text-muted)] line-clamp-2 text-sm">{safeGet(project, 'description')}</p>
                    </div>
                ))}
            </Scroller>
        </div>
    </section>
);

// ---------- Component: TimelineSection ----------
export const TimelineSection = ({ timelineEvents }) => (
    <section className="py-20" id="timeline">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16 text-[var(--text-primary)]">Our Journey</h2>
            <div className="relative max-w-4xl mx-auto">
                <div className="timeline-line absolute left-4 md:left-1/2 top-0 bottom-0 w-1 transform md:-translate-x-1/2"></div>
                {timelineEvents && timelineEvents.map((event, index) => (
                    <div key={index} className={`relative flex items-center justify-between mb-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                        <div className="hidden md:block w-5/12"></div>
                        <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 timeline-dot w-4 h-4 rounded-full z-10"></div>
                        <div className="ml-12 md:ml-0 w-full md:w-5/12 timeline-content p-6 rounded-lg">
                            <span className="text-[var(--primary-color)] font-bold">{event.year}</span>
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">{event.title}</h3>
                            <p className="text-sm text-[var(--text-secondary)]">{event.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// ---------- Component: EventsSection ----------
export const EventsSection = ({ events, onShowDetails }) => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const displayEvents = activeTab === 'upcoming' ? events.upcoming : events.past;

    return (
        <section className="py-20" id="events">
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
                    )) : (
                        <p className="text-[var(--text-muted)] w-full text-center py-8">No events found.</p>
                    )}
                </Scroller>
            </div>
        </section>
    );
};

// ---------- Component: TeamSection ----------
export const TeamSection = ({ teamMembers, onShowDetails }) => {
    // Graceful handling if data is missing
    const safeMembers = teamMembers || [];
    if (safeMembers.length === 0) return null;

    const mid = Math.ceil(safeMembers.length / 2);
    const row1 = safeMembers.slice(0, mid);
    const row2 = safeMembers.slice(mid);

    const renderTeamCard = (m) => (
        <div className="team-card cursor-pointer group h-full bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl text-center hover:border-[var(--primary-color)] transition-colors" onClick={() => onShowDetails('team', m)}>
            <div className="relative mx-auto mb-3 w-24 h-24">
                <img
                    src={m.image || 'https://placehold.co/150x150?text=User'}
                    alt={m.name}
                    className="w-full h-full rounded-full object-cover border-4 border-[var(--border-color)] group-hover:border-[var(--primary-color)] transition-colors"
                />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">{m.name}</h3>
            <p className="text-[var(--primary-color)] font-semibold text-xs mb-1 truncate">{m.role}</p>
            <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider truncate">{m.department}</p>
        </div>
    );

    return (
        <section className="py-20 bg-[var(--bg-secondary)] overflow-hidden" id="team">
            <div className="container mx-auto px-6 mb-12">
                <h2 className="text-3xl font-bold text-center text-[var(--text-primary)]">Team</h2>
            </div>
            <MarqueeScroller items={row1.length > 0 ? row1 : safeMembers} direction="left" renderItem={renderTeamCard} speed={0.8} />
            <div className="mt-6">
                <MarqueeScroller items={row2.length > 0 ? row2 : safeMembers} direction="right" renderItem={renderTeamCard} speed={0.8} />
            </div>
        </section>
    );
};

// ---------- Component: AlumniSection ----------
export const AlumniSection = ({ alumni, onShowDetails }) => {
    const safeAlumni = alumni || [];
    if (safeAlumni.length === 0) return null;

    const mid = Math.ceil(safeAlumni.length / 2);
    const row1 = safeAlumni.slice(0, mid);
    const row2 = safeAlumni.slice(mid);

    const renderAlumniCard = (a) => (
        <div className="alumni-card cursor-pointer group h-full bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-xl text-center hover:border-[var(--primary-color)] transition-colors" onClick={() => onShowDetails('alumni', a)}>
            <div className="relative mx-auto mb-3 w-20 h-20">
                <img
                    src={a.image || 'https://placehold.co/150x150?text=Alumni'}
                    alt={a.name}
                    className="w-full h-full rounded-full object-cover border-4 border-[var(--border-color)] group-hover:border-[var(--primary-color)] transition-colors"
                />
            </div>
            <h3 className="text-md font-bold text-[var(--text-primary)] truncate">{a.name}</h3>
            <p className="text-[var(--text-secondary)] text-xs mb-2 truncate">{a.currentRole || a.current_role}</p>
            <span className="inline-block bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-muted)] text-[10px] px-2 py-1 rounded-full">
                Class of {a.year}
            </span>
        </div>
    );

    return (
        <section className="py-20 overflow-hidden" id="alumni">
            <div className="container mx-auto px-6 mb-12">
                <h2 className="text-3xl font-bold text-center text-[var(--text-primary)]">Alumni</h2>
            </div>
            <MarqueeScroller items={row1.length > 0 ? row1 : safeAlumni} direction="left" renderItem={renderAlumniCard} speed={0.8} />
            <div className="mt-6">
                <MarqueeScroller items={row2.length > 0 ? row2 : safeAlumni} direction="right" renderItem={renderAlumniCard} speed={0.8} />
            </div>
        </section>
    );
};

// ---------- Component: AchievementsSection ----------
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

// ---------- Component: PartnersSection ----------
export const PartnersSection = ({ partners }) => {
    if (!partners || partners.length === 0) return null;

    // Use the Refactored Marquee Scroller here as well for consistency
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

// ---------- Component: GalleryComponent ----------
export const GalleryComponent = ({ galleryItems, onGalleryClick }) => {
    const scrollRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            const isMobile = window.innerWidth < 768;
            const cardWidth = isMobile ? window.innerWidth * 0.85 : window.innerWidth * 0.6;
            const gap = 32; // 2rem
            const scrollAmount = cardWidth + gap;

            if (direction === 1 && scrollLeft + clientWidth >= scrollWidth - 10) {
                scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                scrollRef.current.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
            }
        }
    };

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => scroll(1), 4000);
        return () => clearInterval(interval);
    }, [isPaused]);

    if (!galleryItems || galleryItems.length === 0) return null;

    return (
        <section
            className="py-20 bg-[var(--bg-primary)] overflow-hidden"
            id="gallery"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="container mx-auto px-6 mb-8">
                <h2 className="text-3xl font-bold text-center text-[var(--text-primary)]">Gallery</h2>
            </div>
            <div className="relative w-full group/slider">
                <button
                    className="gallery-nav-btn left-4 opacity-0 group-hover/slider:opacity-100 md:opacity-100"
                    onClick={() => scroll(-1)}
                    aria-label="Previous"
                >
                    &#8249;
                </button>
                <button
                    className="gallery-nav-btn right-4 opacity-0 group-hover/slider:opacity-100 md:opacity-100"
                    onClick={() => scroll(1)}
                    aria-label="Next"
                >
                    &#8250;
                </button>
                <div className="gallery-slider" ref={scrollRef}>
                    {galleryItems.map((item, index) => (
                        <div
                            key={index}
                            className="gallery-slide"
                            onClick={() => onGalleryClick(item)}
                        >
                            <img src={item.images[0]} alt={item.title} loading="lazy" />
                            <div className="gallery-slide-overlay">
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-gray-200 text-sm md:text-base">{item.description}</p>
                                {item.totalImages > 1 && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                                        +{item.totalImages - 1} more photos
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ---------- Component: Footer ----------
export const Footer = ({ socialLinks }) => (
    <footer className="bg-[var(--bg-primary)] border-t border-[var(--border-color)] py-12 text-center">
        <div className="container mx-auto px-6">
            <div className="flex justify-center gap-8 mb-8">
                {socialLinks && socialLinks.map((s, i) => (
                    <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--primary-color)] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1"
                        aria-label={s.name || 'Social Link'}
                    >
                        <Icon name={s.icon} />
                    </a>
                ))}
            </div>
            <p className="text-[var(--text-muted)] font-medium">
                Made with <span className="text-red-500 animate-pulse">♥</span> from Technical Department IUCEE-RIT
            </p>
        </div>
    </footer>
);

// ---------- Application Modal (Connected to DB) ----------
export const ApplicationModal = ({ isOpen, onClose }) => {
    // Add state for loading
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Gather form data
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Submission failed');
            }

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
                    {/* Row 1 */}
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

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-[var(--text-secondary)]">Phone Number</label>
                            <input required type="tel" name="phone" placeholder="+91 98765 43210" className="input-3d w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2 rounded border border-[var(--border-color)]" disabled={isSubmitting} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-[var(--text-secondary)]">PRN</label>
                            <input required name="prn" placeholder="12345678" className="input-3d w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2 rounded border border-[var(--border-color)]" disabled={isSubmitting} />
                        </div>
                    </div>

                    {/* Row 3 */}
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
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-[var(--text-secondary)]">Year of Study</label>
                            <select required name="year" className="input-3d w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2 rounded border border-[var(--border-color)]" disabled={isSubmitting}>
                                <option value="">Select Year</option>
                                <option value="FE">First Year</option>
                                <option value="SE">Second Year</option>
                                <option value="TE">Third Year</option>
                                <option value="BE">Final Year</option>
                            </select>
                        </div>
                    </div>

                    {/* Text Areas */}
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-[var(--text-secondary)]">Why do you want to join?</label>
                        <textarea required name="motivation" rows="3" placeholder="Explain your motivation..." className="input-3d w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2 rounded border border-[var(--border-color)]" disabled={isSubmitting}></textarea>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-[var(--text-secondary)]">Prior Experience (if any)</label>
                        <textarea name="experience" rows="3" placeholder="Technical skills, past projects, etc." className="input-3d w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] p-2 rounded border border-[var(--border-color)]" disabled={isSubmitting}></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`btn-primary w-full py-3 mt-4 text-lg flex justify-center items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                            </>
                        ) : 'Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    )
};

// ---------- Details Modal ----------
export const DetailsModal = ({ isOpen, onClose, type, data, onImageClick }) => {
    if (!isOpen || !data) return null;
    const get = (key, fallback) => data[key] || fallback;

    const renderContent = () => {
        switch (type) {
            case 'project':
                return (
                    <div className="flex flex-col gap-4">
                        {/* 1. Main Slider */}
                        <GalleryScroller
                            images={data.images}
                            title={data.title}
                            onImageClick={onImageClick}
                        />

                        {/* 2. Thumbnail Strip */}
                        {data.images && data.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {data.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`Thumbnail ${idx}`}
                                        className="w-20 h-16 object-cover rounded cursor-pointer border-2 border-transparent hover:border-[var(--primary-color)] transition-all"
                                        onClick={() => onImageClick(img, data.images, idx)}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-4">
                                <h4 className="font-bold text-[var(--primary-color)]">Description</h4>
                                <p className="text-[var(--text-secondary)]">{get('description')}</p>

                                {/* Team/Contributors */}
                                {data.teamMembers && data.teamMembers.length > 0 && (
                                    <>
                                        <h4 className="font-bold text-[var(--primary-color)] mt-4">Contributors</h4>
                                        <ul className="list-disc list-inside text-[var(--text-secondary)]">
                                            {data.teamMembers.map((m, i) => <li key={i}>{m}</li>)}
                                        </ul>
                                    </>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-4">
                                <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                                    <div className="mb-2"><span className="font-bold">Year:</span> {get('project_year') || get('year') || 'N/A'}</div>
                                    <div className="mb-2"><span className="font-bold">Status:</span> {get('status', 'Active')}</div>
                                    <div className="mb-2"><span className="font-bold">Category:</span> {get('category', 'General')}</div>
                                </div>
                                {data.technologies && data.technologies.length > 0 && (
                                    <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                                        <h5 className="font-bold mb-2 text-sm">Tech Stack</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {data.technologies.map((t, i) => (
                                                <span key={i} className="text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] px-2 py-1 rounded">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Check for DB column github_url, else fallback to links object */}
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
                                <div><span className="font-bold">Location:</span> {get('location', 'TBA')}</div>
                                {type === 'upcoming_event' && (
                                    <div><span className="font-bold">Capacity:</span> {get('capacity', 'Unlimited')}</div>
                                )}
                            </div>
                            {type === 'upcoming_event' && data.redirect_url && (
                                <a href={data.redirect_url} target="_blank" className="btn-primary block text-center w-full py-3 mt-4">Register Now</a>
                            )}
                        </div>
                    </div>
                );
            case 'team':
            case 'alumni':
                // Common fields normalization
                const isAlumni = type === 'alumni';
                const role = isAlumni ? (data.currentRole || data.current_role) : data.role;
                const subtext = isAlumni ? `Class of ${data.year}` : data.department;
                const link = data.linkedin_url || data.link;

                return (
                    <div className="profile-grid">
                        {/* Left Column: Big Image */}
                        <div className="shrink-0">
                            <img
                                src={data.image || 'https://placehold.co/400x400?text=User'}
                                alt={data.name}
                                className="profile-avatar-large"
                            />
                        </div>

                        {/* Right Column: Details */}
                        <div className="profile-content">
                            <h4 className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                                {data.name}
                            </h4>
                            <p className="text-xl text-[var(--primary-color)] font-bold mb-1">
                                {role}
                            </p>
                            <div className="inline-block bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-1 rounded-full text-xs font-semibold text-[var(--text-muted)] tracking-wider uppercase mb-6 self-center md:self-start">
                                {subtext}
                            </div>

                            {/* Bio / Quote Section */}
                            <div className="text-[var(--text-secondary)] leading-relaxed space-y-4 mb-6">
                                {isAlumni && data.quote && (
                                    <blockquote className="italic border-l-4 border-[var(--primary-color)] pl-4 py-1 my-4 bg-[var(--bg-secondary)]/30 rounded-r">
                                        "{data.quote}"
                                    </blockquote>
                                )}
                                {data.bio && <p>{data.bio}</p>}
                            </div>

                            {/* Uniform Button */}
                            {link && (
                                <div className="mt-auto pt-2">
                                    <a
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary inline-flex items-center px-6 py-3 gap-2 text-sm uppercase tracking-wide shadow-lg"
                                    >
                                        <Icon name="linkedin" className="w-5 h-5" />
                                        Connect on LinkedIn
                                    </a>
                                </div>
                            )}
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
                        {type === 'team' || type === 'alumni' ? 'Profile Details' : (data.title || 'Details')}
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