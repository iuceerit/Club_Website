"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

import {
  LoadingScreen, Navbar, HeroSection, VisionSection, TimelineSection,
  ProjectsSection, EventsSection, AchievementsSection, TeamSection, AlumniSection,
  GalleryComponent, Footer, ApplicationModal, DetailsModal, SdgSection,
  FullscreenViewer, ScrollToTop,
  PartnersSection
} from '../components/main';

import {
  socialMedia, sdgData
} from '../lib/data';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  // 1. App Data State
  const [appData, setAppData] = useState({
    timelineEvents: [],
    achievements: [],
    partnersData: [],
    alumni: [],
    galleryData: [],
    projectsData: [],
    teamData: [],
    eventsData: { upcoming: [], past: [] }
  });

  const canvasRef = useRef(null);

  // 2. UI States
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, type: '', data: null });
  const [isApplyModalOpen, setApplicationModalOpen] = useState(false);
  const [fullscreenViewer, setFullscreenViewer] = useState({ isOpen: false, gallery: [], startIndex: 0 });
  const [isScrolled, setIsScrolled] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);

  // --- Initial Data Load ---
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const contentRes = await fetch('/api/content').catch(() => null);
        if (contentRes && contentRes.ok) {
          const data = await contentRes.json();
          setAppData(prev => ({
            ...prev,
            projectsData: data.projectsData || [],
            galleryData: data.gallery || [],
            eventsData: {
              upcoming: data.events?.upcoming || [],
              past: data.events?.past || []
            },
            teamData: data.team || [],
            alumni: data.alumni || [],
            timelineEvents: data.timelineEvents || [],
            achievements: data.achievements || [],
            partnersData: data.partnersData || []
          }));
        }

        const btnRes = await fetch('/api/button-status').catch(() => null);
        if (btnRes && btnRes.ok) {
          const btnData = await btnRes.json();
          setIsEnrollmentOpen(btnData.enabled);
        }
      } catch (error) {
        console.error("Data load error:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 1000);
      }
    };
    loadAllData();
  }, []);

  // --- HELPER: Generic Fetcher for Details ---
  const fetchFullDetailsIfNeeded = async (item, type) => {
    const currentImgCount = item.images?.length || 0;
    const totalImgCount = item.totalImages || 0;

    if (totalImgCount > currentImgCount && !item.detailsLoaded) {
      try {
        const res = await fetch(`/api/content?type=${type}_details&id=${item.id}`);
        if (res.ok) {
          const fullData = await res.json();
          return { ...item, ...fullData, detailsLoaded: true };
        }
      } catch (e) {
        console.error(`Failed to fetch details for ${type}`, e);
      }
    }
    return item;
  };

  // --- Show Details Handler ---
  const handleShowDetails = async (type, data) => {
    setDetailsModal({ isOpen: true, type, data });
    const fullData = await fetchFullDetailsIfNeeded(data, type);
    if (fullData.detailsLoaded && fullData !== data) {
      setDetailsModal(prev => ({ ...prev, data: fullData }));
    }
  };

  // --- Gallery Click Handler ---
  const handleGalleryClick = async (item) => {
    let imagesToShow = item.images;
    setFullscreenViewer({
      isOpen: true,
      gallery: imagesToShow.map(img => typeof img === 'string' ? img : img.src),
      startIndex: 0
    });
    const fullItem = await fetchFullDetailsIfNeeded(item, 'gallery');
    if (fullItem.detailsLoaded && fullItem.images.length > imagesToShow.length) {
      setFullscreenViewer(prev => ({
        ...prev,
        gallery: fullItem.images.map(img => typeof img === 'string' ? img : img.src)
      }));
      setAppData(prev => ({
        ...prev,
        galleryData: prev.galleryData.map(g => g.id === item.id ? fullItem : g)
      }));
    }
  };

  // --- Three.js Background ---
  useEffect(() => {
    if (!canvasRef.current || !THREE) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 5;

    const palette = [
      new THREE.Color('#059669'), new THREE.Color('#06b6d4'),
      new THREE.Color('#34d399'), new THREE.Color('#22d3ee')
    ];

    const particleCount = window.innerWidth <= 768 ? 60 : 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.8 });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const animate = () => {
      requestAnimationFrame(animate);
      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0002;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openFullscreenViewer = (gallery, startIndex = 0) => {
    setFullscreenViewer({
      isOpen: true,
      gallery: gallery.map(img => typeof img === 'string' ? img : img.src),
      startIndex
    });
  };

  // Helper boolean to check if ANY events exist
  const hasEvents = appData.eventsData.upcoming.length > 0 || appData.eventsData.past.length > 0;

  return (
    <div className="App transition-colors duration-300">
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 opacity-30 pointer-events-none" />
      <LoadingScreen isLoading={isLoading} />
      <Navbar isScrolled={isScrolled} />
      <main>
        <HeroSection onJoinClick={() => setApplicationModalOpen(true)} isEnrollmentOpen={isEnrollmentOpen} />

        {/* Vision is static content, kept visible */}
        <VisionSection />

        {/* Conditionally Render Sections based on Data Availability */}
        {appData.achievements.length > 0 && (
          <AchievementsSection achievements={appData.achievements} />
        )}

        {/* SDG is static data from file, kept visible */}
        <SdgSection sdgs={sdgData} />

        {appData.projectsData.length > 0 && (
          <ProjectsSection projects={appData.projectsData} onShowDetails={handleShowDetails} />
        )}

        {hasEvents && (
          <EventsSection events={appData.eventsData} onShowDetails={handleShowDetails} />
        )}

        {appData.timelineEvents.length > 0 && (
          <TimelineSection timelineEvents={appData.timelineEvents} />
        )}

        {appData.teamData.length > 0 && (
          <TeamSection teamMembers={appData.teamData} onShowDetails={handleShowDetails} />
        )}

        {appData.alumni.length > 0 && (
          <AlumniSection alumni={appData.alumni} onShowDetails={handleShowDetails} />
        )}

        {appData.partnersData.length > 0 && (
          <PartnersSection partners={appData.partnersData} />
        )}

        {appData.galleryData.length > 0 && (
          <GalleryComponent
            galleryItems={appData.galleryData}
            onGalleryClick={handleGalleryClick}
          />
        )}
      </main>
      <Footer socialLinks={socialMedia} />
      <ScrollToTop />
      <ApplicationModal isOpen={isApplyModalOpen} onClose={() => setApplicationModalOpen(false)} />

      <DetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, type: '', data: null })}
        type={detailsModal.type}
        data={detailsModal.data}
        onImageClick={(img, gallery, index) => openFullscreenViewer(gallery, index)}
      />

      {fullscreenViewer.isOpen && (
        <FullscreenViewer
          gallery={fullscreenViewer.gallery}
          startIndex={fullscreenViewer.startIndex}
          onClose={() => setFullscreenViewer({ isOpen: false, gallery: [], startIndex: 0 })}
        />
      )}
    </div>
  );
}