import './css/Aulas.css';
import React, { useState, useEffect } from 'react';
import { useRef } from "react";
import {QRCodeSVG} from 'qrcode.react'; // Importa la biblioteca QR Code

import { useParams, useNavigate } from "react-router-dom";
import CursoGrupoEstudiantes from './CursoGrupoEstudiantes';
import CursoEquipoDocente from './CursoEquipoDocente';
import useCursoData from '../../hooks/useCursoData';
import CONFIG from '../../config';
import { set } from 'firebase/database';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';

const URL_PLATAFORMA =`${CONFIG.BASE_URL}`;
const URL_CURSOS = `${CONFIG.API_URL}/operarCursos.php`;
const URL_CURSOS_GRUPOS = `${CONFIG.API_URL}/operarCursoGrupo.php`;

function Curso({ acceder, rol, configuracion }) {
    const { cursoId } = useParams();
    const navigate = useNavigate();
    const [verInfo, setVerInfo] = useState('Docentes');
    const { curso, docentesCurso, estudiantesCurso, inscripciones } = useCursoData(cursoId);
    const [cantidadEstudiantes, setCantidadEstudiantes] = useState(0);
    const [cantidadDocentes, setCantidadDocentes] = useState(0);
    const [editarDenominacion, setEditarDenominacion] = useState(false);
    const [cdenominacion, setCdenominacion] = useState(curso?.denominacion || '');
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [fileSeleccionado, setFileSeleccionado] = useState(null);

    const handleBack = () => {
        const searchState = JSON.parse(localStorage.getItem('searchState'));
        if (searchState) {
            localStorage.removeItem('searchState');
            console.log(searchState);
            navigate('/Cursos', { state: searchState });
        } else {
            navigate('/');
        }
    };
    let cantidadE=estudiantesCurso.length;
    let cantidadD=docentesCurso.length;
    useEffect(() => {
        if (!acceder) {
            localStorage.clear();
            navigate('/');
            return;
        }
        //console.log('curso: ', cursoId);
        if (rol === null || (rol > 4 && rol != 9 && rol != "9")) {
            navigate("/");
            return;
        }
       
        setCantidadEstudiantes(cantidadE);
        setCantidadDocentes(cantidadD);
    
    }, [acceder, rol, cantidadE]);

    useEffect(() => {
        if (curso) {
            setCdenominacion(curso.denominacion || '');
        }
    }, [curso]);

    
    if (!curso) {
        return <div className='container-principal'>Cargando...</div>; // Manejo de estado de carga
    }

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

    const c = curso; // Dado que ahora `curso` es un objeto
    //console.log('curso c:', c);
    

   const guardarNomberGrupo = (idCursoGrupo, denominacion) => {
        // Aquí deberías implementar la lógica para guardar el nuevo nombre del grupo
        const data={'modo':'Cambiar_denominacion_grupo',
        'id_curso_grupo': idCursoGrupo,
        'denominacion': denominacion}
        // Probablemente necesites hacer una solicitud a tu API para actualizar el nombre en la base de datos
        axios.post(URL_CURSOS, data)
        .then(res => {
            const [tipo, msj] = res.data;
            show_alerta(msj, tipo);
        })
        .catch(err => {
            console.error('Error al cambiar la denominación del grupo:', err);
            show_alerta('Error al cambiar la denominación del grupo', 'error');
        });
        setEditarDenominacion(false);
    };

    const entrarEnCurso =(cur)=>{
        localStorage.setItem('loggeduserCurso', cur.id );
        localStorage.setItem('loggeduserCursoGrupo',  cur.id_curso_grupo);
        localStorage.setItem('loggeduserCursoGrupoO',  JSON.stringify(cur));
        navigate(`/MC/${cur.id}/c`);
    }

    //control de la imagen de portada
    const handleClick = () => {
        fileInputRef.current.click(); // abre el selector
    };


    const handleChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validar que sea imagen
        if (!file.type.startsWith("image/")) {
        alert("Solo se permiten imágenes");
        return;
        }
        setFileSeleccionado(file); // GUARDAR EL ARCHIVO
        setPreview(URL.createObjectURL(file));

    };
    const handleUpload = async (e) => {
       if (!fileSeleccionado) return;

        const formData = new FormData();
        formData.append("imagen", fileSeleccionado);
        formData.append("id_curso_grupo", c.id_curso_grupo); // o el identificador que uses

        try {
            // Ejemplo con fetch (podés usar axios también)
            const respuesta = await axios.post(URL_CURSOS_GRUPOS, formData);
            console.log('respuesta:', respuesta.data);
            if(respuesta.data.success){
                show_alerta('Imagen actualizada', 'success');
            }else{
                
                show_alerta('Error al actualizar la imagen'+respuesta.data.error, 'error');
            }
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        } catch (error) {
            console.error(error);
            show_alerta('Error al subir la imagen', 'error');
        }
    };

    return (
        <div className='container-principal'>
            <div className='row'>
                <div className='col-12 col-sm-1'>
                    <button type='button' className='btn btn-outline-secondary btn-sm mb-3' onClick={handleBack}>
                        <i className="fa-solid fa-angles-left"></i> Volver
                    </button>    
                </div>
                <div className='col-12 col-sm-11'>
                    <h4>
                        {mostrarNombre(c.orden)} - {c.nombre} cohorte {c.cohorte} 
                        <h3 className='d-flex'>
                        grupo: 
                            {!editarDenominacion?
                            <>
                                {cdenominacion} 
                                <button type="button" className="btn btn-outline-warning btn-sm mx-1" onClick={()=>setEditarDenominacion(true)}>
                                    <i className="fa-solid fa-pencil"></i>
                                </button>
                            </>
                            :
                            <>
                                <input type="text" className='cursoInputEditarDenominacion' value={cdenominacion} onChange={(e) => setCdenominacion(e.target.value)} />
                                <button type='button' className='btn btn-sm btn-primary ms-1' onClick={()=>guardarNomberGrupo(c.id_curso_grupo, cdenominacion)}><i className='fa-solid fa-floppy-disk'></i> Guardar</button> 
                            </>
                            }
                        </h3>
                        <span className={` ms-1 small1 text-${c.estado === 'Abierto' ? 'success' : 'warning'}`}>
                            <i className={`small1 fa-solid fa-lock${c.estado === 'Abierto' ? '-open' : ''} mr-3`}></i> curso {c.estado}
                        </span>
                    </h4>
                </div>
                <div className={`alert alert-${inscripciones ? 'info' : 'danger'} me-2`} role='alert'>
                    <div className='row align-items-center'>
                        <div className='col-12 col-md-auto text-center text-md-start'>
                            {/*Primero analiso las tres imagens por orden gerarquico sin no esta imagen_grupo_curso miro imagen si no esta miro imagen_general sino esta pongo la imagen por defecto */}
                            {preview? 
                            <>
                                <img src={preview} width="200px" />
                                <div className='alert alert-danger mt-1 text-center' role='alert'>
                                    <div>¿Desea subir la imagen?</div>
                                    <button type='button' className='btn btn-sm btn-primary ms-2' onClick={handleUpload}>
                                        <i className='fa-solid fa-cloud-upload-alt'></i> Subir
                                    </button>
                                    <button 
                                    type='button' 
                                    className='btn btn-sm btn-secondary ms-2' 
                                    onClick={() => {
                                        setPreview(null);
                                        setFileSeleccionado(null);
                                        if (fileInputRef.current) {
                                        fileInputRef.current.value = null;
                                        }
                                    }}
                                    >
                                        <i className='fa-solid fa-xmark'></i> Cancelar
                                    </button>
                                </div>
                            </>
                            :
                            <img 
                            src={`${CONFIG.API_URL}/${
                                c.imagen_grupo_curso?.trim() || 
                                c.imagen?.trim() || 
                                c.imagen_general?.trim() || 
                                'uploads/espacios/sin_imagen.png'
                            }`} 
                            className='img-fluid rounded-4'
                            style={{ maxWidth: '150px' }}
                            />
                            }
                            {!preview && 
                            <>
                            {/* Botón edita portada */}
                                <button onClick={handleClick} className="btn btn-sm btn-success mt-2 d-inline-block d-md-block w-100">
                                   <i className='fa-solid fa-edit'></i> Cambiar portada
                                </button>

                                {/* Input oculto */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleChange}
                                    style={{ display: "none" }}
                                />
                            </>
                            }
                        </div>
                        <div className='col-12 col-md text-center text-md-start mt-3 mt-md-0'>
                                <span>Periodo de inscripción desde <b>{c.fecha_inicio}</b> hasta <b>{c.fecha_fin}</b></span>
                            <h6 className={`text-${inscripciones ? 'success' : 'danger'} mt-2`}>
                                Inscripciones al curso {inscripciones ? <>abiertas hasta {c.fecha_fin}</> : 'cerradas'}
                            </h6>
                        </div>
                        <div className='col-12 col-md-auto text-center mt-3 mt-md-0 d-flex flex-column gap-2'> 
                            <button 
                            className='btn btn-primary w-100' 
                            type='button' 
                            onClick={() => entrarEnCurso(c)}>
                                Ver clases
                            </button>
                            {(rol == 9 || rol == "9") && (
                            <button 
                            className='btn btn-info w-100 text-white' 
                            type='button' 
                            onClick={() => {
                                localStorage.setItem('loggeduserCurso', c.id);
                                localStorage.setItem('loggeduserCursoGrupo', c.id_curso_grupo);
                                localStorage.setItem('loggeduserCursoGrupoO', JSON.stringify(c));
                                navigate(`/MC/${c.id}/e`);
                            }}>
                                <i className="fa-solid fa-chart-line"></i> Trayectorias
                            </button>
                            )}
                        </div>
                        <div className='col-12 col-md-auto text-center mt-3 mt-md-0'>
                            
                            {c.codigo_inscripcion && 
                            <div>
                                <h6 className='d-flex justify-content-center'>Codigo de inscripción</h6> 
                                <div className='d-flex justify-content-center' ><QRCodeSVG value={`${URL_PLATAFORMA}Inscripcion/${c.codigo_inscripcion}`} size={128} /></div>
                            </div>
                            }
                        </div>
                    </div>
                </div>
                <ul className="nav nav-tabs my-2">
                    <li className="nav-item">
                        <a className={`nav-link ${verInfo === 'Docentes' ? 'active' : ''}`} aria-current="page" href="#" onClick={() => setVerInfo('Docentes')}>Docentes <span className="badge text-bg-light">{docentesCurso.length}</span></a>
                    </li>
                    <li className="nav-item">
                        <a className={`nav-link ${verInfo === 'Estudiantes' ? 'active' : ''}`} aria-current="page" href="#" onClick={() => setVerInfo('Estudiantes')}>Estudiantes <span className="badge text-bg-light">{cantidadEstudiantes}</span></a>
                    </li>
                </ul>

                {verInfo === 'Docentes' &&
                    <div className='row'>
                        <CursoEquipoDocente id_curso_grupo={c.id_curso_grupo} cantidadDocentes={cantidadDocentes} setCantidadDocentes={setCantidadDocentes} configuracion={configuracion} />
                    </div>
                }
                {verInfo === 'Estudiantes' &&
                    <div className='row'>
                       {c.dictado==='Estudiantes' && <CursoGrupoEstudiantes id_curso_grupo={c.id_curso_grupo} cantidadEstudiantes={cantidadEstudiantes} setCantidadEstudiantes={setCantidadEstudiantes} configuracion={configuracion} />}
                    </div>
                }
            </div>
        </div>
    );
}

export default Curso;
