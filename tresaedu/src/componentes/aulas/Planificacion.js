import './css/Aulas.css';
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useEffect , useState} from "react";
import { show_alerta } from '../../funciones.js';
import PlanificacionFormIA from './PlanificacionFormIA';
import PlanificacionForm from './PlanificacionForm';
import PLanificacionVista from './PlanificacionVista.js';
import CONFIG from '../../config';
import { set } from 'firebase/database';

const URL_CURSOS  = `${CONFIG.API_URL}/operarCursos.php`;

function Planificacion({acceder, rol}) {
    const { idMC, idCG } = useParams();
    const loggedUserId = localStorage.getItem('loggedUserId');
    const datoBase ={
      id:null,
      id_curso_grupo: idCG,
      id_curso_equipo_docente: '',
      fecha: '',
      tipo: '',
      introduccion: '',
      id_curso: '',
      propositos: '',
      capacidades: "[]",
      contenidos_generales: "[]",
      estrategia_metodologica: '',
      evaluacion: '',
      entorno: '',
      recursos: '',
      bibliografia: '',
      creado_por: loggedUserId,
      titulo: '',
      archivo:''
    }

    const navigate = useNavigate();
    const [verAgregarPlanificacion, setVerAgregarPlanificacion] = useState(false);
    const [verAgregarPlanificacionArchivo, setVerAgregarPlanificacionArchivo] = useState(false);
    const [planificacionesCurso, setPlanificacionesCurso] = useState([]);
    const [planificacion, setPlanificacion] = useState(datoBase);

    const data= {
        'id_curso_grupo' : idCG,
        'modo': 'buscarCursoPlanificacion'
    }

    useEffect(() => {
        if(acceder){
            if((rol===null)){
                navigate("/");
            }else{
                console.log("data:"+ JSON.stringify(data));
                buscaPlanificacion(data); 
            }
        }else{
            localStorage.clear();
            navigate('/');
        }           
    }, [acceder, rol]);
    
    const buscaPlanificacion =  (d) =>{
        axios.post(URL_CURSOS, d)
        .then(res =>{
            if(!res.data.error){   
                setPlanificacionesCurso(res.data.planificacion);
                //setPlanificacion(res.data.planificacion[0]);

                console.log("data:"+ JSON.stringify(res.data.planificacion));
            }else{
                setPlanificacionesCurso([]);
                setPlanificacion(datoBase);
            }
        })
        .catch(err=>{
            console.log(err);
        })
    }

    const agregarPlanificacion = async (metodo,parametros) =>{
        await axios({method:metodo, url:URL_CURSOS, data:parametros, headers: {'Content-Type': 'multipart/form-data'}})
        .then(res =>{
            console.log(res.data);
            var tipo = res.data[0];
            var msj = res.data[1];
            //console.log(msj+'-'+tipo);
            show_alerta(msj,tipo);
            setVerAgregarPlanificacion(false);
            setVerAgregarPlanificacionArchivo(false);
            setPlanificacion(datoBase); // esto cambia la seleccionada
            buscaPlanificacion(data);
        })
        .catch(err=>{
            show_alerta('Error en la solicitud ','error');
            console.log(err);
        })
    }
     const eliminaPlanificacion = async (metodo,parametros) =>{
        await axios({method:metodo, url:URL_CURSOS, data:parametros})
        .then(res =>{
            console.log(res.data);
            var tipo = res.data[0];
            var msj = res.data[1];
            //console.log(msj+'-'+tipo);
            show_alerta(msj,tipo);
            setVerAgregarPlanificacion(false);
            setVerAgregarPlanificacionArchivo(false);
            setPlanificacion(datoBase); // esto cambia la seleccionada
            buscaPlanificacion(data);
        })
        .catch(err=>{
            show_alerta('Error en la solicitud ','error');
            console.log(err);
        })
    }
    
    const obtenerIcono = (archivo) => {
      if (!archivo) return null;

      const ext = archivo.split('.').pop().toLowerCase();

      if (ext === 'pdf') return 'icono-pdf.jpg';
      if (['doc', 'docx'].includes(ext)) return 'icono-doc.png';

      return 'icono-doc.png';
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

    return (    
        <div className="container-principal">
          <div className='row'>
            <div className="col-12 mb-3">
              <div className='card'>
                <div className='card-body'>

                  {/* si el rol es 2 mostrar el boton de volver a cursos */}
                  {rol=== 2 &&
                  <div className='d.flex justify-content-star mb-2'>
                    <botton type='button' className='btn btn-outline-secondary btn-sm' onClick={()=>navigate('/Cursos')}>volver</botton>
                  </div>
                  }

                  <div className='row'>
                    <div className='col-7'>
                      <h4>
                        <i className="fa-regular fa-calendar me-1"></i>
                        {planificacionesCurso.length > 1 ? 'Planificaciones anuales del curso' : 'Planificación anual del curso'}
                      </h4>  
                    </div>

                    {(rol === "6" || rol === "5" || rol=== "2" || rol === 6 || rol === 5 || rol === 2 ) &&
                    <>
                    <div className='col-5 d-flex justify-content-end'>
                     {/*botonera agregar planficaciones*/} 
                        {!verAgregarPlanificacionArchivo &&
                          <button type='button' 
                          className={`mb-2 me-1 btn ${verAgregarPlanificacion ? 'btn-secondary' : 'btn-primary '}`} 
                          onClick={() => {
                                          setVerAgregarPlanificacion(!verAgregarPlanificacion);
                                          setPlanificacion(datoBase);
                                        }
                                  }
                          >
                            {verAgregarPlanificacion ? 'X' : <><i className="fas fa-pencil"></i> Escribir PLanificación</>}
                          </button>
                        }
                        {!verAgregarPlanificacion &&
                          <button type='button' 
                          className={`mb-2 me-1 btn ${verAgregarPlanificacionArchivo ? 'btn-secondary' : 'btn-primary '}`} 
                          onClick={() => {
                                          setVerAgregarPlanificacionArchivo(!verAgregarPlanificacionArchivo);
                                          setPlanificacion(datoBase);
                                  }}
                          >
                            {verAgregarPlanificacionArchivo ? 'X' : <><i className="fas fa-upload"></i> Subir Documento</>}
                          </button>
                        }
                      </div>
                    </>
                    }
                  </div>
                  <div className='d-flex flex-wrap mb-3'>
                    {/*mostrar las planificaciones cargadas si no hay mostrar imagen*/}
                    {/* si hay planificaciones y no se activo el formularios mostrar las planificaciones*/}
                    {planificacionesCurso.length > 0?
                      !verAgregarPlanificacion && !verAgregarPlanificacionArchivo &&
                      planificacionesCurso.map((p, index) => (
                      <div key={index} onClick={() => setPlanificacion(p)}
                        style={{ cursor: 'pointer', width: '200px' }}
                        className={`card shadow p-3 me-1 ${
                            planificacion?.id === p.id 
                              ? 'border border-success border-3' 
                              : ''
                        }`}
                      >
                        <h7 className='small text-secondary'>{p.titulo? p.titulo : 'Sin título'}</h7>
                        <h6>{!p.orden.includes('S') ? mostrarNombre(p.orden) :''} {p.denominacion} {p.nombre_espacio}</h6>
                        <h7>cohorte {p.cohorte}</h7>
                        <div className='my-2 text-center'>
                          {p.archivo ? (
                            <a 
                            href={`${CONFIG.API_URL}/planificaciones/${p.archivo}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            >
                              <img 
                              src={`${CONFIG.API_URL}/img/${obtenerIcono(p.archivo)}`} 
                              alt="Archivo" 
                              className="img-fluid" 
                              width={'80px'}
                              />
                            </a>
                          ) : (
                            <span className="card texto_ch text-secondary p-1">
                            {p.introduccion ? p.introduccion : ''} 
                            </span>
                          )}
                          {(rol === "6" || rol === "5" || rol=== "2" || rol === 6 || rol === 5 || rol === 2 ) &&
                          <div className='d-grid gap-1 mt-2'>
                            <button 
                            type='button' 
                            className='mb-2 btn btn-sm btn-primary' 
                            onClick={() => {
                                setPlanificacion(p); // esto cambia la seleccionada
                                {!p.archivo? setVerAgregarPlanificacion(!verAgregarPlanificacion): setVerAgregarPlanificacionArchivo(!verAgregarPlanificacionArchivo)};
                              }}
                            >
                              <i className="fa-regular fa-calendar-plus"></i> Editar Planificación
                            </button>
                            {p.creado_por == loggedUserId &&
                              <button 
                              type='button'
                              className='mb-2 btn btn-sm btn-danger'
                              onClick={() => {
                                if(window.confirm('¿Confirma que desea eliminar esta planificación?')){
                                  eliminaPlanificacion('DELETE', {'id': p.id, 'tabla': 'planificaciones'});
                                }
                              }}
                              >
                                <i className="fa-solid fa-trash"></i> Eliminar Planificación
                              </button>
                            }
                            <span className='text-secondary small'> {p.creado_por == loggedUserId ? '-Yo la Carge-' : p.nombre_creador!=null ? p.nombre_creador + ' ' + p.apellido_creador : ''}</span>
                          </div>
                          }
                        </div>  
                      </div>
                      ))
                    :
                    <>
                      {!verAgregarPlanificacion && !verAgregarPlanificacionArchivo &&
                      <div className='text-center'>
                        <img width={350} src={`${CONFIG.BASE_URL}/img/2953962.jpg`} />
                      </div>
                      }
                    </>
                    }
                  </div>

                  <div className='row'>
                    <div className='d-none d-xl-block col-12 col-xl-2 col-xxl-3'></div>
                    <div className='col-12 col-xl-8 col-xxl-6'>
                      <div className='card-body'>
                        <div className='card-title'>
                          {/* si hay planificaciones y no se activo el formularios mostrar primera esta en verPlanificacion */}
                          {planificacionesCurso.length > 0 && !verAgregarPlanificacion && !verAgregarPlanificacionArchivo &&
                            <PLanificacionVista 
                            plan={planificacion}
                            />
                          }
                          {/* si se presiono agregar planificacion escrita*/}
                          {/* o si se presiono agregar planificacion por archivo*/}
                          {(verAgregarPlanificacion || verAgregarPlanificacionArchivo) && 
                              <PlanificacionForm 
                                planificacion={planificacion}
                                setVerAgregarPlanificacion={setVerAgregarPlanificacion}
                                verAgregarPlanificacion={verAgregarPlanificacion}
                                agregarPlanificacion={agregarPlanificacion}
                                datoBase={datoBase}
                                setPlanificacion={setPlanificacion}
                                setVerAgregarPlanificacionArchivo={setVerAgregarPlanificacionArchivo} 
                                verAgregarPlanificacionArchivo={verAgregarPlanificacionArchivo}
                              /> 
                          }
                        </div>
                      </div>
                    </div>
                    <div className='d-none d-xl-block col-12 col-xl-2 col-xxl-3'></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
     );
}

export default Planificacion;