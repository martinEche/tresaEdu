import Calendar from 'react-calendar';
import './css/Calendar.css';

function CalendarioAsistencia({ fechasConAsistencia, fechaSeleccionada, setFechaSeleccionada }) {

  const toDateLocal = (fecha) => {
  const [y, m, d] = fecha.split('-');
  return new Date(y, m - 1, d);
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      //const fecha = date.toISOString().split('T')[0];
      const fecha = date.toLocaleDateString('sv-SE');

      if (fechasConAsistencia.includes(fecha)) {
        return 'dia-con-asistencia';
      } else {
        return 'dia-sin-asistencia';
      }
    }
  };

  return (
    <div className="calendario-asistencia" style={{ width: '350px', margin: '0 auto' }}>
      <Calendar
        tileClassName={tileClassName}
        value={toDateLocal(fechaSeleccionada)}
        onChange={(date) => {
          const fecha = date.toLocaleDateString('sv-SE');
          setFechaSeleccionada(fecha);
        }}
      />
    </div>
  );
}

export default CalendarioAsistencia;