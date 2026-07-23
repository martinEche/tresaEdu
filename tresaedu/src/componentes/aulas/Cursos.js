import './css/Cursos.css';
import React, { useEffect, useState } from 'react';
import { useLocation } from "react-router-dom";
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from 'qrcode.react'; // Importa la biblioteca QR Code

import Espera from '../Espera';
import FormNuevaCohorte from './FormNuevaCohorte';
import FormInscripciones from './FormInscripciones.js';
import CONFIG from '../../config';

const URL_formacion = `${CONFIG.API_URL}/operarFormacion.php`;
const URL_COHORTES = `${CONFIG.API_URL}/operarCohortes.php`;
const URL_CURSOS = `${CONFIG.API_URL}/operarCursos.php`;
const URL_DOCENTES_COHORTES = `${CONFIG.API_URL}/operarDocentesCohortes.php`;
const URL_PLATAFORMA = `${CONFIG.BASE_URL}`;

function Cursos({ acceder, rol, rolSelect }) {
    const fechaActual = new Date();
    const navigate = useNavigate();
    const location = useLocation();

    const [cursos, setCursos] = useState([]);
    const [instancias, setInstancias] = useState([]);

    const [formaciones, setFormaciones] = useState([]);
    const [cohotesCreadas, setCohortesCreadas] = useState([]);

    const [verFormularioCohorte, setVerFormularioCohorte] = useState(false);
    const [verFormularioEdicionCohorte, setVerFormularioEdicionCohorte] = useState(false);
    const [año, setAño] = useState(0);
    const [buscar, setBuscar] = useState('');
    const [buscarNombre, setBuscarNombre] = useState('');
    const [visible, setVisible] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const elementosPorPagina = 25;
    const [seleccionados, setSeleccionados] = useState([]);
    const [seleccionarTodoCheck, setSeleccionarTodoCheck] = useState(false);
    const [qrCode, setQrCode] = useState(''); // Estado para el contenido del QR Code


    const [nombreInstancia, setNombreInstancia] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [tipoCalificacion, setTipoCalificacion] = useState('');
    const [modoEditar, setModoEditar] = useState(false);
    const [instanciaIndex, setInstanciaIndex] = useState(null);

    const [resultado, setResultado] = useState([]);
    const [instanciasCohorte, setInstanciasCohorte] = useState([]);

    const [ordenSeleccionado, setOrdenSeleccionado] = useState('todos'); // Estado para el filtro de orden

    const [dropdownOpen, setDropdownOpen] = useState(false);

    let resultadoAux = [];
    let instanciasCohorteAux = [];
    let cursosFiltrado = [];

    const obtenerDatosCursos = async () => {
        try {
            await axios.get(URL_CURSOS)
                .then(res => {
                    console.log('cursos', res.data);
                    if (!res.data.error) {
                        setCursos(res.data[0]);
                        setInstancias(res.data[1]);
                    } else {
                        setCursos([]);
                        setInstancias([]);
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
            if ((rol === null) || (rol > 4 && rol != 9 && rol != "9")) {
                navigate("/");
            } else {
                obtenerDatosCursos();
                axios.get(URL_formacion)
                    .then(res => {
                        console.log('formacion:', res.data);
                        if (!res.data.error) {
                            setFormaciones(res.data);
                        } else {
                            setFormaciones([]);
                        }
                    })
                    .catch(err => {
                        console.log(err)
                    })
                axios.get(`${URL_COHORTES}?accion=años`)
                    .then(res => {
                        console.log('datoas:' + JSON.stringify(res.data))
                        if (!res.data.error) {
                            setCohortesCreadas(res.data.cohortes);
                        } else {
                            setCohortesCreadas([]);
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
    }, [acceder, rol, navigate]);

    useEffect(() => {
        const searchState = location.state || JSON.parse(localStorage.getItem('searchState'));
        if (searchState) {
            setCursos(JSON.parse(searchState.cursos));  // Asegura que 'cursos' sea un array
            setBuscar(searchState.buscar);
            setAño(searchState.año);
            setPaginaActual(searchState.paginaActual);
            setSeleccionados(searchState.seleccionados);
            //filtrar(searchState.buscar, 'formacion');
            localStorage.removeItem('searchState');
        }
    }, [location.state]);  // location.state como dependencia

    //efecto para cuando cursos se actualiza
    useEffect(() => {
        if (Array.isArray(cursos) && cursos.length > 0) {
            filtrar(buscar, 'formacion');
        }
    }, [cursos]); // Este efecto solo se ejecuta cuando cursos cambia

    const enviarFormData = (data) => {
        //console.log('url'+URL)
        enviarSolicitud("POST", data);
    };


    const enviarSolicitud = (metodo, parametros) => {
        //console.log('url'+URL)
        axios({ method: metodo, url: URL_CURSOS, data: parametros })
            .then(res => {
                console.log("respuesta crear cohorte: " + res.data)
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

    const indiceUltimoElemento = paginaActual * elementosPorPagina;
    const indicePrimerElemento = indiceUltimoElemento - elementosPorPagina;
    //const cursosPaginados = resultado.slice(indicePrimerElemento, indiceUltimoElemento);
    //const totalPaginas = Math.ceil(resultado.length / elementosPorPagina);

    const resultadoFiltradoPorOrden =
        ordenSeleccionado === 'todos'
            ? resultado
            : resultado.filter(c => c.orden === ordenSeleccionado);

    const cursosPaginados = resultadoFiltradoPorOrden.slice(
        indicePrimerElemento,
        indiceUltimoElemento
    );

    const totalPaginas = Math.ceil(
        resultadoFiltradoPorOrden.length / elementosPorPagina
    );


    const cambiarPagina = (numeroPagina) => {
        setPaginaActual(numeroPagina);
    };

    const seleccionarTodo = () => {
        if (seleccionarTodoCheck) {
            setSeleccionados([]);
        } else {
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
        axios.post(URL_CURSOS, data)
            .then(res => {

                var tipo = res.data[0];
                var msj = res.data[1];
                show_alerta(msj, tipo);
                if (tipo === 'success') {

                    setCursos(cursos.map(curso =>
                        seleccionados.includes(curso.id) ? { ...curso, estado: estado } : curso
                    ));
                    filtroGeneral(cursos.map(curso =>
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

    const handleSelect = (e, llamo) => {
        const selectedIndex = e.target.selectedIndex;
        const selectedOptionText = e.target.options[selectedIndex].text;
        // console.log('llamo:'+llamo)
        if (llamo === "formacion") {
            setBuscar(e.target.value);
            setBuscarNombre(selectedOptionText);
            //console.log('entro en formacion');
        }
        if (llamo === "cohorte") {
            setAño(e.target.value);
            //console.log('entro en cohorte');
        }
        filtrar(e.target.value, llamo);
    }

    const filtroGeneral = (cursosAux) => {
        let filtroFormacion = buscar;
        let filtroAño = año;
        // console.log('buscar:'+buscar);
        //  console.log('año: '+año);

        resultadoAux = cursosAux.filter((dato) => {
            if ((dato.id_formacion == filtroFormacion) && (dato.cohorte == filtroAño)) {
                return true;
            }
            return false;
        });
        // console.log('cursos: '+JSON.stringify(resultadoAux))
        const idCursoRastreador = {};
        for (const curso of resultadoAux) {
            if (!idCursoRastreador[curso.id]) {
                idCursoRastreador[curso.id] = true;
                cursosFiltrado.push(curso);
            }
        }
        // console.log('cursos: '+JSON.stringify(resultadoAux))
        setResultado(resultadoAux);

    };

    const filtrar = (valor, llamo) => {
        let filtroFormacion = buscar;
        let filtroAño = año;

        if (llamo === "formacion") {
            filtroFormacion = valor;
        }
        if (llamo === "cohorte") {
            filtroAño = valor;
        }
        // console.log("cursos: "+JSON.stringify(cursos)) ;
        if (Array.isArray(cursos) && cursos.length > 0) {
            // console.log('entro en array, formacion:'+filtroFormacion);
            // console.log('y año:'+filtroAño);

            instanciasCohorteAux = instancias.filter((dato) => {
                if ((dato.id_formacion == filtroFormacion) && (dato.cohorte == filtroAño)) {
                    return true;
                }
                return false;
            });
            //console.log('busco instanciasCohorte: '+JSON.stringify(instanciasCohorteAux))
            setInstanciasCohorte(instanciasCohorteAux);

            resultadoAux = cursos.filter((dato) => {
                if ((dato.id_formacion == filtroFormacion) && (dato.cohorte == filtroAño)) {
                    return true;
                }
                return false;
            });
            //console.log('cursos: '+JSON.stringify(resultadoAux))
            const idCursoRastreador = {};
            for (const curso of resultadoAux) {
                if (!idCursoRastreador[curso.id]) {
                    idCursoRastreador[curso.id] = true;
                    cursosFiltrado.push(curso);
                }
            }
            setResultado(resultadoAux);
        }
    }


    const handleNavigateToCurso = (id_curso_grupo) => {
        localStorage.setItem('searchState', JSON.stringify({
            buscar,
            año,
            cursos: JSON.stringify(cursos),  // Almacenar como string JSON
            paginaActual,
            seleccionados
        }));
        navigate(`/Cursos/${id_curso_grupo}`);
    };

    const generarQRCode = async (id_curso_grupo) => {
        const data = {
            id_curso_grupo: id_curso_grupo,
            modo: 'generarCodigoInscripcion'
        };
        try {
            const res = await axios.post(URL_CURSOS, data)
            const [tipo, msj, codigo] = res.data;
            if (tipo === 'success') {
                obtenerDatosCursos();
                setQrCode(codigo)
            }
        } catch (err) {
            //show_alerta('Error en la solicitud', 'error');
            console.log(err);
        }
    };

    //editar y agregar grupos al curso de la cohorte  seleccionada
    const handleAgregarGrupos = async (event) => {
        event.preventDefault();
        const cursoId = document.getElementById('curso').value;
        const cantidadGrupos = document.getElementById('cantidadGrupos').value;

        const dato = {
            'id_curso': cursoId,
            'cantidad': cantidadGrupos,
            'nuevo': 'AgregarGrupos'
        };

        //console.log('data: '+JSON.stringify(dato));
        try {
            const res = await axios.post(URL_CURSOS, dato)
            //console.log(res.data);
            const [tipo, msj] = res.data;
            show_alerta(msj, tipo);
            if (tipo === 'success') {
                obtenerDatosCursos();
                document.getElementById('curso').value = '';
                document.getElementById('cantidadGrupos').value = '';
                document.getElementById('btn-cerrar-agregar-grupos').click();
            }
        } catch (err) {
            // show_alerta('Error en la solicitud', 'error');
            console.log(err);
        }
    };

    //editar y agregar grupos al curso de la cohorte  seleccionada
    const handleAgregarInstancias = async (event) => {
        event.preventDefault();

        const dato = {
            'id_formacion': buscar,
            'cohorte_año': año,
            'arreglo_instancias': instanciasCohorte,
            'nuevo': 'AgregarInstancias'
        };

        // console.log('data: '+JSON.stringify(dato));
        try {
            const res = await axios.post(URL_CURSOS, dato)
            // console.log(res.data);
            const [tipo, msj] = res.data;
            show_alerta(msj, tipo);
            if (tipo === 'success') {
                obtenerDatosCursos();
                //								document.getElementById('curso').value = '';
                //								document.getElementById('cantidadGrupos').value = '';
                document.getElementById('btn-cerrar-agregar-instancias').click();
            }
        } catch (err) {
            show_alerta('Error en la solicitud', 'error');
        }
    };

    //elimina Grupo 
    const eliminarGrupo = (id) => {
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Seguro de eliminar el grupo?',
            icon: 'warning',
            html: '<span class=\"text-muted\">Se eliminaran todos clases, estudiantes y docentes del grupo y No se podrá dar marcha atrás</span>',
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
                    enviarSolicitud('DELETE', { 'id': id, tabla: 'curso_grupo' })
                    obtenerDatosCursos();
                }
            });
    };

    //metodo agregar instancia
    const agregarInstancia = () => {
        // Crear un nuevo objeto con los valores
        const nuevaInstancia = {
            id: '',
            nombre: nombreInstancia,
            fechaDesde: fechaDesde,
            fechaHasta: fechaHasta,
            id_cohorte: '',
            tipoCalificacion: tipoCalificacion,
            cohorte: año,
            id_formacion: buscar,
        };
        // Copiar el arreglo existente de instancias
        //const nuevasInstancias = [...instanciasCohorte, nuevaInstancia];
        // Agregar el nuevo objeto al arreglo
        //nuevasInstancias.push(nuevaInstancia);
        // Actualizar el estado con el nuevo arreglo
        instanciasCohorte.push(nuevaInstancia);
        // console.log('instanciasCohorte: '+JSON.stringify(instanciasCohorte))
        // Limpiar los valores de los inputs
        setNombreInstancia('');
        setFechaDesde('');
        setFechaHasta('');
        setTipoCalificacion('');
    };
    //metodo editar instancia
    const editarInstancia = (index) => {
        setModoEditar(true);
        const instanciaAEditar = instanciasCohorte[index];
        console.log(instanciaAEditar);
        setNombreInstancia(instanciaAEditar.nombre);
        setFechaDesde(instanciaAEditar.fechaDesde);
        setFechaHasta(instanciaAEditar.fechaHasta);
        setTipoCalificacion(instanciaAEditar.tipoCalificacion);
        setInstanciaIndex(index);
    };
    //metodo cancelar edicion
    const cancelarEdicion = () => {
        setModoEditar(false);
        setNombreInstancia('');
        setFechaDesde('');
        setFechaHasta('');
        setTipoCalificacion('');
    };

    //metodo para actualizar la instancia editada
    const actualizarInstancia = () => {
        // Copiar el arreglo existente de instancias
        const nuevasInstancias = [...instanciasCohorte];
        // Actualizar la instancia correspondiente
        nuevasInstancias.splice(instanciaIndex, 1, {
            nombre: nombreInstancia,
            fechaDesde: fechaDesde,
            fechaHasta: fechaHasta,
            tipoCalificacion: tipoCalificacion,
        });
        // Actualizar el estado con el nuevo arreglo
        setInstanciasCohorte(nuevasInstancias);
        // Limpiar los valores de los inputs
        setNombreInstancia('');
        setFechaDesde('');
        setFechaHasta('');
        setTipoCalificacion('');
        setModoEditar(false);
    };

    //metodo eliminar instancia   
    const eliminarInstancia = (index) => {
        // Copiar el arreglo existente de instancias
        const nuevasInstancias = [...instanciasCohorte];
        // Eliminar la instancia correspondiente
        nuevasInstancias.splice(index, 1);
        // Actualizar el estado con el nuevo arreglo
        instanciasCohorte = [...nuevasInstancias];
    };

    //repetir los docentes de la cohorte anterior
    const repetirDocentesCohorteAnterior = async () => {
        //armar data
        const data = {
            'id_formacion': buscar,
            'cohorte_año': año,
            'nuevo': 'RepetirDocentesCohorteAnterior'
        };
        //preguntar con swal si quiere repetir los docentes si pone no no hacer nada
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Seguro de repetir la planta docente de la cohorte anterior?',
            icon: 'warning',
            html: '<span class=\"text-muted\">Se copiaran los docentes de la cohorte anterior a la cohorte actual</span>',
            showCancelButton: true, confirmButtonText: '<i class="fa-solid fa-trash-can"></i> Si, repetir planta docente', cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-danger mx-2 shadow-sm',
                cancelButton: 'btn btn-outline-secondary mx-2',
                popup: 'rounded-4 shadow'
            },
            buttonsStyling: false
        }).then(async (res) => {
            if (res.isConfirmed) {
                try {
                    const res = await axios.post(URL_DOCENTES_COHORTES, data);
                    console.log(res);
                    const [tipo, msj] = res.data;
                    show_alerta(msj, tipo);
                    //if (tipo === 'success') {
                    //   obtenerDatosCursos();
                    // }
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    //funcion para mostrar el nombre del curso segun el orden
    const mostrarNombre = (orden) => {
        let nombre = "";
        switch (orden) {
            case "S2":
                nombre = 'Sala de 2';
                break
            case "S3":
                nombre = 'Sala de 3';
                break
            case "S4":
                nombre = 'Sala de 4';
                break
            case "S5":
                nombre = 'Sala de 5';
                break
            case "In":
                nombre = 'Espacio Institucional';
                break
            default:
                nombre = orden + '°';
        }
        return nombre
    };

    const ordenesUnicas = [...new Set(
        resultado.map(c => c.orden)
    )];

    return (
        <div className='container-principal'>
            {(!verFormularioCohorte && !verFormularioEdicionCohorte) ?
                <div>
                    <h3 className='titulo-cursos'>
                        Cursos
                        {(rol != 9 && rol != "9") && (
                            <button type='button' className='btn btn-outline-success btn-sm ms-2' onClick={() => setVerFormularioCohorte(true)} ><i className="fa-solid fa-circle-plus"></i> Crear cohorte</button>
                        )}
                    </h3>
                    <div className='row'>
                        <div className='col-6'>
                            <div className="input-group mb-3 me-2">
                                <span className="input-group-text" id="basic-addon1"><i className="fa-solid fa-magnifying-glass"></i></span>
                                <select className="form-select"
                                    name='formacion'
                                    onChange={(e) => handleSelect(e, e.target.name)} value={buscar} >
                                    <option>Seleccionar formación</option>
                                    {formaciones.map((f) => (
                                        <option key={f.id} value={f.id}>{f.nombre_formacion} ({f.tipo_formacion})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className='col-6'>
                            <select className='form-select'
                                name='cohorte'
                                onChange={(e) => handleSelect(e, e.target.name)} value={año} >

                                <option >Seleccionar año</option>
                                <option value={(fechaActual.getFullYear() + 1).toString()}>{(fechaActual.getFullYear() + 1).toString()}</option>
                                <option value={fechaActual.getFullYear().toString()}>{fechaActual.getFullYear().toString()}</option>
                                {cohotesCreadas.map((c) => (
                                    <option key={c.cohorte} value={c.cohorte}>{c.cohorte}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        {buscar &&
                            <div className='texto-resultado'>
                                <i className="fa-solid fa-filter"></i>
                                Mostrando {resultado.length} cursos de <span className='texto-resultado-nombre'>{buscarNombre} - cohorte {año == 0 ? 'sin seleccionar' : año} </span>
                            </div>
                        }
                        {(rol != 9 && rol != "9") && (
                            <>
                                <button type="button" className='btn btn-success btn-sm my-2 me-2' data-bs-toggle="modal" data-bs-target="#exampleModal" disabled={resultado.length === 0}>
                                    <i className="fa-regular fa-clock"></i> Establecer inicio y fin de inscripciones
                                </button>
                                <button type="button" className='btn btn-success btn-sm my-2 me-2' data-bs-toggle="modal" data-bs-target="#ModalAgregarGrupo" disabled={resultado.length === 0}> Agregar Grupo/s</button>
                                <button type="button" className='btn btn-success btn-sm my-2 me-2' data-bs-toggle="modal" data-bs-target="#ModalModificaInstancia" disabled={resultado.length === 0}> modificar instancias Calificación de la cohorte</button>
                                <button type="button" className='btn btn-success btn-sm my-2 me-2' onClick={repetirDocentesCohorteAnterior} disabled={resultado.length === 0}> Repetir planta docente cohorte anterior</button>
                            </>
                        )}
                        {!visible ?
                            <div>
                                {/* selector por orden */}
                                {resultado.length > 0 &&
                                    <div className="mb-2 d-flex flex-wrap gap-2">
                                        <button
                                            className={`btn btn-sm ${ordenSeleccionado === 'todos' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => {
                                                setOrdenSeleccionado('todos');
                                                setPaginaActual(1);
                                            }}
                                        >
                                            Todos
                                        </button>

                                        {ordenesUnicas.map((orden) => (
                                            <button
                                                key={orden}
                                                className={`btn btn-sm ${ordenSeleccionado === orden
                                                    ? 'btn-primary'
                                                    : 'btn-outline-primary'
                                                    }`}
                                                onClick={() => {
                                                    setOrdenSeleccionado(orden);
                                                    setPaginaActual(1);
                                                }}
                                            >
                                                {mostrarNombre(orden)}
                                            </button>
                                        ))}
                                    </div>
                                }
                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 mt-2">
                                    <div className="table-responsive">
                                        <table className='table table-hover align-middle mb-0'>
                                            <thead className='table-light text-muted'>
                                                <tr >
                                                    <th className="small" colSpan={5}>
                                                        <div className="row g-3 align-items-center">
                                                            {(rol != 9 && rol != "9") && (
                                                                <div className="col-auto">
                                                                    <input className="form-check-input" type="checkbox" checked={seleccionarTodoCheck} onChange={seleccionarTodo} />
                                                                </div>
                                                            )}
                                                            {(rol != 9 && rol != "9") && (
                                                                <div className="col-auto">
                                                                    <div className="dropdown">
                                                                        <button
                                                                            className="btn btn-light btn-sm dropdown-toggle"
                                                                            type="button"
                                                                            onClick={() => setDropdownOpen(!dropdownOpen)}
                                                                            disabled={seleccionados.length === 0}
                                                                        >
                                                                            Acciones
                                                                        </button>

                                                                        <ul className={`dropdown-menu ${dropdownOpen ? "show" : ""}`}>
                                                                            <li>
                                                                                <button
                                                                                    className="dropdown-item"
                                                                                    onClick={() => {
                                                                                        cambiarEstadoCursos('Abierto');
                                                                                        setDropdownOpen(false);
                                                                                    }}
                                                                                >
                                                                                    Abrir cursos seleccionados
                                                                                </button>
                                                                            </li>
                                                                            <li>
                                                                                <button
                                                                                    className="dropdown-item"
                                                                                    onClick={() => {
                                                                                        cambiarEstadoCursos('Cerrado');
                                                                                        setDropdownOpen(false);
                                                                                    }}
                                                                                >
                                                                                    Cerrar cursos seleccionados
                                                                                </button>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <th className="small1">Inicio inscripción</th>
                                                    <th className="small1">Fin inscripción</th>
                                                    <th className="small1">Docente/s</th>
                                                    <th className="small1">Estudiante/s</th>
                                                    <th className="small1">Planificación</th>
                                                    <th className="small1">Inscripción</th>
                                                    <th className="small1">Acc.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cursosPaginados.map((c, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            {(rol != 9 && rol != "9") && (
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    value={c.id}
                                                                    checked={seleccionados.includes(c.id)}
                                                                    onChange={() => manejarSeleccionIndividual(c.id)}
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="small1">
                                                            <span className={`text-${c.estado === 'Abierto' ? 'success' : 'warning'}`}>
                                                                <i className={`small1 fa-solid fa-lock${c.estado === 'Abierto' ? '-open' : ''} mr-3`}></i>
                                                            </span>
                                                        </td>
                                                        <td className="small1">{mostrarNombre(c.orden)}</td>
                                                        <td className="small1">{c.denominacion}</td>
                                                        <td className="small1">{c.nombre}</td>
                                                        <td className="small1">{c.fecha_inicio}</td>
                                                        <td className="small1">{c.fecha_fin}</td>
                                                        <td className="small1"><i className="fa-solid fa-chalkboard-user"></i> {c.cantidad_docentes}</td>
                                                        <td className="small1"><i className="fa-solid fa-graduation-cap"></i> {c.cantidad_estudiantes}</td>
                                                        <td className="small1">{!c.tiene_planificacion === 0 ? 'NO' : <><button type='button' className='btn btn-outline-info btn-sm' onClick={() => navigate(`/MC/${c.id_}/p/${c.id_curso_grupo}`)}>Si</button></>}</td>
                                                        <td className="small1">
                                                            {c.codigo_inscripcion === '' ?
                                                                <button type='button' className='btn btn-outline-primary btn-sm' data-bs-toggle="modal" data-bs-target="#qrModal" onClick={() => generarQRCode(c.id_curso_grupo)}><i className="fa-solid fa-qrcode"></i> QR</button> :
                                                                <button type='button' className='btn btn-outline-primary btn-sm' data-bs-toggle="modal" data-bs-target="#qrModal" onClick={() => setQrCode(c.codigo_inscripcion)}><i className="fa-solid fa-qrcode"></i> QR</button>}
                                                        </td>
                                                        <td>
                                                            <button type='button' className='btn btn-outline-dark btn-sm me-2' onClick={() => handleNavigateToCurso(c.id_curso_grupo)}><i className="fa-solid fa-eye"></i> ver</button>
                                                            {(rol != 9 && rol != "9") && (
                                                                <button type='button' className='btn btn-outline-danger btn-sm mx-1' onClick={() => eliminarGrupo(c.id_curso_grupo)}><i className="fa-solid fa-trash"></i></button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
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
                    {/* Mostrar el formulario de nueva cohorte */}
                    {verFormularioCohorte && <FormNuevaCohorte enviarFormData={enviarFormData} setVerFormularioCohorte={setVerFormularioCohorte} />}

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

            {/* MODAL PARA MOSTRAR CODIGOS QR DE INSCRIPCION */}
            <div className="modal fade" id="qrModal" aria-labelledby="qrModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="qrModalLabel">Código QR para inscripción al curso</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body d-flex justify-content-center">
                            {qrCode && <QRCodeSVG value={`${URL_PLATAFORMA}Inscripcion/${qrCode}`} size={256} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL PARA AGREGAR GRUPOS  */}
            <div className="modal fade" id="ModalAgregarGrupo" aria-labelledby="ModalAgregarGrupoLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="ModalAgregarGrupoLabel">Agregar Grupos</h5>
                            <button type="button" id="btn-cerrar-agregar-grupos" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleAgregarGrupos}>
                                <div className="mb-3">
                                    <label htmlFor="curso" className="form-label">Seleccionar Curso</label>
                                    <select className="form-select" id="curso" required>
                                        {cursosFiltrado.map((curso) => (
                                            <option key={curso.id} value={curso.id}>{curso.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="cantidadGrupos" className="form-label">Cantidad de Grupos</label>
                                    <input type="number" className="form-control" id="cantidadGrupos" min="1" required />
                                </div>
                                <button type="submit" className="btn btn-primary">Agregar Grupos</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL PARA MODIFICAR LAS INSTANCIAS DE CALIFICACION DE UNA COHORTE  */}
            <div className="modal fade" id="ModalModificaInstancia" aria-labelledby="ModalModificaInstancia" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="ModalAgregarGrupoLabel">Instancias de calificaciones</h5>
                            <button type="button" id="btn-cerrar-agregar-instancias" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className='contenedor-instancias'>
                                <form onSubmit={handleAgregarInstancias}>
                                    {!(instanciasCohorte.length == 0) &&
                                        <table className='table table-hover table-sm'>
                                            <thead>
                                                <tr>
                                                    <th className='small'>instancia</th>
                                                    <th className='small'>fecha apertura</th>
                                                    <th className='small'>fecha cierre</th>
                                                    <th className='small'>Calificación</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {instanciasCohorte.map((i, index) => (
                                                    <tr key={index}>
                                                        <td className='small'>
                                                            {/* <input type="text" 
																	className="form-control form-control-sm" 
																	name='instancia' id="instancia" 
																	value={i.nombre_instancia}
																	/>
																*/}
                                                            {i.nombre}

                                                        </td>
                                                        <td className='small'>
                                                            {i.fechaDesde}
                                                        </td>
                                                        <td className='small'>
                                                            {i.fechaHasta}
                                                        </td>
                                                        <td className='small'>
                                                            {i.tipoCalificacion}
                                                        </td>
                                                        <td>
                                                            <button type='button' className='btn btn-sm btn-light me-1' onClick={() => editarInstancia(index)}> <i className='fa-solid fa-edit'></i> </button>
                                                            <button type='button' className='btn btn-sm btn-light' onClick={() => eliminarInstancia(index)}> X </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    }
                                    <div className={!modoEditar ? 'row g-1 ' : 'row g-1 border border-success rounded p-1'}>
                                        <h5>{modoEditar ? "Editando instancia" : "Crear nueva instancia"}</h5>
                                        <div className="row g-1">
                                            <div className="col-md-3 ">
                                                <div className="form-floating">
                                                    <input type="text"
                                                        className="form-control form-control-sm"
                                                        name='instancia' id="instancia"
                                                        value={nombreInstancia}
                                                        onChange={(e) => setNombreInstancia(e.target.value)} />
                                                    <label htmlFor="instancia">Instancia</label>
                                                </div>
                                            </div>
                                            <div className="col-md-3 small">
                                                <div className="form-floating">
                                                    <input type="datetime-local"
                                                        className="form-control form-control-sm"
                                                        name='fdesde' id="fdesde"
                                                        value={fechaDesde}
                                                        onChange={(e) => setFechaDesde(e.target.value)}
                                                    />
                                                    <label htmlFor="fdesde">fecha desde</label>
                                                </div>
                                            </div>
                                            <div className="col-md-3 small">
                                                <div className="form-floating">
                                                    <input type="datetime-local" className="form-control form-control-sm"
                                                        name='fhasta' id="fhasta"
                                                        value={fechaHasta}
                                                        onChange={(e) => setFechaHasta(e.target.value)} />
                                                    <label htmlFor="fhasta">Fecha hasta</label>
                                                </div>
                                            </div>
                                            <div className="col-md-3 small">
                                                <div className="form-floating">
                                                    <select className="form-select" id="tipoCalificacion"
                                                        name='tipoCalificacion'
                                                        value={tipoCalificacion}
                                                        onChange={(e) => setTipoCalificacion(e.target.value)}
                                                    >
                                                        <option value="Numerica">Numérica</option>
                                                        <option value="Valorativa">Valorativa</option>
                                                        <option value="Logro">Logro</option>
                                                        <option value="Participacion">Participación</option>
                                                    </select>
                                                    <label htmlFor="tipoCalificacion">Tipo calificación</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='row mx-1 mt-2 mb-1 text-center'>
                                            {!modoEditar ?
                                                <button type='button' className='btn btn btn-sm btn-light' onClick={agregarInstancia}>agregar instancia (luego guardar)</button>
                                                :
                                                <div>
                                                    <button type='button' className='btn btn btn-sm btn-light me-1' onClick={actualizarInstancia}>Actualizar instancia</button>
                                                    <button type='button' className='btn btn btn-sm btn-light' onClick={cancelarEdicion}>Cancelar edición</button>
                                                </div>
                                            }

                                        </div>
                                        <div className='row mx-1 mt-2 mb-1 text-center border-top pt-2'>
                                            <button type='submit' className='btn btn btn-sm btn-success'>Gurdar definitivamente todas las instancias</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
export default Cursos;