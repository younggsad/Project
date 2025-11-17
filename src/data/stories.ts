import { users } from "@/data/user";

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
  viewed?: boolean;
}

export const stories: Story[] = [
  { id: 1, userId: 1, createdAt: Date.now(), media: [{ type: "image", url: "/stories/story1.jpg", duration: 5000 }] },
  { id: 2, userId: 2, createdAt: Date.now(), media: [{ type: "image", url: "/stories/story2.jpg", duration: 5000 }, { type: "image", url: "/stories/story2.jpg", duration: 5000 }] },
  { id: 3, userId: 3, createdAt: Date.now(), media: [{ type: "image", url: "/stories/story3.jpg", duration: 5000 }, { type: "video", url: "/stories/video1.mp4" }] },
  { id: 4, userId: 4, createdAt: Date.now(), media: [{ type: "image", url: "/stories/story4.jpg", duration: 5000 }] },
];

export const storyData: UserStories[] = stories.map(story => {
  const user = users.find(u => u.id === story.userId);
  return {
    id: story.id,
    userId: story.userId,
    user: {
      username: user?.username || "Unknown",
      avatar: user?.avatar || "/default-avatar.png",
    },
    media: story.media,
    viewed: false,
  };
});
