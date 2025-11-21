'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Stories.module.css";
import { Volume2, VolumeX, MoreHorizontal, Heart, MessageSquare, Share2, X, Flag
} from "lucide-react";

export type StoryItem = {
  userId: number;
  username: string;
  avatar: string;
  createdAt?: number;
  media: { type: "image" | "video"; url: string; duration?: number };
  mediaIndex?: number;
  userStoriesCount?: number;
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
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
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
  const [isMenuPaused, setIsMenuPaused] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prevUserRef = useRef<number | null>(null);
  const startTouchY = useRef<number | null>(null);
  const touchDeltaY = useRef<number>(0);
  const isActuallyPaused = isPaused || showMenu || showBottomSheet;
  const viewedRef = useRef<Set<number>>(new Set([startIndex]));

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

  // Отмечаем просмотренные истории
  useEffect(() => {
    viewedRef.current.add(index);
  }, [index]);

  // apply volume/mute to video element
  useEffect(() => {
    if (videoRef.current) {
      if (isActuallyPaused) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  }, [isActuallyPaused]);

  // notify parent about user change (index inside user's list)
  useEffect(() => {
    if (typeof onUserChange === "function") {
      onUserChange(current.userId, posInUser);
    }
    prevUserRef.current = current.userId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current.userId, posInUser]);

  // preload next media
  useEffect(() => {
    const next = items[index + 1];
    if (!next) return;
    if (next.media.type === "image") {
      const img = new Image();
      img.src = next.media.url;
    } else {
      const v = document.createElement('video');
      v.src = next.media.url;
      v.preload = 'auto';
    }
  }, [index, items]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    setIndex(i => {
      // Ищем следующий непросмотренный
      for (let nextIdx = i + 1; nextIdx < items.length; nextIdx++) {
        if (!viewedRef.current.has(nextIdx)) {
          return nextIdx;
        }
      }
      
      // Если все последующие просмотрены, идём по порядку
      const next = i + 1;
      
      if (next < items.length) {
        return next;
      }
      
      // Достигли конца
      if (loop) {
        // В режиме loop ищем первый непросмотренный с начала
        const firstUnseen = items.findIndex((_, idx) => !viewedRef.current.has(idx));
        return firstUnseen !== -1 ? firstUnseen : 0;
      } else {
        setTimeout(() => onClose(), 0);
        return i;
      }
    });

    setProgress(0);
    setTimeout(() => closeAllMenus(), 0);
    clearTimer();
  }, [items, loop, onClose, clearTimer]);

  const goPrev = useCallback(() => {
    closeAllMenus();
    setIndex(i => {
      // Ищем предыдущий непросмотренный
      for (let prevIdx = i - 1; prevIdx >= 0; prevIdx--) {
        if (!viewedRef.current.has(prevIdx)) {
          return prevIdx;
        }
      }
      
      // Если все предыдущие просмотрены, идём по порядку
      return Math.max(0, i - 1);
    });
    setProgress(0);
    clearTimer();
  }, [clearTimer]);

  // progress handling (video or image)
  useEffect(() => {
    clearTimer();
    setProgress(0);

    // reset wide flag and then evaluate actual media dims shortly
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
        setTimeout(() => goNext(), 0);
      };

      v.addEventListener('timeupdate', onTime);
      v.addEventListener('ended', onEnded);

      // metadata loaded -> compute if wide
      const onMeta = () => {
        if (v.videoWidth && v.videoHeight) {
          setIsWideMedia(v.videoWidth / v.videoHeight > 1.4);
        }
      };
      v.addEventListener('loadedmetadata', onMeta);

      if (!isPaused) v.play().catch(() => {});
      else v.pause();

      return () => {
        v.removeEventListener('timeupdate', onTime);
        v.removeEventListener('ended', onEnded);
        v.removeEventListener('loadedmetadata', onMeta);
      };
    } else {
      // image: start timer and compute image natural size
      let elapsed = 0;
      const img = new Image();
      img.src = current.media.url;
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setIsWideMedia(img.naturalWidth / img.naturalHeight > 1.4);
        }
      };

      if (!isPaused) {
        timerRef.current = window.setInterval(() => {
          elapsed += PROGRESS_TICK_MS;
          setProgress(Math.min(1, elapsed / duration));
          if (elapsed >= duration) {
            clearTimer();
            setTimeout(() => goNext(), 0);
          }
        }, PROGRESS_TICK_MS);
      }
      return () => clearTimer();
    }
  }, [current, isPaused, goNext, duration, clearTimer]);

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
    setTimeout(() => closeAllMenus(), 0);
    if (zone === "prev") goPrev();
    if (zone === "next") goNext();
    if (zone === "toggle") setIsPaused(p => !p);
  };

  // like toggle (visual only)
  const toggleLike = (idx: number) => {
    setLiked(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // three-dots menu handlers
  const onMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMobile = window.innerWidth <= 768;
    if (isMobile) setShowBottomSheet(true);
    else setShowMenu(prev => !prev);
  };

  const closeAllMenus = useCallback(() => {
    setShowMenu(false);
    setShowBottomSheet(false);
  }, []);

  useEffect(() => {
    if (isMenuPaused) setIsPaused(true);
    else setIsPaused(false);
  }, [isMenuPaused]);

  // touch handlers for swipe down to close on mobile
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    startTouchY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startTouchY.current === null) return;
    const curY = e.touches[0].clientY;
    touchDeltaY.current = curY - startTouchY.current;
    // optional: we can translate container for UX (not required)
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
    setTimeout(() => closeAllMenus(), 0);
    // threshold, close if swiped down enough
    if (delta > 120) onClose();
  };

  // Stop propagation so clicks on the modal don't close overlay (we don't auto close overlay on click though)
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
        {/* Header with avatar, name, time, more + close */}
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
              title="More"
            >
              <MoreHorizontal size={20} />
            </button>

            <button className={styles.closeBtnTop} onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>

            {/* simple desktop menu */}
            {showMenu && (
              <div className={styles.menu}>
                <button className={styles.menuItem}><Flag size={16} />Пожаловаться</button>
                <button className={styles.menuItem}>Скрыть истории пользователя</button>
              </div>
            )}
          </div>
        </header>

        {/* Progress row */}
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

        {/* Media area */}
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
            autoPlay
            preload="auto"
            controls={false}
          />
          )}

          {/* Hit zones (prev / toggle / next) */}
          <div className={styles.hitZones}>
            <button className={`${styles.zone} ${styles.left}`} onClick={() => handleZoneClick("prev")} aria-label="Prev" />
            <button className={`${styles.zone} ${styles.center}`} onClick={() => handleZoneClick("toggle")} aria-label="Pause/Play" />
            <button className={`${styles.zone} ${styles.right}`} onClick={() => handleZoneClick("next")} aria-label="Next" />
          </div>

          {/* volume controls */}
          <div className={styles.volumeControls}>
            {current.media.type === 'video' && (
              <>
                <button
                  className={styles.soundBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(m => !m);
                  }}
                  aria-label="Toggle sound"
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
                  aria-label="Volume"
                />
              </>
            )}
          </div>

          {/* bottom controls */}
          <div className={styles.bottomControls}>
            <button
              className={`${styles.actionBtn} ${liked[index] ? styles.liked : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(index);
              }}
              aria-pressed={!!liked[index]}
              title={liked[index] ? "Liked" : "Like"}
            >
              <Heart size={20} />
            </button>

            <button className={styles.actionBtn} onClick={(e) => e.stopPropagation()} title="Send message">
              <MessageSquare size={20} />
            </button>

            <button className={styles.actionBtn} onClick={(e) => e.stopPropagation()} title="Share">
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* bottom sheet for mobile or confirm panel for desktop */}
        <div
          className={`${styles.bottomSheet} ${showBottomSheet ? styles.sheetVisible : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.sheetHandle} />
          <button className={styles.sheetItem}><Flag size={16} /> Пожаловаться</button>
          <button className={styles.sheetItem}>Скрыть истории пользователя</button>
          <button className={styles.sheetCancel} onClick={() => setShowBottomSheet(false)}>Отмена</button>
        </div>

      </div>
    </div>
  );
};

export default Stories;
