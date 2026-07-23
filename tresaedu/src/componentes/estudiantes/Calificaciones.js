import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from "react-router-dom";
import axios from 'axios';
import CONFIG from '../../config';
import NavBarEstudianteTutor from './NavBarEstudianteTutor';

const URL_CALIFICACIONES = `${CONFIG.API_URL}/operarCalificaciones.php`;

function Calificaciones({ acceder, configuracion }) {
    const loggeduserCurso = localStorage.getItem('loggeduserCurso');
    const navigate = useNavigate();
    const [cursoParticipa, setCursoParticipa] = useState([]);
    const [valoraciones, setValoraciones] = useState([]);
    const [instanciasCohorte, setInstanciasCohorte] = useState([]);
    const anioActual = new Date().getFullYear();

    const llamoTutor = localStorage.getItem('kte') || null; 

    // Inicializar sincronamente para evitar dobles renders y race conditions en los fetch
    const [datoEstudiante, setDatoEstudiante] = useState(() => {
        if (llamoTutor && llamoTutor !== "null") {
            try {
                const [fecha, estudianteStr, idTutor] = llamoTutor.split("&");
                return JSON.parse(estudianteStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    });

    const [userId, setUserId] = useState(() => {
        if (datoEstudiante && datoEstudiante.estudiante_id) {
            return datoEstudiante.estudiante_id;
        }
        return parseInt(localStorage.getItem('loggedUserId'), 10) || null;
    });

    useEffect(() => {
        if (!acceder) {
            localStorage.clear();
            navigate('/');
            return;
        }
        // Ya no seteamos userId aquí porque se inicializa sincronamente arriba
    }, [acceder, navigate]);

    // efecto separado para cargar datos SOLO cuando userId esté seteado
    useEffect(() => {
        if (!userId) return;   // evita disparar cuando está vacío
        obtenerDatos();
    }, [userId]);

    const data = {
        id_usuario: userId,
        ciclo: anioActual,
        modo: 'buscarCursosyCalificaciones'
    };

    const obtenerDatos = () => {
        console.log('data', data);
        axios.post(URL_CALIFICACIONES, data)
            .then(res => {
                console.log('ddd', res.data);
                if (!res.data.error) {
                    setValoraciones(res.data.valoraciones);
                    setCursoParticipa(res.data.cursos);
                    setInstanciasCohorte(res.data.instancias);
                } else {
                    setValoraciones([]);
                    setCursoParticipa([]);
                    setInstanciasCohorte([]);
                }
            })
            .catch(err => {
                console.log(err);
            });
    };
    // progreso general solo leo orden M modulos
    const modulos = cursoParticipa.filter(
        c => c.orden?.toUpperCase() === "M"
    );

    const totalModulos = modulos.length;

    const modulosAprobados = modulos.filter(
        c => Number(c.aprobado) === 1
    ).length;

    const porcentajeLogrado =
        totalModulos > 0
            ? Math.round((modulosAprobados * 100) / totalModulos)
            : 0;

    const porcentajePendiente = 100 - porcentajeLogrado;

    return (
        <div className='container-principal'>
            {llamoTutor && <NavBarEstudianteTutor estudiante={datoEstudiante} configuracion={configuracion} />}
            <div className='card shadow border-1 p-4'>
                <h4>Calificaciones por cursos</h4>
                <div className="mb-2">
                    <div className="mb-2">
                        <div
                            className="progress"
                            style={{
                                height: "12px",
                                borderRadius: "10px"
                            }}
                        >
                            <div
                                className="progress-bar bg-success"
                                style={{
                                    width: `${porcentajeLogrado}%`
                                }}
                            >
                            </div>

                            <div
                                className="progress-bar bg-light text-dark"
                                style={{
                                    width: `${porcentajePendiente}%`
                                }}
                            >
                            </div>
                        </div>

                        <div className="small text-muted mt-1">
                            <i className="fa-solid fa-circle-check text-success me-1"></i>
                            {modulosAprobados} logrados
                            {" • "}
                            {totalModulos - modulosAprobados} pendientes
                            {" • "}
                            {porcentajeLogrado}% de avance
                        </div>
                    </div>
                </div>


                <hr />
                <div class="table-responsive">
                    <table className='table table-sm '>
                        <thead>
                            <tr>
                                <th>Espacio</th>
                                {instanciasCohorte.length != 0 && instanciasCohorte.map((i, index) => (
                                    <th key={index} className="text-center align-middle">
                                        <div className="mb-1">{i.nombre_instancia}{i.id_instancia}</div>
                                        <Link 
                                            to={`/ImprimirBoletin/${userId}/${i.id_cohorte}?instancia=${i.id}`}
                                            className="btn btn-sm btn-outline-primary"
                                            target="_blank"
                                            title="Ver Boletín"
                                        >
                                            <i className="fa-solid fa-print"></i>
                                        </Link>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {cursoParticipa.length != 0 && cursoParticipa.map((c, i) => (
                                <tr key={i}>
                                    <td>{c.nombre_espacio && c.nombre_espacio.toLowerCase().includes('años')
                                        ? 'Sala'
                                        : c.nombre_espacio?.toLowerCase() || ''}</td>
                                    {instanciasCohorte.length != 0 && instanciasCohorte.map((inst, index) => {
                                        const calificacion = (valoraciones || []).find(
                                            (v) =>
                                                v.id_instancia === inst.id && v.id_usuario == userId && v.id_curso === c.id
                                        );
                                        return (
                                            <td key={index}>
                                                {calificacion && calificacion.estado_aprobacion === 'publicada' && (calificacion.valor > 0 || calificacion.valor !== '') ? <strong className='btn btn-sm btn-outline-secondary'>{calificacion.valor}</strong> : '-'}
                                                {calificacion && calificacion.estado_aprobacion === 'publicada' && calificacion.observacion !== '' &&
                                                    <button
                                                        type='button'
                                                        className='btn btn-sm btn-outline-secondary ms-1'
                                                        onClick={() => alert(calificacion.observacion)}
                                                    >
                                                        <i className="fa-regular fa-file-lines"></i>
                                                    </button>
                                                }
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Calificaciones;
