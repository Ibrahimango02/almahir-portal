
export default function AvatarIcon({ url, size = 'medium' }: { url: string, size: 'small' | 'medium' | 'large' }) {
    const sizeClasses = {
        small: 'h-8 w-8',
        medium: 'h-10 w-10',
        large: 'h-24 w-24',
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200`}>
            {url ? (
                <img
                    src={url}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="h-full w-full flex items-center justify-center">
                    <svg className="h-1/2 w-1/2 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14.25c4.142 0 7.5 3.358 7.5 7.5H4.5c0-4.142 3.358-7.5 7.5-7.5zm0-1.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" />
                    </svg>
                </div>
            )}
        </div>
    );
}