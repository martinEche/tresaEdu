import { useState } from "react";

function CalendarioResumenEventos({ eventos }) {
    const [mostrarModal, setMostrarModal] = useState(false);
    const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
    const loggeduserId =localStorage.getItem('loggedUserId');
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
        todosDETC: "Todos los Docentes, Estudiantes y Tutores de este curso",
        todosM: "Todos los Maestranzas",
        yo: "Solo yo"
    };

    const parsearFechaLocal = (fechaString) => {
        const partes = fechaString.split(" ")[0].split('-');
        if (partes.length === 3) {
            return new Date(partes[0], partes[1] - 1, partes[2]);
        }
        return new Date(fechaString);
    };

    const eventosHoy = () => {
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0); // Asegúrate de comparar solo las fechas

        return eventos.filter((evento) => {
            const fechaEvento = parsearFechaLocal(evento.fecha);
            return fechaEvento.getTime() === fechaActual.getTime();
        });
    };

    const proximosEventos = (dias_proximos) => {
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);
        
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaActual.getDate() + dias_proximos);
        fechaLimite.setHours(23, 59, 59, 999);

        return eventos.filter((evento) => {
            const fechaEvento = parsearFechaLocal(evento.fecha);
            return fechaEvento >= fechaActual && fechaEvento <= fechaLimite;
        });
    };

    const estadoEvento = (fecha, hora_inicio, hora_fin) => {
        //console.log(fecha,"-" ,hora_inicio,"-", hora_fin);
        const ahora = new Date();

        // Parseo de la parte de fecha (YYYY-MM-DD)
        const soloFecha = fecha.split(" ")[0]; // "2025-09-06"

        // Construyo fechas con horas
        const inicio = new Date(`${soloFecha}T${hora_inicio}`);
        const fin = new Date(`${soloFecha}T${hora_fin}`);
        // Fecha del evento con hora desde
        //const inicio = new Date(`${fecha}T${hora_inicio}`);
        // Fecha del evento con hora hasta
        //const fin = new Date(`${fecha}T${hora_fin}`);

        // Si ya terminó
        if (fin < ahora) {
            return "Finalizó";
        }
        // Si está ocurriendo ahora mismo
        if (inicio <= ahora && ahora <= fin) {
            return "Inició";
        }

        return "Vigente";
    };


    const eliminarEvento = (idEvento) =>{
        alert("eliminar");
    }

    const mostrarEvento = (evt) => {
        setEventoSeleccionado(evt);
        setMostrarModal(true);
    };

    const cerrarModal = () => {
        setMostrarModal(false);
        setEventoSeleccionado(null);
    };


    return (    
        <>
            <div className='card shadow mb-1'>
                <div className='card-body'>
                    <h5>Eventos de Hoy:</h5>
                    {eventosHoy().map((evento) => (
                        <div key={evento.id_evento}
                            onClick={(e) => {
                                e.stopPropagation(); // evita que dispare el click del día
                                mostrarEvento(evento);
                            }}
                            style={{cursor:'pointer'}}
                        >
                            <i className="fa-regular fa-calendar-check me-1 text-success"></i><strong>{evento.evento}</strong>
                            <div className="ms-3 small text-secondary">{evento.hora_desde} a {evento.hora_hasta}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className='card mb-1'>
                <div className='card-body'>
                    <h5>Próximos eventos <small>(15 días)</small>:</h5 >
                    {proximosEventos(15).map((evento) => {
                    const fechaObj = new Date(evento.fecha);
                    const dia = fechaObj.getDate().toString().padStart(2, '0'); 
                    const mes = fechaObj.toLocaleString('es-ES', { month: 'short' }); // "sep"
                    return (
                        <div key={evento.id_evento} 
                            className="alert alert-light" 
                            role="alert"
                            onClick={(e) => {
                                e.stopPropagation(); // evita que dispare el click del día
                                mostrarEvento(evento);
                            }}
                            style={{cursor:'pointer'}}
                        >
                            <strong>{dia} {mes}</strong> {evento.evento} 
                            <div className="small text-secondary">
                                <i className="fa-regular fa-clock text-warning me-1"></i>
                                {evento.hora_desde} - {evento.hora_hasta} 
                            </div>
                        </div>
                    );
                    })}
                </div>
            </div>

            {/* MODAL */}
            {mostrarModal && eventoSeleccionado &&
                <div className="mi-modal-overlay">
                <div className="mi-modal-content">
                    <div className='modal-texto-estado-evento'>
                    <span style={{ color: estadoEvento(eventoSeleccionado.fecha, eventoSeleccionado.hora_desde, eventoSeleccionado.hora_hasta)=== 'Finalizó' ? 'red' : 'green' }}>
                       {estadoEvento(eventoSeleccionado.fecha, eventoSeleccionado.hora_desde, eventoSeleccionado.hora_hasta)}
                    </span>
                    </div>
                    <div onClick={cerrarModal} className='d-flex justify-content-end btn-superior'>
                        <span>x</span>
                    </div>
                    
                    <h3 className='text-start mb-3'>{eventoSeleccionado.evento}</h3>
                    <h4> <i className="fa-regular fa-calendar"></i> {eventoSeleccionado.fecha.split(" ")[0]}</h4>
                    <p><i className="fa-regular fa-clock text-warning me-1"></i>{eventoSeleccionado.hora_desde}</p>
                    <p><i className="fa-regular fa-clock text-warning me-1"></i>{eventoSeleccionado.hora_hasta}</p>
                    <p>  {eventoSeleccionado.id_curso_grupo===0?'Evento General':<><strong>curso: </strong>{eventoSeleccionado.orden}-{eventoSeleccionado.espacio}</>}</p>
                    
                    <p><i className="fa-regular fa-eye text-success"></i> {etiquetas[eventoSeleccionado.tipo_recordatorio]}</p>
                    <p className='modal-texto-menor'>Creado por: {eventoSeleccionado.nombre_creador}, {eventoSeleccionado.apellido_creador }</p>
                    {/* Agregar más campos si hay */}

                    {eventoSeleccionado.creada_por == loggeduserId &&
                    <button onClick={()=>eliminarEvento(eventoSeleccionado.id)} className="btn btn-outline-danger mt-2 mx-2"><i className="fa-regular fa-trash-can"></i> eliminar</button>
                    }
                    <button onClick={cerrarModal} className="btn btn-secondary mt-2">Cerrar</button>
                </div>
                </div>
            }

        </>
     );
}

export default CalendarioResumenEventos;