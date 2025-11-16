'use client';

import { useState } from "react";
import { storyData as initialStories, UserStories } from "@/data/stories";
import Stories from "@/components/Stories/Stories";
import styles from "./StoryBar.module.css";

export const StoryBar = () => {
  const [stories, setStories] = useState<UserStories[]>(initialStories);
  const [openUserIndex, setOpenUserIndex] = useState<number | null>(null);

  const handleOpenStory = (idx: number) => {
    setOpenUserIndex(idx);

    setStories((prev) =>
      prev.map((s, i) =>
        i === idx
          ? { ...s, viewed: true }
          : s
      )
    );
  };

  return (
    <>
      <div className={styles.storyBar}>
        {stories.map((story, idx) => (
          <div
            key={idx}
            className={styles.story}
            onClick={() => handleOpenStory(idx)}
          >
            <div className={`${styles.avatarWrapper} ${story.viewed ? "" : styles.unviewed}`}>
              <img src={story.user.avatar} alt={story.user.username} className={styles.avatar} />
            </div>
            <span>{story.user.username}</span>
          </div>
        ))}
      </div>

      {openUserIndex !== null && (
        <Stories
          stories={stories}
          startUserIndex={openUserIndex}
          onClose={() => setOpenUserIndex(null)}
          loop={false}
        />
      )}
    </>
  );
};
