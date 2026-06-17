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
          <span key={s} className={s <= Math.round(rating) ? 'text-[#D4A04D]' : 'text-[#2A2A2D]'}>
            ★
          </span>
        ))}
      </div>
      {reviewCount !== undefined && (
        <span className="text-[#A7A7A7] text-xs">({reviewCount})</span>
      )}
    </div>
  );
}
