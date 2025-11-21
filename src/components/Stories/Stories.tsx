'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Stories.module.css";
import { Volume2, VolumeX, MoreHorizontal, Heart, MessageSquare, Share2, X, Flag } from "lucide-react";

export type StoryItem = {
  userId: number;
  username: string;
  avatar: string;
  createdAt?: number;
  media: { type: "image" | "video"; url: string; duration?: number };
  originalIndex?: number;
  mediaIndex?: number;
  isViewed?: boolean;
};

type Props = {
  items: StoryItem[];
  startIndex: number;
  onClose: () => void;
  onUserChange?: (userId: number, storyIdx: number) => void;
  loop?: boolean;
};

const DEFAULT_IMAGE_DURATION = 5000;
const PROGRESS_TICK_MS = 50;

const timeAgo = (ts?: number) => {
  if (!ts) return '';
  
  const now = Date.now();
  const diff = now - ts;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}д`;
  if (hours > 0) return `${hours}ч`;
  if (minutes > 0) return `${minutes}м`;
  return 'только что';
};

const Stories = ({ items, startIndex, onClose, onUserChange, loop = false }: Props) => {
  const [index, setIndex] = useState<number>(startIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.05);
  const [showMenu, setShowMenu] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [isWideMedia, setIsWideMedia] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startTouchY = useRef<number | null>(null);
  const touchDeltaY = useRef<number>(0);
  const isActuallyPaused = isPaused || showMenu || showBottomSheet;

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // guards
  if (!items || items.length === 0) return null;
  if (index < 0 || index >= items.length) return null;
  const current = items[index];
  if (!current) return null;

  // indices for current user (to render progress segments)
  const userIndices = items
    .map((it, ii) => ({ it, ii }))
    .filter(x => x.it.userId === current.userId)
    .map(x => x.ii);
  const posInUser = userIndices.indexOf(index);
  const duration = current.media.duration ?? (current.media.type === "image" ? DEFAULT_IMAGE_DURATION : 0);

  // notify parent about user change
  useEffect(() => {
    if (typeof onUserChange === "function") {
      onUserChange(current.userId, posInUser);
    }
  }, [index, current.userId, posInUser, onUserChange]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    const nextIndex = index + 1;
    
    if (nextIndex < items.length) {
      setIndex(nextIndex);
      setProgress(0);
    } else {
      onClose();
    }
    
    clearTimer();
  }, [index, items.length, onClose, clearTimer]);

  const goPrev = useCallback(() => {
    const prevIndex = index - 1;
    
    if (prevIndex >= 0) {
      setIndex(prevIndex);
      setProgress(0);
    }
    
    clearTimer();
  }, [index, clearTimer]);

  // progress handling
  useEffect(() => {
    clearTimer();
    setProgress(0);
    setIsWideMedia(false);

    if (current.media.type === "video") {
      const v = videoRef.current;
      if (!v) return;

      const onTime = () => {
        if (v.duration && !isNaN(v.duration)) {
          setProgress(Math.min(1, v.currentTime / v.duration));
        }
      };
      const onEnded = () => {
        goNext();
      };

      v.addEventListener('timeupdate', onTime);
      v.addEventListener('ended', onEnded);

      const onMeta = () => {
        if (v.videoWidth && v.videoHeight) {
          setIsWideMedia(v.videoWidth / v.videoHeight > 1.4);
        }
      };
      v.addEventListener('loadedmetadata', onMeta);

      if (!isActuallyPaused) v.play().catch(() => {});
      else v.pause();

      return () => {
        v.removeEventListener('timeupdate', onTime);
        v.removeEventListener('ended', onEnded);
        v.removeEventListener('loadedmetadata', onMeta);
      };
    } else {
      let elapsed = 0;
      const img = new Image();
      img.src = current.media.url;
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setIsWideMedia(img.naturalWidth / img.naturalHeight > 1.4);
        }
      };

      if (!isActuallyPaused) {
        timerRef.current = window.setInterval(() => {
          elapsed += PROGRESS_TICK_MS;
          setProgress(Math.min(1, elapsed / duration));
          if (elapsed >= duration) {
            clearTimer();
            goNext();
          }
        }, PROGRESS_TICK_MS);
      }
      return () => clearTimer();
    }
  }, [current, isActuallyPaused, goNext, duration, clearTimer]);

  // keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, onClose]);

  // hit zones
  const handleZoneClick = (zone: "prev" | "toggle" | "next") => {
    if (zone === "prev") goPrev();
    if (zone === "next") goNext();
    if (zone === "toggle") setIsPaused(p => !p);
  };

  // like toggle
  const toggleLike = (idx: number) => {
    setLiked(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // menu handlers - ИСПРАВЛЕННАЯ ЛОГИКА
  const onMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Добавляем preventDefault для мобильных
    
    if (isMobile) {
      setShowBottomSheet(true);
      setShowMenu(false);
    } else {
      setShowMenu(prev => !prev);
      setShowBottomSheet(false);
    }
  };

  const closeAllMenus = useCallback(() => {
    setShowMenu(false);
    setShowBottomSheet(false);
  }, []);

  // Закрывать меню при клике вне его
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  // touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    startTouchY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startTouchY.current === null) return;
    const curY = e.touches[0].clientY;
    touchDeltaY.current = curY - startTouchY.current;
    const el = document.querySelector(`.${styles.container}`) as HTMLElement | null;
    if (el && touchDeltaY.current > 0) {
      el.style.transform = `translateY(${touchDeltaY.current}px) scale(${1 - Math.min(0.08, touchDeltaY.current / 200)})`;
      el.style.transition = 'transform 0s';
    }
  };

  const onTouchEnd = () => {
    const delta = touchDeltaY.current;
    const el = document.querySelector(`.${styles.container}`) as HTMLElement | null;
    if (el) {
      el.style.transform = '';
      el.style.transition = '';
    }
    startTouchY.current = null;
    touchDeltaY.current = 0;
    
    // Закрываем bottom sheet если свайпаем вниз
    if (showBottomSheet && delta > 50) {
      setShowBottomSheet(false);
    }
    
    if (delta > 120) onClose();
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.container}
        onClick={stop}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <header className={styles.header}>
          <div className={styles.leftHeader}>
            <img src={current.avatar} className={styles.avatar} alt={current.username} draggable={false} />
            <div className={styles.meta}>
              <div className={styles.username}>{current.username}</div>
              <div className={styles.timeAgo}>{timeAgo(current.createdAt)}</div>
            </div>
          </div>

          <div className={styles.rightHeader}>
            <button
              className={styles.moreBtn}
              onClick={onMoreClick}
              aria-label="More"
            >
              <MoreHorizontal size={20} />
            </button>

            <button className={styles.closeBtnTop} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>

            {/* Десктоп меню */}
            {showMenu && !isMobile && (
              <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
                <button className={styles.menuItem}><Flag size={16} />Пожаловаться</button>
                <button className={styles.menuItem}>Скрыть истории пользователя</button>
              </div>
            )}
          </div>
        </header>

        <div className={styles.progressRow}>
          {userIndices.map((globalIndex, pos) => (
            <div key={globalIndex} className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{
                  transform:
                    pos === posInUser
                      ? `scaleX(${progress})`
                      : pos < posInUser
                        ? 'scaleX(1)'
                        : 'scaleX(0)'
                }}
              />
            </div>
          ))}
        </div>

        <div className={`${styles.mediaArea} ${isWideMedia ? styles.wide : ''}`}>
          {current.media.type === 'image' ? (
            <img
              src={current.media.url}
              className={styles.mediaImage}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                setIsWideMedia(img.naturalWidth / img.naturalHeight > 1.4);
              }}
              alt=""
            />
          ) : (
          <video
            ref={(v) => {
              videoRef.current = v;
              if (v) {
                v.volume = volume;
                v.muted = isMuted;
              }
            }}
            src={current.media.url}
            className={styles.mediaVideo}
            playsInline
            autoPlay={!isActuallyPaused}
            preload="auto"
            controls={false}
          />
          )}

          <div className={styles.hitZones}>
            <button className={`${styles.zone} ${styles.left}`} onClick={() => handleZoneClick("prev")} />
            <button className={`${styles.zone} ${styles.center}`} onClick={() => handleZoneClick("toggle")} />
            <button className={`${styles.zone} ${styles.right}`} onClick={() => handleZoneClick("next")} />
          </div>

          {current.media.type === 'video' && (
            <div className={styles.volumeControls}>
              <button
                className={styles.soundBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(m => !m);
                }}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (v > 0 && isMuted) setIsMuted(false);
                  if (videoRef.current) videoRef.current.volume = v;
                }}
                className={styles.volumeSlider}
              />
            </div>
          )}

          <div className={styles.bottomControls}>
            <button
              className={`${styles.actionBtn} ${liked[index] ? styles.liked : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(index);
              }}
            >
              <Heart size={20} />
            </button>

            <button className={styles.actionBtn}>
              <MessageSquare size={20} />
            </button>

            <button className={styles.actionBtn}>
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* Мобильное bottom sheet */}
        {showBottomSheet && isMobile && (
          <div 
            className={`${styles.bottomSheet} ${showBottomSheet ? styles.sheetVisible : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className={styles.sheetHandle} 
              onClick={() => setShowBottomSheet(false)}
            />
            <button className={styles.sheetItem} onClick={() => setShowBottomSheet(false)}>
              <Flag size={16} /> Пожаловаться
            </button>
            <button className={styles.sheetItem} onClick={() => setShowBottomSheet(false)}>
              Скрыть истории пользователя
            </button>
            <button 
              className={styles.sheetCancel} 
              onClick={() => setShowBottomSheet(false)}
            >
              Отмена
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stories;
