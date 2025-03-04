import { uploadMenu } from '@/services/api';
import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useState, FormEvent, useRef } from 'react';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setUploadSuccess(false);

    if (selectedFile) {
      // Mostrar vista previa solo para imágenes
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Por favor, selecciona un archivo para subir.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      const result = await uploadMenu(file);
      
      console.log('Archivo subido con éxito:', result);
      setUploadSuccess(true);
      
      // Reiniciar el formulario
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error al subir el archivo:', err);
      setError('Error al subir el archivo. Por favor, inténtalo de nuevo.');
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Subir nuevo menú</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Área de carga de archivos */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors duration-200"
             onClick={() => fileInputRef.current?.click()}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
          />
          
          {preview ? (
            <div className="mx-auto">
              <img src={preview} alt="Preview" className="h-48 mx-auto mb-4 object-contain" />
              <p className="text-sm text-gray-600 mt-2">{file?.name}</p>
            </div>
          ) : file ? (
            <div className="mx-auto">
              <DocumentTextIcon className="h-24 w-24 mx-auto text-gray-400" />
              <p className="text-sm text-gray-600 mt-2">{file.name}</p>
            </div>
          ) : (
            <div>
              <CloudArrowUpIcon className="h-24 w-24 mx-auto text-gray-400" />
              <p className="text-gray-600 mt-2">
                Haz clic para seleccionar o arrastra un archivo
              </p>
              <p className="text-sm text-gray-500 mt-1">
                PDF, JPG, PNG (máx. 10MB)
              </p>
            </div>
          )}
        </div>
        
        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        {/* Mensaje de éxito */}
        {uploadSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            El archivo se ha subido correctamente.
          </div>
        )}
        
        {/* Botón de envío */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!file || isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Subiendo...
              </>
            ) : 'Subir archivo'}
          </button>
        </div>
      </form>
    </div>
  );
} 