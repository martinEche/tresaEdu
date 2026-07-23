import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Principal.css';
import CONFIG from '../../config.js';
import { Link } from 'react-router-dom';

const URL_ALERTAS = `${CONFIG.API_URL}/operarAlertas.php`;

function PrincipalDocentesEspeciales({ ListadosDeCursos, configuracion }) {
    const [alertasAsistencia, setAlertasAsistencia] = useState([]);
    const [alertasCalificaciones, setAlertasCalificaciones] = useState([]);
    const [busquedaCurso, setBusquedaCurso] = useState('');

    useEffect(() => {
        axios.get(URL_ALERTAS)
            .then(res => {
                if (res.data.success) {
                    setAlertasAsistencia(res.data.alertasAsistencia);
                    setAlertasCalificaciones(res.data.alertasCalificaciones);
                }
            })
            .catch(err => console.log(err));
    }, []);

    return (
        <div>
            <h5>Área Docentes Especiales</h5>
            <div className='row mt-3'>
                {/* Panel de Alertas */}
                <div className='col-12 col-md-8'>
                    <div className='row'>
                        <div className='col-12 col-md-6 mb-3'>
                            <div className='card border-danger'>
                                <div className='card-header bg-danger text-white fw-bold'>
                                    <i className="fa-solid fa-triangle-exclamation me-2"></i>
                                    Alertas de Inasistencias
                                </div>
                                <div className='card-body p-0' style={{maxHeight: '400px', overflowY: 'auto'}}>
                                    {alertasAsistencia.length > 0 ? (
                                        <ul className="list-group list-group-flush">
                                            {alertasAsistencia.map((alerta, index) => (
                                                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <Link to={`/VerPerfil/e/${alerta.id}`} className='text-decoration-none'>
                                                        {alerta.nombre} {alerta.apellido} <span className="text-muted small">({alerta.dni})</span>
                                                    </Link>
                                                    <span className="badge bg-danger rounded-pill">{alerta.total_ausencias} faltas</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-3 text-muted mb-0">No hay alertas críticas de inasistencia.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className='col-12 col-md-6 mb-3'>
                            <div className='card border-warning'>
                                <div className='card-header bg-warning text-dark fw-bold'>
                                    <i className="fa-solid fa-bell me-2"></i>
                                    Alertas de Calificaciones
                                </div>
                                <div className='card-body p-0' style={{maxHeight: '400px', overflowY: 'auto'}}>
                                    {alertasCalificaciones.length > 0 ? (
                                        <ul className="list-group list-group-flush">
                                            {alertasCalificaciones.map((alerta, index) => (
                                                <li key={index} className="list-group-item">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <Link to={`/VerPerfil/e/${alerta.id}`} className='text-decoration-none fw-semibold'>
                                                            {alerta.nombre} {alerta.apellido}
                                                        </Link>
                                                        <span className='badge bg-warning text-dark fw-bold'>{alerta.valor}</span>
                                                    </div>
                                                    <div className='small text-muted mt-1'>
                                                        Instancia: {alerta.instancia_titulo}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-3 text-muted mb-0">No hay alertas recientes de bajas calificaciones.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel de Cursos */}
                <div className='col-12 col-md-4'>
                    <div className='card text-bg-light border-dark mb-3'>
                        <div className='card-header border-dark bg-secondary text-white fw-bold d-flex flex-column'>
                            <span>Listado de Cursos</span>
                            <input 
                                type="text" 
                                className="form-control form-control-sm mt-2" 
                                placeholder="Buscar curso..." 
                                value={busquedaCurso}
                                onChange={(e) => setBusquedaCurso(e.target.value)}
                            />
                        </div>
                        <div className='card-body p-0' style={{maxHeight: '600px', overflowY: 'auto'}}>
                            <div className="list-group list-group-flush">
                                {ListadosDeCursos && ListadosDeCursos.length > 0 ? (
                                    ListadosDeCursos.filter(curso => 
                                        `${curso.nombre_formacion} ${curso.nombre_espacio} ${curso.denominacion}`.toLowerCase().includes(busquedaCurso.toLowerCase())
                                    ).map((curso, index) => (
                                        <Link 
                                            key={index} 
                                            to={`/Cursos/${curso.id_curso_grupo}`} 
                                            className="list-group-item list-group-item-action flex-column align-items-start"
                                        >
                                            <div className="d-flex w-100 justify-content-between">
                                                <h6 className="mb-1">{curso.nombre_espacio}</h6>
                                                <span className="badge bg-secondary rounded-pill">{curso.denominacion}</span>
                                            </div>
                                            <small className="text-muted">{curso.nombre_formacion}</small>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-3 text-muted">No hay cursos cargados.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrincipalDocentesEspeciales;
