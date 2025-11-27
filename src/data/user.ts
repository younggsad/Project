export interface User {
  id: number;
  username: string;
  avatar: string;
  bio: string;
  link: string;
  postsCount: number;
  followers: number;
  following: number;
  highlights: []
}

export const users: User[] = [
  { 
    id: 1, 
    username: "friendlythug52ngg", 
    avatar: "/avatars/friendly-thug-52-ngg.png", 
    bio: "Music",
    link: "https://VL//friendlythug52ngg.com",
    postsCount: 1,
    followers: 500000,
    following: 100,
    highlights: []
  },
  { 
    id: 2, 
    username: "babymelo", 
    avatar: "/avatars/baby-melo.jpg",
        bio: "Music",
    link: "https://VL//babymelo.com",
    postsCount: 1,
    followers: 500000,
    following: 100,
    highlights: []
  },
  { id: 3, 
    username: "kai4ngel", 
    avatar: "/avatars/kai-angel.png",
        bio: "Music",
    link: "https://VL//kai4angel.com",
    postsCount: 1,
    followers: 500000,
    following: 100,
    highlights: []
  },
  { id: 4, 
    username: "pepelnahudi", 
    avatar: "/avatars/pepel-nahudi.png",
        bio: "Music",
    link: "https://VL//pepelnahudi.com",
    postsCount: 1,
    followers: 500000,
    following: 100,
    highlights: []
  },
];
