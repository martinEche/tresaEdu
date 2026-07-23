import { useEffect, useState } from 'react';
import './css/Foros.css'
import { eliminarTema } from '../../servicios/forumService';
import { show_alerta } from '../../funciones.js';
import ForoTemaForm from './ForoTemaForm';
import ForoTema from './ForoTema';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

function Foro({ rol, clase, temas, setTemas, fetchTemas, configuracion }) {
  const usuario_id = localStorage.getItem('loggedUserId'); //obtener el usuario que esta actualmente activo
  const [verNuevoTema, setVerNuevoTema] = useState(false);
  const [temaSeleccionado, setTemaSeleccionado] = useState(0);
  const [temaEdita, setTemaEdita] = useState(null);

  const cerrarTemas =() =>{
    setTemaSeleccionado(0);
  }
  const crear = () => {
    setTemaEdita(null);
    setVerNuevoTema(!verNuevoTema);
  };

  const editar = (tema) => {
    setTemaEdita(tema);
    setVerNuevoTema(!verNuevoTema);
  };

  const eliminar = async (idTema) => {
    const MySwal = withReactContent(Swal);
    const res1 = await MySwal.fire({
      title: '¿Seguro de eliminar el tema?',
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
      const res2 = await MySwal.fire({
        title: 'Todas las respuestas al tema seran eliminadas ¿Seguro continuar con la eliminacion?',
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

      if (res2.isConfirmed) {
        try {
          const res = await eliminarTema(idTema);
          //console.log(res.data)
          const tipo = res.data[0];
          const msj = res.data[1];
          show_alerta(msj, tipo);
          setTemas([]);
          fetchTemas()
        } catch (err) {
          show_alerta('Error en la solicitud', 'error');
          console.log(err);
        }
      }
    }
  };

  return (
    <div className='mt-1'>
      <div className='row'>
        <div className="col-12 ">
          <div className='card mb-4 alert alert-light'>
            <div className='card-body'>
              <div className='row mb-3'>
              {(rol==6 || rol==5 || rol ==9 || rol==11)&&    
                <div className='col-12 col-sm-8'>
                  <h4>Temas foro: {clase.titulo_corto} </h4>
                </div>
              }
                <div className='col-12 col-sm-4 d-flex justify-content-end'>
                  {(rol==6 || rol==5 || rol ==9 || rol==11)&& 
                    <>
                    {!verNuevoTema &&
                      <button type='button' className='btn btn-sm btn-success' onClick={() => crear()}>
                        {!verNuevoTema ? '+ tema' : 'Cancelar nuevo tema'}
                      </button>
                    }
                    
                    {temaSeleccionado!=0 &&
                      <button type='button' className='btn btn-sm btn-secondary ms-1'
                      onClick={() => cerrarTemas()}>
                        CerrarTema
                      </button>
                    }
                    </>
                  }
                </div>
              </div>
              {!verNuevoTema ?
                <div>
                  {(rol==6 || rol==5 || rol ==9 || rol==11)?  
                    <table className='table table-hover table-sm'>
                      <thead>
                        <tr>
                          <th className='small'>#</th>
                          <th className='small'>Tema</th>
                          <th className='small'>Respuestas</th>
                          <th className='small'>Última respuesta</th>
                          <th className='small'>Estado</th>
                          <th className='small'>Acc.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {temas.length > 0 ? 
                          temas.map(tema => (
                            <tr className='small' key={tema.id} >
                              <td className='small'>{tema.id}</td>
                              <td className='small'> 
                                <div className='row'>
                                  <span className='tema-foro me-2' onClick={() => setTemaSeleccionado(tema.id)}>
                                    {tema.tema} {tema.archivos.length!=0 && <i className="fa-solid fa-paperclip"></i>}
                                  </span>
                                </div>
                                <div className='row'><span className='small'>{tema.fecha_creacion_tema}</span></div>
                              </td>
                              <td className=''>{tema.num_respuestas}</td>
                              <td className='small'>{!tema.fecha_ultima_respuesta ? '-' : tema.fecha_ultima_respuesta}</td>
                              <td className='small'>{tema.f_cerrado ? 'Abierto' : `cerrado el ${tema.f_cerrado}`}</td>
                              <td>
                                {usuario_id==tema.id_usuario &&
                                <>
                                  <button type='button' className='btn btn-sm btn-outline-warning ms-2' onClick={() => editar(tema)}><i className="fa-regular fa-pen-to-square"></i></button>
                                  <button type='button' className='btn btn-sm btn-outline-danger ms-2' onClick={()=>eliminar(tema.id)} ><i className="fa-regular fa-trash-can"></i></button>
                                </>}
                              </td>
                            </tr>
                          ))
                          :
                          <tr><td colSpan={8}>No hay temas</td></tr>
                        }
                      </tbody>
                    </table>
                  :
                    <> 
                      {temas.length > 0 && 
                        temas.map(tema => (
                          <div className='row' key={tema.id}> 
                          <div className='texto-foro-clase'>Foro/s de la clase</div>
                            <span className='tema-foro me-2' onClick={() => setTemaSeleccionado(tema.id)}>
                              <i className="fa-regular fa-message me-1"></i>
                              {tema.tema} {tema.archivos.length!=0 && <i className="fa-solid fa-paperclip"></i>}
                            </span>
                            <span className='small'>{tema.fecha_creacion_tema}</span>
                            {temaSeleccionado!=0 &&
                              <button type='button' className='btn btn-sm btn-secondary' onClick={() => cerrarTemas()}>
                                Ocultar tema
                              </button>
                            }
                          </div>
                        ))
                      }
                    </> 
                  }
                  {!(temaSeleccionado === 0) && <ForoTema id={temaSeleccionado} editar={editar} configuracion={configuracion} />}
                </div>
                :
                <ForoTemaForm
                  temaEdita={temaEdita}
                  clase={clase} 
                  setVerNuevoTema={setVerNuevoTema} 
                  setTemas={setTemas} 
                  fetchTemas={fetchTemas}
                />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Foro;
