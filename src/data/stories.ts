import { users } from "@/data/user";

export interface Story {
  id: number;
  userId: number;
}

export const stories: Story[] = [
  { id: 1, userId: 1 },
  { id: 2, userId: 2 },
  { id: 3, userId: 3 },
  { id: 4, userId: 4 },
];

export const getStoryWithUser = (story: Story) => ({
  ...story,
  ...users.find((u) => u.id === story.userId),
});
