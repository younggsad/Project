'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { storyData as initialStoryData, UserStories } from "@/data/stories";
import Stories, { StoryItem } from "@/components/Stories/Stories";
import styles from "./StoryBar.module.css";

const LS_KEY = "stories_state_v2";

export default function StoryBar() {
  const [stories, setStories] = useState<UserStories[]>(initialStoryData);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Загрузка из Local Storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<UserStories>[];
        const merged = initialStoryData.map(story => {
          const savedStory = saved.find(s => s.userId === story.userId);
          return savedStory ? { ...story, ...savedStory } : story;
        });
        setStories(merged);
      }
    } catch (err) {
      console.warn("Failed to load stories state:", err);
    }
  }, []);

  // Сохранение в Local Storage
  useEffect(() => {
    try {
      const toSave = stories.map(s => ({ 
        userId: s.userId, 
        viewedStories: s.viewedStories, 
        viewedAt: s.viewedAt 
      }));
      localStorage.setItem(LS_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.warn("Failed to save stories state:", err);
    }
  }, [stories]);

  // ПРАВИЛЬНЫЙ ПОРЯДОК: все истории всех пользователей, отсортированные по времени
  const flatStories: StoryItem[] = useMemo(() => {
    // Создаем массив всех отдельных историй
    const allStories: (StoryItem & { originalIndex: number })[] = [];
    
    stories.forEach((userStory, userIndex) => {
      userStory.media.forEach((mediaItem, mediaIndex) => {
        allStories.push({
          userId: userStory.userId,
          username: userStory.user.username,
          avatar: userStory.user.avatar,
          media: mediaItem,
          createdAt: userStory.createdAt,
          originalIndex: userIndex, // сохраняем оригинальный индекс для стабильности
          mediaIndex: mediaIndex,
          isViewed: userStory.viewedStories?.[mediaIndex] || false
        });
      });
    });

    // Сортируем ВСЕ истории по времени создания (новые сначала)
    const sorted = allStories.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    console.log('Все истории в порядке времени:',
      sorted.map((s, i) => ({
        index: i,
        user: s.username,
        time: s.createdAt ? new Date(s.createdAt).toLocaleTimeString() : 'no time',
        viewed: s.isViewed,
        mediaIndex: s.mediaIndex
      }))
    );

    return sorted;
  }, [stories]);

  // Сортируем пользователей для отображения в баре
  const sortedStories = useMemo(() => {
    const unviewed: UserStories[] = [];
    const viewed: UserStories[] = [];

    stories.forEach(story => {
      const hasUnviewed = story.viewedStories?.some(viewed => !viewed) ?? true;
      if (hasUnviewed) {
        unviewed.push(story);
      } else {
        viewed.push(story);
      }
    });

    // Сортируем по времени (новые сначала)
    unviewed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    viewed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return [...unviewed, ...viewed];
  }, [stories]);

  // Открыть истории пользователя - ПРОСТАЯ ЛОГИКА
  const handleOpenUser = useCallback((userId: number) => {
    // Находим САМУЮ ПЕРВУЮ непросмотренную историю этого пользователя в общем списке
    for (let i = 0; i < flatStories.length; i++) {
      const story = flatStories[i];
      if (story.userId === userId) {
        // Проверяем, просмотрена ли эта конкретная история
        const userStory = stories.find(s => s.userId === userId);
        const isViewed = userStory?.viewedStories?.[story.mediaIndex || 0] || false;
        
        if (!isViewed) {
          setOpenIndex(i);
          return;
        }
      }
    }

    // Если все истории пользователя просмотрены, открываем самую новую
    for (let i = 0; i < flatStories.length; i++) {
      const story = flatStories[i];
      if (story.userId === userId) {
        setOpenIndex(i);
        return;
      }
    }
  }, [flatStories, stories]);

  // Обработчик изменения текущей истории
  const handleUserChange = useCallback((userId: number, storyIdx: number) => {
    setStories(prev => prev.map(userStory => {
      if (userStory.userId !== userId) return userStory;
      
      const updatedViewedStories = [...(userStory.viewedStories || Array(userStory.media.length).fill(false))];
      if (storyIdx >= 0 && storyIdx < updatedViewedStories.length) {
        updatedViewedStories[storyIdx] = true;
      }
      
      return {
        ...userStory,
        viewedStories: updatedViewedStories,
      };
    }));
  }, []);

  return (
    <>
      <div className={styles.storyBar}>
        {sortedStories.map(userStory => {
          const hasUnviewed = userStory.viewedStories?.some(viewed => !viewed) ?? true;
          return (
            <div
              key={userStory.id}
              className={`${styles.story} ${hasUnviewed ? styles.unviewed : styles.viewed}`}
              onClick={() => handleOpenUser(userStory.userId)}
            >
              <div className={styles.avatarWrapper}>
                <img 
                  src={userStory.user.avatar} 
                  alt={userStory.user.username} 
                  className={styles.avatar} 
                />
              </div>
              <span className={styles.username}>{userStory.user.username}</span>
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
