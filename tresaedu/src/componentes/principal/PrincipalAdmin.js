import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Principal.css';
import CONFIG from '../../config.js';
import { Bar } from 'react-chartjs-2'; // instalar npm install chart.js react-chartjs-2
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { show_alerta } from '../../funciones.js';
import CalendarioResumenEventos from '../mensajes/CalendarioResumenEventos.js';
import RegistroAsistencia from './RegistroAsistencia.js';

// Registrar las escalas y elementos de Chart.js
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const URL_INFO = `${CONFIG.API_URL}/info_principal.php`;
const URL_CALENDARIO = `${CONFIG.API_URL}/operarCalendario.php`;

function PrincipalAdmin({ registroAsistencia, ListadosDeCursos, mensajesSinLeer, rol, configuracion }) {
    const [usuarios, setUsuarios] = useState(0);
    const [cursos, setCursos] = useState(0);
    const [estudiantes, setEstudiantes] = useState(0);
    const [docentes, setDocentes] = useState(0);
    const [matriculaData, setMatriculaData] = useState([]);
    const [matriculaDataI, setMatriculaDataI] = useState([]);
    const [matriculaDataP, setMatriculaDataP] = useState([]);
    const userId =localStorage.getItem('loggedUserId');
    const [eventos, setEventos] = useState([]);
    const fecha = new Date();
    const cicloActual = fecha.getFullYear();
    const [modalAsistencia, setModalAsistencia] = useState(false);

    useEffect(() => {
        buscaInfo();
        obtenerEventos();
    }, []);

    const buscaInfo = () => {
        axios.get(`${URL_INFO}?ciclo=${cicloActual}`)
            .then(res => {
                if (res.data.usuarios) { 
                    setUsuarios(res.data.usuarios);
                    setCursos(res.data.cursos);
                    setEstudiantes(res.data.estudiantes);
                    setDocentes(res.data.docentes);
                    setMatriculaData(res.data.formaciones); // Asumiendo que la API retorna estos datos
                    setMatriculaDataI(res.data.matriculaI); // Asumiendo que la API retorna estos datos
                    setMatriculaDataP(res.data.matriculaP); // Asumiendo que la API retorna estos datos
                    console.log('formaciones:', res.data.formaciones);
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

    // Preparamos los datos para el gráfico para inicial I y para primaria P
    const yearsI = [...new Set(matriculaDataI.map(item => item.año))];
    const yearsP = [...new Set(matriculaDataP.map(item => item.año))];

    const datasetsI = yearsI.map(year => {
        return {
            label: `Inicial ${year}`,
            data: matriculaDataI.filter(item => item.año === year).map(item => item.total_estudiantes),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }
    });
    const datasetsP = yearsP.map(year => {
        return {
            label: `Primaria ${year}`,
            data: matriculaDataP.filter(item => item.año === year).map(item => item.total_estudiantes),
            backgroundColor: 'rgba(202, 14, 8, 0.6)',
            borderColor: 'rgba(241, 41, 41, 1)',
            borderWidth: 1,
        }
    });

    const labelsI = matriculaDataI.map(item => mostrarNombre(item.orden));
    const labelsP = matriculaDataP.map(item => mostrarNombre(item.orden));

    const dataI = {
        labels: labelsI,
        datasets: datasetsI
    };
    const dataP = {
        labels: labelsP,
        datasets: datasetsP
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

    return (    
        <div>
            <h5>Área {rol==2? 'administrador':'equipo directivo'}</h5>
            <div className='row'>
                <div className='col-12 col-md-6 col-lg-3'>
                    
                    <div className=''>
                            <CalendarioResumenEventos userId={userId} rol={rol} eventos={eventos} />
                    </div>
                                    
                </div>
                <div className='col-12 col-md-6 col-lg-5'>
                    <div className='card px-4 pb-4'>
                        {/* armar estadistica de matricula por año y orden */}
                        {matriculaData?.length > 0 && matriculaData.map((formacion) => {
                            if (!formacion.matricula || formacion.matricula.length === 0) return null;

                            const colores = [
                                'rgba(10, 198, 148, 0.6)',
                                'rgba(255, 99, 132, 0.6)',
                                'rgba(54, 162, 235, 0.6)'
                            ];

                            const coloresBorde = [
                                'rgba(10, 198, 148, 1)',
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)'
                            ];
                            // 1. Obtener años únicos (labels)
                            const años = [...new Set(formacion.matricula.map(m => m.año))];
                            // 2. Obtener órdenes únicos (datasets)
                            const ordenes = [...new Set(formacion.matricula.map(m => m.orden))];
                            // 3. Armar datasets
                            const datasets = ordenes.map((orden, index) => ({
                                label: `Año ${orden}`,
                                data: años.map(año => {
                                    const item = formacion.matricula.find(
                                        m => m.año === año && m.orden === orden
                                    );
                                    return item ? Number(item.total_estudiantes) : 0;
                                }),
                                backgroundColor: colores[index % colores.length]
                            }));
                            const chartData = {
                                labels: años,
                                datasets
                            };
                            return (
                                <div key={formacion.id_formacion}>
                                    <h6 className='mt-1'>{formacion.nombre_formacion} - nivel: {formacion.nivel}</h6>
                                    <div className='principal-grafico'>
                                        <Bar data={chartData} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/*columna de información numeros */}
                    <div className='row'>
                        <div className='col-6 col-md-3 col-lg-6 d-flex justify-content-center'>
                            {/*información usuarios totales */}
                            
                            <div className='cuadro-info-simple ' style={{
                                background:configuracion.color_secundario,
                                background: `linear-gradient(266deg,${configuracion.color_secundario} 0%, ${configuracion.color_principal} 100%, ${configuracion.color_terciario} 100%)`}}
                            >
                                <i className='fa-solid fa-users'></i>
                                <div className='texto-info1' style={{color:configuracion.color_terciario}}>
                                   + {usuarios} Usuarios
                                </div>
                            </div>
                        </div>
                        <div className='col-6 col-md-3 col-lg-6 d-flex justify-content-center'>
                            <div className='cuadro-info-simple'  style={{
                                background:configuracion.color_secundario,
                                background: `linear-gradient(266deg,${configuracion.color_principal} 0%, ${configuracion.color_secundario} 100%, ${configuracion.color_terciario} 100%)`}}>
                                <i className="fa-solid fa-boxes-stacked"></i>
                                <div className='texto-info1' style={{color:configuracion.color_terciario}}> + {cursos} cursos</div>
                            </div>
                        </div>
                        <div className='col-6 col-md-3 col-lg-6 d-flex justify-content-center'>
                            <div className='cuadro-info-simple ' style={{
                                background:configuracion.color_secundario,
                                background: `linear-gradient(266deg,${configuracion.color_secundario} 0%, ${configuracion.color_principal} 100%, ${configuracion.color_terciario} 100%)`}}
                            >    
                                <i className="fa-solid fa-graduation-cap"></i>
                                <div className='texto-info1' style={{color:configuracion.color_terciario}}> + {estudiantes} estudiantes</div>
                            </div>
                        </div>
                        <div className='col-6 col-md-3 col-lg-6 d-flex justify-content-center'>
                            <div className='cuadro-info-simple' style={{
                                background:configuracion.color_secundario,
                                background: `linear-gradient(266deg,${configuracion.color_principal} 0%, ${configuracion.color_secundario} 100%, ${configuracion.color_terciario} 100%)`}}> 
                                <i className="fa-solid fa-chalkboard-user"></i>
                                <div className='texto-info1' style={{color:configuracion.color_terciario}}> + {docentes} Docentes</div>
                            </div>                        
                        </div>
                    </div>
                   
                </div>
                <div className='col-12 col-md-12 col-lg-4 card'>
                    <div className='card p-2 my-2'>        
                        <div>
                            {/* Aquí se muestra el registro de asistencia, pasando los datos obtenidos desde el componente padre */}
                            <h6>
                                 <span className='me-4'>Resumen registro de asistencia - {cicloActual}</span>      
                                <button 
                                    className='btn btn-outline-secondary btn-sm ms-4'
                                    onClick={()=>setModalAsistencia(true)}
                                >
                                    <i className="fa-solid fa-magnifying-glass-chart"></i>
                                </button>
                            </h6>
                            <RegistroAsistencia 
                                anioRegistro={cicloActual}
                                registroAsistencia={registroAsistencia} 
                                ListadosDeCursos={ListadosDeCursos}
                                configuracion={configuracion} 
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Modal para mostrar el registro de asistencia en detalle */}
            {modalAsistencia && (
                <div
                    className="modal-asistencia-overlay"
                    onClick={() => setModalAsistencia(false)}
                >
                    <div
                        className="modal-asistencia-contenido"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="btn-cerrar-modal"
                            onClick={() => setModalAsistencia(false)}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>

                        <RegistroAsistencia
                            anioRegistro={cicloActual}
                            registroAsistencia={registroAsistencia}
                            ListadosDeCursos={ListadosDeCursos}
                            configuracion={configuracion}
                            tipo="full"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default PrincipalAdmin;
