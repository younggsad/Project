import { users } from "@/data/users";

export interface StoryMedia {
  type: "image" | "video";
  url: string;
  duration?: number;
}

export interface Story {
  id: number;
  userId: number;
  media: StoryMedia[];
  createdAt: number;
}

export interface UserStories {
  id: number;
  userId: number;
  user: {
    username: string;
    avatar: string;
  };
  media: StoryMedia[];
  createdAt: number;
  viewed?: boolean;
  viewedAt?: number | null;
  viewedStories?: boolean[];
}

// Реалистичные временные метки (последние 24 часа)
const now = Date.now();
const oneHour = 60 * 60 * 1000;
const oneMinute = 60 * 1000;

export const stories: Story[] = [
  { 
    id: 1, 
    userId: 1, 
    createdAt: now - 25 * oneMinute, // 25 минут назад
    media: [{ type: "image", url: "/stories/story1.jpg", duration: 5000 }] 
  },
  { 
    id: 2, 
    userId: 2, 
    createdAt: now - 3 * oneHour, // 3 часа назад
    media: [
      { type: "image", url: "/stories/story2.jpg", duration: 5000 }, 
      { type: "image", url: "/stories/story2.jpg", duration: 5000 }
    ] 
  },
  { 
    id: 3, 
    userId: 3, 
    createdAt: now - 45 * oneMinute, // 45 минут назад
    media: [
      { type: "image", url: "/stories/story3.jpg", duration: 5000 }, 
      { type: "video", url: "/stories/video1.mp4", duration: 10000 }
    ] 
  },
  { 
    id: 4, 
    userId: 4, 
    createdAt: now - 12 * oneHour, // 12 часов назад
    media: [{ type: "image", url: "/stories/story4.jpg", duration: 5000 }] 
  },
  { 
    id: 5, 
    userId: 5, 
    createdAt: now - 5 * oneMinute, // 5 минут назад - самая новая
    media: [{ type: "image", url: "/stories/story5.jpg", duration: 5000 }] 
  },
];

// Сортируем истории по времени создания (сначала новые)
const sortedStories = [...stories].sort((a, b) => b.createdAt - a.createdAt);

export const storyData: UserStories[] = sortedStories.map(story => {
  const user = users.find(u => u.id === story.userId);
  return {
    id: story.id,
    userId: story.userId,
    user: {
      username: user?.username || "Unknown",
      avatar: user?.avatar || "/avatars/unknown.jpg",
    },
    media: story.media,
    createdAt: story.createdAt,
    viewedStories: story.media.map(() => false),
    viewedAt: null,
  };
});