import { users } from "./user";
import type { User } from "./user";

export interface ReelItemRaw {
  id: number;
  videoUrl: string;
  music: string;
  userId: number;
  likes: number;
  comments: number;
  shares?: number;
  description?: string;
  createdAt?: string;
}

export interface ReelItem extends Omit<ReelItemRaw, "userId"> {
  user: User;
}

const rawReels: ReelItemRaw[] = [
  {
    id: 1,
    userId: 1,
    videoUrl: "/stories/video2.mp4",
    music: "friendly thug 52 ngg - 2 Goyard",
    likes: 20000,
    comments: 1500,
    shares: 300,
    description: "52",
    createdAt: "2024-01-15"
  },
  {
    id: 2,
    userId: 3,
    videoUrl: "/stories/video1.mp4",
    music: "kai angel - are u happy",
    likes: 15000,
    comments: 1200,
    shares: 450,
    description: "VIPERR",
    createdAt: "2024-01-14"
  }
];

export const reels: ReelItem[] = rawReels.map((reel) => ({
  ...reel,
  user: users.find((u: { id: number; }) => u.id === reel.userId)!,
}));