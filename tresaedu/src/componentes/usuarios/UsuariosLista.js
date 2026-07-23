import './css/UsuariosLista.css';
import axios from 'axios';
import { Link, useParams, useLocation } from "react-router-dom";
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { show_alerta } from '../../funciones.js';
import { useNavigate } from "react-router-dom";


import UsuarioRoles from "./UsuarioRoles";
import UsuarioCrudForm from './UsuarioCrudForm.js';
import Roles from './Roles.js';
import CONFIG from '../../config.js';
import UsuarioBotoneraPermitida from './UsuarioBotoneraPermitida.js';

const URL_LISTAR = `${CONFIG.API_URL}/listarUsuarios.php`;
const URL = `${CONFIG.API_URL}/operarTablaUsuario.php`;

function UsuariosLista({ acceder, rol, rolSelect }) {
    const navigate = useNavigate();
    const rolRegistrado = localStorage.getItem('loggeduserRolId');
    const [buscar, setBuscar] = useState("");
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState({});

    const location = useLocation();
    const { userId } = useParams();

    //  inspeccionar el pathname para ver si llao la ruta cuotas
    const esRutaCuotas = location.pathname.includes("/Usuarios/Cuotas/");

    const [datoAEditar, setDatoAEditar] = useState(null);
    const [idUsuario, setIdUsuario] = useState(0);

    useEffect(() => {
        if (acceder) {
            if ((rol === null) || ((rol > 4) && (rol < 13))) {
                navigate("/");
            }
            //  if(((rol>=13) || (rolRegistrado>=13)) && (userId==0)){
            //    navigate("/");
            // }
            buscarRoles(rol);
        } else {
            localStorage.clear();
            rolSelect(null)
            navigate('/');
        }
    }, [rol])

    const buscarRoles = (rol) => {
        const dataR = { rol: userId, modo: 'buscarRoles' }
        axios.post(URL_LISTAR, dataR)
            .then(res => {
                if (!res.data.error) {
                    setRoles(res.data);
                    console.log('roles:', res.data);
                } else {
                    setRoles([]);
                }
            })
            .catch(err => {
                console.log(err);
            })
    }

    const crearData = (data) => {
        enviarSolicitud("POST", data);
    };

    const actualizarData = (data) => {
        console.log(data);
        enviarSolicitud("PUT", data);
    };

    const eliminarData = (id) => {
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Eliminar este usuario?',
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
                    enviarSolicitud('DELETE', { 'id': id })
                }
            });
    };

    const getUsuarios = () => {
        const data = {
            'id_rol': userId,
            'modo': 'buscaUsuariosPorRol'
        };
        axios.post(URL_LISTAR, data)
            .then(res => {
                if (!res.data.error) {
                    setUsuarios(res.data);
                } else {
                    setUsuarios([]);
                }
            })
            .catch(err => {
                console.log(err);
            });
    };

    useEffect(() => {
        getUsuarios();
    }, [userId]);

    const handleBuscar = (e) => {
        setBuscar(e.target.value);
    }

    //metodo de filtrado
    let resultado = [];
    if (!buscar) {
        resultado = usuarios;
    } else {
        const termino = buscar.toLowerCase();
        resultado = usuarios.filter((dato) => {
            return (
                (dato.nombre && dato.nombre.toLowerCase().includes(termino)) ||
                (dato.apellido && dato.apellido.toLowerCase().includes(termino)) ||
                (dato.usuario && dato.usuario.toLowerCase().includes(termino)) ||
                (dato.documento && dato.documento.toString().toLowerCase().includes(termino))
            );
        });
    }

    //constantes para paginacion
    const [paginaActual, setPaginaActual] = useState(1);
    const registrosPorPagina = 10;
    const ultimoIndice = paginaActual * registrosPorPagina;
    const primerIndice = ultimoIndice - registrosPorPagina;
    const registros = resultado.slice(primerIndice, ultimoIndice);
    const npaginas = Math.ceil(resultado.length / registrosPorPagina);

    const enviarSolicitud = async (metodo, parametros) => {
        await axios({ method: metodo, url: URL, data: parametros })
            .then(res => {
                var tipo = res.data[0];
                var msj = res.data[1];
                //  console.log(msj+'-'+tipo);
                show_alerta(msj, tipo);
                if (tipo === 'success') {
                    document.getElementById('btnCerrar').click();
                    getUsuarios();
                }
            })
            .catch(err => {
                show_alerta('Error en la solicitud ', 'error');
                console.log(err);
            })
    }

    const resetPassword = async (id) => {
        await axios({ method: 'PUT', url: URL, data: { id: id, modo: 'resetPassword' } })
            .then(res => {
                var tipo = res.data[0];
                var msj = res.data[1];
                show_alerta(msj, tipo);
            }
            )
            .catch(err => {
                show_alerta('Error en la solicitud ', 'error');
                console.log(err);
            })
    }


    return (
        <div className='container-principal'>
            <h4>
                {!esRutaCuotas && <Link className='btn btn-sm btn-outline-secondary me-2 mb-2' to={'/usuarios'}> <i className="fa-solid fa-backward"></i></Link>}
                {userId > 0 && `${roles.nombre}`} {userId == -1 && ` Sin rol asignado`} {userId == 0 && `Todos los Usuarios`}
            </h4>
            {userId == 0 ? (<button type="button" className='btn btn-outline-success me-2 mb-1' onClick={() => setDatoAEditar(null)} data-bs-toggle="modal" data-bs-target="#modalEditar" ><i className="fa-solid fa-circle-plus"></i> nuevo usuario</button>) : ''}

            <div className="input-group mb-3 mt-3 me-2">
                <span className="input-group-text" id="basic-addon1"><i className="fa-solid fa-magnifying-glass"></i></span>
                <input type="text" className="form-control border" id='buscar' name='buscar' value={buscar} onChange={handleBuscar} placeholder='buscar...' aria-label='buscar' aria-describedby='basic-addon1' />
            </div>
            <small>filtro <b>{resultado.length} / {usuarios.length}</b> </small>

            {rol == 13 && esRutaCuotas &&
                <div>
                    <button type='button' className='btn btn-danger mx-1'> cuota adeudadas</button>
                    <button type='button' className='btn btn-info'> todos</button>
                </div>
            }
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <div className="table-responsive">
                    <table className='table table-hover align-middle mb-0'>
                        <thead className='table-light text-muted'>
                            <tr>
                                <th className="fw-semibold px-3">Apellido</th>
                                <th className="fw-semibold">Nombre</th>
                                <th className="fw-semibold">Nom. usuario</th>
                                <th className="fw-semibold">Documento</th>
                                {userId == 0 && <th className="fw-semibold">Rol/es</th>}
                                <th className="fw-semibold text-center">Ficha</th>
                                {((userId == 0) && (rol != 13)) && <th className="fw-semibold text-end px-3">Acciones</th>}
                                {(userId == 7) && (rol != 13) && <th className="fw-semibold text-end px-3">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className='border-top-0'>
                            {!!registros &&
                                registros.map(u => (
                                    <tr key={u.id}>
                                        <td className="fw-medium px-3">{u.apellido}</td>
                                        <td>{u.nombre}</td>
                                        <td><span className="badge bg-light text-dark border fw-normal">{u.usuario}</span></td>
                                        <td className="text-secondary">{u.documento}</td>
                                        {userId == 0 && <td><UsuarioRoles id_usuario={u.id} rol={rol} /></td>}
                                        <td className="text-center">
                                            <button type="button" className='btn btn-sm btn-outline-info rounded-circle shadow-sm' onClick={() => navigate(`/Ficha/${u.id}`)} title="Ver ficha">
                                                <i className="fa-regular fa-id-card"></i>
                                            </button>
                                            {esRutaCuotas && rol == 13 && (
                                                <button 
                                                    type="button" 
                                                    className='btn btn-sm btn-outline-success ms-2 rounded-pill shadow-sm'
                                                    onClick={() => navigate('/Cuotas', { state: { estudianteId: u.id } })}
                                                    title="Ver cuotas del estudiante"
                                                >
                                                    <i className="fa-solid fa-money-bill-1-wave me-1"></i> Ver cuotas
                                                </button>
                                            )}
                                        </td>
                                        {((userId == 0) && (rol != 13)) && (
                                            <td className="text-end px-3">
                                                <div className="d-flex justify-content-end align-items-center gap-2">
                                                    <button type="button" className='btn btn-sm btn-outline-primary shadow-sm' onClick={() => setIdUsuario(u.id)} data-bs-toggle="modal" data-bs-target="#modalRoles" title="Asignar rol">
                                                        <i className='fa-solid fa-user-tag me-1'></i> Rol
                                                    </button>
                                                    <UsuarioBotoneraPermitida
                                                        rolLogeado={rol}
                                                        usr={u}
                                                        setIdUsuario={setIdUsuario}
                                                        setDatoAEditar={setDatoAEditar}
                                                        eliminarData={eliminarData} />
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            {registros.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="text-center py-4 text-muted">
                                        No se encontraron usuarios.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <nav className="d-flex justify-content-start mt-2">
                <ul className='pagination shadow-sm'>
                    <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                        <button className='page-link' onClick={prePage}>Anterior</button>
                    </li>
                    <li className='page-item disabled d-none d-md-block'>
                        <span className="page-link">Página {paginaActual} de {npaginas || 1}</span>
                    </li>
                    <li className={`page-item ${paginaActual === npaginas || npaginas === 0 ? 'disabled' : ''}`}>
                        <button className='page-link' onClick={nexPage}>Siguiente</button>
                    </li>
                </ul>
            </nav>

            {/* Modal para crear o editar usuario */}
            <div id="modalEditar" className="modal fade" aria-labelledby="modalUsuarios" aria-hidden="true">
                <div className='modal-dialog'>
                    <div className="modal-content">
                        <div className='modal-header'>
                            <h1 className="modal-title fs-5" id="ModalLabel"></h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className='modal-body'>

                            <UsuarioCrudForm crearData={crearData} actualizarData={actualizarData} datoAEditar={datoAEditar} setDatoAEditar={setDatoAEditar} />

                        </div>
                        <div className="modal-footer">
                            <button type="button" id='btnCerrar' className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para asignar roles */}
            <div id="modalRoles" className="modal fade" aria-labelledby="modalUsuarios" aria-hidden="true">
                <div className='modal-dialog'>
                    <div className="modal-content">
                        <div className='modal-header'>
                            <h1 className="modal-title fs-5" id="ModalLabel">Roles Disponibles</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className='modal-body'>
                            <Roles idUsuario={idUsuario} setUsuarios={setUsuarios} rol={rol} getUsuarios={getUsuarios} />
                        </div>
                        <div className="modal-footer">
                            <button type="button" id='btnCerrar2' className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para resetear contraseña */}
            <div id="modalResetPassword" className="modal fade" aria-labelledby="modalResetPassword" aria-hidden="true">
                <div className='modal-dialog'>
                    <div className="modal-content">
                        <div className='modal-header'>
                            <h1 className="modal-title fs-5" id="ModalLabel"> <i className="fa-solid fa-key"></i> Resetear Contraseña</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className='modal-body'>
                            <h5>¿Desea resetear la contraseña del usuario?</h5>
                            <p>La nueva contraseña será 123. Se recomienda cambiarla después de iniciar sesión.</p>
                            <button type="button" className='btn btn-sm btn-warning me-1' onClick={() => resetPassword(idUsuario)} data-bs-toggle="modal" data-bs-target="#modalResetPassword"><i className="fa-solid fa-key"></i> Resetear</button>
                        </div>
                        <div className="modal-footer">
                            <button type="button" id='btnCerrar2' className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
    function prePage() {
        if (paginaActual !== 1) {
            setPaginaActual(paginaActual - 1);
        }
    }
    function nexPage() {
        if (paginaActual !== npaginas) {
            setPaginaActual(paginaActual + 1);
        }
    }

}


export default UsuariosLista;