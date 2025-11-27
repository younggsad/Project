interface Props {
  user: any;
}

export default function ProfileBio({ user }: Props) {
  return (
    <div className="px-4 py-2">
      <p className="text-sm">{user.bio}</p>

      {user.link && (
        <a
          href={user.link}
          target="_blank"
          className="text-blue-500 text-sm"
        >
          {user.link}
        </a>
      )}
    </div>
  );
}
