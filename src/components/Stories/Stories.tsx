"use client";

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
  if (!ts) return "";
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}д`;
  if (hours > 0) return `${hours}ч`;
  if (minutes > 0) return `${minutes}м`;
  return "только что";
};

const Stories = ({ items, startIndex, onClose, onUserChange }: Props) => {
  const [index, setIndex] = useState(startIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.05);
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [isWideMedia, setIsWideMedia] = useState(false);

  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isActuallyPaused = isPaused || showMenu;

  if (!items.length) return null;
  if (index < 0 || index >= items.length) return null;

  const current = items[index];
  if (!current) return null;

  const userIndices = items
    .map((it, ii) => ({ it, ii }))
    .filter((x) => x.it.userId === current.userId)
    .map((x) => x.ii);

  const posInUser = userIndices.indexOf(index);
  const duration =
    current.media.duration ??
    (current.media.type === "image" ? DEFAULT_IMAGE_DURATION : 0);

  useEffect(() => {
    if (onUserChange) onUserChange(current.userId, posInUser);
  }, [index, current.userId, posInUser, onUserChange]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    const next = index + 1;
    if (next < items.length) {
      setIndex(next);
      setProgress(0);
    } else {
      onClose();
    }
    clearTimer();
  }, [index, items.length, onClose, clearTimer]);

  const goPrev = useCallback(() => {
    const prev = index - 1;
    if (prev >= 0) {
      setIndex(prev);
      setProgress(0);
    }
    clearTimer();
  }, [index, clearTimer]);

  /** Progress handling */
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

      const onEnded = () => goNext();

      const onMeta = () => {
        if (v.videoWidth && v.videoHeight) {
          setIsWideMedia(v.videoWidth / v.videoHeight > 1.4);
        }
      };

      v.addEventListener("timeupdate", onTime);
      v.addEventListener("ended", onEnded);
      v.addEventListener("loadedmetadata", onMeta);

      if (!isActuallyPaused) v.play().catch(() => {});
      else v.pause();

      return () => {
        v.removeEventListener("timeupdate", onTime);
        v.removeEventListener("ended", onEnded);
        v.removeEventListener("loadedmetadata", onMeta);
      };
    } else {
      let elapsed = 0;
      const img = new Image();
      img.src = current.media.url;
      img.onload = () => {
        setIsWideMedia(img.naturalWidth / img.naturalHeight > 1.4);
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

  /** Keyboard events */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose]);

  const handleZoneClick = (zone: "prev" | "toggle" | "next") => {
    if (zone === "prev") goPrev();
    if (zone === "next") goNext();
    if (zone === "toggle") setIsPaused((p) => !p);
  };

  const toggleLike = (i: number) =>
    setLiked((prev) => ({ ...prev, [i]: !prev[i] }));

  const onMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu((p) => !p);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) setShowMenu(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenu]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={stop}>
        <header className={styles.header}>
          <div className={styles.leftHeader}>
            <img src={current.avatar} className={styles.avatar} draggable={false} />
            <div className={styles.meta}>
              <div className={styles.username}>{current.username}</div>
              <div className={styles.timeAgo}>{timeAgo(current.createdAt)}</div>
            </div>
          </div>

          <div className={styles.rightHeader}>
            <button className={styles.moreBtn} onClick={onMoreClick}>
              <MoreHorizontal size={20} />
            </button>

            <button className={styles.closeBtnTop} onClick={onClose}>
              <X size={20} />
            </button>

            {showMenu && (
              <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
                <button className={styles.menuItem}>
                  <Flag size={16} />
                  Пожаловаться
                </button>
                <button className={styles.menuItem}>
                  Скрыть истории пользователя
                </button>
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
                      ? "scaleX(1)"
                      : "scaleX(0)",
                }}
              />
            </div>
          ))}
        </div>

        <div className={`${styles.mediaArea} ${isWideMedia ? styles.wide : ""}`}>
          {current.media.type === "image" ? (
            <img
              src={current.media.url}
              className={styles.mediaImage}
              draggable={false}
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
            <button
              className={`${styles.zone} ${styles.left}`}
              onClick={() => handleZoneClick("prev")}
            />
            <button
              className={`${styles.zone} ${styles.center}`}
              onClick={() => handleZoneClick("toggle")}
            />
            <button
              className={`${styles.zone} ${styles.right}`}
              onClick={() => handleZoneClick("next")}
            />
          </div>

          {current.media.type === "video" && (
            <div className={styles.volumeControls}>
              <button
                className={styles.soundBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted((m) => !m);
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
              className={`${styles.actionBtn} ${
                liked[index] ? styles.liked : ""
              }`}
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
      </div>
    </div>
  );
};

export default Stories;
