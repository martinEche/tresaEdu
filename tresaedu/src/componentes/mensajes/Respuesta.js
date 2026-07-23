import './css/Foros.css'
import React, { useState } from 'react';
import PerfilLogo from '../usuarios/PerfilLogo.js';
import { eliminarRespuesta } from '../../servicios/forumService';
import ForoArchivos from './ForoArchivos.js';
import ForoRespuestaForm from './ForoRespuestaForm.js';
import { show_alerta } from '../../funciones.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

function Respuesta({ respuesta, temaId, responder, verResponder, setVerResponder, responderA, setResponderA, configuracion }) {
    const usuario_id = localStorage.getItem('loggedUserId'); //obtener el usuario que esta actualmente activo
    const [mostrarSubrespuestas, setMostrarSubrespuestas] = useState(false);

    const toggleSubrespuestas = () => {
        setMostrarSubrespuestas(!mostrarSubrespuestas);
    };

    const eliminarR = async (idRespuesta) => {
        const MySwal = withReactContent(Swal);
        const res1 = await MySwal.fire({
          title: '¿Seguro de eliminar su respuesta?',
          icon: 'warning',
          html: '<span class=\"text-muted\">No se podrá dar marcha atrás</span>',
          showCancelButton: true,
          confirmButtonText: '<i class="fa-solid fa-trash-can"></i> Si, eliminar',
          cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-danger mx-2 shadow-sm',
                cancelButton: 'btn btn-outline-secondary mx-2',
                popup: 'rounded-4 shadow'
            },
            buttonsStyling: false
        });
    
        if (res1.isConfirmed) {
            try {
              const res = await eliminarRespuesta(idRespuesta);
              console.log(res.data)
              const tipo = res.data[0];
              const msj = res.data[1];
              show_alerta(msj, tipo);
            } catch (err) {
              show_alerta('Error en la solicitud', 'error');
              console.log(err);
            }
        }
      };

    return (
        <div className='respuesta-card ms-2'>
            <div className='card-body'>
                <div className='row'>
                    <div className='col-12 col-sm-11'>
                        <PerfilLogo id={respuesta.id_usuario} version="foro" fecha={respuesta.fecha_creacion}configuracion={configuracion} />
                    </div>
                </div>
                <hr />
                <p>{respuesta.contenido}</p>
                <ForoArchivos id_foro_tema={respuesta.id_foro_tema} id_foro_respuesta={respuesta.id} />
                {!verResponder || responderA !== respuesta.id ? (
                    <>
                        <button type='button' className='btn btn-sm btn-primary' onClick={() => { setVerResponder(true); setResponderA(respuesta.id); }}>Responder</button>
                        {respuesta.id_usuario==usuario_id &&<button type='button' className='btn btn-sm btn-outline-danger ms-2' onClick={()=>eliminarR(respuesta.id)} ><i className="fa-regular fa-trash-can"></i></button>}
                    </>
                ) : (
                    <ForoRespuestaForm temaId={temaId} respuestaId={respuesta.id} responder={responder} setVerResponder={setVerResponder} />
                )}
                
                {respuesta.subrespuestas && respuesta.subrespuestas.length > 0 && (
                    <>
                        <div className='d-flex justify-content-start mt-3'>
                            <button type='button' className='respuesta-btn' onClick={toggleSubrespuestas}>
                                {mostrarSubrespuestas ? 'Ocultar respuestas' :<> {respuesta.subrespuestas.length} respuesta</>}
                            </button>
                        </div>
                        {mostrarSubrespuestas && (
                            <div className='subrespuestas'>
                                {respuesta.subrespuestas.map((subrespuesta) => (
                                    <Respuesta
                                        key={subrespuesta.id}
                                        respuesta={subrespuesta}
                                        temaId={temaId}
                                        responder={responder}
                                        verResponder={verResponder}
                                        setVerResponder={setVerResponder}
                                        responderA={responderA}
                                        setResponderA={setResponderA}
                                        configuracion={configuracion}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Respuesta;
