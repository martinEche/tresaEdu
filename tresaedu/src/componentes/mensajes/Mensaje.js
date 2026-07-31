import './css/Mensajes.css';
import axios from 'axios';
import { useState , useEffect} from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { show_alerta } from '../../funciones.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import MensajeAdjuntos from './MensajeAdjuntos';
import CONFIG from '../../config';
import MensajesCrudForm from './MensajesCrudForm';
import PerfilLogo from '../usuarios/PerfilLogo.js';
import { useFirebaseCounter } from '../../hooks/useFirebaseCounter';
import MensajesEliminados from './MensajesEliminados.js';
import MensajesGrupo from './MensajesGrupo.js';
import { RenderTexto } from './RenderTexto.js';

const URL_LISTAR_MENSAJES = `${CONFIG.API_URL}/listarMensajes.php`;
const URL_MENSAJES = `${CONFIG.API_URL}/operarMensajes.php`;

function Mensaje({acceder, rol, configuracion}){
    const navigate = useNavigate();
    const [responder, setResponder] = useState(false);
    const [respuestas, setRespuestas] = useState([]);
    const [mensaje, setMensaje] = useState({});
    const { mensajeId, origen, tipo } = useParams(); //se agrego tipo para saber si es mensaje directo o grupal (curso o grupo personalizado)
    const userId = localStorage.getItem('loggedUserId');
    //grupos
    const [nombreGrupo, setNombreGrupo] = useState('');
    const [imagenGrupo, setImagenGrupo] = useState('');
    const [denominacion, setDenominacion] = useState('');
    const [soyAdmin, setSoyAdmin] = useState(false);

    const [refreshGrupo, setRefreshGrupo] = useState(0); // <-- agregado
    const [estadoCurso, setEstadoCurso] = useState('Abierto');
    const [esGrupoPersonalizado, setEsGrupoPersonalizado] = useState(false);
    const [preload, setPreload] = useState(false);
    
    useEffect( ()=>{
        if(!acceder){
            localStorage.clear();
            navigate('/');
        }else{
            //chequear mensajesId si es negativo es un grupo personalizado 
            if(tipo==='G'){                
                setEsGrupoPersonalizado(true);
            }else{
                setEsGrupoPersonalizado(false);
            }
            const data= { 'id' :  mensajeId, 'tipo' : origen };
            console.log('Buscando mensaje con datos:', data);
            fetchMensaje(data);
        }
    },[mensajeId, tipo, origen]);

    useEffect(() => {
        if (responder) {
            window.scrollTo({
            top: 0,
            behavior: "smooth"
            });
        }
    }, [responder]);

    const fetchMensaje = async (dataInfo) => {
        try {
            const res = await axios.post(URL_LISTAR_MENSAJES, dataInfo);
            console.log('entro en fetch, Mensaje recibido:', res.data);
            if(!res.data.error){ 
                setMensaje(res.data.dato);
                buscaRespuestas();
            } else {
                setMensaje({});
            }
        } catch (err) {
            console.log(err);
        }
    };

    // escuchar cambios en el hilo de mensajes (ej: respuestas nuevas)
    //no escucha negativos porque son grupos personalizados y no tienen un hilo de mensajes tradicional, 
    // se actualizan a través de MensajesGrupo con la llave de refresh
    console.log('mensajeId en useFirebaseCounter:', mensajeId);
    useFirebaseCounter(
        //mensajeId && mensajeId > 0 ? `mensajes/thread_${mensajeId}` : null,
        //    () => {
        //        buscaRespuestas();
        //    }
        mensajeId ? `mensajes/thread_${mensajeId}` : null,
            () => {
                buscaRespuestas();
            }
    );

    // Scroll al formulario cuando 'responder' cambia a true
    useEffect(() => {
        if (responder) {
            const formulario = document.querySelector('.respuestaForm');
            formulario?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [responder]);

    const buscaRespuestas = async()=>{
        const dato= {
            'id' :  userId,
            'tipo' : mensajeId>=0 ? 'RESPUESTAS_2' : 'RESPUESTAS_GRUPO',
            'id_mensaje': mensajeId,
            'grupo_personalizado': esGrupoPersonalizado ? 'Si' : 'No'
        };
        console.log('Buscando respuestas con datos:', dato);
        try {
            const res = await axios.post(URL_LISTAR_MENSAJES, dato);
            console.log('Respuestas recibidas:', res.data);
            if(!res.data.error){
                setRespuestas(res.data);
            } else {
                setRespuestas([]);
            }
        } catch (err) {
            console.log(err);
        }
    };

    const enviarFormData = (data) => {
        //antes de enviar los datos controlo que  los archivos 
        // NO superen el limite permitido de 100MB para evitar errores en el servidor 
        // y mejorar la experiencia del usuario
        // LIMITE TOTAL 100MB
        const maxSize = 100 * 1024 * 1024;

        let totalSize = 0;

        for (let pair of data.entries()) {

            // Detectar archivos
            if (pair[1] instanceof File) {
                totalSize += pair[1].size;
            }
        }

        if (totalSize > maxSize) {
            show_alerta('Los archivos superan el máximo permitido de 100MB','error');
            setResponder(false);
            return;
        }

        enviarSolicitud("POST", data);
    };

    const eliminarMensaje = (id, tabla) => {
        let texto = 'Se envía a la papelera para eliminarlo definitivamente elimineló de ahí.';
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Seguro de eliminar el mensaje?',
            icon: 'question',
            text: texto,
            showCancelButton: true, confirmButtonText: 'Si, eliminar', cancelButtonText: 'Cancelar'
        })
            .then(res => {
                if (res.isConfirmed) {
                    enviarSolicitud('DELETE', { 'id': id, 'tabla': tabla })
                    //actualizar mensajes 
                    //mostrarMensajes('Recibidos');
                    
                } else {
                    show_alerta(' NO fue eliminado');
                }
            });
    };

    const enviarSolicitud = async (metodo, parametros) => {
        try {
            //console.log('Enviando mensaje...');
            setPreload(true);
            const res = await axios({ method: metodo, url: URL_MENSAJES , data: parametros });
            setPreload(false);
            console.log('Respuesta recibida:', res.data);
           if(metodo=='DELETE'){
                const [tipo, msj] = res.data;
                if (tipo === 'success') { 
                    show_alerta(msj, tipo);
                }
            }else{
                
                if(res.data.success){
                    show_alerta('Respuesta enviada', 'success');
                    
                    //notificacion a firebase
                    const datosFirebase = {
                            id_insertado: res.data.id_insertado,
                            recipient_usernames: res.data.recipient_usernames,
                            mensaje: res.data.mensaje,
                            asunto: res.data.asunto,
                            respuesta_a: res.data.respuesta_a
                    };
                    await axios.post(`${CONFIG.API_URL}/notificarFirebase.php`, datosFirebase);
                    //show_alerta('Notificación enviada', 'success');
                    //final notificacion firebase

                    buscaRespuestas();
                    setResponder(false);

                    // FORZAR refresh en MensajesGrupo para que se renderice inmediatamente
                    setRefreshGrupo(prev => prev + 1);
                } else {
                    console.log('Error en respuesta del servidor:', res.data);
                    show_alerta('Error al enviar respuesta', 'error');
                }
           }

        } catch (err) {
            console.log(err);
        }
    };
    
    return(
    <div className='container-principal'>
    {
        ((!mensaje || Object.keys(mensaje).length === 0 ) && !mensajeId < 0)? ( 
            <div className='m-3'><img className="img-fluid" src="https://media.tenor.com/On7kvXhzml4AAAAi/loading-gif.gif" /></div>
        ) 
        : 
        (
        <>
            {/* si el mensaje es grupal, hay dos tipo de grupal un curso/sala (id_curso>0) o personalizado (id_curso<0)*/}
            {/* cambio la forma de mostrar a modo estilo chat componente <MensajesGrupo> */}
            {/* tipo tambien indica el tipo de mensaje si es G o C es grupal si es D es directo*/}
            {(tipo!== 'D' || mensaje.id_curso > 0 || mensaje.id_curso < 0 ) ?  
                <div className='mb-2'>
                    <div className="chat-header d-flex align-items-center justify-content-between p-2 border-bottom">
                        {/* IZQUIERDA: grupo */}
                        <div className="d-flex align-items-center gap-2">
                            {/* boton volver a inbox */}
                            <div className='mb-1'>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/Mensajes')}>
                                    <i className="fa-solid fa-arrow-left"></i> <i className="fa-solid fa-inbox"></i>
                                </button>
                            </div>
                            <img 
                                src={imagenGrupo?
                                    `${CONFIG.API_URL}/${imagenGrupo}`
                                    :
                                    `${CONFIG.API_URL}/uploads/espacios/escudo_solo_instituto.png`
                                    }
                                alt="Grupo" 
                                className="grupo-img"
                            />
                            <div>
                                <div className="fw-bold small">
                                    {nombreGrupo}
                                    <span className={`badge ms-2 ${tipo === 'G' ? 'bg-info' : 'bg-warning'}`}>
                                        {tipo === 'G' ? 'Grupo personalizado' : 'Curso/Sala'}
                                    </span>
                                </div>
                                
                                <div className="text-muted small">
                                    Mensaje grupal:{denominacion}
                                </div>
                            </div>
                        </div>
                        {/* DERECHA: asunto */}
                        <div className="text-end">
                            <div className="small text-muted"></div>
                            <div className="fw-semibold">
                                {mensaje ? mensaje.asunto : 'Sin asunto'}
                            </div>
                        </div>
                    </div>
                    <MensajesGrupo 
                        rol={rol} 
                        userId={userId}
                        setSoyAdmin={setSoyAdmin}
                        soyAdmin={soyAdmin}
                        id_curso_grupo={mensaje.id_curso? mensaje.id_curso : (tipo=='C'? mensajeId*-1 : mensajeId)}
                        tipo={tipo} 
                        setNombreGrupo={setNombreGrupo}
                        setImagenGrupo ={setImagenGrupo}
                        setDenominacion={setDenominacion}
                        refreshKey={refreshGrupo} /* <-- pasa la llave de refresh */
                        configuracion={configuracion}
                        setEstadoCurso={setEstadoCurso}
                        responder={responder}
                        eliminarMensaje={eliminarMensaje}
                    />
                </div>
            :          
            <>
            {/* mensajes tipo correo */}
                <div className='mb-1'>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/Mensajes')}>
                        <i className="fa-solid fa-arrow-left"></i> <i className="fa-solid fa-inbox"></i>
                    </button>
                </div>
                {(mensajeId > 0 && mensaje) ? 
                <div className="m-3">
                    <h4><i className="fa-solid fa-envelope-open"></i> {mensaje.asunto}</h4>
                    <br />
                    <div className='row'>
                        <div className='col-sm-8 mensaje-de'>
                            <div className='row'>
                                <div className='col-1' ><PerfilLogo id={mensaje.id_usuario} version="logo_solo" configuracion={configuracion} /></div>
                                <div className='col' >
                                    {mensaje.nombre} {mensaje.apellido} <span className='mensaje-de-usuario'>({mensaje.de})</span>
                                    <div className='mensaje-para'>para:{mensaje.para}</div>
                                </div>
                            </div>
                        </div>
                        <div className='col-sm-4 mensaje-fecha'>
                            {mensaje.fecha}
                        </div>
                    </div>
                    
                    <p className='pt-2 mensaje-original'><RenderTexto texto={mensaje.mensaje} /></p>
                    <hr />
                    <div className='text-center'>
                    { mensaje.adjunto =='Si' ? <><MensajeAdjuntos mensaje_id={mensaje.id_mensaje} /> </>: '' }
                    </div>
                </div>
                : 
                <div className='m-3'>Cargando mensaje...</div>
                }

                {/* muestro respuestas para el mensaje porque es Directo tipo 'D' armo hilo */}
                <div>
                {mensajeId>0 &&respuestas.length > 0 && 
                    <div className='ms-4'>
                        <h5>Respuestas:</h5>
                        {respuestas.map((mr, index)=>
                            <div key={index}>
                                <div  className='row'>
                                    <div className='col-1' ><PerfilLogo id={mr.id_u} version="logo_solo" configuracion={configuracion} /></div>
                                    <div className='col' >
                                        {`${mr.de} <<${mr.nombre}, ${mr.apellido}>>`}
                                        <div className='mensaje-para'><strong>Para:</strong>{mr.para}</div>
                                    </div>
                                </div>
                                <p className='mensaje-respuesta'><RenderTexto texto={mr.mensaje} /></p>
                            </div>
                        )}
                    </div>
                }
                </div>
            </>
            }
            {/*si hay que responder/escribir muestro el formulario para escribir y enviar el mensaje*/}
            {responder?
                <div className='respuestaForm '>
                {/* IMPORTANTE: la clave esta en el para_r que se arma dependiendo si es mensaje directo o grupal,*/}
                {/* si es grupal arranca con @ va con @curso o @grupo y el id para que sepa a donde enviar el mensaje */}
                {/* si es G o sea grupo personalizado envio mensajeId como esta o sea negativo */} 
                {/* si es C lo invierto y lo envio positivo */}
                {/* y si es directo va con el usuario destinatario */}
                    <MensajesCrudForm 
                    enviarFormData={enviarFormData} 
                    respuesta_a={mensaje.id_curso === 0?mensajeId:0} 
                    para_r={mensaje.id_curso === 0? 
                        `${mensaje.de} <<${mensaje.nombre} ${mensaje.apellido}>>,`
                        : `@${tipo=='C'? 'curso' : 'grupo'}, cohorte, #${mensaje.id_curso? mensaje.id_curso : (tipo=='C'? mensajeId*-1 : mensajeId)}`
                        }
                    asunto_r={`${mensaje.asunto?mensaje.asunto:'Sin asunto'}`} 
                    llamoNuevo={false}
                    cerrarModal={setResponder}
                    preload={preload}
                    />
                </div>
            :
            
            <div>
                {/* veo que tipo de boton de respuesta muestro o si no lo muestro*/}
                <div className='Pie-mensaje'>
                {(estadoCurso === 'Abierto')?                  
                    <a href="#" className='btn btn-outline-secondary m-1' onClick={()=>setResponder(true)}>
                    {mensaje.id_curso === 0 ? 
                        <>
                            <i className="fa-solid fa-reply">Responder</i> 
                        </>
                        : 
                        <> 
                            <i className="fa-solid fa-pencil"></i> escribir
                        </>
                    } 
                    </a>
                :
                <div className='alert alert-danger m-1'>
                    <i className="fa-solid fa-lock"></i> Curso cerrado, no puedes enviar mensajes
                </div>
                }
                    {/* <a href="#" className='btn btn-outline-secondary'><i className="fa-regular fa-trash-can"></i></a> */}
                </div>
            </div>
            }
        </>
        )
    }   
    </div>
    )
}
export default Mensaje;