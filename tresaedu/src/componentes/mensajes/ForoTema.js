import React, { useEffect, useState } from 'react';
import { obtenerTemaPorId, responderTema } from '../../servicios/forumService';
import { show_alerta } from '../../funciones.js';
import ForoRespuestaForm from './ForoRespuestaForm';
import PerfilLogo from '../usuarios/PerfilLogo.js';
import ForoArchivos from './ForoArchivos.js';
import Respuesta from './Respuesta';

function ForoTema({ id, editar, configuracion }) {
    const usuario_id = localStorage.getItem('loggedUserId'); //obtener el usuario que esta actualmente activo
    const [tema, setTema] = useState(null);
    const [respuestas, setRespuestas] = useState([]);
    const [verResponder, setVerResponder] = useState(false);
    const [responderA, setResponderA] = useState(null);

    useEffect(() => {
        obtenerTema();
    }, [id]);

    const obtenerTema = async () => {
        const data = await obtenerTemaPorId(id);
        setTema(data);
        setRespuestas(data.respuestas || []); // las respuestas vienen con el tema las separo en otro hook
    };

    const responder = async (formData) => {
        try {
            const res = await responderTema(formData);
            const [tipo, msj] = res.data;
            show_alerta(msj, tipo);
            setVerResponder(false);
            setResponderA(null);
            obtenerTema();
        } catch (err) {
            show_alerta('Error en la solicitud', 'error');
        }
    };

    return (
        <div>
            {tema && (
                <>
                    <div className='tema-card'>
                        <div className='card-body'>
                            <div className='row'>
                                <div className='col-12 col-sm-11'>
                                    <PerfilLogo id={tema.id_usuario} version="foro" fecha={tema.fecha_creacion_tema} configuracion={configuracion}/>
                                </div>
                            </div>
                            <hr />
                            <div>
                                <h3>{tema.tema}</h3>
                                <p>{tema.contenido}</p>
                                <ForoArchivos id_foro_tema={tema.id} id_foro_respuesta={0} />

                                {!verResponder || responderA !== null ? (
                                  <>
                                    <button type='button' className='btn btn-sm btn-primary' onClick={() => { setVerResponder(true); setResponderA(null); }}>Responder</button>
                                    {tema.id_usuario==usuario_id && <button type='button' className='btn btn-sm btn-outline-warning ms-2' onClick={() => editar(tema)}><i className="fa-regular fa-pen-to-square"></i></button>}
                                  </>  
                                ) : (
                                    <ForoRespuestaForm temaId={tema.id} responder={responder} setVerResponder={setVerResponder} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4>Respuestas</h4>
                        <div className='ps-4'>
                            {respuestas && respuestas.map((respuesta) => (
                                <Respuesta
                                    key={respuesta.id}
                                    respuesta={respuesta}
                                    temaId={tema.id}
                                    responder={responder}
                                    verResponder={verResponder}
                                    setVerResponder={setVerResponder}
                                    responderA={responderA}
                                    setResponderA={setResponderA}
                                    configuracion={configuracion}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ForoTema;
