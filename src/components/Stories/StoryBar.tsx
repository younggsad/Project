'use client';

import React, { useCallback, useMemo, useState } from "react";
import { storyData as initialStoryData, UserStories } from "@/data/stories";
import Stories, { StoryItem } from "@/components/Stories/Stories";
import styles from "./StoryBar.module.css";

export default function StoryBar() {
  const [stories, setStories] = useState<UserStories[]>(initialStoryData);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // плоский массив для Stories
  const flatStories: StoryItem[] = useMemo(
    () =>
      stories.flatMap((s) =>
        s.media.map((m) => ({
          userId: s.userId,
          username: s.user.username,
          avatar: s.user.avatar,
          media: m,
        }))
      ),
    [stories]
  );

  // 🔥 СОРТИРОВКА: непросмотренные → просмотренные
  const sortedStories = useMemo(
    () => [
      ...stories.filter((s) => !s.viewed),
      ...stories.filter((s) => s.viewed),
    ],
    [stories]
  );

  // открыть истории выбранного пользователя
  const handleOpenUser = useCallback(
    (userId: number) => {
      const idx = flatStories.findIndex((it) => it.userId === userId);
      if (idx === -1) return;
      setOpenIndex(idx);

      // помечаем как просмотренные
      setStories((prev) =>
        prev.map((s) => (s.userId === userId ? { ...s, viewed: true } : s))
      );
    },
    [flatStories]
  );

  // вызывается при смене пользователя в Stories
  const handleUserChange = useCallback((userId: number) => {
    setStories((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, viewed: true } : s))
    );
  }, []);

  return (
    <>
      <div className={styles.storyBar}>
        {sortedStories.map((s) => (
          <div
            key={s.id}
            className={`${styles.story} ${!s.viewed ? styles.unviewed : ""}`}
            onClick={() => handleOpenUser(s.userId)}
          >
            <div className={styles.avatarWrapper}>
              <img
                src={s.user.avatar}
                alt={s.user.username}
                className={styles.avatar}
              />
            </div>
            <span>{s.user.username}</span>
          </div>
        ))}
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
