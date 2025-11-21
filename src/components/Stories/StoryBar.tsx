'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { storyData as initialStoryData, UserStories } from "@/data/stories";
import { stories as rawStories } from "@/data/stories";
import Stories, { StoryItem } from "@/components/Stories/Stories";
import styles from "./StoryBar.module.css";

const LS_KEY = "stories_state_v2";
const ONE_DAY = 24 * 60 * 60 * 1000;

// refreshViewed: сбрасывает viewedStories, если прошло >24ч или если появилась новая история
const refreshViewed = (list: UserStories[]): UserStories[] => {
  const now = Date.now();
  return list.map(user => {
    if (!user.viewedAt) return user;

    const expired = now - user.viewedAt > ONE_DAY;
    if (expired) return { ...user, viewedStories: user.viewedStories?.map(() => false), viewedAt: null };

    const userRaw = rawStories.filter(r => r.userId === user.userId);
    if (!userRaw.length) return user;

    const newestCreatedAt = Math.max(...userRaw.map(x => x.createdAt));
    if (newestCreatedAt > (user.viewedAt ?? 0)) {
      return { ...user, viewedStories: user.viewedStories?.map(() => false) };
    }

    return user;
  });
};

// mergeSaved: объединяет LS с начальными данными
const mergeSaved = (initial: UserStories[], saved: Partial<UserStories>[]) => {
  const byUserId = new Map<number, Partial<UserStories>>();
  for (const s of saved) if (s.userId) byUserId.set(s.userId, s);

  return initial.map(it => {
    const savedFor = byUserId.get(it.userId);
    if (!savedFor) return it;
    return {
      ...it,
      viewedStories: savedFor.viewedStories ?? it.viewedStories,
      viewedAt: savedFor.viewedAt ?? it.viewedAt,
    };
  });
};

export default function StoryBar() {
  const [stories, setStories] = useState<UserStories[]>(initialStoryData);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // загрузка из LS
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserStories>[];
        const merged = mergeSaved(initialStoryData, parsed);
        setStories(refreshViewed(merged));
        return;
      }
    } catch (err) {
      console.warn("Failed to parse LS:", err);
    }
    setStories(refreshViewed(initialStoryData));
  }, []);

  // сохраняем LS
  useEffect(() => {
    try {
      const toSave = stories.map(s => ({ userId: s.userId, viewedStories: s.viewedStories, viewedAt: s.viewedAt }));
      localStorage.setItem(LS_KEY, JSON.stringify(toSave));
    } catch {}
  }, [stories]);

  const flatStories: StoryItem[] = useMemo(() =>
    stories.flatMap(s =>
      s.media.map((m, mediaIndex) => ({
        userId: s.userId,
        username: s.user.username,
        avatar: s.user.avatar,
        media: m,
        // Добавляем информацию о позиции в медиа пользователя
        mediaIndex,
        userStoriesCount: s.media.length
      }))
    ), [stories]
  );

  const sortedStories = useMemo(
    () => [...stories].sort((a, b) => {
      const aUnviewed = a.viewedStories?.some(v => !v) ? 0 : 1;
      const bUnviewed = b.viewedStories?.some(v => !v) ? 0 : 1;
      return aUnviewed - bUnviewed;
    }), [stories]
  );

  // открыть историю пользователя
  const handleOpenUser = useCallback((userId: number) => {
    // Находим индекс первого стори пользователя в flatStories
    const firstStoryIndex = flatStories.findIndex(story => story.userId === userId);
    
    if (firstStoryIndex !== -1) {
      setOpenIndex(firstStoryIndex);
    }
  }, [flatStories]);

  const handleUserChange = useCallback((userId: number, storyIdx: number) => {
    setStories(prev => prev.map(u => {
      if (u.userId !== userId) return u;
      const updatedViewed = [...(u.viewedStories ?? Array(u.media.length).fill(false))];
      if (storyIdx >= 0 && storyIdx < updatedViewed.length) {
        updatedViewed[storyIdx] = true;
      }
      return { ...u, viewedStories: updatedViewed, viewedAt: Date.now() };
    }));
  }, []);

  return (
    <>
      <div className={styles.storyBar}>
        {sortedStories.map(s => {
          const hasUnviewed = s.viewedStories?.some(v => !v);
          return (
            <div
              key={s.id}
              className={`${styles.story} ${hasUnviewed ? styles.unviewed : ""}`}
              onClick={() => handleOpenUser(s.userId)}
            >
              <div className={styles.avatarWrapper}>
                <img src={s.user.avatar} alt={s.user.username} className={styles.avatar} />
              </div>
              <span>{s.user.username}</span>
            </div>
          );
        })}
      </div>

      {openIndex !== null && (
        <Stories
          items={flatStories}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
          onUserChange={handleUserChange}
          loop={false}
        />
      )}
    </>
  );
}
