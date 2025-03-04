'use client';

import UploadForm from '@/components/UploadForm';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href="/"
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mr-4"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                <span>Volver</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pestañas */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subir Menús
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gestionar Menús
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'upload' ? (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Sube nuevos menús de restaurantes</h2>
              <p className="text-gray-600 mb-8">
                Selecciona un archivo de menú para subir. Formatos admitidos: PDF, JPG, PNG y WEBP.
                Los menús se procesarán automáticamente para extraer la información relevante.
              </p>
              <UploadForm />
            </div>
          ) : (
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Gestión de menús</h2>
              <p className="text-gray-500 mb-4">
                Esta funcionalidad estará disponible próximamente.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
                En desarrollo: Próximamente podrás ver, editar y eliminar los menús cargados.
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 