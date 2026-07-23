import { useEffect, useState } from "react";
import '../css/InscripcionExterna.css';
import InscripcionExternaForm from "./InscripcionExternaForm";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { show_alerta } from '../../funciones.js';

import axios from 'axios';

import CONFIG from '../../config';
const URL_INFO = `${CONFIG.API_URL}/info_principal_tutor.php`;

function InscripcionExterna({ logeado, esInscripcion, setEsInscripcion, configuracion }) {
    const { codigo } = useParams();
    const [verFormRegistro, setVerFormRegistro] = useState(false);
    const [curso, setCurso] = useState('');
    const [estudiantesACargo, setEstudiantesACargo] = useState([]);

    const navigate = useNavigate();
    const datosUser = JSON.parse(localStorage.getItem('loggeddatosuser'));
    const loggeduserId =localStorage.getItem('loggedUserId');

    useEffect(() => {
        setEsInscripcion(true);
        BuscaCursoConCodigo(codigo)
        console.log("logeado?:"+logeado);
        if(logeado){
          buscaInfoVinculacion();
        }
    }, [logeado]);

    const BuscaCursoConCodigo = async (cod) => {
      try {
        const response = await axios.get(`${CONFIG.API_URL}/operarCursos.php?codigo=${cod}`);
       // console.log("dd:"+JSON.stringify(response.data.curso));
        if (response.data.resultado) {
            setCurso(response.data.curso)
        }
      } catch (err) {
        console.log(err);
      }
    }

    const inscribirUsuario = async () =>{
      try {
        const response = await axios.post(`${CONFIG.API_URL}/operarCursos.php`,{'modo':'inscribirPorCodigo', 'id_usuario': datosUser.id, 'codigo':codigo});
          var tipo = response.data[0];
          var msj = response.data[1];
          show_alerta(msj,tipo);
          if(tipo=='success'){
           navigate("/")
          }
      } catch (err) {
       //alert(err);
      }
    }

    const c = curso; // Dado que ahora `curso` es un objeto
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
    }

    const buscaInfoVinculacion = () => {
      axios.get(`${URL_INFO}?id_tutor=${loggeduserId}`)
          .then(res => {
              if (!res.data.error) { 
                  console.log(res.data.datos);
                  setEstudiantesACargo(res.data.datos);
              } else {
                  setEstudiantesACargo([]);
                  console.log(res.data.mensaje);
              }
          })
          .catch(err => {
              console.log(err);
          });
    };

    return (
        <div className="fondo-inscripciones py-5" 
          style={{
            background: configuracion.color_secundario,
            background: `linear-gradient(59deg, ${configuracion.color_secundario} 20%, ${configuracion.color_terciario} 49%, ${configuracion.color_principal} 100%)`
          }}>
            <div className="container-principal">
                <h1 className="titulo-inscripcion text-center my-3">Bienvenida/o al módulo de autogestión de la inscripción.</h1>
                <div className="alert alert-success" role="alert">
                    Inscripcion al curso <strong>{mostrarNombre(c.orden)} "{c.denominacion}" ciclo: {c.cohorte}</strong>.
                </div>  
                {!logeado && verFormRegistro && 
                <div className="alert alert-info" role="alert"><p>Ingrese en primer lugar los datos personales del tutor y a continuacion los/as del estudiantes a inscribir en el curso.</p>
                </div>
                 }
                {!verFormRegistro ?
                    <div className="row ">
                        {logeado ?
                          <div className="col-12 my-2 d-flex justify-content-center">
                            {estudiantesACargo.length ===0 && 
                            <div>
                              <div>
                                <button className="btn-original1" 
                                onClick={() =>inscribirUsuario()}
                                style={{
                                    '--color-prin': configuracion.color_principal,
                                    '--color-sec': configuracion.color_secundario,
                                    '--color-terc': configuracion.color_terciario,
                                }}
                                >
                                  <img src={`${CONFIG.API_URL}/img/${configuracion.logo_chico}`}  className="me-3" width={'40px'} />
                                  Inscribir al curso
                                </button>
                              </div> 
                              <div className="alert alert-info mt-4 me-4">No posee menor a cargo</div>
                            </div>
                              
                            } 
                            {estudiantesACargo.length !=0 && estudiantesACargo.map((e)=>(
												      <div key={e.estudiante_id}>
													      <button className="btn-original1"
                                style={{
                                    '--color-prin': configuracion.color_principal,
                                    '--color-sec': configuracion.color_secundario,
                                    '--color-terc': configuracion.color_terciario,
                                }}
                                >
                                  <img src={`${CONFIG.API_URL}/img/${configuracion.logo_chico}`} onClick={() =>inscribirUsuario({})} className="me-3" width={'40px'} />Inscribir a <strong>{e.nombre}, {e.apellido}</strong> al curso</button>
												      </div>
											      ))}
                          </div>
                        :
                          <>
                            <div className="col-12 col-sm-6 my-2 ">
                              <h4 className="d-flex justify-content-center">No tengo cuenta en la plataforma</h4>
                                <div className="d-flex justify-content-center">
                                  <button className="btn-original1"
                                  style={{
                                    '--color-prin': configuracion.color_principal,
                                    '--color-sec': configuracion.color_secundario,
                                    '--color-terc': configuracion.color_terciario,
                                  }}
                                  onClick={() => setVerFormRegistro(true)}
                                >
                                  <img src={`${CONFIG.API_URL}/img/${configuracion.logo_chico}`} className="me-3" width={'40px'} /> Crear cuenta e inscribir
                                </button>
                                </div>
                            </div>
                            <div className="col-12 col-sm-6 my-2 ">
                              <h4 className="d-flex justify-content-center">Si ya tenes cuenta en la plataforma.</h4>
                              <div className="d-flex justify-content-center">
                                <button className="btn-original1" 
                                  style={{
                                    '--color-prin': configuracion.color_principal,
                                    '--color-sec': configuracion.color_secundario,
                                    '--color-terc': configuracion.color_terciario,
                                  }}
                                  onClick={() => {setEsInscripcion(false); navigate("/")}}
                                >
                                  <img src={`${CONFIG.API_URL}/img/${configuracion.logo_chico}`} className="me-3" width={'40px'} /> Ingresar a la cuenta y volve a escanear el QR
                                </button>
                              </div>
                            </div>
                          </>
                        }
                    </div>
                    :
                     <InscripcionExternaForm setVerFormRegistro={setVerFormRegistro} codigo={codigo} />   
                }
                
            </div>
        </div>
    );
}

export default InscripcionExterna;
