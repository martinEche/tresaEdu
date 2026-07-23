import React, { useState, useEffect } from 'react'; 
import './css/agenda.css';
import CONFIG from '../../config';

const URL_CALENDARIO = `${CONFIG.API_URL}/operarCalendario.php`;

function Calendario({ eventos, fechaMostrar, onDiaClick, eliminarEvento }) {
  const [diasEnCalendario, setDiasEnCalendario] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
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
    todosDETC: "Todos los Participantes (docentes y estudiantes) de este curso ",
    todosM: "Todos los Maestranzas",
    yo: "Solo yo"
  };

  useEffect(() => {
    generarDiasCalendario();
  }, [eventos, fechaMostrar]);

  const parsearFechaLocal = (fechaString) => {
    const partes = fechaString.split(" ")[0].split('-');
    if (partes.length === 3) {
      return new Date(partes[0], partes[1] - 1, partes[2]);
    }
    return new Date(fechaString);
  };

  const eventosDelDia = (fecha) => {
    return eventos.filter((evento) => parsearFechaLocal(evento.fecha).toDateString() === fecha.toDateString());
  };

  const generarDiasCalendario = () => {
    const fechaInicial = new Date(fechaMostrar);
    const primerDia = new Date(fechaInicial);
    primerDia.setDate(primerDia.getDate() - primerDia.getDay() - 7); // Empezar desde el domingo anterior
    const dias = [];

    for (let i = 0; i < 42; i++) { // 6 semanas (42 días)
      const diaActual = new Date(primerDia);
      diaActual.setDate(primerDia.getDate() + i);
      dias.push(diaActual);
    }
    setDiasEnCalendario(dias);
  };

  const esHoy = (fecha) => {
    const hoy = new Date();
    return (
      fecha.getFullYear() === hoy.getFullYear() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getDate() === hoy.getDate()
    );
  };

  const esDiaAnterior = (fecha) => {
    const hoy = new Date();
   // hoy.setHours(0, 0, 0, 0); // Eliminar la hora para solo comparar la fecha
    const fechaComparar = new Date(fecha); // Asegura que sea Date
    //fechaComparar.setHours(0, 0, 0, 0);
  return fechaComparar < hoy;
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

  const esMismoMes = (fecha) => {
    return fecha.getMonth() === fechaMostrar.getMonth();
  };

  const mostrarEvento = (evt) => {
    setEventoSeleccionado(evt);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEventoSeleccionado(null);
  };

  return (
    <div className='mb-2'>
      <div className="calendar-grid">
        <div className='calendario-titulo'>Dom</div>
        <div className='calendario-titulo'>Lun</div>
        <div className='calendario-titulo'>Mar</div>
        <div className='calendario-titulo'>Mie</div>
        <div className='calendario-titulo'>Jue</div>
        <div className='calendario-titulo'>Vie</div>
        <div className='calendario-titulo'>Sab</div>
        {diasEnCalendario.map((dia, index) => (
          <div
            key={index}
            className={`calendar-day ${esDiaAnterior(dia) ? 'dia-anterior' : ''} ${!esMismoMes(dia) ? 'mes-diferente' : ''} ${esHoy(dia) ? 'hoy' : ''}`}
            onClick={() => onDiaClick && onDiaClick(dia)} // callback de Agenda
          >
            <span>{dia.getDate()}{esHoy(dia) && ' (hoy)'}</span>
            {eventosDelDia(dia).map((evento, idx) => (
              <>
              <div
                key={idx}
                className={`${evento.tipo_recordatorio} ${esDiaAnterior(dia) ? 'evento-pasado' : 'evento'}`}
                onClick={(e) => {
                  e.stopPropagation(); // evita que dispare el click del día
                  mostrarEvento(evento);
                }}
              >
                <div className='d-flex d-wrap justify-content-start'>
                  <div className="evento-recortado">{evento.evento}</div>
                </div>
              </div>
              </>
            ))}
          </div>
        ))}
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
                    <button onClick={()=>{eliminarEvento(eventoSeleccionado.id_evento); cerrarModal()}} className="btn btn-outline-danger mt-2 mx-2"><i className="fa-regular fa-trash-can"></i> eliminar </button>
                    }
                    <button onClick={cerrarModal} className="btn btn-secondary mt-2">Cerrar</button>
                </div>
                </div>
            }
    </div>
  );
}

export default Calendario;
