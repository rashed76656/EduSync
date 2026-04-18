export const Logo = ({ className = 'w-8 h-8' }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20 0L37.3205 10V30L20 40L2.67949 30V10L20 0Z"
        fill="url(#paint0_linear)"
      />
      <path
        d="M20 5L33.8564 13V27L20 35L6.14359 27V13L20 5Z"
        fill="white"
        fillOpacity="0.2"
      />
      <path
        d="M20 10L28.6603 15V25L20 30L11.3397 25V15L20 10Z"
        fill="white"
      />
      <defs>
        <linearGradient
          id="paint0_linear"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
};
