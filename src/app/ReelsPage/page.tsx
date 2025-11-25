"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./Reels.module.css";
import { reels } from "@/data/reels";
import {
  PauseCircle,
  PlayCircle,
  Heart,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
  Music2,
} from "lucide-react";

export default function ReelsPage() {
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showIndicator, setShowIndicator] = useState<"play" | "pause" | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [likedStates, setLikedStates] = useState<{[key: number]: boolean}>({});
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Разрешаем прокрутку только внутри контейнера рилсов
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const isInReels = containerRef.current?.contains(target);
      
      if (!isInReels) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const isInReels = containerRef.current?.contains(target);
      
      if (!isInReels) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Обновление времени видео
  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (!currentVideo) return;

    const updateTime = () => {
      if (!isSeeking) {
        setCurrentTime(currentVideo.currentTime);
      }
    };

    const updateDuration = () => {
      setDuration(currentVideo.duration || 0);
    };

    currentVideo.addEventListener('timeupdate', updateTime);
    currentVideo.addEventListener('loadedmetadata', updateDuration);
    currentVideo.addEventListener('durationchange', updateDuration);

    updateDuration();

    return () => {
      currentVideo.removeEventListener('timeupdate', updateTime);
      currentVideo.removeEventListener('loadedmetadata', updateDuration);
      currentVideo.removeEventListener('durationchange', updateDuration);
    };
  }, [currentIndex, isSeeking]);

  // Автовоспроизведение текущего видео
  useEffect(() => {
    const playCurrentVideo = async () => {
      videoRefs.current.forEach((video, index) => {
        if (!video) return;
        if (index === currentIndex && isPlaying) {
          video.play().catch(() => {});
          video.volume = volume;
        } else {
          video.pause();
        }
      });
    };

    playCurrentVideo();
  }, [currentIndex, volume, isPlaying]);

  const togglePlay = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      showTempIndicator("play");
    } else {
      video.pause();
      setIsPlaying(false);
      showTempIndicator("pause");
    }
  }, []);

  const showTempIndicator = (type: "play" | "pause") => {
    setShowIndicator(type);
    setTimeout(() => setShowIndicator(null), 600);
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / containerHeight);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  }, [currentIndex]);

  // Добавляем обработчик колесика мыши для проматывания
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const delta = e.deltaY;
    
    if (Math.abs(delta) > 50) {
      const direction = delta > 0 ? 1 : -1;
      const newIndex = Math.max(0, Math.min(reels.length - 1, currentIndex + direction));
      
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        setIsPlaying(true);
        setCurrentTime(0);
        
        const targetScroll = newIndex * container.clientHeight;
        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex, reels.length]);

  const toggleMute = () => {
    setMuted((prev) => {
      const newMuted = !prev;
      setVolume(newMuted ? 0 : 0.5);
      return newMuted;
    });
  };

  const handleLike = (reelId: number) => {
    setLikedStates(prev => ({
      ...prev,
      [reelId]: !prev[reelId]
    }));
  };

  const handleShare = async (reel: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reel by ${reel.user.username}`,
          text: reel.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Обработчики для прогресс-бара
  const handleSeek = useCallback((clientX: number) => {
    if (!progressBarRef.current) return;
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [currentIndex, duration]);

  const handleSeekStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsSeeking(true);
    if ('touches' in e) {
      handleSeek(e.touches[0].clientX);
    } else {
      handleSeek(e.clientX);
    }
  }, [handleSeek]);

  const handleSeekMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isSeeking) return;
    
    if ('touches' in e) {
      handleSeek(e.touches[0].clientX);
    } else {
      handleSeek(e.clientX);
    }
  }, [isSeeking, handleSeek]);

  const handleSeekEnd = useCallback(() => {
    setIsSeeking(false);
  }, []);

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    handleSeek(e.clientX);
  }, [handleSeek]);

  // Добавляем глобальные обработчики для перетаскивания
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isSeeking) {
        handleSeek(e.clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isSeeking) {
        setIsSeeking(false);
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isSeeking) {
        handleSeek(e.touches[0].clientX);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isSeeking) {
        setIsSeeking(false);
      }
    };

    if (isSeeking) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isSeeking, handleSeek]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const isDesktop = typeof window !== "undefined" && window.innerWidth > 1024;

  if (!reels || reels.length === 0) {
    return <div className={styles.empty}>Нет рилсов</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div 
        ref={containerRef}
        className={styles.reelsContainer} 
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        {reels.map((reel, index) => (
          <div className={styles.reelWrapper} key={reel.id}>
            <video
              ref={(el) => { if (el) videoRefs.current[index] = el; }}
              src={reel.videoUrl}
              className={styles.video}
              muted={muted}
              loop
              playsInline
              onClick={() => togglePlay(index)}
            />

            {currentIndex === index && showIndicator && (
              <div className={styles.centerIndicator}>
                {showIndicator === "play" ? 
                  <PlayCircle size={90} /> : <PauseCircle size={90} />}
              </div>
            )}

            <div className={styles.overlay}>
              {/* Правая панель действий */}
              <div className={styles.actions}>
                <div className={styles.actionItem}>
                  <button 
                    className={`${styles.actionBtn} ${likedStates[reel.id] ? styles.liked : ''}`}
                    onClick={() => handleLike(reel.id)}
                  >
                    <Heart 
                      size={28} 
                      fill={likedStates[reel.id] ? "currentColor" : "none"}
                    />
                  </button>
                  <span className={styles.actionCount}>
                    {formatCount(reel.likes)}
                  </span>
                </div>

                <div className={styles.actionItem}>
                  <button className={styles.actionBtn}>
                    <MessageSquare size={26} />
                  </button>
                  <span className={styles.actionCount}>
                    {formatCount(reel.comments)}
                  </span>
                </div>

                <div className={styles.actionItem}>
                  <button 
                    className={styles.actionBtn}
                    onClick={() => handleShare(reel)}
                  >
                    <Share2 size={26} />
                  </button>
                  <span className={styles.actionCount}>Share</span>
                </div>

                <div 
                  className={styles.volumeControl}
                  onMouseEnter={() => setIsHoveringVolume(true)}
                  onMouseLeave={() => setIsHoveringVolume(false)}
                >
                  <button className={styles.actionBtn} onClick={toggleMute}>
                    {muted ? <VolumeX size={26} /> : <Volume2 size={26} />}
                  </button>
                  <span className={styles.actionCount}>Sound</span>
                </div>
              </div>

              {/* Нижняя панель с информацией */}
              <div className={styles.bottomPanel}>
                <div className={styles.userInfo}>
                  <img src={reel.user.avatar} alt={reel.user.username} />
                  <div className={styles.userInfoContent}>
                    <span className={styles.username}>@{reel.user.username}</span>
                  </div>
                </div>

                {reel.description && (
                  <div className={styles.description}>
                    {reel.description}
                  </div>
                )}

                <div className={styles.musicBox}>
                  <Music2 size={16} />
                  <span className={styles.musicText}>{reel.music}</span>
                </div>
              </div>

              {/* Прогресс-бар видео - отдельно снизу */}
              {currentIndex === index && duration > 0 && (
                <div className={styles.videoProgress}>
                  <div 
                    ref={progressBarRef}
                    className={styles.progressBar}
                    onClick={handleProgressBarClick}
                    onMouseDown={handleSeekStart}
                    onTouchStart={handleSeekStart}
                  >
                    <div className={styles.progressBackground} />
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                    <div 
                      className={styles.progressThumb}
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <div className={styles.timeDisplay}>
                    <span className={styles.currentTime}>{formatTime(currentTime)}</span>
                    <span className={styles.duration}>{formatTime(duration)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
