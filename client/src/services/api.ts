import axios from 'axios';

// URL base de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Cliente axios con configuración predeterminada
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interfaz para representar un plato
export interface Dish {
  nombre: string;
  puntuacion: number;
}

// Interfaz para representar un restaurante o menú
export interface Restaurant {
  '@search.score'?: number;
  url?: string;
  metadata_storage_name?: string;
  metadata_author?: string | null;
  metadata_storage_size?: number;
  metadata_storage_last_modified?: string;
  language?: string;
  sentiment?: string;
  merged_content?: string;
  keyphrases?: string[];
  locations?: string[];
  imageTags?: string[];
  imageCaption?: string[];
  ubicacion?: string;
  tipologia?: 'Italiana' | 'Asiatica' | 'India' | 'Casera' | 'Tradicional';
  tipo_menu?: string;
  precio?: number;
  puntuacion?: number;
  platos?: Dish[];
}

// Interfaz para los parámetros de búsqueda
export interface SearchParams {
  search: string;
  tipologia?: string;
  puntuacion?: number;
  precio?: number;
  facet?: string;
  sort?: 'relevance' | 'file_name' | 'size' | 'date' | 'sentiment';
}

// Interfaz para la respuesta de búsqueda
export interface SearchResponse {
  count: number;
  results: Restaurant[];
  facets: Record<string, { value: string; count: number }[]>;
  search_terms: string;
}

// Buscar restaurantes o menús
export const searchRestaurants = async (params: SearchParams): Promise<SearchResponse> => {
  try {
    const response = await apiClient.get<SearchResponse>('/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error al buscar restaurantes:', error);
    throw error;
  }
};

// Subir un nuevo menú
export const uploadMenu = async (file: File): Promise<{ filename: string; url: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error al subir el menú:', error);
    throw error;
  }
};

export default {
  searchRestaurants,
  uploadMenu
}; 