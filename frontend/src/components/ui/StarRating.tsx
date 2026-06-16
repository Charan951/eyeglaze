interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
}

export default function StarRating({ rating, reviewCount, size = 'sm' }: StarRatingProps) {
  const starSize = size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <div className="flex items-center gap-1">
      <div className={`flex ${starSize}`}>
        {[1, 2, 3, 4, 5].map(s => (
          <span key={s} className={s <= Math.round(rating) ? 'text-[#C9A84C]' : 'text-[#2A2A2A]'}>
            ★
          </span>
        ))}
      </div>
      {reviewCount !== undefined && (
        <span className="text-[#888888] text-xs">({reviewCount})</span>
      )}
    </div>
  );
}
