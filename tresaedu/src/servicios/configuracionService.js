import axios from 'axios';
import CONFIG from '../config';


const API_URL = `${CONFIG.API_URL}/operarConfiguracion.php`;

export async function fetchConfiguracion() {
  try {
    const response = await axios.get(API_URL); 
    //console.log("datoconfig ",response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching configuration:', error);
    throw error;
  }
}


export async function guardaConfiguracion(config) {
    try {
        
      const response = await axios.post(API_URL, config); 
      console.log(response)
      return response;
    } catch (error) {
      console.error('Error guardando configuration:', error);
      throw error;
    }
  }
