export function TopRightPattern() {
    return (
        <svg
            className="absolute top-0 right-0 h-[400px] w-[400px] -z-10 opacity-50 overflow-visible text-gray-200 dark:text-gray-800"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                opacity="0.5"
                d="M200 0C200 110.457 289.543 200 400 200V0H200Z"
                fill="currentColor"
            />
            <path
                d="M400 0H0L400 400V0Z"
                fill="url(#paint0_linear_top_right)"
                fillOpacity="0.05"
            />
            <path
                d="M185.5 0C185.5 118.465 281.535 214.5 400 214.5V0H185.5Z"
                stroke="currentColor"
            />
            <path
                d="M136 0C136 145.805 254.195 264 400 264V0H136Z"
                stroke="currentColor"
            />
            <path
                d="M87 0C87 172.864 227.136 313 400 313V0H87Z"
                stroke="currentColor"
            />
            <path
                d="M38 0C38 199.923 200.077 362 400 362V0H38Z"
                stroke="currentColor"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_top_right"
                    x1="300"
                    y1="100"
                    x2="100"
                    y2="300"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="currentColor" />
                    <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function BottomLeftPattern() {
    return (
        <svg
            className="absolute bottom-0 left-0 h-[400px] w-[400px] -z-10 opacity-50 overflow-visible text-gray-200 dark:text-gray-800"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M214.5 400C214.5 281.535 118.465 185.5 0 185.5V400H214.5Z"
                stroke="currentColor"
            />
            <path
                d="M264 400C264 254.195 145.805 136 0 136V400H264Z"
                stroke="currentColor"
            />
            <path
                d="M313 400C313 227.136 172.864 87 0 87V400H313Z"
                stroke="currentColor"
            />
            <path
                d="M362 400C362 199.923 199.923 38 0 38V400H362Z"
                stroke="currentColor"
            />
            <path
                d="M400 400C400 179.086 220.914 0 0 0V400H400Z"
                stroke="currentColor"
            />
        </svg>
    );
}
