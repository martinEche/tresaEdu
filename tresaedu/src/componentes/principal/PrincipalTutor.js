import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Principal.css';
import CONFIG from '../../config.js';
import PrincipalEstudiante from './PrincipalEstudiante.js';
import CalendarioResumenEventos from '../mensajes/CalendarioResumenEventos.js';
import TuteladoDashboardCard from './TuteladoDashboardCard.js';


const URL_INFO = `${CONFIG.API_URL}/info_principal_tutor.php`;
const URL_CALENDARIO = `${CONFIG.API_URL}/operarCalendario.php`;

function PrincipalTutor({rol, configuracion}) {
    const userId =localStorage.getItem('loggedUserId');
    const [eventos, setEventos] = useState([]);
    const loggeduserId =localStorage.getItem('loggedUserId');
    const [estudiantesACargo, setEstudiantesACargo] = useState([]);
    const kte= localStorage.getItem('kte');
		const [verEstudiante, setVerEstudiante] = useState(0);
    const defaultFilePerfil='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
    
  

     useEffect(() => {
            obtenerEventos();
    }, []);

		useEffect(() => {
      const savedKte = localStorage.getItem('kte');
      if (savedKte) {
          const partes = savedKte.split("&");
          if (partes.length >= 2) {
              const est = JSON.parse(partes[1]);
              setVerEstudiante(est.estudiante_id);
          }
      } else {
          setVerEstudiante(0);
      }
			buscaInfoVinculacion();
		}, []);
    
		const buscaInfoVinculacion = () => {
        axios.get(`${URL_INFO}?id_tutor=${loggeduserId}&agrupado=1`)
            .then(res => {
                if (!res.data.error) { 
                    console.log('datos vinculo:',res.data.datos);
                    setEstudiantesACargo(res.data.datos);
                } else {
                    setEstudiantesACargo([]);
										console.log(res.data.mensaje);
                }
            })
            .catch(err => {
                console.log(err);
            });
    };

    const obtenerEventos = async () => {
        try {
            const res = await axios.get(`${URL_CALENDARIO}?id_usiario=${userId}&rol_usuario=${rol}`);
            if (Array.isArray(res.data)) {
                // Aplicar filtros según el rol
                const eventosFiltrados = res.data.filter(evento => {
                    const esPropio = evento.creada_por == userId;
    
                let filtroPorRol = false;
                rol = parseInt(rol, 10);
                switch (rol) {
                        case 1:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 2:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 3:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 4:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 5:
                            filtroPorRol = ['todos', 'todosD', 'todosDC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            break;
                        case 6:
                            filtroPorRol = ['todos', 'todosD', 'todosDC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            break;
                        case 7:
                            filtroPorRol = ['todos', 'todosE', 'todosEC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            //console.log('rol 7, evento:', evento.tipo_recordatorio, 'filtroPorRol:', filtroPorRol);
                            break;
                        case 8:
                            filtroPorRol = ['todos', 'todosT','todosE', 'todoTC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            break;
                        case 9:
                            filtroPorRol = ['todos', 'todosD'].includes(evento.tipo_recordatorio);
                            break;
                        case 12:
                            filtroPorRol = ['todos', 'todosM'].includes(evento.tipo_recordatorio);
                            break;
                        default:
                            filtroPorRol = false;
                            break;
                    }
    
                    return esPropio || filtroPorRol;
                });
    
                setEventos(eventosFiltrados);
            } else {
                setEventos([]);
                console.error('La respuesta de la API no es un array:', res.data);
            }
        } catch (err) {
            console.error('Error al obtener eventos:', err);
        }
    };

    const mostrarNombre = (orden)=>{
			let nombre="";
			switch(orden){  
				case "S2":
					nombre='Sala de 2';
					break        
				case "S3":
					nombre='Sala de 3';
				break
				case "S4":
					nombre='Sala de 4';
				break
				case "S5":
					nombre='Sala de 5';
				break
				case "In":
					nombre='Espacio Institucional';
				break
				default:
					nombre=orden+'°';
			}
			return nombre
		};
const seleccionarEstudiante= (est)=>{
  const fechaActual = new Date();
  localStorage.removeItem('kte');
  localStorage.setItem('kte',fechaActual+'&'+JSON.stringify(est)+'&'+loggeduserId);
  setVerEstudiante(est.estudiante_id);

}

    return (   
        <>
				{verEstudiante == 0 ?
				<>
          <h5>Área para tutores</h5>
          <div className='text-center'>
					{/* <button type="button" className="btn btn-primary">Inscribir un estudiante a mi cargo a un curso</button> */}
					</div>
					<hr/>
          <div className='row'>
            <div className='col-12 col-lg-4'>
              <div className='card px-2 mb-3'>
                <div className='mt-1'>
                  <CalendarioResumenEventos userId={userId} rol={rol} eventos={eventos} />
                </div>                   
              </div>
            </div>
            <div className='col-12 col-lg-8'>
              <div className='card px-4 pb-4'>
                <h5 className='mt-2'>Dashboard de Tutelados</h5>                        
                <div className='d-flex flex-wrap justify-content-center'>
											{estudiantesACargo.map((e)=>(
                        <TuteladoDashboardCard 
                          key={e.estudiante_id} 
                          estudiante={e} 
                          seleccionarEstudiante={seleccionarEstudiante} 
                          configuracion={configuracion} 
                          mostrarNombre={mostrarNombre} 
                        />
											))}
                </div>
              </div>                   
            </div>
          </div>
					</>
					:
					<PrincipalEstudiante 
            rol={rol} 
            configuracion={configuracion} 
            verTutor={verEstudiante} 
            setVerEstudiante={setVerEstudiante}
          />
					}
        </>                
     );
}

export default PrincipalTutor;