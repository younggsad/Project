import { Post } from "@/data/posts";

interface Props {
  posts: Post[];
}

export default function ProfilePostsGrid({ posts }: Props) {
  return (
    <div className="grid grid-cols-3 gap-px">
      {posts.map((post) => (
        <img
          key={post.id}
          src={post.image}
          className="w-full aspect-square object-cover"
        />
      ))}
    </div>
  );
}
