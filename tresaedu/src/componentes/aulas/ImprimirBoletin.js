import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios'; // Wait, let's keep axios import as it was
import CONFIG from '../../config.js';
import './css/ImprimirBoletin.css';

function ImprimirBoletin({ acceder, configuracion }) {
    const { studentId, cohorteId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const instanciaSeleccionadaId = searchParams.get('instancia');

    const [perfil, setPerfil] = useState(null);
    const [cursos, setCursos] = useState([]);
    const [valoraciones, setValoraciones] = useState([]);
    const [instancias, setInstancias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Redirigir si no tiene acceso
        if (!acceder) {
            localStorage.clear();
            navigate('/');
            return;
        }

        const fetchDatos = async () => {
            setLoading(true);
            try {
                // 1. Obtener detalles del estudiante
                const resUser = await axios.post(`${CONFIG.API_URL}/listarUsuarios.php`, {
                    id_usuario: studentId,
                    modo: 'buscarFichalUsuario'
                });
                if (!resUser.data.error) {
                    setPerfil(resUser.data.info);
                } else {
                    setError(true);
                }

                // 2. Obtener cursos, valoraciones e instancias para esta cohorte
                const resGrades = await axios.post(`${CONFIG.API_URL}/operarCalificaciones.php`, {
                    modo: 'buscarCursosyCalificaciones',
                    id_usuario: studentId,
                    id_cohorte: cohorteId,
                    ciclo: new Date().getFullYear()
                });
                if (resGrades.data.resultado) {
                    setCursos(resGrades.data.cursos || []);
                    setValoraciones(resGrades.data.valoraciones || []);
                    setInstancias(resGrades.data.instancias || []);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Error al cargar datos del boletín:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (studentId && cohorteId) {
            fetchDatos();
        }
    }, [studentId, cohorteId, acceder, navigate]);

    if (loading) {
        return (
            <div className="boletin-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '15px' }}>
                <div className="spinner-border text-primary" role="status"></div>
                <span className="text-secondary fw-semibold">Generando reporte de calificaciones...</span>
            </div>
        );
    }

    if (error || !perfil) {
        return (
            <div className="boletin-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '15px' }}>
                <i className="fa-solid fa-triangle-exclamation text-danger" style={{ fontSize: '3rem' }}></i>
                <h4 className="text-dark">Error al cargar el boletín</h4>
                <p className="text-muted text-center" style={{ maxWidth: '400px' }}>No se pudo obtener la información de calificaciones para este alumno. Verifique que existan datos cargados para la cohorte seleccionada.</p>
                <button className="boletin-btn boletin-btn-secondary" onClick={() => window.close()}>Cerrar Ventana</button>
            </div>
        );
    }

    // Extraer metadatos de los cursos
    const primerCurso = cursos[0] || {};
    const cohorteNombre = primerCurso.nombre_formacion || 'General';
    const cohorteAño = primerCurso.año || '';
    const divisionDenom = primerCurso.denominacion || '';
    const ordenAño = primerCurso.orden || '';

    const selectedInst = instancias.find(i => String(i.id) === String(instanciaSeleccionadaId));
    const esFinal = !instanciaSeleccionadaId || (selectedInst?.nombre_instancia?.toLowerCase() === 'final');

    // Agrupar observaciones de docentes para mostrarlas en un apartado ordenado (solo para boletín final)
    const observacionesList = [];
    if (esFinal) {
        cursos.forEach(c => {
            instancias.forEach(inst => {
                const val = valoraciones.find(v => v.id_instancia === inst.id && v.id_curso === c.id);
                if (val && val.observacion && val.observacion.trim() !== '' && (val.estado_aprobacion === 'aprobada' || val.estado_aprobacion === 'publicada')) {
                    observacionesList.push({
                        materia: c.nombre_espacio,
                        instancia: inst.nombre_instancia,
                        texto: val.observacion
                    });
                }
            });
        });
    }

    return (
        <div className="boletin-body">
            {/* Barra de Acciones (Oculta en Impresión) */}
            <div className="boletin-acciones-bar no-print">
                <div className="boletin-acciones-titulo">
                    <i className="fa-solid fa-file-pdf"></i>
                    Vista Previa del Boletín Digital
                </div>
                <div className="boletin-acciones-botones">
                    <button className="boletin-btn boletin-btn-primary" onClick={() => window.print()}>
                        <i className="fa-solid fa-print"></i>
                        Imprimir / Guardar PDF
                    </button>
                    <button className="boletin-btn boletin-btn-secondary" onClick={() => window.close()}>
                        <i className="fa-solid fa-xmark"></i>
                        Cerrar Ventana
                    </button>
                </div>
            </div>

            {/* Contenedor del Boletín */}
            <div className="boletin-container">
                {/* Encabezado */}
                <div className="boletin-header">
                    <div className="boletin-logo-sec">
                        {configuracion?.logo_solo ? (
                            <img 
                                src={`${CONFIG.API_URL}/img/${configuracion.logo_solo}`} 
                                alt="Logo" 
                                className="boletin-logo-img"
                            />
                        ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                                TE
                            </div>
                        )}
                        <div className="boletin-school-info">
                            <h1>{configuracion?.nombre || 'PLATAFORMA EDUCATIVA'}</h1>
                            <p>Registro de Calificaciones y Valoración Pedagógica</p>
                        </div>
                    </div>
                    <div className="boletin-titulo-doc">
                        <h2>Instrumento de comunicacion a las familias</h2>
                        <p>Ciclo Lectivo: {cohorteAño || new Date().getFullYear()}</p>
                    </div>
                </div>

                {/* Datos del Estudiante */}
                <div className="boletin-alumno-card">
                    <div className="boletin-alumno-grid">
                        <div className="boletin-info-item">
                            <span className="boletin-info-label">Estudiante</span>
                            <span className="boletin-info-value">{perfil.apellido}, {perfil.nombre}</span>
                        </div>
                        <div className="boletin-info-item">
                            <span className="boletin-info-label">Documento</span>
                            <span className="boletin-info-value">{perfil.documento || '—'}</span>
                        </div>
                        <div className="boletin-info-item">
                            <span className="boletin-info-label">Cohorte / Formación</span>
                            <span className="boletin-info-value">{cohorteNombre}</span>
                        </div>
                        <div className="boletin-info-item">
                            <span className="boletin-info-label">Curso / División</span>
                            <span className="boletin-info-value">
                                {ordenAño ? `${ordenAño}° año` : '—'}
                                {divisionDenom ? ` - Div. ${divisionDenom}` : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabla de Calificaciones */}
                <div className="boletin-table-wrapper">
                    <table className="boletin-table">
                        <thead>
                            {esFinal ? (
                                <tr>
                                    <th style={{ width: '40%' }}>Espacio Curricular</th>
                                    {instancias.map((inst) => (
                                        <th key={inst.id} style={{ textAlign: 'center' }}>
                                            {inst.nombre_instancia}
                                        </th>
                                    ))}
                                </tr>
                            ) : (
                                <tr>
                                    <th style={{ width: '40%' }}>Espacio Curricular</th>
                                    <th style={{ textAlign: 'center', width: '20%' }}>
                                        {selectedInst?.nombre_instancia}
                                    </th>
                                    <th style={{ width: '40%' }}>Observaciones</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {esFinal ? (
                                cursos.map((c) => (
                                    <tr key={c.id}>
                                        <td>
                                            <div className="boletin-materia-nombre">
                                                {c.nombre_espacio}
                                            </div>
                                        </td>
                                        {instancias.map((inst) => {
                                            const val = valoraciones.find(
                                                (v) => v.id_instancia === inst.id && v.id_curso === c.id
                                            );
                                            const tieneCal = val && val.valor !== null && val.valor !== '' && 
                                                             (val.estado_aprobacion === 'aprobada' || val.estado_aprobacion === 'publicada');
                                            const valorNum = tieneCal ? parseFloat(val.valor) : null;

                                            return (
                                                <td key={inst.id} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                    {tieneCal ? (
                                                        <span className={`boletin-grade-badge ${valorNum !== null && valorNum < 6 ? 'text-danger' : ''}`}>
                                                            {val.valor}
                                                        </span>
                                                    ) : (
                                                        <span className="boletin-grade-empty"></span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                cursos.map((c) => {
                                    const val = selectedInst ? valoraciones.find(
                                        (v) => v.id_instancia === selectedInst.id && v.id_curso === c.id
                                    ) : null;
                                    const esAprobadaOPublicada = val && (val.estado_aprobacion === 'aprobada' || val.estado_aprobacion === 'publicada');
                                    const tieneCal = val && val.valor !== null && val.valor !== '' && esAprobadaOPublicada;
                                    const valorNum = tieneCal ? parseFloat(val.valor) : null;
                                    const observacion = esAprobadaOPublicada ? (val?.observacion || '') : '';

                                    return (
                                        <tr key={c.id}>
                                            <td>
                                                <div className="boletin-materia-nombre">
                                                    {c.nombre_espacio}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                {tieneCal ? (
                                                    <span className={`boletin-grade-badge ${valorNum !== null && valorNum < 6 ? 'text-danger' : ''}`}>
                                                        {val.valor}
                                                    </span>
                                                ) : (
                                                    <span className="boletin-grade-empty"></span>
                                                )}
                                            </td>
                                            <td style={{ fontSize: '0.9rem', verticalAlign: 'middle', padding: '8px' }}>
                                                {observacion}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Observaciones de los Docentes (Solo si hay) */}
                {observacionesList.length > 0 && (
                    <div className="boletin-observaciones-sec">
                        <div className="boletin-observaciones-titulo">
                            <i className="fa-regular fa-comment-dots"></i>
                            Observaciones y Aclaraciones Pedagógicas
                        </div>
                        {observacionesList.map((obs, idx) => (
                            <div key={idx} className="boletin-observacion-row">
                                <strong>{obs.materia} ({obs.instancia}):</strong> {obs.texto}
                            </div>
                        ))}
                    </div>
                )}

                {/* Firmas */}
                <div className="boletin-firmas-sec">
                    <div className="boletin-firma-box">
                        <div className="boletin-firma-linea"></div>
                        <div className="boletin-firma-aclaracion">Firma Docente</div>
                        <div className="boletin-firma-cargo">Equipo Pedagógico</div>
                    </div>
                    <div className="boletin-firma-box">
                        <div className="boletin-firma-linea"></div>
                        <div className="boletin-firma-aclaracion">Sello y Firma</div>
                        <div className="boletin-firma-cargo">Dirección Institucional</div>
                    </div>
                </div>

                {/* Footer Legal */}
                <div className="boletin-footer-legal">
                    Documento de registro académico generado de manera digital desde la plataforma {configuracion?.nombre || 'TRESAEDU'} el {new Date().toLocaleDateString('es-AR')}.
                </div>
            </div>
        </div>
    );
}

export default ImprimirBoletin;
