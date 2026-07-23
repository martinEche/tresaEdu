import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Principal.css';
import CONFIG from '../../config.js';
import { Bar } from 'react-chartjs-2'; // instalar npm install chart.js react-chartjs-2
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { show_alerta } from '../../funciones.js';

// Registrar las escalas y elementos de Chart.js
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const URL_INFO = `${CONFIG.API_URL}/info_principal.php`;
const URL_CALENDARIO = `${CONFIG.API_URL}/operarCalendario.php`;

function PrincipalTesorero({rol, mensajesSinLeer, configuracion}) {
    const [usuarios, setUsuarios] = useState(0);
    const [cursos, setCursos] = useState(0);
    const [estudiantes, setEstudiantes] = useState(0);
    const [docentes, setDocentes] = useState(0);
    const [matriculaData, setMatriculaData] = useState([]);
    const userId =localStorage.getItem('loggedUserId');
    const [eventos, setEventos] = useState([]);
    const fecha = new Date();
    const cicloActual = fecha.getFullYear();
   
    
    useEffect(() => {
        buscaInfo();
        obtenerEventos();
    }, []);

    const buscaInfo = () => {
        axios.get(`${URL_INFO}?ciclo=${cicloActual}&dato=cuotas`)
            .then(res => {
                if (res.data.usuarios) { 
                    setUsuarios(res.data.usuarios);
                    setCursos(res.data.cursos);
                    setEstudiantes(res.data.estudiantes);
                    setDocentes(res.data.docentes);
                    setMatriculaData(res.data.matricula); // Asumiendo que la API retorna estos datos
                    console.log(res.data.matricula)
                } else {
                    setUsuarios(0);
                    setCursos(0);
                    setEstudiantes(0);
                    setDocentes(0);
                }
            })
            .catch(err => {
                console.log(err);
            });
    };

    // Preparamos los datos para el gráfico
		// Ejemplo de datos inventados
		const cuotasData = [
			{ año: 2025, orden: 1, pagas: 30, impagas: 0 },   // 100% pagas
			{ año: 2025, orden: 2, pagas: 20, impagas: 10 },  // mezcla
		];

		// Sacamos los labels de los cursos
		const labels = cuotasData.map(item => `${item.orden}°`);

		// Armamos datasets
		const data = {
			labels,
			datasets: [
				{
					label: 'Pagas',
					data: cuotasData.map(item => item.pagas),
					backgroundColor: 'rgba(75, 192, 114, 0.6)',
					borderColor: 'rgba(75, 192, 85, 1)',
					borderWidth: 1,
				},
				{
					label: 'Impagas',
					data: cuotasData.map(item => item.impagas),
					backgroundColor: 'rgba(255, 99, 132, 0.6)',
					borderColor: 'rgba(255, 99, 132, 1)',
					borderWidth: 1,
				},
			],
		};


    const obtenerEventos = async () => {
        try {
            const res = await axios.get(URL_CALENDARIO);
            if (Array.isArray(res.data)) {
                // Aplicar filtros según el rol
                const eventosFiltrados = res.data.filter(evento => {
                    const esPropio = evento.creada_por == userId;
    
                let filtroPorRol = false;
                rol = parseInt(rol, 10);
                switch (rol) {
                        case 1:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 2:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 3:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
                            break;
                        case 4:
                            filtroPorRol = ['todos', 'todosA', 'todosD', 'todosE','todosT','todosM'].includes(evento.tipo_recordatorio);
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
                            filtroPorRol = ['todos', 'todosT','todosE', 'todoTC', 'todosDETC'].includes(evento.tipo_recordatorio);
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
    
                setEventos(eventosFiltrados);
            } else {
                setEventos([]);
                console.error('La respuesta de la API no es un array:', res.data);
            }
        } catch (err) {
            console.error('Error al obtener eventos:', err);
        }
    };

    const eventosHoy = () => {
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0); // Asegúrate de comparar solo las fechas

        return eventos.filter((evento) => {
            const fechaEvento = new Date(evento.fecha);
            fechaEvento.setHours(0, 0, 0, 0);
            return fechaEvento.getTime() === fechaActual.getTime();
        });
    };

    const proximosEventos = (dias_proximos) => {
        const fechaActual = new Date();
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaActual.getDate() + dias_proximos);

        return eventos.filter((evento) => {
            const fechaEvento = new Date(evento.fecha);
            return fechaEvento >= fechaActual && fechaEvento <= fechaLimite;
        });
    };

   
    return (    
        <div className="contenedor-principal">
          <h3>Área tesorereria</h3>  
            <div className='row'>
              <div className='col-12 col-md-6 col-lg-4'>
                <div className='card px-2 pt-2'>
                  <div className=''>
                    <div className='card mb-3'>
                      <div className='card-body'>
                        <div className='card-title'>
                          <h5>Eventos de Hoy:</h5>
                        </div>
                        {eventosHoy().map((evento) => (
                          <div key={evento.id_evento}>
                            <strong>{evento.evento}</strong> - {evento.hora_desde} a {evento.hora_hasta}
                          </div>
                        ))}
                      </div>
                    </div>
                  <div className='card mb-3'>
                    <div className='card-body'>
                      <div className='card-title'>
                        <h5>Próximos eventos <small>(15 días)</small>:</h5 >
                      </div>
                      {proximosEventos(15).map((evento) => (
                        <div key={evento.id_evento}>
                          <strong>{evento.evento}</strong> - {new Date(evento.fecha).toLocaleDateString()} ({evento.hora_desde} - {evento.hora_hasta})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>                                
              </div>
            </div>
          <div className='col-12 col-md-6 col-lg-6'>
            <div className='card px-4 pb-4'>
              <h2>Informe gráfico</h2>
              <h5>Cuotas por año y grado</h5>
              <div className='principal-grafico'>
                <Bar data={data} />
              </div>
             
            </div>
          </div>
          <div className='col-12 col-md-12 col-lg-2 card'>
            <div className='row'>
              <div className='col-6 col-md-3 col-lg-12 d-flex justify-content-center'>
                <div className='cuadro-info-simple ' style={{
                  background:configuracion.color_secundario,
                  background: `linear-gradient(266deg,${configuracion.color_secundario} 0%, ${configuracion.color_principal} 100%, ${configuracion.color_terciario} 100%)`}}
                >
                  <i className='fa-solid fa-users'></i>
                  <div className='texto-info1' style={{color:configuracion.color_terciario}}>{usuarios} Usuarios</div>
                </div>
              </div>
              <div className='col-6 col-md-3 col-lg-12 d-flex justify-content-center'>
                <div className='cuadro-info-simple'  style={{
                    background:configuracion.color_secundario,
                    background: `linear-gradient(266deg,${configuracion.color_principal} 0%, ${configuracion.color_secundario} 100%, ${configuracion.color_terciario} 100%)`}}
								>
                  <i className="fa-solid fa-boxes-stacked"></i>
                  <div className='texto-info1' style={{color:configuracion.color_terciario}}>{cursos} cursos</div>
                </div>
              </div>
              <div className='col-6 col-md-3 col-lg-12 d-flex justify-content-center'>
                <div className='cuadro-info-simple ' style={{
                      background:configuracion.color_secundario,
                      background: `linear-gradient(266deg,${configuracion.color_secundario} 0%, ${configuracion.color_principal} 100%, ${configuracion.color_terciario} 100%)`}}
                >    
                  <i className="fa-solid fa-graduation-cap"></i>
                  <div className='texto-info1' style={{color:configuracion.color_terciario}}>{estudiantes} estudiantes</div>
                </div>
              </div>
              <div className='col-6 col-md-3 col-lg-12 d-flex justify-content-center'>
                <div className='cuadro-info-simple' style={{
                      background:configuracion.color_secundario,
                      background: `linear-gradient(266deg,${configuracion.color_principal} 0%, ${configuracion.color_secundario} 100%, ${configuracion.color_terciario} 100%)`}}
									> 
                    <i className="fa-solid fa-chalkboard-user"></i>
                    <div className='texto-info1' style={{color:configuracion.color_terciario}}>{docentes} Docentes</div>
                  </div>                        
                </div>
              </div>
            </div>
          </div>
        </div>
     );
}

export default PrincipalTesorero;