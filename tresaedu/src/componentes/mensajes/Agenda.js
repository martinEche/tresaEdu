
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import './css/agenda.css';
import { show_alerta } from '../../funciones.js';
import Calendario from './Calendario';
import CONFIG from '../../config';
import CalendarioResumenEventos from './CalendarioResumenEventos';

const URL_CALENDARIO = `${CONFIG.API_URL}/operarCalendario.php`;

function Agenda({ acceder, rol }) {
    const navigate = useNavigate();
    const hoy = new Date()
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const [fechaMostrar, setFechaMostrar] = useState(hoy);
    const userId = localStorage.getItem('loggedUserId');
    const cursoId = localStorage.getItem('loggeduserCurso');
    const grupoId = localStorage.getItem('loggeduserCursoGrupo');

    const [eventos, setEventos] = useState([]);
    const [verAgregarEvento, setVerAgregarEvento] = useState(false);
    const [nuevoEvento, setNuevoEvento] = useState({
        evento: '',
        fecha: '',
        hora_desde: '08:00',
        hora_hasta: '23:59',
        id_curso_grupo: cursoId ? grupoId : null,
        tipo_recordatorio: 'yo',
        creada_por: userId,
    });

    useEffect(() => {
        if (acceder) {
            obtenerEventos();
        } else {
            localStorage.clear();
            navigate('/');
        }
    }, []);

    const obtenerEventos = async () => {
        try {
            console.log('estoy en cursoGrupo:', grupoId);
            console.log('consulta:', `${URL_CALENDARIO}?id_usiario=${userId}${grupoId ? `&id_curso_grupo=${grupoId}` : ''}`);
            const res = await axios.get(`${URL_CALENDARIO}?id_usiario=${userId}${grupoId ? `&id_curso_grupo=${grupoId}` : ''}`);
            //const res = await axios.get(URL_CALENDARIO);
            console.log('eventos obtenidos:', res.data);
            if (Array.isArray(res.data)) {
                // Aplicar filtros según el rol
                const eventosFiltrados = res.data.filter(evento => {
                    const esPropio = evento.creada_por == userId;

                    let filtroPorRol = false;
                    rol = parseInt(rol, 10);
                    console.log('rol:', rol);
                    switch (rol) {
                        case 1:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE', 'todosT', 'todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 2:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE', 'todosT', 'todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 3:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE', 'todosT', 'todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 4:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE', 'todosT', 'todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 5:
                            filtroPorRol = ['todos', 'todosD', 'todosDC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            break;
                        case 6:
                            filtroPorRol = ['todos', 'todosD', 'todosDC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            break;
                        case 7:
                            filtroPorRol = ['todos', 'todosE', 'todosEC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            //console.log('rol 7, evento:', evento.tipo_recordatorio, 'filtroPorRol:', filtroPorRol);
                            break;
                        case 8:
                            filtroPorRol = ['todos', 'todosT', 'todosE', 'todoTC', 'todosDETC'].includes(evento.tipo_recordatorio);
                            break;
                        case 9:
                            filtroPorRol = ['todos', 'todosD'].includes(evento.tipo_recordatorio);
                            break;
                        case 12:
                            filtroPorRol = ['todos', 'todosM'].includes(evento.tipo_recordatorio);
                            break;
                        default:
                            filtroPorRol = false;
                            break;
                    }

                    return esPropio || filtroPorRol;
                });
                console.log('eventos filtrados:', eventosFiltrados);
                setEventos(eventosFiltrados);
            } else {
                setEventos([]);
                console.error('La respuesta de la API no es un array:', res.data);
            }
        } catch (err) {
            console.error('Error al obtener eventos:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNuevoEvento({
            ...nuevoEvento,
            [name]: value,
        });
    };

    const agregarEvento = async () => {
        try {
            console.log('nuevo evento:', nuevoEvento);
            const res = await axios.post(URL_CALENDARIO, nuevoEvento);
            console.log('respuesta:', res.data);
            setVerAgregarEvento(false);
            obtenerEventos();
            setNuevoEvento({
                evento: '',
                fecha: '',
                hora_desde: '',
                hora_hasta: '',
                id_curso_grupo: cursoId ? grupoId : null,
                tipo_recordatorio: 'yo',
                creada_por: userId
            });
            show_alerta('Evento agregado', 'success');
        } catch (err) {
            console.error('Error al agregar evento:', err);
        }
    };

    const moverCalendario = (accion) => {
        // Crear una nueva fecha basada en la fecha actual
        let nuevaFecha = new Date(fechaMostrar);
        switch (accion) {
            case 'PROXIMO':
                // Incrementar el mes de la nueva fecha
                nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
                if (nuevaFecha.getFullYear() === hoy.getFullYear() &&
                    nuevaFecha.getMonth() === hoy.getMonth()) {
                    //   console.log('es hoy')
                    nuevaFecha = hoy;
                } else {
                    // console.log('NO es hoy')
                    nuevaFecha.setDate(1);
                }
                break;
            case 'ANTERIOR':
                // Decrementar el mes de la nueva fecha
                nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
                if (nuevaFecha.getFullYear() === hoy.getFullYear() &&
                    nuevaFecha.getMonth() === hoy.getMonth()) {
                    //console.log('es hoy')
                    nuevaFecha = hoy;
                } else {
                    // console.log('NO es hoy')
                    nuevaFecha.setDate(1);
                }
                break;
            case 'HOY':
                //console.log('hoy: '+hoy);
                nuevaFecha = hoy;
                nuevaFecha.setHours(0, 0, 0, 0);
                break;
        }
        // Actualizar el estado con la nueva fecha
        //console.log('nuevaFecha: '+nuevaFecha);
        setFechaMostrar(nuevaFecha);
        //console.log('fechaMostrar: '+fechaMostrar);
    };
    const opcionesVisibilidad = () => {
        const opcionesBase = [{ value: "yo", label: "Solo Yo" }];
        let opcionesCurso = [];
        let opcionesRol = [];

        const opcionesPorRol = {
            1: ["todos", "todosA", "todosD", "todosE", "todosT", "todosM"],
            2: ["todos", "todosA", "todosD", "todosE", "todosT", "todosM"],
            3: ["todos", "todosA", "todosD", "todosE", "todosT", "todosM"],
            4: ["todos", "todosA", "todosD", "todosE", "todosT", "todosM"],
            5: ["todosDC", "todosEC", "todosTC", "todosDETC"],
            6: ["todosDC", "todosEC", "todosTC", "todosDETC"],
            7: [],
            8: [],
            9: ["todos", "todosG"],
            12: ["todosM"]
        };

        const etiquetas = {
            todos: "Todos los usuarios",
            todosA: "Todos los Administradores",
            todosG: "Todo el Equipo de Gestion",
            todosD: "Todos los Docentes",
            todosDC: "Todos los Docentes de este curso",
            todosE: "Todos los Estudiantes",
            todosEC: "Todos los Estudiantes de este curso",
            todosT: "Todos los Tutores",
            todosTC: "Todos los Tutores de estudiantes de este curso",
            todosDETC: "Todos los Participantes (docentes y estudiantes) de este curso ",
            todosM: "Todos los Maestranzas"
        };


        if (!(cursoId === null) || (rol < 4)) {
            opcionesRol = opcionesPorRol[rol] || [];
            //opcionesCurso = [{ value: "Curso", label: "Curso X" }];
        }
        return [...opcionesBase, ...opcionesCurso, ...opcionesRol.map(op => ({ value: op, label: etiquetas[op] }))];
    };

    // Dentro de Agenda
    const manejarClickDia = (fecha) => {
        const fechaISO = fecha.toISOString().split("T")[0]; // YYYY-MM-DD
        //blanque los campos
        setNuevoEvento({
            evento: '',
            fecha: '',
            hora_desde: '08:00',
            hora_hasta: '23:59',
            id_curso_grupo: cursoId ? grupoId : null,
            tipo_recordatorio: 'yo',
            creada_por: userId,
        });
        //pone la fecha clickada
        setNuevoEvento({
            ...nuevoEvento,
            fecha: fechaISO
        });
        //muestra el form
        setVerAgregarEvento(true);
    };

    const mostrarFormNuevoEvento = () => {
        setVerAgregarEvento(!verAgregarEvento);
        setNuevoEvento({
            evento: '',
            fecha: '',
            hora_desde: '08:00',
            hora_hasta: '23:59',
            id_curso_grupo: cursoId ? grupoId : null,
            tipo_recordatorio: 'yo',
            creada_por: userId,
        });
    };

    const eliminarEvento = async (idEvento) => {
        await axios({ method: 'DELETE', url: URL_CALENDARIO, data: { 'id': idEvento, 'tabla': 'calendario' } })
            .then(res => {
                //console.log('elimino evento:'+res.data+'idEvento:'+idEvento);
                var tipo = res.data[0];
                var msj = res.data[1];
                //console.log(msj+'-'+tipo);
                show_alerta(msj, tipo);
                obtenerEventos();
            })
            .catch(err => {
                show_alerta('Error en la solicitud ', 'error');
                console.log(err);
            })
    };

    return (
        <div className="container-principal">
            <div className='row'>
                <div className="col-12 col-sm-9 mb-3">
                    <div className='card'>
                        <div className='card-body'>
                            <div className="calendario-container">
                                {!verAgregarEvento ? (
                                    <div>
                                        <div className='row'>
                                            <div className='col-12 col-sm-5'>
                                                <h4>
                                                    {meses[fechaMostrar.getMonth()]} {fechaMostrar.getFullYear()}
                                                </h4>
                                            </div>
                                            <div className='col-12 col-sm-4'>
                                                <button type='button' className='btn btn-outline-dark btn-sm mx-1' onClick={() => moverCalendario('ANTERIOR')}>
                                                    <i className="fa-solid fa-circle-chevron-left"></i>
                                                </button>
                                                <button type='button' className='btn btn-outline-dark btn-sm mx-1' onClick={() => moverCalendario('HOY')}>
                                                    HOY
                                                </button>
                                                <button type='button' className='btn btn-outline-dark btn-sm mx-1' onClick={() => moverCalendario('PROXIMO')}>
                                                    <i className="fa-solid fa-circle-chevron-right"></i>
                                                </button>
                                            </div>
                                            <div className='col-12 col-sm-3 d-flex justify-content-end'>
                                                <button type='button' className={`mb-2 btn ${verAgregarEvento ? 'btn-secondary' : 'btn-outline-success '}`} onClick={() => mostrarFormNuevoEvento()}>
                                                    {verAgregarEvento ? 'Cancelar' : <><i className="fa-regular fa-calendar-plus"></i> Agregar evento</>}
                                                </button>
                                            </div>
                                        </div>
                                        <Calendario eventos={eventos} fechaMostrar={fechaMostrar} onDiaClick={manejarClickDia} eliminarEvento={eliminarEvento} />
                                    </div>
                                ) : (

                                    <div className='row'>
                                        <div className='row'>
                                            <div className='col-9'><h4 className='ps-3'>Agregar nuevo evento</h4></div>
                                            <div className='col-2 d-flex justify-content-end'>
                                                <button type='button' className='mb-2 btn btn-secondary' onClick={() => setVerAgregarEvento(!verAgregarEvento)}>
                                                    X
                                                </button>
                                            </div>
                                        </div>
                                        <div className='d-none d-xl-block col-12 col-xl-2 col-xxl-3'></div>
                                        <div className='col-12 col-xl-8 col-xxl-6'>
                                            <div className='card-body'>
                                                <form onSubmit={(e) => { e.preventDefault(); agregarEvento(); }}>
                                                    <div className='form-group mb-3'>
                                                        <input
                                                            className='txt-evento'
                                                            type="text"
                                                            name="evento"
                                                            value={nuevoEvento.evento}
                                                            onChange={handleInputChange}
                                                            required
                                                            placeholder='Describa el evento...'
                                                        />
                                                    </div>

                                                    <div className='form-group mb-3'>
                                                        <label><strong>Fecha:</strong></label>
                                                        <input className='form-control' type="date" name="fecha" value={nuevoEvento.fecha} onChange={handleInputChange} required />
                                                    </div>
                                                    <div className='form-group mb-3'>
                                                        <label>Hora Desde:</label>
                                                        <input className='form-control' type="time" name="hora_desde" value={nuevoEvento.hora_desde} onChange={handleInputChange} required />
                                                    </div>
                                                    <div className='form-group mb-3'>
                                                        <label>Hora Hasta:</label>
                                                        <input className='form-control' type="time" name="hora_hasta" value={nuevoEvento.hora_hasta} onChange={handleInputChange} required />
                                                    </div>

                                                    <input className='form-control' type="hidden" name="id_curso" value={nuevoEvento.id_curso} onChange={handleInputChange} required />
                                                    <hr />

                                                    <div className='form-group mb-3'>
                                                        <label>¿Quién lo ve?:</label>
                                                        <select className="form-select" name="tipo_recordatorio" value={nuevoEvento.tipo_recordatorio} onChange={handleInputChange} required>
                                                            {opcionesVisibilidad().map(op => (
                                                                <option key={op.value} value={op.value}>{op.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <input className='form-control' type="hidden" name="creada_por" value={nuevoEvento.creada_por} onChange={handleInputChange} />

                                                    <button className='btn btn-success m-2' type="submit">Agregar Evento</button>
                                                    <button type='button' className={`m-2 btn ${verAgregarEvento ? 'btn-secondary' : 'btn-outline-success '}`} onClick={() => setVerAgregarEvento(!verAgregarEvento)}>
                                                        {verAgregarEvento ? 'Cancelar' : <><i className="fa-regular fa-calendar-plus"></i> Agregar evento</>}
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                        <div className='d-none d-xl-block col-12 col-xl-2 col-xxl-3'></div>
                                    </div>
                                )}
                            </div>
                            <div className="calendario-container"></div>
                        </div>
                    </div>
                </div>
                <div className='col-12 col-sm-3'>
                    <CalendarioResumenEventos userId={userId} rol={rol} eventos={eventos} />
                </div>
            </div>
        </div>
    );
}

export default Agenda;
