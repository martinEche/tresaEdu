
import './css/Cursos.css';
import React, { useEffect, useState } from 'react';
import { useLocation } from "react-router-dom";
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import { useNavigate } from "react-router-dom";

import Espera from '../Espera';
import FormNuevaCohorte from './FormNuevaCohorte';
import FormInscripciones from './FormInscripciones.js';
import CONFIG from '../../config';

const URL_formacion = `${CONFIG.API_URL}/operarFormacion.php`;
const URL = `${CONFIG.API_URL}/operarCursos.php`;

function Cursos({ acceder, rol, rolSelect }) {
    const fechaActual = new Date();

    const navigate = useNavigate();
    const location = useLocation();

    const [cursos, setCursos] = useState([]);
    const [formaciones, setFormaciones] = useState([]);
    const [verFormularioCohorte, setVerFormularioCohorte] = useState(false);

    const [año, setAño] = useState(0);
    const [buscar, setBuscar] = useState('');
    const [buscarNombre, setBuscarNombre] = useState('');
    const [visible, setVisible] = useState(false);

    const [paginaActual, setPaginaActual] = useState(1);
    const elementosPorPagina = 25;

    const [seleccionados, setSeleccionados] = useState([]);
    const [seleccionarTodoCheck, setSeleccionarTodoCheck] = useState(false);

    let resultado = [];

    // Función para obtener los datos
    const obtenerDatosCursos = async () => {
        try {
            await axios.get(URL)
                .then(res => {
                    if (!res.data.error) {
                        setCursos(res.data);
                    } else {
                        setCursos([]);
                    }
                })
                .catch(err => {
                    console.log(err)
                })
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if (acceder) {
            if ((rol === null) || (rol > 4)) {
                navigate("/");
            } else {
                obtenerDatosCursos();
                axios.get(URL_formacion)
                    .then(res => {
                        if (!res.data.error) {
                            setFormaciones(res.data);
                        } else {
                            setFormaciones([]);
                        }
                    })
                    .catch(err => {
                        console.log(err)
                    })
            }
        } else {
            localStorage.clear();
            rolSelect(null)
            navigate('/');
        }
    }, [acceder, rol, rolSelect, navigate]);

    useEffect(() => {
        const searchState = location.state || JSON.parse(localStorage.getItem('searchState'));
        if (searchState) {
            setBuscar(searchState.buscar);
            setAño(searchState.año);
            setPaginaActual(searchState.paginaActual);
            setSeleccionados(searchState.seleccionados);
            localStorage.removeItem('searchState');
        }
    }, [location.state]);

    const enviarFormData = (data) => {
        enviarSolicitud("POST", data);
    };

    const enviarSolicitud = (metodo, parametros) => {
        axios({ method: metodo, url: URL, data: parametros })
            .then(res => {
                var tipo = res.data[0];
                var msj = res.data[1];
                show_alerta(msj, tipo);
                if (tipo === 'success') {
                    setVerFormularioCohorte(false);
                    obtenerDatosCursos();
                }
            })
            .catch(err => {
                show_alerta('Error en la solicitud ', 'error');
                console.log(err);
            })
    }

    if (buscar) {
        resultado = cursos.filter((dato) => {
            if ((dato.id_formacion == buscar) && (dato.cohorte == año)) {
                return true;
            }
            return false;
        });
    }

    const indiceUltimoElemento = paginaActual * elementosPorPagina;
    const indicePrimerElemento = indiceUltimoElemento - elementosPorPagina;
    const cursosPaginados = resultado.slice(indicePrimerElemento, indiceUltimoElemento);
    const totalPaginas = Math.ceil(resultado.length / elementosPorPagina);

    const cambiarPagina = (numeroPagina) => {
        setPaginaActual(numeroPagina);
    };

    const seleccionarTodo = () => {
        if (seleccionarTodoCheck) {
            // Deseleccionar todos
            setSeleccionados([]);
        } else {
            // Seleccionar todos
            const todosSeleccionados = cursosPaginados.map(curso => curso.id);
            setSeleccionados(todosSeleccionados);
        }
        setSeleccionarTodoCheck(!seleccionarTodoCheck);
    };

    const manejarSeleccionIndividual = (id) => {
        if (seleccionados.includes(id)) {
            setSeleccionados(seleccionados.filter(seleccionado => seleccionado !== id));
        } else {
            setSeleccionados([...seleccionados, id]);
        }
    };

    const cambiarEstadoCursos = (estado) => {
        const data = {
            ids: seleccionados,
            estado: estado,
            modo: 'Cambiar_estado'
        };
        //console.log(seleccionados);
        axios.post(URL, data)
            .then(res => {
                //console.log(res);
                var tipo = res.data[0];
                var msj = res.data[1];
                show_alerta(msj, tipo);
                if (tipo === 'success') {
                    // Actualizar estado de cursos localmente
                    setCursos(cursos.map(curso =>
                        seleccionados.includes(curso.id) ? { ...curso, estado: estado } : curso
                    ));
                    setSeleccionados([]);
                    setSeleccionarTodoCheck(false);
                }
            })
            .catch(err => {
                show_alerta('Error en la solicitud', 'error');
                console.log(err);
            });
    };
    const handleSelect = (e) => {
        const selectedIndex = e.target.selectedIndex;
        const selectedOptionText = e.target.options[selectedIndex].text;
        setBuscar(e.target.value);
        setBuscarNombre(selectedOptionText)
        //console.log(selectedOptionText);
    }
    //funcion para hacer el boton de back y guardar la busqueda
    const handleNavigateToCurso = (id_curso_grupo) => {
        localStorage.setItem('searchState', JSON.stringify({
            buscar,
            año,
            paginaActual,
            seleccionados
        }));
        navigate(`/Cursos/${id_curso_grupo}`);
    };
    return (
        <div className='container-principal'>
            {!verFormularioCohorte ?
                <div>
                    <h3 className='titulo-cursos'>Cursos  <button type='button' className='btn btn-outline-success btn-sm ms-2' onClick={() => setVerFormularioCohorte(true)} ><i className="fa-solid fa-circle-plus"></i> Crear cohorte</button></h3>

                    <div className='row'>
                        <div className='col-6'>
                            <div className="input-group mb-3 me-2">
                                <span className="input-group-text" id="basic-addon1"><i className="fa-solid fa-magnifying-glass"></i></span>
                                <select className="form-select" name='formacion' onChange={(e) => handleSelect(e)}>
                                    <option>Seleccionar formación</option>
                                    {formaciones.map((f) => (
                                        <option key={f.id} value={f.id}>{f.nombre_formacion}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className='col-6'>
                            <select className='form-select' name='cohorte' onChange={(e) => setAño(e.target.value)}>
                                <option >Seleccionar año</option>
                                <option value={fechaActual.getFullYear().toString()}>{fechaActual.getFullYear().toString()}</option>
                                <option value={(fechaActual.getFullYear() - 1).toString()}>{(fechaActual.getFullYear() - 1).toString()}</option>
                                <option value={(fechaActual.getFullYear() + 1).toString()}>{(fechaActual.getFullYear() + 1).toString()}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        {buscar && <div className='texto-resultado'><i className="fa-solid fa-filter"></i> Mostrando {resultado.length} cursos de <span className='texto-resultado-nombre'>{buscarNombre} - cohorte {año == 0 ? 'sin seleccionar' : año} </span></div>}
                        <button type="button" className='btn btn-success btn-sm' data-bs-toggle="modal" data-bs-target="#exampleModal" disabled={resultado.length === 0}>
                            <i className="fa-regular fa-clock"></i> Establecer inicio y fin de inscripciones
                        </button>
                        <button type="button" className='btn btn-success btn-sm m-2' disabled={resultado.length === 0}> Cerrar todas las cursadas de la cohorte seleccionada </button>
                        {!visible ?
                            <div>
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th className="small" colSpan={5}>
                                                <div className="row g-3 align-items-center">
                                                    <div className="col-auto">
                                                        <input className="form-check-input" type="checkbox" checked={seleccionarTodoCheck} onChange={seleccionarTodo} />
                                                    </div>
                                                    <div className="col-auto">
                                                        <div className="dropdown">
                                                            <button className="btn btn-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" disabled={seleccionados.length === 0}>Acciones</button>
                                                            <ul className="dropdown-menu">
                                                                <li><a className="dropdown-item" href="#" onClick={() => cambiarEstadoCursos('Abierto')} >Abrir cursos seleccionados</a></li>
                                                                <li><a className="dropdown-item" href="#" onClick={() => cambiarEstadoCursos('Cerrado')} >Cerrar cursos seleccionados</a></li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </th>
                                            <th className="small1">Inicio inscripción</th>
                                            <th className="small1">Fin inscripción</th>
                                            <th className="small1">Docente/s</th>
                                            <th className="small1">inscripcion QR</th>
                                            <th className="small1">Acc.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cursosPaginados.map((c, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value={c.id}
                                                        checked={seleccionados.includes(c.id)}
                                                        onChange={() => manejarSeleccionIndividual(c.id)}
                                                    />
                                                </td>
                                                <td className="small1">
                                                    <span className={`text-${c.estado === 'Abierto' ? 'success' : 'warning'}`}>
                                                        <i className={`small1 fa-solid fa-lock${c.estado === 'Abierto' ? '-open' : ''} mr-3`}></i>
                                                    </span>
                                                </td>
                                                <td className="small1">{c.orden}°</td>
                                                <td className="small1">{c.denominacion}</td>
                                                <td className="small1">{c.nombre} ({c.espacio})</td>
                                                <td className="small1">{c.fecha_inicio}</td>
                                                <td className="small1">{c.fecha_fin}</td>
                                                <td className="small1"><i className="fa-solid fa-chalkboard-user"></i></td>
                                                <td className="small1"><i className="fa-solid fa-qrcode"></i>{c.codigo_inscripcion}</td>
                                                <td>
                                                    <button type='button' className='btn btn-outline-dark btn-sm' onClick={() => handleNavigateToCurso(c.id_curso_grupo)}><i className="fa-solid fa-gear"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {resultado.length > elementosPorPagina &&
                                    <nav aria-label="Page navigation example">
                                        <ul className="pagination">
                                            <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => cambiarPagina(paginaActual - 1)}>Previous</button>
                                            </li>
                                            {[...Array(totalPaginas).keys()].map(numero => (
                                                <li key={numero + 1} className={`page-item ${paginaActual === numero + 1 ? 'active' : ''}`}>
                                                    <button className="page-link" onClick={() => cambiarPagina(numero + 1)}>{numero + 1}</button>
                                                </li>
                                            ))}
                                            <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => cambiarPagina(paginaActual + 1)}>Next</button>
                                            </li>
                                        </ul>
                                    </nav>
                                }
                            </div>
                            : <div className='container m-3'><Espera visible={visible} /></div>}
                    </div>
                </div> :
                <div className="modal-body">
                    <FormNuevaCohorte enviarFormData={enviarFormData} setVerFormularioCohorte={setVerFormularioCohorte} />
                </div>
            }

            <div className="modal fade" id="exampleModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="exampleModalLabel">{buscarNombre} cohorte {año}</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <FormInscripciones enviarFormData={enviarFormData} idFormacion={buscar} cohorte={año} />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default Cursos;

