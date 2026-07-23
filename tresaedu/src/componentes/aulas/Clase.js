import './css/quill.snow.css';
import './css/Aulas.css';
import ClaseForm from './ClaseForm';
import ClaseMateriales from './ClaseMateriales';
import ClaseActividades from './ClaseActividades';

import { obtenerTemas } from '../../servicios/forumService';

import Foro from '../mensajes/Foro.js';
import { useState, useEffect } from 'react';
import CONFIG from '../../config.js';

function Clase({rol, clases, clase, enviarSolicitud, editarClase, nuevaClase, setEditaMaterial, editaMaterial, setEditaActividad, editaActividad, verAreaForos, configuracion}) {
    const [cantActividades, setCantActividades] = useState(0);
    const [cantTemasForos, setCantTemasForos] = useState(0);
	
    const [temas, setTemas] = useState([]);


		useEffect(() => {
			//console.log('clase_llego:'+JSON.stringify(clase));
            //console.log('rol en clase:'+rol);
			fetchTemas();
		}, [rol, clases, clase, enviarSolicitud, editarClase, nuevaClase, setEditaMaterial, editaMaterial, setEditaActividad, editaActividad, verAreaForos]);

		const fetchTemas = async () => {
			const data = await obtenerTemas(clase.id);
			setTemas(data);
			setCantTemasForos(data.length);
			//console.log("useeffect:"+data.length);
			//console.log("useeffect idCurso: "+ clase.id);

		};

    return (    
        <>
            <div>
                {(editarClase || nuevaClase)?
                <div className="hoja-form">
                    <h5><i className="fa-regular fa-file"></i> {editarClase ? "Edita ":"Nueva"} clase</h5>
                    <ClaseForm clase={clase} enviarSolicitud={enviarSolicitud}  />
                </div>
                :
                <>
                { clases.length==0 ? <img width={350} src={`${CONFIG.BASE_URL}/img/2953962.jpg`} />:
                	verAreaForos ?  <Foro  rol={rol} clase={clase} temas={temas} setTemas={setTemas} fetchTemas={fetchTemas} configurcion={configuracion} />
										:
                    <div className="hoja mb-4">
                        <div className="clase-titulo">
                            Título: {clase.tema} #{clase.id}
                            <div className="elementos_clase">
                                <i className="fa-solid fa-book m-1"></i> {clase?.materiales?.length || 0}
                                <i className="fa-solid fa-briefcase m-1"></i> {cantActividades}
                                <i className="fa-regular fa-message me-1"></i> {cantTemasForos}
                            </div>
                        </div>
                        {rol==7 && cantTemasForos>0 &&<Foro  rol={rol} clase={clase} temas={temas} setTemas={setTemas} fetchTemas={fetchTemas}/>}
                        
                        {/* Sección de Recursos / Materiales */}
                        {((rol == 6 || rol == 5 || rol == 9 || rol == 11 || rol <= 4) || (clase?.materiales && clase.materiales.length > 0)) && (
                            <div className='clase-seccion-container mb-4'>
                                <div className='clase-seccion-header'>
                                    <div className='clase-seccion-title-wrapper'>
                                        <div className='clase-seccion-icon icon-recursos'>
                                            <i className="fa-solid fa-book"></i>
                                        </div>
                                        <span className='clase-seccion-title'>Recursos de aprendizaje</span>
                                    </div>
                                    {(rol==6 || rol==5 || rol==9 || rol==11) && (
                                        <button 
                                            className={`btn btn-sm ${editaMaterial ? 'btn-secondary' : 'btn-primary'} d-flex align-items-center gap-1`} 
                                            onClick={() => setEditaMaterial(!editaMaterial)}
                                        >
                                            {editaMaterial ? 'Cancelar edición' : <><i className="fa-solid fa-pencil"></i> Editar</>}
                                        </button>
                                    )}
                                </div>
                                <ClaseMateriales 
                                    enviarSolicitud={enviarSolicitud} 
                                    id_clase={clase.id} 
                                    setEditaMaterial={setEditaMaterial} 
                                    editaMaterial={editaMaterial} 
                                    materiales={clase.materiales || []}
                                />
                            </div>
                        )}

                        <div className="presentacion informacion" dangerouslySetInnerHTML={{ __html:clase.presentacion}}></div>
                        <div className="desarrollo informacion " dangerouslySetInnerHTML={{ __html:clase.desarrollo}}></div>
                        <div className="cierre informacion " dangerouslySetInnerHTML={{ __html:clase.cierre}}></div>
                        
                        {/* Sección de Actividades / Tareas */}
                        <div className={`clase-seccion-container mt-4 ${((rol == 6 || rol == 5 || rol == 9 || rol == 11 || rol <= 4) || cantActividades > 0) ? '' : 'd-none'}`}>
                            <div className='clase-seccion-header'>
                                <div className='clase-seccion-title-wrapper'>
                                    <div className='clase-seccion-icon icon-actividades'>
                                        <i className="fa-solid fa-flag-checkered"></i>
                                    </div>
                                    <span className='clase-seccion-title'>Actividades y Tareas</span>
                                </div>
                                {(rol==6 || rol==5 || rol==9 || rol==11) && (
                                    <button 
                                        className={`btn btn-sm ${editaActividad ? 'btn-secondary' : 'btn-danger'} d-flex align-items-center gap-1`} 
                                        onClick={() => setEditaActividad(!editaActividad)}
                                    >
                                        {editaActividad ? 'Cancelar edición' : <><i className="fa-solid fa-pencil"></i> Editar</>}
                                    </button>
                                )}
                            </div>
                           
                            <ClaseActividades 
                                rol={rol}
                                setCantActividades={setCantActividades} 
                                enviarSolicitud={enviarSolicitud} 
                                id_curso={clase.id_curso} 
                                id_clase={clase.id} 
                                setEditaActividad={setEditaActividad} 
                                editaActividad={editaActividad}
                                trabajos={clase.trabajos || []}
                                cuestionarios={clase.cuestionarios || []}
                            />
                        </div>
                    </div>


                }
                </>
                }
            </div>
        </>
     );
}

export default Clase;