'use client';

import React, { useCallback, useMemo, useState } from "react";
import { storyData as initialStoryData, UserStories } from "@/data/stories";
import Stories, { StoryItem } from "@/components/Stories/Stories";
import styles from "./StoryBar.module.css";

export default function StoryBar() {
  // локальный стейт копии storyData чтобы отмечать viewed
  const [stories, setStories] = useState<UserStories[]>(initialStoryData);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // flat array: каждый элемент — { userId, username, avatar, media }
  const flatStories: StoryItem[] = useMemo(
    () =>
      stories.flatMap((s, userIdx) =>
        s.media.map((m) => ({
          userId: userIdx, // индекс пользователя в массиве stories
          username: s.user.username,
          avatar: s.user.avatar,
          media: m,
        }))
      ),
    [stories]
  );

  // Открыть модалку на первой медиа выбранного пользователя
  const handleOpenUser = useCallback(
    (userIdx: number) => {
      const idx = flatStories.findIndex((it) => it.userId === userIdx);
      if (idx === -1) return;
      setOpenIndex(idx);

      // помечаем user как просмотренный
      setStories((prev) =>
        prev.map((s, i) => (i === userIdx ? { ...s, viewed: true } : s))
      );
    },
    [flatStories]
  );

  // Вызывается из Stories при переключении на медиа другого пользователя
  const handleUserChange = useCallback((userId: number) => {
    setStories((prev) =>
      prev.map((s, i) => (i === userId ? { ...s, viewed: true } : s))
    );
  }, []);

  return (
    <>
      <div className={styles.storyBar}>
        {stories.map((s, idx) => (
          <div key={idx} className={styles.story} onClick={() => handleOpenUser(idx)}>
            <div
              className={`${styles.avatarWrapper} ${!s.viewed ? styles.unviewed : ""}`}
            >
              <img src={s.user.avatar} alt={s.user.username} className={styles.avatar} />
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
