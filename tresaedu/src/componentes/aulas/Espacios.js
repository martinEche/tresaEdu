import './css/Aulas.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import EspacioCrudForm from './EspacioCrudForm';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config';

const URL_FORMACION = `${CONFIG.API_URL}/operarFormacion.php`;

function Espacios({ id_formacion, nivel, configuracion }) {
  const [espacios, setEspacios] = useState([]);
  const [datoEditar, setDatoEditar] = useState(null);
  const [espaciosRaiz, setEspaciosRaiz] = useState([]);
  const [subEspaciosMap, setSubEspaciosMap] = useState({});
  const [ordenGeneral, setOrdenGeneral] = useState([]);
  const [ordenMostrar, setOrdenMostrar] = useState(0);
  const Rol = parseInt(localStorage.getItem('loggeduserRolId'), 10);
  const [nombreEstructura, setnombreEstructura] = useState('Espacio/s');
  const cargaHoraria = espacios.reduce(
    (acum, esp) => acum + Number(esp.horas || 0),
    0
  );

  const data = {
    'id': id_formacion,
    'modo': 'buscarEspaciosID'
  };

  // Función para obtener los datos
  const obtenerDatos = async () => {
    try {
      const res = await axios.post(URL_FORMACION, data);
      if (!res.data.error) {
        setEspacios(res.data);
        const rootSpaces = res.data.filter((dato) => !dato.correspondencia || dato.correspondencia == 0 || dato.correspondencia == -1);
        console.log('datos:', rootSpaces);
        setEspaciosRaiz(rootSpaces);

        //agrupa los ordenes para  hacer el selector de ordenes y mostrar los espacios ordeandos
        const SelectorOrden = [...new Set(res.data.map(item => item.orden))].map(orden => ({ orden }));
        console.log('ordenes:', SelectorOrden);
        setOrdenGeneral(SelectorOrden);

        const subSpacesMap = res.data.reduce((acc, dato) => {
          if (dato.correspondencia && dato.correspondencia > 0) {
            if (!acc[dato.correspondencia]) {
              acc[dato.correspondencia] = [];
            }
            acc[dato.correspondencia].push(dato);
          }
          return acc;
        }, {});
        setSubEspaciosMap(subSpacesMap);
      } else {
        setEspacios([]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {

    switch (nivel) {
      case 6:
        setnombreEstructura('Módulo/s');
        break;
      case 7:
        setnombreEstructura('Módulo/s');
        break;
      default:
        setnombreEstructura('Espacio');
    }

    obtenerDatos();
  }, [id_formacion]);

  useEffect(() => {
    ordenMostrar != 0 &&
      setEspaciosRaiz(espacios.filter((dato) => (!dato.correspondencia || dato.correspondencia == 0 || dato.correspondencia == -1) && dato.orden === ordenMostrar));
  }, [ordenMostrar, espacios]);

  const enviarFormData = (data) => {
    enviarSolicitud("POST", data);
  };


  const eliminarEspacio = (id) => {
    const MySwal = withReactContent(Swal);
    MySwal.fire({
      title: '¿Eliminar este espacio?',
      html: '<span class="text-muted">Esta acción no se puede deshacer.</span>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '<i class="fa-solid fa-trash-can"></i> Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-danger mx-2 shadow-sm',
        cancelButton: 'btn btn-outline-secondary mx-2',
        popup: 'rounded-4 shadow'
      },
      buttonsStyling: false
    })
      .then(res => {
        if (res.isConfirmed) {
          enviarSolicitud('DELETE', { 'id': id, 'tabla': 'espacios' })
        }
      });
  };

  const enviarSolicitud = async (metodo, parametros) => {
    try {
      const res = await axios({ method: metodo, url: URL_FORMACION, data: parametros });
      console.log("datooos:", res.data);
      const tipo = res.data[0];
      const msj = res.data[1];
      console.log(res.data);
      show_alerta(msj, tipo);
      if (tipo === 'success') {
        document.getElementById('btnCerrar').click();
        obtenerDatos(); // Llamar a fetchData después de una operación exitosa
      }
    } catch (err) {
      // show_alerta('Error en la solicitud', 'error');
      console.log(err);
    }
  };
  const mostrarNombre = (orden) => {
    let nombre = "";
    switch (orden) {
      case "S2":
        nombre = 'Sala de 2';
        break
      case "S3":
        nombre = 'Sala de 3';
        break
      case "S4":
        nombre = 'Sala de 4';
        break
      case "S5":
        nombre = 'Sala de 5';
        break
      case "In":
        nombre = 'Espacio Institucional';
        break
      default:
        nombre = orden + '°';
    }
    return nombre
  }

  return (
    <>
      <div>
        <h5>{nombreEstructura} {espaciosRaiz.length} - carga horaria: {cargaHoraria} hs.</h5>
        {(Rol === '1' || Rol === 1 || Rol === '2' || Rol === 2) &&
          <button
            type='button'
            className='btn btn-sm btn-outline-success my-2'
            onClick={() => setDatoEditar(null)}
            data-bs-toggle="modal"
            data-bs-target="#modalNuevoEspacio"
          >
            <i className='fa-solid fa-circle-plus'></i> Nuevo {nombreEstructura.split('/')[0]}
          </button>}
      </div>
      {ordenGeneral.map(item => (
        <button
          key={item.orden}
          type='button'
          className='btn btn-sm btn-outline-info me-1'
          onClick={() => setOrdenMostrar(item.orden)}
        >
          {item.orden} °
        </button>
      ))}
      {espaciosRaiz.length !== 0 ?
        <table className="table table-hover align-middle mt-3">
          <thead className="table-light">
            <tr>
              <th className="col-1 text-center text-muted">#</th>
              <th className="col-9 text-muted">Espacio Curricular</th>
              <th className="col-2 text-end text-muted">Acciones</th>
            </tr>
          </thead>
          <tbody className="border-top-0">
            {espaciosRaiz.map(esp => (
              <tr key={esp.id} >
                <td className='text-center fw-semibold text-secondary'>{mostrarNombre(esp.orden)}</td>
                <td>
                  {/* si tienen un subesepacio asociado */}
                  {esp.correspondencia == -1 ?
                    <div className="py-2">
                      <h6 className="fw-bold mb-1">{esp.nombre_espacio} <span className="text-muted small">({esp.id})</span></h6>
                      <span className="text-secondary small">{esp.horas === 0 ? '' : `${esp.horas} hs.`} {esp.dictado}</span>
                      <div className="mt-2">
                        {subEspaciosMap[esp.id] && subEspaciosMap[esp.id].map(subEsp => (
                          <div className='d-flex justify-content-between align-items-center bg-light border rounded px-3 py-2 mb-2' key={subEsp.id} >
                            <div className='small fw-medium text-dark'>
                              <i className="fa-solid fa-level-up-alt fa-rotate-90 text-muted me-2"></i>
                              {subEsp.nombre_espacio} <span className="text-muted">({subEsp.id})</span>
                            </div>
                            <div>
                              <div className="btn-group shadow-sm">
                                <button className='btn btn-sm btn-outline-secondary' title="Editar" onClick={() => setDatoEditar(subEsp)} data-bs-toggle="modal" data-bs-target="#modalNuevoEspacio"><i className='fa-solid fa-pencil'></i></button>
                                <button type='button' className='btn btn-sm btn-outline-danger' title="Eliminar" onClick={() => eliminarEspacio(subEsp.id)}><i className='fa-solid fa-trash-can'></i></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    : <div className='d-flex align-items-center py-2'>
                      {esp.imagen ?
                        <img src={`${CONFIG.API_URL}/${esp.imagen}`} alt="Preview"
                          className="rounded-3 shadow-sm object-fit-cover"
                          style={{ width: "60px", height: "60px" }}
                        />
                        :
                        <img src={`${CONFIG.API_URL}/img/${configuracion.imagen_fondo}`} alt="Preview"
                          className="rounded-3 shadow-sm object-fit-cover"
                          style={{ width: "60px", height: "60px" }}
                        />
                      }
                      <div className='ms-3'>
                        <h6 className="fw-bold mb-1">{esp.nombre_espacio} <span className="text-muted small">({esp.id})</span></h6>
                        <span className="text-secondary small">{esp.horas === 0 ? '' : `${esp.horas} hs.`} {esp.dictado && `- ${esp.dictado}`}</span>
                      </div>
                    </div>
                  }
                </td>
                <td className='text-end'>
                  <div className="btn-group shadow-sm">
                    <button className='btn btn-sm btn-outline-secondary' title="Editar" onClick={() => setDatoEditar(esp)} data-bs-toggle="modal" data-bs-target="#modalNuevoEspacio"><i className='fa-solid fa-pencil'></i></button>
                    {(Rol === 1 || Rol === 2) && <button type='button' className='btn btn-sm btn-outline-danger' title="Eliminar" onClick={() => eliminarEspacio(esp.id)}><i className='fa-solid fa-trash-can'></i></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        : <><hr /><span className='formacion-texto-sin_resultados'>Sin {nombreEstructura}</span><hr /></>}

      <div id="modalNuevoEspacio" className="modal fade" aria-labelledby="modalNuevoEspacio" aria-hidden="true">
        <div className='modal-dialog modal-lg'>
          <div className="modal-content">
            <div className='modal-header'>
              <h1 className="modal-title fs-5" id="ModalLabel">{nombreEstructura.split('/')[0]}</h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className='modal-body'>
              <EspacioCrudForm enviarFormData={enviarFormData} espacios={espacios} id_formacion={id_formacion} nombreEstructura={nombreEstructura} datoEditar={datoEditar} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Espacios;
