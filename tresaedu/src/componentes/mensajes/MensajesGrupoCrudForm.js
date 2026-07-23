import './css/Mensajes.css';
import { useEffect, useState } from "react";
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config';

const URL_USUARIOS = `${CONFIG.API_URL}/operarTablaUsuario.php`;
const URL_GRUPOS = `${CONFIG.API_URL}/operarGrupos.php`;


function MensajesGrupoCrudForm({ enviarFormData, editarGrupoID, cursos = []  }) {
    
    const [nombreGrupoPersonalizado, setNombreGrupoPersonalizado] = useState('');
    const [descripcionGrupo, setDescripcionGrupo] = useState('');
 
    const loggeduserRolId = localStorage.getItem('loggeduserRolId');
    const [usuarios, setUsuarios] = useState([]);

    const [inputBusqueda, setInputBusqueda] = useState('');
    const [participantes, setParticipantes] = useState([]); // ARRAY real
    const [sugerencias, setSugerencias] = useState([]);

    const [imagenGrupo, setImagenGrupo] = useState(null);
    const [previewImagen, setPreviewImagen] = useState(null);

    const [cursoSeleccionadoParaTutores, setCursoSeleccionadoParaTutores] = useState('');

    const cursosPermitidos = cursos && Array.isArray(cursos) ? cursos.filter(c => {
        if (!c.nombre_formacion) return false;
        const nombreFormacion = c.nombre_formacion.toLowerCase();
        return nombreFormacion.includes('primaria') || nombreFormacion.includes('inicial');
    }) : [];

    console.log("Cursos recibidos en form:", cursos);
    console.log("Cursos permitidos:", cursosPermitidos);
    console.log("Rol de usuario:", loggeduserRolId);

    const agregarTutoresDelCurso = () => {
        if (!cursoSeleccionadoParaTutores) return;
        axios.get(`${URL_USUARIOS}?tutores_curso_grupo=${cursoSeleccionadoParaTutores}`)
            .then(res => {
                if(Array.isArray(res.data)){
                    setParticipantes(prev => {
                        const nuevos = res.data.filter(tutor => !prev.some(p => p.id === tutor.id));
                        if (nuevos.length === 0) {
                            show_alerta('No se encontraron nuevos tutores para agregar o ya están en el grupo.', 'info');
                            return prev;
                        }
                        show_alerta(`Se agregaron ${nuevos.length} tutores al grupo.`, 'success');
                        return [...prev, ...nuevos];
                    });
                } else {
                    show_alerta('No se pudieron obtener los tutores.', 'error');
                }
            })
            .catch(err => {
                console.error("Error al obtener tutores:", err);
                show_alerta('Ocurrió un error al obtener los tutores.', 'error');
            });
    };

    useEffect(() => {
        obtenerUsuariosPermitidos(loggeduserRolId);
        if(editarGrupoID!= null){
            obtenerDatosGrupoAEditar(editarGrupoID);
        }
    }, [editarGrupoID]);

    useEffect(() => {
        if (!editarGrupoID) {
            setNombreGrupoPersonalizado('');
            setDescripcionGrupo('');
            setImagenGrupo(null);
            setPreviewImagen(null);
        }
    }, [editarGrupoID]);

    // busca usuarios que se podrian agregar al grupo
    const obtenerUsuariosPermitidos = (rol_origen) =>{
        axios.get(`${URL_USUARIOS}?rol_origen=${rol_origen}`)
            .then(res => { setUsuarios(res.data);})
            .catch(err => { console.error("Error al obtener usuarios:", err); });
    }

    //si es modo editar busca datos del grupo para precargar el form
    const obtenerDatosGrupoAEditar = (id_grupo) =>{
        axios.get(`${URL_GRUPOS}?id_grupo=${id_grupo}&modo=obtenerDatosGrupo`)
            .then(res => { 
                setNombreGrupoPersonalizado(res.data.nombre_grupo);
                setDescripcionGrupo(res.data.descripcion);

                if (res.data.imagen) {
                    const urlImagen = `${CONFIG.API_URL}/${res.data.imagen}`;
                    
                    setImagenGrupo(res.data.imagen); // mantiene referencia (string)
                    setPreviewImagen(urlImagen);     // agrega preview
                }
            })
            .catch(err => { console.error("Error al obtener grupo:", err); });
    }
    
    
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (inputBusqueda.length >= 2) {
                const filtrados = usuarios.filter(usuario =>
                    `${usuario.nombre} ${usuario.apellido}`
                        .toLowerCase()
                        .includes(inputBusqueda.toLowerCase())
                );
                setSugerencias(filtrados);
            } else {
                setSugerencias([]);
            }
        }, 200);

        return () => clearTimeout(timeout);
    }, [inputBusqueda, usuarios]);

    const seleccionarUsuario = (usuario) => {
        // evitar duplicados
        const existe = participantes.some(p => p.id === usuario.id);
        if (existe) return;

        setParticipantes(prev => [...prev, usuario]);

        // limpiar input
        setInputBusqueda('');
        setSugerencias([]);
    };

    const quitarParticipante = (id) => {
        setParticipantes(prev => prev.filter(p => p.id !== id));
    };

    const handleImagenChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImagenGrupo(file);

        // preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImagen(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmint =(e) => {
        e.preventDefault();

        if (!nombreGrupoPersonalizado || !descripcionGrupo || (!editarGrupoID && participantes.length === 0)) {
            show_alerta('Faltan datos', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('modo', !editarGrupoID?'crear_grupo':'edita_grupo');
        formData.append('id', editarGrupoID?editarGrupoID:0);
        formData.append('nombre_grupo', nombreGrupoPersonalizado);
        formData.append('descripcion', descripcionGrupo);
        formData.append('id_usuario_creador', localStorage.getItem('loggedUserId'));

        if (imagenGrupo instanceof File) {
            formData.append('imagen_grupo', imagenGrupo);
        }

        // SOLO IDS (mucho mejor para PHP)
        !editarGrupoID && //si no es editar envio participantes
            formData.append('participantes', JSON.stringify(participantes.map(p => p.id)));

        enviarFormData(formData);
        handleReset();
    }

    const handleReset = () => {
        setNombreGrupoPersonalizado('');
        setDescripcionGrupo('');
        setParticipantes([]);
        setInputBusqueda('');
        setImagenGrupo(null);
        setPreviewImagen(null);
    };

    return (
        <div className="me-2">
            <form onSubmit={handleSubmint} id='form'>
                <div className="mb-3">
                    <label htmlFor="nombreGrupo" className="form-label">Nombre del grupo</label>
                        <input 
                        type="text" 
                        className="form-control" 
                        id="nombreGrupo" 
                        value={nombreGrupoPersonalizado} 
                        onChange={(e) => setNombreGrupoPersonalizado(e.target.value)} 
                        />
                </div>
                <div className="mb-3">
                    <label htmlFor="descripcionGrupo" className="form-label">Descripción del grupo</label>
                        <textarea 
                        className="form-control" 
                        id="descripcionGrupo" 
                        rows="2"
                        value={descripcionGrupo}
                        onChange={(e) => setDescripcionGrupo(e.target.value)}
                        >
                        </textarea>
                </div>
                <div className="mb-3 d-flex flex-column align-items-center">
                    <label className="avatar-grupo cursor-pointer">
                        {previewImagen ? (
                            <img src={previewImagen} alt="preview" />
                        ) : (
                            <div className="avatar-placeholder">
                                <i className="fa-solid fa-camera"></i>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImagenChange}
                        />
                    </label>
                    <small className="text-muted mt-1">
                        Agregar imagen del grupo
                    </small>
                </div>
            {/* Si es editar  no muestro el selector de participantes */}
            {!editarGrupoID &&
                <div className="mb-3 position-relative">
                    <label className="form-label"><i className="fa-solid fa-users"></i> Seleccionar Participantes</label>
                    
                    {/* SELECTOR MASIVO DE TUTORES PARA DOCENTES DE PRIMARIA / INICIAL */}
                    {cursosPermitidos.length > 0 && (
                        <div className="mb-3 p-3 bg-light rounded border">
                            <label className="form-label small text-muted"><i className="fa-solid fa-user-group"></i> Agregar tutores por curso (Inicial/Primaria)</label>
                            <div className="input-group">
                                <select 
                                    className="form-select form-select-sm"
                                    value={cursoSeleccionadoParaTutores}
                                    onChange={(e) => setCursoSeleccionadoParaTutores(e.target.value)}
                                >
                                    <option value="">Seleccione un curso...</option>
                                    {cursosPermitidos.map(c => (
                                        <option key={c.id_curso_grupo} value={c.id_curso_grupo}>
                                            {c.nombre_espacio} - {c.denominacion}
                                        </option>
                                    ))}
                                </select>
                                <button 
                                    type="button" 
                                    className="btn btn-sm btn-secondary"
                                    onClick={agregarTutoresDelCurso}
                                    disabled={!cursoSeleccionadoParaTutores}
                                >
                                    <i className="fa-solid fa-plus"></i> Agregar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* INPUT BUSCADOR */}
                    <input
                        type="text"
                        className="form-control"
                        placeholder="🔍 Buscar usuario..."
                        value={inputBusqueda}
                        onChange={(e) => setInputBusqueda(e.target.value)}
                    />
                    {/* SUGERENCIAS */}
                    <div className="contenedor-sugerencias">
                    {sugerencias.length > 0 ? (
                        <ul className="lista-sugerencias position-absolute w-100 bg-white border rounded mt-1" style={{zIndex: 1000}}>
                            {sugerencias.map(usuario => (
                                <li 
                                    key={usuario.id}
                                    className="p-2 hover-bg-light"
                                    style={{cursor:'pointer'}}
                                    onClick={() => seleccionarUsuario(usuario)}
                                >
                                    {usuario.nombre} {usuario.apellido}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    </div>
                    {/* LISTA DE PARTICIPANTES */}
                    <div className="mt-3">
                        {participantes.length === 0 && (
                            <div className="text-muted small">Sin participantes</div>
                        )}
                        {participantes.map(p => (
                            <div key={p.id} className="d-flex justify-content-between align-items-center border rounded p-2 mb-1">
                                <span className="small">
                                    {p.nombre} {p.apellido}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => quitarParticipante(p.id)}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            }
                <button type="submit" className="btn btn-primary">{!editarGrupoID?'Crear grupo':'Guardar modificaciones'}</button>
            </form>
        </div>
    )
}
export default MensajesGrupoCrudForm; 


