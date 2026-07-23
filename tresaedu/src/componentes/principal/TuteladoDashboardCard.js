import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CONFIG from '../../config';

const URL_ASISTENCIA = `${CONFIG.API_URL}/operarAsistencia.php`;
const URL_MENSAJES = `${CONFIG.API_URL}/listarMensajes.php`;

function TuteladoDashboardCard({ estudiante, seleccionarEstudiante, configuracion, mostrarNombre }) {
    const [asistencias, setAsistencias] = useState({ presentes: 0, ausentes: 0, tarde: 0 });
    const [mensajesSinLeer, setMensajesSinLeer] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [diasAusentes, setDiasAusentes] = useState([]);
    const [mostrarAusentesModal, setMostrarAusentesModal] = useState(false);

    const defaultFilePerfil = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
    const fecha = new Date();
    const añoActual = fecha.getFullYear();

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            try {
                // Fetch Asistencia
                const asisRes = await axios.get(`${URL_ASISTENCIA}?id_estudiante=${estudiante.estudiante_id}&anioLectivo=${añoActual}`);
                let conteoFinal = { presentes: 0, ausentes: 0, tarde: 0 };
                let ausentesArray = [];
                if (asisRes.data.resultado && asisRes.data.asistencia) {
                    conteoFinal = asisRes.data.asistencia.reduce((acc, item) => {
                        if (item.asistencia === "Presente") acc.presentes++;
                        else if (item.asistencia === "Ausente") {
                            acc.ausentes++;
                            ausentesArray.push(item.fecha);
                        }
                        else if (item.asistencia === "Tarde") acc.tarde++;
                        return acc;
                    }, conteoFinal);
                }

                // Fetch Mensajes
                const dataMsj = {
                    modo: 'listarMensajesSinLeer',
                    id_usuario: estudiante.estudiante_id
                };
                const msjRes = await axios.post(URL_MENSAJES, dataMsj);
                let unread = 0;
                if (!msjRes.data.error) {
                    unread = msjRes.data.cantidad || 0;
                }

                if (isMounted) {
                    setAsistencias(conteoFinal);
                    setDiasAusentes(ausentesArray);
                    setMensajesSinLeer(unread);
                    setCargando(false);
                }
            } catch (error) {
                console.error("Error fetching dashboard data for student:", error);
                if (isMounted) setCargando(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [estudiante.estudiante_id, añoActual]);

    // Calcular si hay alertas
    const tieneAlertas = asistencias.ausentes > 2 || mensajesSinLeer > 0;

    return (
        <div className='card shadow border-0 p-3 m-2' style={{ width: '100%', maxWidth: '350px' }}>
            <div className='d-flex align-items-center mb-3'>
                <img 
                    alt="Perfil"
                    className='imagen-circular-estudiante rounded-circle border border-black p-1 me-3' 
                    src={(estudiante.imagen_perfil === '' || estudiante.imagen_perfil == null) ? defaultFilePerfil : `${CONFIG.API_URL}/${estudiante.imagen_perfil}`} 
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                />
                <div>
                    <h6 className="mb-0"><strong>{estudiante.nombre}, {estudiante.apellido}</strong></h6>
                    <small className="text-muted">Curso: {mostrarNombre(estudiante.orden)} {estudiante.denominacion}</small>
                </div>
            </div>

            {cargando ? (
                <div className="text-center py-2"><small>Cargando datos...</small></div>
            ) : (
                <>
                    <div className="d-flex justify-content-between mb-2">
                        <div 
                            className="text-center border rounded p-2" 
                            style={{flex: 1, marginRight: '5px', cursor: asistencias.ausentes > 0 ? 'pointer' : 'default'}}
                            onClick={() => { if (asistencias.ausentes > 0) setMostrarAusentesModal(true); }}
                            title={asistencias.ausentes > 0 ? "Ver detalle de inasistencias" : ""}
                        >
                            <div className="small text-muted">Ausentes</div>
                            <h5 className={asistencias.ausentes > 2 ? 'text-danger mb-0' : 'mb-0'}>{asistencias.ausentes}</h5>
                        </div>
                        <div className="text-center border rounded p-2" style={{flex: 1, marginLeft: '5px'}}>
                            <div className="small text-muted">No Leídos</div>
                            <h5 className={mensajesSinLeer > 0 ? 'text-warning mb-0' : 'mb-0'}>{mensajesSinLeer}</h5>
                        </div>
                    </div>

                    {tieneAlertas && (
                        <div className="alert alert-warning p-2 small mb-3">
                            <i className="fa-solid fa-triangle-exclamation me-2"></i>
                            Revisa el perfil, hay alertas pendientes.
                        </div>
                    )}
                </>
            )}

            <button 
                className='btn btn-sm w-100 mt-auto text-white' 
                style={{ backgroundColor: configuracion.color_principal || '#007bff' }}
                onClick={() => seleccionarEstudiante(estudiante)}
            >
                Ver más detalle
            </button>

            {/* Modal de Ausentes */}
            {mostrarAusentesModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={() => setMostrarAusentesModal(false)}></div>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header bg-danger text-white">
                                    <h5 className="modal-title">
                                        <i className="fa-solid fa-calendar-xmark me-2"></i>
                                        Registro de Inasistencias
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setMostrarAusentesModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <p>El estudiante registra inasistencia los siguientes días:</p>
                                    <ul className="list-group">
                                        {diasAusentes.map((fechaAusente, index) => (
                                            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                                <span><i className="fa-regular fa-calendar me-2"></i> {fechaAusente}</span>
                                                <span className="badge bg-danger rounded-pill">Ausente</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setMostrarAusentesModal(false)}>Cerrar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default TuteladoDashboardCard;
