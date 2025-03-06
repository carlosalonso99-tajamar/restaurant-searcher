import os
import logging
import uuid
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from flask_cors import CORS

# Importa las librerías de Azure Search
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient

# Importa las librerías de Azure Storage
from azure.storage.blob import BlobServiceClient, ContentSettings

# Configurar logging para debug
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Cargar variables de entorno
load_dotenv()
search_endpoint = os.getenv('SEARCH_SERVICE_ENDPOINT')
search_key = os.getenv('SEARCH_SERVICE_QUERY_KEY')
search_index = os.getenv('SEARCH_INDEX_NAME')
storage_connection_string = os.getenv('STORAGE_CONNECTION_STRING')
storage_container_name = os.getenv('STORAGE_CONTAINER_NAME', 'meals')
storage_prefix = os.getenv('STORAGE_PREFIX', '')  # Prefijo opcional para organizar archivos

if not search_endpoint or not search_key or not search_index:
    logging.error("Faltan variables de entorno: SEARCH_SERVICE_ENDPOINT, SEARCH_SERVICE_QUERY_KEY o SEARCH_INDEX_NAME")

if not storage_connection_string:
    logging.error("Falta variable de entorno: STORAGE_CONNECTION_STRING")

# Configuración para la carga de archivos
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Función wrapper para hacer la consulta al índice de Azure Search
def search_query(search_text, filter_by=None, sort_order=None):
    try:
        logging.debug("Creando el cliente de búsqueda...")
        credential = AzureKeyCredential(search_key)
        search_client = SearchClient(
            endpoint=search_endpoint,
            index_name=search_index,
            credential=credential
        )
        
        logging.info(f"Enviando consulta: '{search_text}' con filtro: '{filter_by}' y orden: '{sort_order}'")
        results = search_client.search(
            search_text,
            search_mode="all",
            include_total_count=True,
            filter=filter_by,
            order_by=sort_order,
            facets=['metadata_author'],
            highlight_fields="merged_content,imageCaption",
            select="url,metadata_storage_name,metadata_author,metadata_storage_size,metadata_storage_last_modified,language,sentiment,merged_content,keyphrases,locations,imageTags,imageCaption,platos,ubicacion,tipologia,tipo_menu,precio,puntuacion"
        )

        logging.debug("Consulta enviada, obteniendo resultados...")
        return results

    except Exception as ex:
        logging.exception("Error en la función search_query")
        raise ex

# Ruta de la página de inicio (ahora devuelve JSON)
@app.route("/")
def home():
    logging.debug("Acceso a la API principal")
    return jsonify({
        "status": "ok",
        "message": "API de búsqueda de restaurantes activa",
        "endpoints": {
            "search": "/search?search=<términos>",
            "upload": "/upload"
        }
    })

