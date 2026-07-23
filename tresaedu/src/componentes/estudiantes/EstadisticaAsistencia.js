import { useEffect } from 'react';
import './css/estadisticaAsistencia.css';

function EstadisticaAsistencia({asistencia, fechaSeleccionada, id_usuario}) {
    const presentes = asistencia.filter((a) => a.fecha === fechaSeleccionada && a.asistencia === 'Presente').length;
    const ausentes = asistencia.filter((a) => a.fecha === fechaSeleccionada && a.asistencia === 'Ausente').length;
    const tardes = asistencia.filter((a) => a.fecha === fechaSeleccionada && a.asistencia === 'Tarde').length;
    console.log('asist: '+asistencia);
    return (  
    <>  
        {!id_usuario?
        <div className='row g-1'>
            <div className="col-6 col-md-3  text-center">
                <div className='cuadro-asistencia colorPresente'>
                    <h6>Presentes</h6>
                    <h3>{presentes + tardes}</h3>
                </div>
            </div>
            <div className="col-6 col-md-3 text-center">
                <div className='cuadro-asistencia colorAusente'>
                    <h6>Ausentes</h6>
                    <h3>{ausentes}</h3>
                </div>
            </div>
            <div className="col-5 col-md-2 text-center">
                <div className='cuadro-asistencia colorTarde'>
                    <h6>Tarde</h6>
                    <h3>{tardes}</h3>
                </div>
            </div>
            <div className="col-7 col-md-4 text-center">
                <div className='cuadro-asistencia color3'>
                    <h6>%Presentes</h6>
                    <h3>{Math.round((presentes + tardes) / (tardes + presentes + ausentes) * 100)}%</h3>
                </div>
            </div>
        </div>

        :''}
    </>
     );
}

export default EstadisticaAsistencia;