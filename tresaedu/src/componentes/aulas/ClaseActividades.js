import './css/Aulas.css'; 
import Espera from '../Espera';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ClaseActividadesForm from './ClaseActividadesForm';
import CONFIG from '../../config';
import { useNavigate } from 'react-router-dom';
import VerActividad from '../actividades/VerActividad';

const URL_CLASES  = `${CONFIG.API_URL}/operarClases.php`;

function ClaseActividades({rol, setCantActividades, enviarSolicitud, id_curso, id_clase, setEditaActividad, editaActividad, trabajos, cuestionarios}) {
    const [actividadesCurso, setActividadesCurso] = useState([]);
   // const [actividadesClase, setActividadesClase] = useState([]);
    const [trabajosCurso, setTrabajosCurso] = useState([]);
    const [cuestionarioCurso, setCuestionarioCurso] = useState([]);
    const [trabajosClase, setTrabajosClase] = useState(trabajos || []);
    const [cuestionarioClase, setCuestionarioClase] = useState(cuestionarios || []);
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);    
    const [mostrarActividad, setMostrarActividad] = useState('');

    const data= {
        'id_curso' : id_curso,
        'modo': 'buscarActividadesEspacioCurso'
    }
    
    // Sincronizar con props
    useEffect(() => {
        setTrabajosClase(trabajos || []);
        setCuestionarioClase(cuestionarios || []);
    }, [trabajos, cuestionarios]);

    useEffect(() => {
        if (editaActividad) {
            buscaActividadesCurso(data);
        }
    }, [editaActividad, id_clase]);

    useEffect(() => {
        setCantActividades(trabajosClase.length + cuestionarioClase.length );
    }, [trabajosClase, cuestionarioClase, setCantActividades]);
    
    const buscaActividadesCurso = (d) => {
        setVisible(true);
        axios.post(URL_CLASES, d)
        .then(res =>{
            console.log('res.dataaaaaa', res.data);
            if(!res.data.error){   
                setTrabajosCurso(res.data.trabajos)
                
                setTrabajosClase(res.data.trabajos.filter((trabajo)=>{
                    return trabajo.id_clase == id_clase;
                }))
               
                setCuestionarioCurso(res.data.cuestionarios)
 
                setCuestionarioClase(res.data.cuestionarios.filter((cuestionario)=>{
                    return cuestionario.id_clase == id_clase;
                }))
                setCantActividades(trabajosClase.length + cuestionarioClase.length);
            }else{
                setActividadesCurso([]);
            }
            setVisible(false);           
        })
        .catch(err=>{
            console.log(err);
        })   
    }

    const quitarActividad = (id_trabajo_clase, tabla) => {
        enviarSolicitud('DELETE', {'id': id_trabajo_clase, 'tabla': tabla});
        setEditaActividad(false);
    }

    return (    
        <div>
        {editaActividad && 
        <>
            <div className='alert alert-warning'>
                Para poder agregar actividades o cuestionarios a la clase deberan estar creados previamente. 
                Para crearlos ingresar al menu laboratorio <i className='fa-solid fa-flask'></i>
            </div>
            <ClaseActividadesForm 
            setEditaActividad={setEditaActividad} 
            id_clase={id_clase} 
            trabajosCurso={trabajosCurso} 
            cuestionarioCurso={cuestionarioCurso}
            enviarSolicitud={enviarSolicitud} />
        </>
        }
        {!visible ? 
        (
        <div className="activities-container">
            {cuestionarioClase.length !== 0 && (
                <div className="activities-section">
                    <h6 className="activities-section-title"><i className="fa-solid fa-list-check me-2"></i>Cuestionarios</h6>
                    <div className="activities-grid">
                        {cuestionarioClase.map((ccl) => (
                            <div key={ccl.id} className="activity-card card-cuestionario">
                                <div className="activity-icon-wrapper">
                                    <i className="fas fa-list-ol"></i>
                                </div>
                                <div className="activity-info">
                                    <h6 className="activity-title" onClick={() => navigate(`/cuestionario/${ccl.id}`)}>
                                        {ccl.titulo}
                                    </h6>
                                    <p className="activity-description">{ccl.descripcion}</p>
                                    <span className="activity-badge badge-cuestionario">Cuestionario</span>
                                    {ccl.intentos > 0 && rol == 7 && (
                                        <div className="mt-2 small text-muted">
                                            <strong>Completado:</strong> Mejor acierto: {Math.round(ccl.mejor_acierto * 100)}% / {ccl.intentos} intento{ccl.intentos > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                                {editaActividad && (
                                    <button 
                                        onClick={() => quitarActividad(ccl.id_formulario_clase, 'formulario_clase')} 
                                        className="btn-delete-activity"
                                        title="Quitar de la clase"
                                    >
                                        <i className="fa-regular fa-trash-can"></i>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {trabajosClase.length !== 0 && (
                <div className="activities-section mt-4">
                    <h6 className="activities-section-title"><i className="fa-solid fa-briefcase me-2"></i>Tareas / Actividades</h6>
                    <div className="activities-grid">
                        {trabajosClase.map((acl) => (
                            <div key={acl.id} className="activity-card card-tarea">
                                <div className="activity-icon-wrapper">
                                    <i className="fa-solid fa-briefcase"></i>
                                </div>
                                <div className="activity-info">
                                    <h6 className="activity-title" onClick={() => setMostrarActividad(acl)}>
                                        {acl.titulo}
                                    </h6>
                                    {mostrarActividad && mostrarActividad.id === acl.id ? (
                                        <div className="activity-expanded-content">
                                            <VerActividad actividad={mostrarActividad} setMostrarActividad={setMostrarActividad} rol={rol} />
                                        </div>
                                    ) : (
                                        <>
                                            <p className="activity-description">{acl.desarrollo ? acl.desarrollo.replace(/<[^>]*>/g, '').substr(0, 120) + '...' : ''}</p>
                                            <span className="activity-badge badge-tarea">Tarea</span>
                                        </>
                                    )}
                                </div>
                                {editaActividad && (
                                    <button 
                                        onClick={() => quitarActividad(acl.id_trabajo_clase, 'trabajo_clase')} 
                                        className="btn-delete-activity"
                                        title="Quitar de la clase"
                                    >
                                        <i className="fa-regular fa-trash-can"></i>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    ) 
    : <div className='container m-3'><Espera visible={visible} /></div>
}

    </div>
    );
}

export default ClaseActividades;