# Ruta para búsqueda (ahora retorna JSON)
@app.route("/search", methods=['GET'])
def search():
    try:
        search_text = request.args.get("search", "").strip()
        if not search_text:
            return jsonify({"error": "Se requiere un término de búsqueda"}), 400
            
        logging.debug(f"Términos de búsqueda recibidos: '{search_text}'")

        # Construir filtros basados en controles adicionales
        filters = []
        
        # Facet de autor
        facet = request.args.get("facet")
        if facet:
            filters.append(f"metadata_author eq '{facet}'")
        
        # Filtro de puntuación mínima (puntuacion es numérico)
        puntuacion_min = request.args.get("puntuacion")
        if puntuacion_min:
            filters.append(f"puntuacion ge {puntuacion_min}")

        # Filtro de precio máximo (asumiendo que precio es numérico o se ha normalizado)
        precio_max = request.args.get("precio")
        if precio_max:
            filters.append(f"precio le {precio_max}")

        # Filtro de tipología
        tipologia = request.args.get("tipologia")
        if tipologia:
            filters.append(f"tipologia eq '{tipologia}'")
        
        # Combinar filtros con 'and'
        filter_expression = " and ".join(filters) if filters else None
        logging.debug(f"Filtro aplicado: {filter_expression}")

        # Orden
        sort_field = request.args.get("sort", "relevance")
        sort_expression = 'search.score()'
        if sort_field == 'file_name':
            sort_expression = 'metadata_storage_name asc'
        elif sort_field == 'size':
            sort_expression = 'metadata_storage_size desc'
        elif sort_field == 'date':
            sort_expression = 'metadata_storage_last_modified desc'
        elif sort_field == 'sentiment':
            sort_expression = 'sentiment desc'
        logging.debug(f"Orden configurado: {sort_expression}")

        results = search_query(search_text, filter_expression, sort_expression)
        
        # Convertir los resultados a un formato JSON adecuado
        json_results = []
        facets = {}
        
        # Procesar facets si existen
        try:
            if hasattr(results, 'get_facets'):
                facet_results = results.get_facets()
                if facet_results:
                    for facet_name, facet_values in facet_results.items():
                        facets[facet_name] = [
                            {"value": fv.value, "count": fv.count} 
                            for fv in facet_values
                        ]
        except Exception as e:
            logging.warning(f"Error procesando facets: {str(e)}")
        
        # Procesar resultados de búsqueda
        try:
            for result in results:
                item = {}
                for key, value in result.items():
                    # Intentar convertir a JSON cualquier valor que no sea nativo
                    if hasattr(value, '__dict__'):
                        try:
                            item[key] = value.__dict__
                        except:
                            item[key] = str(value)
                    else:
                        item[key] = value
                json_results.append(item)
        except Exception as e:
            logging.exception(f"Error procesando resultados: {str(e)}")
            return jsonify({"error": "Error procesando resultados", "details": str(e)}), 500
        
        logging.info("Consulta realizada exitosamente. Enviando resultados JSON.")
        return jsonify({
            "count": results.get_count() if hasattr(results, 'get_count') else len(json_results),
            "results": json_results,
            "facets": facets,
            "search_terms": search_text
        })
    
    except Exception as error:
        logging.exception("Error durante el procesamiento de la búsqueda")
        return jsonify({"error": str(error)}), 500

# Ruta para subir archivos
@app.route('/upload', methods=['POST'])
def upload_file():
    # Verificar que se haya enviado un archivo
    if 'file' not in request.files:
        return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
    
    file = request.files['file']
    
    # Si el usuario no selecciona un archivo, el navegador envía un archivo vacío
    if file.filename == '':
        return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
    
    if file and allowed_file(file.filename):
        try:
            # Generar un nombre seguro para el archivo y añadir un UUID para evitar colisiones
            original_filename = secure_filename(file.filename)
            
            # Añadir el prefijo si está configurado
            if storage_prefix:
                blob_path = f"{storage_prefix}/{uuid.uuid4()}_{original_filename}"
            else:
                blob_path = f"{uuid.uuid4()}_{original_filename}"
            
            # Conectar con Azure Blob Storage
            blob_service_client = BlobServiceClient.from_connection_string(storage_connection_string)
            container_client = blob_service_client.get_container_client(storage_container_name)
            
            # Crear el contenedor si no existe (opcional)
            try:
                container_client.get_container_properties()
            except Exception:
                container_client.create_container()
            
            # Determinar el tipo de contenido basado en la extensión
            content_type = None
            if blob_path.lower().endswith('.pdf'):
                content_type = 'application/pdf'
            elif blob_path.lower().endswith(('.jpg', '.jpeg')):
                content_type = 'image/jpeg'
            elif blob_path.lower().endswith('.png'):
                content_type = 'image/png'
            elif blob_path.lower().endswith('.webp'):
                content_type = 'image/webp'
            
            # Subir el archivo a Azure Blob Storage
            blob_client = container_client.get_blob_client(blob_path)
            
            # Configurar el tipo de contenido
            content_settings = None
            if content_type:
                content_settings = ContentSettings(content_type=content_type)
            
            # Subir el archivo al blob
            with file.stream as data:
                blob_client.upload_blob(data, content_settings=content_settings, overwrite=True)
            
            # Obtener la URL del blob
            blob_url = blob_client.url
            
            logging.info(f"Archivo {blob_path} subido correctamente a {blob_url}")
            
            return jsonify({
                'message': 'Archivo subido correctamente',
                'filename': blob_path,
                'url': blob_url
            }), 200
            
        except Exception as e:
            logging.exception("Error al subir el archivo")
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Tipo de archivo no permitido'}), 400

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
