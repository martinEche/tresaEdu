// src/services/cursoService.js
import axios from 'axios';
import CONFIG from '../config'

const URL = `${CONFIG.API_URL}/operarCursos.php`;

export const buscarCursoPorId = async (id_curso_grupo) => {
    try {
      const response = await axios.post(URL, {'id_curso_grupo': id_curso_grupo,'modo': 'buscarCursoID'});
        console.log('response del back buscarCursoPorId:', response);
      return response
    } catch (error) {
      console.error('Error al obtener el curso', error);
      return null;
    }
  };
  
  export const buscarEstudiantesPorCurso = async (id_curso_grupo) => {
    try {
      const response = await axios.post(URL, {'id_curso_grupo': id_curso_grupo, 'modo': 'buscarEstudiantesCurso'});
      return response
    } catch (error) {
      console.error('Error al obtener el curso', error);
      return null;
    }
  };
  export const buscarDocentesPorCurso = async (id_curso_grupo) => {
    try {
      const response = await axios.post(URL, {'id_curso_grupo': id_curso_grupo, 'modo': 'buscarDocentesEnCurso'});
      return response
    } catch (error) {
      console.error('Error al obtener el curso', error);
      return null;
    }
  };

  export const asignarEstudianteAlCurso = async (id_curso_grupo, idEstudiante) => {
    try {
      const response = await axios.post(URL, { 'id_curso_grupo': id_curso_grupo, 'modo': 'asignaEstudiante', 'idEstudiante': idEstudiante });
      return response
    } catch (error) {
      console.error('Error al asignar el estudiante al curso', error);
      return null;
    }
  };
  export const quitarEstudianteAlCurso = async (id_estudiante_curso) => {
    try {
      //console.log('id antes de ir al back:'+ id_estudiante_curso)
      const response = await axios({ method: 'DELETE', url: URL, data: {'id': id_estudiante_curso, 'tabla':'curso_estudiante'} });
      //console.log('response del back:', response)
      
      return response
    } catch (error) {
      console.error('Error al quitar el estudiante del curso', error);
      return null;
    }
  };
 export const asignarDocenteAlCurso = async (id_curso_grupo, idDocente) => {
    try {
      const response = await axios.post(URL, { 'id_curso_grupo': id_curso_grupo, 'modo': 'asignarDocente', 'idDocente': idDocente });
      //console.log('response del backDocente:', response);
      return response
    } catch (error) {
      console.error('Error al asignar el docente al curso', error);
      return null;
    }
  };
               
  export const quitarDocenteAlCurso = async (id_docente_curso) => {
    try {
      //console.log('id antes de ir al back docente:'+ id_docente_curso)
      const response = await axios({ method: 'DELETE', url: URL, data: {'id': id_docente_curso, 'tabla':'curso_equipo_docente'} });
      //console.log('response del back:', response)
      
      return response
    } catch (error) {
      console.error('Error al quitar el docente del curso', error);
      return null;
    }
  };
