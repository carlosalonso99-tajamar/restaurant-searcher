import os
import logging
from flask import Flask, request, render_template, redirect, url_for
from dotenv import load_dotenv

# Importa las librerías de Azure Search
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient

# Configurar logging para debug
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

app = Flask(__name__)

# Cargar variables de entorno
load_dotenv()
search_endpoint = os.getenv('SEARCH_SERVICE_ENDPOINT')
search_key = os.getenv('SEARCH_SERVICE_QUERY_KEY')
search_index = os.getenv('SEARCH_INDEX_NAME')

if not search_endpoint or not search_key or not search_index:
    logging.error("Faltan variables de entorno: SEARCH_SERVICE_ENDPOINT, SEARCH_SERVICE_QUERY_KEY o SEARCH_INDEX_NAME")

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
            # Cambiado: pasar una cadena con los campos separados por comas
            highlight_fields="merged_content,imageCaption",
            select="url,metadata_storage_name,metadata_author,metadata_storage_size,metadata_storage_last_modified,language,sentiment,merged_content,keyphrases,locations,imageTags,imageCaption"
        )
        print(results)
        logging.debug("Consulta enviada, obteniendo resultados...")
        return results

    except Exception as ex:
        logging.exception("Error en la función search_query")
        raise ex

# Ruta de la página de inicio (formulario de búsqueda)
@app.route("/")
def home():
    logging.debug("Mostrando la página de inicio")
    return render_template("default.html")

# Ruta para mostrar los resultados de búsqueda
@app.route("/search", methods=['GET'])
def search():
    try:
        # Obtener los términos de búsqueda del formulario
        search_text = request.args.get("search", "").strip()
        if not search_text:
            return redirect(url_for("home"))
        logging.debug(f"Términos de búsqueda recibidos: '{search_text}'")

        # Si se seleccionó un facet, lo usamos en el filtro
        filter_expression = None
        facet = request.args.get("facet")
        if facet:
            filter_expression = f"metadata_author eq '{facet}'"
            logging.debug(f"Usando filtro de facet: {filter_expression}")

        # Configurar el orden de la consulta
        sort_expression = 'search.score()'
        sort_field = request.args.get("sort", "relevance")
        logging.debug(f"Campo de orden recibido: {sort_field}")
        if sort_field == 'file_name':
            sort_expression = 'metadata_storage_name asc'
        elif sort_field == 'size':
            sort_expression = 'metadata_storage_size desc'
        elif sort_field == 'date':
            sort_expression = 'metadata_storage_last_modified desc'
        elif sort_field == 'sentiment':
            sort_expression = 'sentiment desc'
        logging.debug(f"Orden de la consulta configurado: {sort_expression}")

        # Realiza la consulta y obtiene los resultados
        results = search_query(search_text, filter_expression, sort_expression)
        logging.info("Consulta realizada exitosamente. Renderizando resultados...")
        return render_template("search.html", search_results=results, search_terms=search_text)

    except Exception as error:
        logging.exception("Error durante el procesamiento de la búsqueda")
        return render_template("error.html", error_message=error)

if __name__ == "__main__":
    app.run(debug=True)
