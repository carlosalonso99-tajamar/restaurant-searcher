import { SearchParams } from '@/services/api';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState, FormEvent } from 'react';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  initialParams?: Partial<SearchParams>;
}

export default function SearchForm({ onSearch, initialParams = {} }: SearchFormProps) {
  const [searchTerm, setSearchTerm] = useState(initialParams.search || '');
  const [tipologia, setTipologia] = useState(initialParams.tipologia || '');
  const [puntuacion, setPuntuacion] = useState(initialParams.puntuacion || 0);
  const [precio, setPrecio] = useState(initialParams.precio || 35);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    const params: SearchParams = {
      search: searchTerm.trim()
    };
    
    if (tipologia) params.tipologia = tipologia;
    if (puntuacion > 0) params.puntuacion = puntuacion;
    if (precio < 35) params.precio = precio;
    
    onSearch(params);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-4">
          {/* Búsqueda principal */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar menús, platos, restaurantes..."
              className="w-full border border-gray-300 rounded-lg py-3 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por tipología */}
            <div>
              <label htmlFor="tipologia" className="block text-sm font-medium text-gray-700 mb-1">
                Tipología
              </label>
              <select
                id="tipologia"
                value={tipologia}
                onChange={(e) => setTipologia(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                <option value="Italiana">Italiana</option>
                <option value="Asiatica">Asiática</option>
                <option value="India">India</option>
                <option value="Casera">Casera</option>
                <option value="Tradicional">Tradicional</option>
              </select>
            </div>
            
            {/* Filtro por puntuación mínima */}
            <div>
              <label htmlFor="puntuacion" className="block text-sm font-medium text-gray-700 mb-1">
                Puntuación mínima: {puntuacion}
              </label>
              <input
                type="range"
                id="puntuacion"
                min="0"
                max="5"
                step="0.1"
                value={puntuacion}
                onChange={(e) => setPuntuacion(parseFloat(e.target.value))}
                className="block w-full"
              />
            </div>
            
            {/* Filtro por precio máximo */}
            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">
                Precio máximo: {precio}€
              </label>
              <input
                type="range"
                id="precio"
                min="0"
                max="35"
                step="1"
                value={precio}
                onChange={(e) => setPrecio(parseInt(e.target.value))}
                className="block w-full"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>
    </form>
  );
} 