import { posts, getPostWithUser } from "@/data/posts";
import { Post as PostComponent } from "./Post";

const postData = posts.map(getPostWithUser);

export const PostList = () => (
    <>
    {postData.map((post) => (
        <PostComponent key={post.id} {...post} />
    ))}
    </>
);