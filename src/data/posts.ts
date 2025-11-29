import { users } from "@/data/users";

export interface Post {
  id: number;
  userId: number;
  image: string;
  caption: string;
  createdAt: string;
}

export const posts: Post[] = [
  {
    id: 1,
    userId: 1,
    image: "/posts/post1.jpg",
    caption: "52",
    createdAt: "2025-11-13T12:30:00Z",
  },
  {
    id: 2,
    userId: 3,
    image: "/posts/post2.jpg",
    caption: "RR",
    createdAt: "2025-11-12T16:00:00Z",
  },
];

export const getPostWithUser = (post: Post) => ({
  ...post,
  ...users.find((u) => u.id === post.userId),
});
