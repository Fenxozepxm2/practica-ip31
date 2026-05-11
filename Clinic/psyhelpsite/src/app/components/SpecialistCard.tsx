// src/app/components/SpecialistCard.tsx
import { Link } from 'react-router';
import type { SpecialistCardProps } from '../../types';
export function SpecialistCard({ specialist }: SpecialistCardProps) {
  const getPhotoUrl = (photoUrl?: string, fullName?: string) => {
    if (!photoUrl) {
      const name = fullName ? encodeURIComponent(fullName) : 'П';
      return `https://ui-avatars.com/api/?name=${name}&background=f3f4f6&color=6b7280&size=400&font-size=0.33`;
    }
    if (photoUrl.startsWith('http')) return photoUrl;
    return `http://127.0.0.1:8000${photoUrl}`;
  };

  return (
    <Link
      to={`/specialist/${specialist.id}`}
      className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all group"
    >
      <div className="aspect-[3/4] bg-muted overflow-hidden relative">
        <img
          src={getPhotoUrl(specialist.photo, specialist.full_name)}
          alt={specialist.full_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-6">
        <h3 className="mb-2 font-semibold text-lg">{specialist.full_name}</h3>
        <p className="text-muted-foreground mb-3 text-sm">{specialist.experience}</p>
        <p className="text-primary text-sm font-medium">Подробнее →</p>
      </div>
    </Link>
  );
}