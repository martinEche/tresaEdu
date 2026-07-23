
import axios from 'axios';
import CONFIG from '../config';

const API_URL = `${CONFIG.API_URL}/operarForos.php`;
                      
export const obtenerTemas = async (id_clase) => {
    try {
      const response = await axios.get(`${API_URL}?id_clase=${id_clase}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener los temas:', error);
      return [];
    }
};

export const obtenerTemaPorId = async (id) => {
  try {
    const response = await axios.get(`${API_URL}?id=${id}`);
    //console.log('data: '+JSON.stringify(response.data))
    //console.log('respuestas: '+JSON.stringify(response.data.respuestas))
    //console.log('subrespuestas: '+JSON.stringify(response.data.respuestas[0].subrespuesta))
    console.log("esta en forumservice")
    return response.data;
  } catch (error) {
    console.error(`Error al obtener el tema con id ${id}:`, error);
    return null;
  }
};

export const obtenerRespuesta = async (id) => {
  try {
  const response = await axios.post(`${API_URL}?'id='${id}`);
  return response.data;
} catch (error) {
  console.error('Error al obtener los temas:', error);
  return [];
}
};

export const crearTema = async (formData) => {
    try {
        const response = await axios.post(API_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response;
    } catch (error) {
        console.error('Error al crear el tema:', error);
        throw error;
    }
};

export const editarTema = async (formData) => {
  try {
      const response = await axios.post(API_URL, formData, {
          headers: {
              'Content-Type': 'multipart/form-data',
          },
      });
      return response;
  } catch (error) {
      console.error('Error al editar el tema:', error);
      throw error;
  }
};

export const responderTema = async (respuestaData) => {
	try {
			const response = await axios.post(API_URL, respuestaData, {
					headers: {
					'Content-Type': 'multipart/form-data',
					},
			});
 			 return response;
	} catch (error) {
			console.error('Error al responder al tema:', error);
			throw error;
	}
};

// Función para eliminar tema y todas sus respuestas 
export const eliminarTema = async (temaId) => {
  try {
    const response = await axios.delete(API_URL, {
      params: {
        accion: 'eliminarTema',
        id: temaId
      }
    });
    return response;
  } catch (err) {
    console.error('Error eliminando tema:', err);
    throw err;
  }
};


// Función para eliminar una respuesta específica
export const eliminarRespuesta = async (respuestaId) => {
  try {
    const response = await axios.delete(API_URL, {
      params: {
        accion: 'eliminarRespuesta',
        id: respuestaId
      }
    });
    return response;
  } catch (err) {
    console.error('Error eliminando respuesta:', err);
    throw err;
  }
};

// Función para  tema y todas sus respuestas 
export const archivosForo = async (temaId,respuestaId) => {
  try {
    const response = await axios.get(`${API_URL}?temaId=${temaId}&respuestaId=${respuestaId}`);
    return response.data;
	} catch (error) {
		console.error('Error al obtener los temas:', error);
		return [];
	}
};