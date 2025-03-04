'use client';

import { useState } from 'react';
import SearchForm from '@/components/SearchForm';
import RestaurantCard from '@/components/RestaurantCard';
import { searchRestaurants, SearchParams, SearchResponse, Restaurant } from '@/services/api';

export default function Home() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (params: SearchParams) => {
    try {
      setIsSearching(true);
      setError(null);
      
      const results = await searchRestaurants(params);
      setSearchResults(results);
      
      if (results.count === 0) {
        setError('No se encontraron restaurantes con los criterios especificados. Intenta con otros filtros.');
      }
    } catch (err) {
      console.error('Error al buscar restaurantes:', err);
      setError('Ocurrió un error al buscar. Por favor, inténtalo de nuevo.');
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero section con buscador */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl mb-8">
            Encuentra los mejores restaurantes cerca de ti
          </h1>
          <p className="text-xl text-blue-100 mb-10">
            Busca por tipo de cocina, ubicación o platos favoritos
          </p>
          
          <div className="bg-white rounded-lg shadow-xl p-6">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </div>

      {/* Sección de resultados */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isSearching ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        ) : searchResults ? (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {searchResults.count} {searchResults.count === 1 ? 'resultado' : 'resultados'} encontrados
              </h2>
              
              {searchResults.search_terms && (
                <p className="text-gray-600">
                  Búsqueda: &quot;{searchResults.search_terms}&quot;
                </p>
              )}
            </div>
            
            {/* Filtros activos */}
            {searchResults.facets && Object.keys(searchResults.facets).length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {Object.entries(searchResults.facets).map(([facetKey, facetValues]) => (
                  facetValues.map(facet => (
                    <span key={`${facetKey}-${facet.value}`} 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {facetKey}: {facet.value} ({facet.count})
                    </span>
                  ))
                ))}
              </div>
            )}
            
            {/* Grid de restaurantes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.results.map((restaurant: Restaurant, index: number) => (
                <RestaurantCard key={`restaurant-${index}-${restaurant.metadata_storage_name}`} restaurant={restaurant} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-xl">Utiliza el buscador para encontrar restaurantes</p>
          </div>
        )}
      </div>
    </main>
  );
}
