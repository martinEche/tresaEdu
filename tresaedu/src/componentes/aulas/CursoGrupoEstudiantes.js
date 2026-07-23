import './css/Aulas.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { show_alerta } from '../../funciones.js';
import PerfilLogo from '../usuarios/PerfilLogo.js';
import { asignarEstudianteAlCurso, quitarEstudianteAlCurso } from '../../servicios/cursoServicios';
import useCursoData from '../../hooks/useCursoData';
import CONFIG from '../../config';
import { Link } from 'react-router-dom';

const URL_LISTAR = `${CONFIG.API_URL}/listarUsuarios.php`;

function CursoGrupoEstudiantes({ id_curso_grupo, setCantidadEstudiantes, configuracion }) {
    const rol = sessionStorage.getItem('rol');
    const { estudiantesCurso, fetchEstudiantesCurso } = useCursoData(id_curso_grupo);
    const [estudiantes, setEstudiantes] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [buscar2, setBuscar2] = useState('');
    const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState([]);
    let filtroGrupoEstudiantes = [];
    let filtroEstudiantes = [];

    useEffect(() => {
        buscaEstudiantes()
    }, []);

    const buscaEstudiantes =()=>{
        axios.post(URL_LISTAR, { 'id_rol': 7, 'modo': 'buscaUsuariosPorRol' })
            .then(res => {
                if (!res.data.error) {
                    setEstudiantes(res.data);
                } else {
                    setEstudiantes([]);
                }
            })
            .catch(err => {
                console.log(err);
            });
    }
    
    function handleSubmint1(e) {
        e.preventDefault();
        if (estudiantesSeleccionados.length === 0) {
            show_alerta('No se seleccionaron estudiantes', 'error');
            return;
        }
        estudiantesSeleccionados.forEach(estudianteId => {
            const estudianteYaAsignado = estudiantesCurso.some(estudiante => estudiante.id === estudianteId);
            if (estudianteYaAsignado) {
                show_alerta('Estudiante ya está inscripto a este curso', 'error');
            } else {
                asignarEstudiante(id_curso_grupo, estudianteId);
            }
        });
    }
    //agrega el estudiante al curso-grupo
    const asignarEstudiante = async (curso, estudiante) => {
        const res = await asignarEstudianteAlCurso(curso, estudiante);
        //console.log("respuesta: " + JSON.stringify(res));
        var tipo = res.data[0];
        var msj = res.data[1];
        show_alerta(msj, tipo);
        if(tipo=='success'){
            document.getElementById('botonCerrarListaEstudiantes').click();
            fetchEstudiantesCurso();  // Llamada para actualizar los estudiantes del curso
        }
    }

    //quitar el estudiante del curso-grupo
    const quitarEstudiante = (id) =>{
        const MySwal= withReactContent(Swal); 
        MySwal.fire({
            title: '¿Seguro de quitar a el/la estudiante del curso y los cursos del mismo orden?',
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
        .then(res=>{
            if(res.isConfirmed){
                enviarSolicitud(id)
            }
        });
    }
    const enviarSolicitud = async (id)=>{
        const res = await quitarEstudianteAlCurso(id);
        //console.log("respuesta quitar: " + JSON.stringify(res));
        var tipo = res.data[0];
         var msj = res.data[1];
        show_alerta(msj, tipo);
        if(tipo=='success'){
            fetchEstudiantesCurso();  // Llamada para actualizar los estudiantes del curso
        }
    }

    // filtro1
    filtroGrupoEstudiantes = !buscar
        ? estudiantesCurso
        : estudiantesCurso.filter((dato) =>
            dato.id_curso_grupo.toLowerCase().includes(buscar.toLowerCase())
        );
    
    // filtro2
    filtroEstudiantes = !buscar2
        ? estudiantes
        : estudiantes.filter((dato) =>
            dato.nombre.toLowerCase().includes(buscar2.toLowerCase()) ||
            dato.apellido.toLowerCase().includes(buscar2.toLowerCase()) ||
            dato.documento.toString().toLowerCase().includes(buscar2.toLowerCase())
    );

    setCantidadEstudiantes(filtroGrupoEstudiantes.length);
    const handleSeleccionarEstudiante = (id) => {
        setEstudiantesSeleccionados(prev => {
            if (prev.includes(id)) {
                return prev.filter(estudianteId => estudianteId !== id); // Deseleccionar si ya está seleccionado
            } else {
                return [...prev, id]; // Agregar al array de seleccionados
            }
        });
    };

    return (
        <>
            <div>
                <div className='row border-bottom mb-2'>
                    <div className='col-8'>
                        <h5><i className="fa-solid fa-graduation-cap"></i> Estudiantes en el curso {filtroGrupoEstudiantes.length}</h5>
                    </div>
                    <div className='col-4 d-flex justify-content-end'>
                        <button type='button' className='btn btn-light btn-sm' data-bs-toggle="modal" data-bs-target="#modalAgregarEstudiantes"><i className="fa-solid fa-circle-plus"></i> estudiante</button>
                    </div>
                </div>
                <div className='mx-1'>
                    {Array.isArray(filtroGrupoEstudiantes) && filtroGrupoEstudiantes.length > 0 &&
                        filtroGrupoEstudiantes.map((ec) => (
                            <div key={ec.id} className='row border-bottom my-1'>
                                <div className='col-10'><PerfilLogo usuario={ec} version="extendida" configuracion={configuracion} /></div>
                                <div className='col-2 d-flex justify-content-end py-1'>
                                    {(rol == 9 || rol == "9") && (
                                        <Link to={`/VerPerfil/e/${ec.id_usuario || ec.id}`} className='btn btn-info btn-sm text-white mx-1' title='Ver Ficha de Estudiante'>
                                            <i className="fa-solid fa-address-card"></i>
                                        </Link>
                                    )}
                                    {rol != 2 && rol != 3 && rol != 4 && rol != 9 && rol != "9" && (
                                        <button type='button' className='btn btn-warning btn-sm' onClick={()=>quitarEstudiante(ec.id_estudiante_curso)}><i className="fa-solid fa-circle-minus"></i></button>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <div className="modal fade" id="modalAgregarEstudiantes" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="exampleModalLabel">
                                Estudiantes
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
                                    <form id="form1" onSubmit={handleSubmint1}>
                                        {filtroEstudiantes.map((d) => (
                                            <div key={d.id} className='mb-1'>
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    checked={estudiantesSeleccionados.includes(d.id)} // Mantener el checkbox seleccionado si está en estudiantesSeleccionados
                                                    onChange={() => handleSeleccionarEstudiante(d.id)} 
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
                                    {estudiantesSeleccionados.length <= 0 ? <div className='alert alert-info'>No hay estudiantes para agregar</div>
                                    :<h6>Seleccionados:</h6>}
                                    <div>
                                        {estudiantesSeleccionados.map(id => {
                                            const estudiante = estudiantes.find(e => e.id === id);
                                            return (
                                                <div key={id}>
                                                    {estudiante.apellido}, {estudiante.nombre}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" name='botonCerrar' id="botonCerrarListaEstudiantes" data-bs-dismiss="modal">Cerrar</button>
                            <button type="submit" form='form1' className='btn btn-success'>Aceptar seleccionados</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CursoGrupoEstudiantes;

