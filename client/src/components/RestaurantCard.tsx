import { Restaurant } from '@/services/api';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import clsx from 'clsx';
import { useState } from 'react';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [showAllDishes, setShowAllDishes] = useState(false);
  
  // Calcular cuántas estrellas mostrar basado en la puntuación
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.round(rating);
    const emptyStars = 5 - fullStars;
    
    // Estrellas llenas
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarSolidIcon key={`full-${i}`} className="h-5 w-5 text-yellow-400" />
      );
    }
    
    // Estrellas vacías
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <StarOutlineIcon key={`empty-${i}`} className="h-5 w-5 text-yellow-400" />
      );
    }
    
    return <div className="flex">{stars}</div>;
  };

  // Determinar cuántos platos mostrar
  const displayedDishes = showAllDishes 
    ? restaurant.platos 
    : restaurant.platos?.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Imagen del restaurante */}
      {restaurant.url ? (
        <div className="relative h-48 w-full">
          <Image
            src={restaurant.url}
            alt={restaurant.tipologia || 'Restaurante'}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-restaurant.jpg';
            }}
          />
        </div>
      ) : (
        <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">Imagen no disponible</span>
        </div>
      )}
      
      {/* Contenido de la tarjeta */}
      <div className="p-5">
        {/* Categoría y precio */}
        <div className="flex justify-between items-center mb-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
            {restaurant.tipologia || 'Restaurante'}
          </span>
          
          <span className="text-gray-600 font-medium">
            {restaurant.precio ? `${restaurant.precio}€` : 'Precio no disponible'}
          </span>
        </div>
        
        {/* Nombre y ubicación */}
        <h3 className="text-xl font-bold text-gray-800 mb-1">
          {restaurant.metadata_storage_name?.split('.')[0] || 'Restaurante'}
        </h3>
        
        {restaurant.ubicacion && (
          <p className="text-sm text-gray-600 mb-3">
            {restaurant.ubicacion}
          </p>
        )}
        
        {/* Contenido */}
        {restaurant.merged_content && (
          <p className="text-gray-700 mb-4 line-clamp-3">
            {restaurant.merged_content}
          </p>
        )}
        
        {/* Calificación */}
        {restaurant.puntuacion && (
          <div className="flex items-center mb-4">
            {renderStars(restaurant.puntuacion)}
            <span className="ml-1 text-sm text-gray-600">
              ({restaurant.puntuacion}/5)
            </span>
          </div>
        )}
        
        {/* Platos destacados */}
        {restaurant.platos && restaurant.platos.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Platos destacados:</h4>
            <ul className="space-y-2">
              {displayedDishes?.map((dish, index) => (
                <li key={`${dish.nombre}-${index}`} className="flex justify-between items-center">
                  <span className="text-gray-700">{dish.nombre}</span>
                  <div className="flex items-center">
                    {renderStars(dish.puntuacion)}
                  </div>
                </li>
              ))}
            </ul>
            
            {/* Botón para mostrar más platos */}
            {restaurant.platos.length > 3 && (
              <button
                onClick={() => setShowAllDishes(!showAllDishes)}
                className="mt-3 flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
              >
                {showAllDishes ? (
                  <>
                    <span>Ver menos</span>
                    <ChevronUpIcon className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    <span>Ver {restaurant.platos.length - 3} platos más</span>
                    <ChevronDownIcon className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 