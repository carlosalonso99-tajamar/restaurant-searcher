import os
import json
import logging
import azure.functions as func
from pydantic import BaseModel
from typing import List
from enum import Enum
from openai import OpenAI

app = func.FunctionApp(http_auth_level=func.AuthLevel.FUNCTION)

# Configuración del cliente OpenAI usando la nueva interfaz
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Enum para la tipología
class TipologiaEnum(str, Enum):
    Italiana = "Italiana"
    Asiatica = "Asiatica"
    India = "India"
    Casera = "Casera"
    Tradicional = "Tradicional"

# Modelo para cada plato, con nombre y puntuación
class Dish(BaseModel):
    nombre: str
    puntuacion: float

# Modelo de datos para parsear la respuesta de OpenAI,
# con tipologia como enum y precio como float (double)
class MenuEntities(BaseModel):
    restaurante: str
    platos: List[Dish]
    ubicacion: str
    tipologia: TipologiaEnum
    tipo_menu: str
    precio: float
    puntuacion: float  # Puntuación general del restaurante

MODEL = "gpt-4o-mini"  # Ajusta el modelo según tus necesidades

@app.route(route="extractMenuEntities")
def http_trigger(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("HTTP trigger: Extracción de entidades para menús de restaurantes.")

    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "No se encontró un JSON válido en la petición."}),
            status_code=400,
            mimetype="application/json"
        )

    if "values" not in body:
        return func.HttpResponse(
            json.dumps({"error": "El JSON no contiene la estructura esperada (values)."}),
            status_code=400,
            mimetype="application/json"
        )

    results = {"values": []}

    for record in body["values"]:
        record_id = record.get("recordId")
        text = record.get("data", {}).get("text", "")

        if not record_id:
            continue

        # En caso de falta de texto, devolvemos valores por defecto
        if not text:
            results["values"].append({
                "recordId": record_id,
                "data": {
                    "entities": {
                        "restaurante": "Desconocido",
                        "platos": [],
                        "ubicacion": "Desconocida",
                        "tipologia": "Tradicional",
                        "tipo_menu": "sin restricciones",
                        "precio": 0.0,
                        "puntuacion": 0.0
                    }
                }
            })
            continue

        # Prompt actualizado: se solicita que "tipologia" sea uno de los siguientes:
        # Italiana, Asiatica, India, Casera o Tradicional, y que "precio" sea un valor numérico (double).
        prompt = (
            "Eres un asistente experto en extraer información de menús de restaurantes. "
            "Dado el siguiente texto extraído de un menú, extrae la siguiente información en formato JSON con la siguiente estructura:\n\n"
            "{\n"
            '  "restaurante": "nombre del restaurante",\n'
            '  "platos": [\n'
            '    { "nombre": "nombre del plato", "puntuacion": puntuación numérica del plato },\n'
            '    ...\n'
            '  ],\n'
            '  "ubicacion": "ubicación del restaurante",\n'
            '  "tipologia": "tipo o categoría del restaurante (Italiana, Asiatica, India, Casera, Tradicional)",\n'
            '  "tipo_menu": "tipo de menú (ej. sin restricciones, celíaco, vegetariano, vegano)",\n'
            '  "precio": precio numérico aproximado,\n'
            '  "puntuacion": puntuación numérica general del restaurante\n'
            "}\n\n"
            "Si falta algún dato, inventa un valor plausible. Asegúrate de devolver un JSON válido.\n\n"
            "Texto:\n" + text + "\n\n"
            "Respuesta JSON:"
        )

        try:
            # Llamada a la API de OpenAI, parseando la respuesta según nuestro modelo MenuEntities
            completion = client.beta.chat.completions.parse(
                model=MODEL,
                store=True,
                messages=[
                    {"role": "system", "content": "Eres un asistente que extrae datos estructurados de menús de restaurantes."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0,
                response_format=MenuEntities,
            )
            # Se obtiene la respuesta parseada
            entities = completion.choices[0].message.parsed.dict()
        except Exception as e:
            logging.error(f"Error llamando a OpenAI: {e}")
            entities = {
                "restaurante": "Desconocido",
                "platos": [],
                "ubicacion": "Desconocida",
                "tipologia": "Tradicional",
                "tipo_menu": "sin restricciones",
                "precio": 0.0,
                "puntuacion": 0.0
            }

        results["values"].append({
            "recordId": record_id,
            "data": {
                "entities": entities
            }
        })

    return func.HttpResponse(
        json.dumps(results, ensure_ascii=False),
        status_code=200,
        mimetype="application/json"
    )


@app.event_grid_trigger(arg_name="azeventgrid")
def EventGridTrigger(azeventgrid: func.EventGridEvent):
    logging.info('Python EventGrid trigger processed an event')


@app.event_grid_trigger(arg_name="azeventgrid")
def EventGridTrigger(azeventgrid: func.EventGridEvent):
    logging.info('Python EventGrid trigger processed an event')
