import './css/Aulas.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { show_alerta } from '../../funciones.js';
import PerfilLogo from '../usuarios/PerfilLogo.js';
import { asignarDocenteAlCurso, quitarDocenteAlCurso } from '../../servicios/cursoServicios';
import useCursoData from '../../hooks/useCursoData';
import CONFIG from '../../config';


const URL_CURSOS = `${CONFIG.API_URL}/operarCursos.php`;
const URL_LISTAR = `${CONFIG.API_URL}/listarUsuarios.php`;

function CursoEquipoDocente({ id_curso_grupo, cantidadDocentes, setCantidadDocentes, configuracion }) {
    const { docentesCurso, fetchDocentesCurso } = useCursoData(id_curso_grupo);
    const [docentes, setDocentes] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [buscar2, setBuscar2] = useState('');

    const [docentesSeleccionados, setDocentesSeleccionados] = useState([]);

    const [editandoId, setEditandoId] = useState(null);
    const [funcionEditada, setFuncionEditada] = useState("");

    let filtroGrupoDocentes = [];
    let filtroDocentes = [];

    useEffect(() => {
        buscarDocentes()
    }, [id_curso_grupo]);

    const buscarDocentes = () => {
        axios.post(URL_LISTAR, { 'id_rol': 6, 'modo': 'buscaUsuariosPorRol' })
            .then(res => {
                if (!res.data.error) {
                    setDocentes(res.data);
                } else {
                    setDocentes([]);
                }
            })
            .catch(err => {
                console.log(err);
                show_alerta('Error en la solicitud', 'error');
            });
    };

    const handleSubmint = async (e) => {
        e.preventDefault();
        if (docentesSeleccionados.length === 0) {
            show_alerta('No se seleccionaron docentes', 'error');
            return;
        }
        docentesSeleccionados.forEach(docenteId => {
            const docenteYaAsignado = docentesCurso.some(docente => docente.id === docenteId);
            if (docenteYaAsignado) {
                show_alerta('Docente ya está asignado a este curso', 'error');
            } else {
                asignarDocente(id_curso_grupo, docenteId);
            }
        });
    };

    //agrega el docente al curso-grupo
    const asignarDocente = async (curso, docente) => {
        const res = await asignarDocenteAlCurso(curso, docente);
        //console.log("respuesta: " + JSON.stringify(res));
        var tipo = res.data[0];
        var msj = res.data[1];
        show_alerta(msj, tipo);
        if (tipo == 'success') {
            document.getElementById('botonCerrarListaDocentes').click();
            fetchDocentesCurso();  // Llamada para actualizar los docentes del curso
        }
    }

    //quitar el docente del curso-grupo
    const quitarDocente = (id) => {
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Seguro de quitar a el/la docente del curso y los cursos del mismo orden?',
            icon: 'warning',
            html: '<span class=\"text-muted\"></span>',
            showCancelButton: true, confirmButtonText: '<i class="fa-solid fa-trash-can"></i> Si, eliminar', cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-danger mx-2 shadow-sm',
                cancelButton: 'btn btn-outline-secondary mx-2',
                popup: 'rounded-4 shadow'
            },
            buttonsStyling: false
        })
            .then(res => {
                if (res.isConfirmed) {
                    enviarSolicitud(id)
                }
            });
    }
    const enviarSolicitud = async (id) => {
        const res = await quitarDocenteAlCurso(id);
        //console.log("respuesta quitar: " + JSON.stringify(res));
        var tipo = res.data[0];
        var msj = res.data[1];
        show_alerta(msj, tipo);
        if (tipo == 'success') {
            fetchDocentesCurso();  // Llamada para actualizar los docentes del curso
        }
    }



    const filtroDocente = buscar
        ? docentes.filter((dato) =>
            dato.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
            dato.apellido.toLowerCase().includes(buscar.toLowerCase()) ||
            dato.documento.toString().toLowerCase().includes(buscar.toLowerCase())
        )
        : docentes;

    // filtro1
    filtroGrupoDocentes = !buscar
        ? docentesCurso
        : docentesCurso.filter((dato) =>
            dato.id_curso_grupo.toLowerCase().includes(buscar.toLowerCase())
        );

    // filtro2
    filtroDocentes = !buscar2
        ? docentes
        : docentes.filter((dato) =>
            dato.nombre.toLowerCase().includes(buscar2.toLowerCase()) ||
            dato.apellido.toLowerCase().includes(buscar2.toLowerCase()) ||
            dato.documento.toString().toLowerCase().includes(buscar2.toLowerCase())
        );

    useEffect(() => {
        setCantidadDocentes(filtroGrupoDocentes.length);
    }, [filtroGrupoDocentes]);

    const handleSeleccionarDocente = (id) => {
        setDocentesSeleccionados(prev => {
            if (prev.includes(id)) {
                return prev.filter(docenteId => docenteId !== id); // Deseleccionar si ya está seleccionado
            } else {
                return [...prev, id]; // Agregar al array de seleccionados
            }
        });
    };

    const iniciarEdicion = (ec) => {
        setEditandoId(ec.id_curso_equipo_docente);
        setFuncionEditada(ec.funcion || "");
    };

    const guardarFuncion = async (id) => {
        try {
            const res = await axios.post(URL_CURSOS, {
                accion: 'editarFuncion',
                id_curso_equipo_docente: id,
                funcion: funcionEditada
            });
            console.log("respuesta editar funcion: " + JSON.stringify(res));
            if (res.data.success) {
                fetchDocentesCurso(); // ✅ SOLUCIÓN
            } else {
                alert("Error al guardar");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setEditandoId(null);
            setFuncionEditada("");
        }
    };

    return (
        <>
            <div>
                <div className='row border-bottom mb-2'>
                    <div className='col-8'>
                        <h5><i className="fa-solid fa-graduation-cap"></i> Docentes en el curso {filtroGrupoDocentes.length}</h5>
                    </div>
                    <div className='col-4 d-flex justify-content-end'>
                        <button type='button' className='btn btn-light btn-sm' data-bs-toggle="modal" data-bs-target="#modalAgregarDocentes"><i className="fa-solid fa-circle-plus"></i> docente</button>
                    </div>
                </div>

                <div className='mx-1'>
                    {Array.isArray(filtroGrupoDocentes) && filtroGrupoDocentes.map((ec) => (
                        <div key={ec.id} className='row border-bottom my-2 align-items-center pb-2'>
                            <div className='col-12 col-md-4 mb-2 mb-md-0'>
                                <PerfilLogo usuario={ec} version="extendida" configuracion={configuracion} />
                            </div>
                            <div className='col-12 col-md-5 d-flex align-items-center mb-2 mb-md-0'>
                                {editandoId === ec.id_curso_equipo_docente ? (
                                    <div className="input-group input-group-sm">
                                        <input
                                            type="text"
                                            className='form-control'
                                            value={funcionEditada}
                                            autoFocus
                                            placeholder="Ej: Profesor titular..."
                                            onChange={(e) => setFuncionEditada(e.target.value)}
                                            onBlur={() => guardarFuncion(ec.id_curso_equipo_docente)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    guardarFuncion(ec.id_curso_equipo_docente);
                                                }
                                                if (e.key === 'Escape') {
                                                    setEditandoId(null);
                                                }
                                            }}
                                        />
                                        <button className="btn btn-primary" type="button" onClick={() => guardarFuncion(ec.id_curso_equipo_docente)}><i className="fa-solid fa-check"></i></button>
                                    </div>
                                ) : (
                                    <span
                                        className={`badge ${ec.funcion ? 'bg-info text-dark' : 'bg-light text-secondary border'} fw-normal`}
                                        style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                                        onClick={() => iniciarEdicion(ec)}
                                        title="Click para editar la función"
                                    >
                                        {ec.funcion || 'Definir función'} <i className="fa-solid fa-pencil ms-1 opacity-50"></i>
                                    </span>
                                )}
                            </div>
                            <div className='col-12 col-md-3 d-flex justify-content-md-end py-1'>
                                <button
                                    type='button'
                                    className='btn btn-outline-danger btn-sm'
                                    onClick={() => quitarDocente(ec.id_curso_equipo_docente)}
                                >
                                    <i className="fa-solid fa-circle-minus"></i> Quitar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="modal fade" id="modalAgregarDocentes" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="exampleModalLabel">
                                Docentes
                                <div className="input-group ">
                                    <span className="input-group-text" id="basic-addon1"><i className="fa-solid fa-magnifying-glass"></i></span>
                                    <input type="text" className="form-control" id='buscar' name='buscar' value={buscar2} onChange={(e) => setBuscar2(e.target.value)} placeholder='buscar...' aria-label='buscar' aria-describedby='basic-addon1' />
                                </div>
                            </h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-8">
                                    <form id="form1" onSubmit={handleSubmint}>
                                        {filtroDocentes.map((d) => (
                                            <div key={d.id} className='mb-1'>
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={docentesSeleccionados.includes(d.id)} // Mantener el checkbox seleccionado si está en docentesSeleccionados
                                                    onChange={() => handleSeleccionarDocente(d.id)}
                                                    id={`chek_${d.id}`}
                                                    value={d.id}
                                                />
                                                <label className="form-check-label mx-1 small" htmlFor={`chek_${d.id}`}>
                                                    {d.apellido}, {d.nombre} ({d.documento})
                                                </label>
                                            </div>
                                        ))}
                                    </form>
                                </div>
                                <div className="col-4">
                                    {docentesSeleccionados.length <= 0 ? <div className='alert alert-info'>No hay docentes para agregar</div>
                                        : <h6>Seleccionados:</h6>}
                                    <div>
                                        {docentesSeleccionados.map(id => {
                                            const docente = docentes.find(d => d.id === id);
                                            return (
                                                <div key={id}>
                                                    {docente.apellido}, {docente.nombre}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" name='botonCerrar' id="botonCerrarListaDocentes" data-bs-dismiss="modal">Cerrar</button>
                            <button type="submit" form='form1' className='btn btn-success'>Aceptar seleccionados</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CursoEquipoDocente;
