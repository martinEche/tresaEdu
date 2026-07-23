import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ActividadForm from './ActividadForm';
import VerActividad from './VerActividad';
import CONFIG from '../../config';

const URL  = `${CONFIG.API_URL}/operarActividades.php`;

function Actividades ({ idMC, rol }){
    const [actividades, setActividades] = useState([]);
	const [mostrarActividad, setMostrarActividad] = useState('');
    const [verFormularioActividad, setVerFormularioActividad] = useState(false);
    const loggeduserId =localStorage.getItem('loggedUserId');

    const [datoActividad, setDatoActividad] = useState({
        id:null,
        id_curso: idMC,
        titulo: '',
        desarrollo: '',
        forma_presentacion: '',
        tipo_trabajo: 'grupal',
        fecha_entrega: '',
        material:'',
        adjunto:'',
        fecha_creacion:'',
        creado_por:''
    });

    useEffect(() => {
        fetchActividades();
    }, []);

    const fetchActividades = async () => {
        try {
            const response = await axios.get(`${URL}?id_curso=${idMC}&rol=${rol}`);
            console.log('response.data', response.data);
            if(response.data.success){
                if(rol==6 ||rol==5){ //si es docente o auxiliar
                    
                    setActividades(response.data.actividades);
                    
                }
                if(rol==7 || rol==8){ //si es estudiante o tutor
                    setActividades(response.data.actividades);
                }
            }
           //console.log(response.data);
        } catch (error) {
            console.error('Error fetching actividades:', error);
        }
    };

    const handleNuevaActividad = () => {
        setVerFormularioActividad(true);
    };

    
		const handleSubmit = async (e) => {
			e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
	
			const formData = new FormData(); // Usamos FormData para manejar archivos
			formData.append("id", datoActividad.id);
			formData.append("id_curso", datoActividad.id_curso);
			formData.append("titulo", datoActividad.titulo);
			formData.append("desarrollo", datoActividad.desarrollo);
			formData.append("forma_presentacion", datoActividad.forma_presentacion);
			formData.append("tipo_trabajo", datoActividad.tipo_trabajo);
			formData.append("fecha_entrega", datoActividad.fecha_entrega);
			formData.append("material", datoActividad.material || ''); // En caso de que no haya material
			formData.append("adjunto", datoActividad.adjunto || null); // En caso de que haya archivo adjunto
			formData.append("creado_por", loggeduserId); // Ajustar según corresponda
			formData.append("fecha_creacion", new Date().toISOString());
	
			try {
					const response = await axios.post(URL, formData, {
							headers: {
									"Content-Type": "multipart/form-data"
							}
					});
					console.log("Actividad guardada:",response.data);
					if (response.data.success) {
							fetchActividades(); // Refrescar la lista de actividades
							setVerFormularioActividad(false); // Cerrar el formulario
					} else {
							console.error("Error al guardar la actividad", response.data);
					}
			} catch (error) {
					console.error("Error al enviar la solicitud", error);
			}
	};

    const verActividad=(actividad)=>{
			//console.log(actividad);
			setMostrarActividad(actividad)
    }
    
    const editarActividad=(actividad)=>{
        setDatoActividad(actividad);
        setVerFormularioActividad(true);
    }
    const elimina=(id)=>{

    }
    
    return (
        <div id={`tarea_clase_${idMC}`} className="tarea" >
        {(!verFormularioActividad && mostrarActividad ==='') ?
          <div>
						<h3 className=' mt-3'>Actividades</h3>
						{(rol==6 ||rol==5) &&
						<button type="button" className="btn btn-dark btn-sm" onClick={()=>handleNuevaActividad()}>
							<i className="fa-regular fa-square-plus me-1" ></i> actividad
            </button>
						}
						<table width="100%" className="table table-sm">
                <thead>
                    <tr>
                        <th width="1%"></th>
                        <th width="20%">Título</th>
                        <th width="25%">Desarrollo</th>
                        <th width="16%">Fecha de entrega</th>
                        <th width="10%">Trabajo</th>
                        <th width="28%"></th>
                    </tr>
                </thead>
                <tbody>
                    {actividades.length > 0 ? actividades.map((actividad, index) => (
                        <tr key={index} id={`fila_trabajo_${actividad.id_trabajo}`}>
                            <td className="small">
                                {actividad.id_clase>0 &&<i className="fa-solid fa-thumbtack mx-1"></i>}
                                {actividad.adjunto && <span className='icon-paperclip'></span>}
                            </td>
                            <td className="small">{actividad.titulo}- {actividad.id_clase}</td>
                            <td className="small">{`${actividad.desarrollo.substring(0, 150)}...`}</td>
                            <td className="small">{actividad.fecha_entrega}</td>
                            <td className="small">{actividad.tipo_trabajo}</td>
                            <td className="small">
                                <button className="btn btn-outline-success btn-sm me-1" onClick={() => verActividad(actividad)}><i className="fa-solid fa-eye"></i></button>
                                {(rol==6 ||rol==5) &&
																<>
                                	<button className="btn btn-outline-warning btn-sm me-1" onClick={() => editarActividad(actividad)}><i className="fa-regular fa-pen-to-square"></i></button>
                                	<button className="btn btn-outline-danger btn-sm me-1" onClick={() => elimina(actividad.id_trabajo, 'trabajo')}><i className="fa-regular fa-trash-can"></i></button>
																</>
																}
														</td>
                        </tr>
                    )) : (
                        <tr><td colSpan="6">No se registran actividades en la clase</td></tr>
                    )}
                </tbody>
            </table>
					</div>  
        :
				<>
				{verFormularioActividad &&
					<ActividadForm 
						datoActividad={datoActividad}
						setDatoActividad={setDatoActividad}
                        idMC={idMC}
						handleSubmit={handleSubmit} 
						setVerFormularioActividad={setVerFormularioActividad} 
					/>
				}
				{mostrarActividad!=='' && <VerActividad actividad={mostrarActividad} setMostrarActividad={setMostrarActividad} />}
				</>
				}    
        </div>
    );
};



export default Actividades;
