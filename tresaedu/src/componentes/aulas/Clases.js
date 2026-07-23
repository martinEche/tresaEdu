import './css/Aulas.css';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { show_alerta } from '../../funciones.js';
import ListaClases from './ListaClases';
import Clase from './Clase';
import CONFIG from '../../config';

const URL_CLASES  = `${CONFIG.API_URL}/operarClases.php`;

function Clases({ acceder, rol }) {

    const loggeduserCurso = localStorage.getItem('loggeduserCurso');
    const loggeduserCursoGrupo = localStorage.getItem('loggeduserCursoGrupo');
    const loggeduserCursoGrupoO = JSON.parse(localStorage.getItem('loggeduserCursoGrupoO'));
    const idUsuario = localStorage.getItem('loggedUserId');

const datoClase = {
    id: null,
    id_curso: loggeduserCurso,
    id_curso_grupo: loggeduserCursoGrupo,
    titulo_corto: '',
    tema: '',
    imagen_arriba: '',
    presentacion: '',
    desarrollo: '',
    cierre: '',
    imagen_abajo: '',
    fecha: '',
    creado_por: idUsuario
}

    const [clase, setClase] = useState(datoClase);
    const [clases, setClases] = useState([]);
    const [nuevaClase, setNuevaClase] = useState(false);
    const [editarClase, setEditarClase] = useState(false);
    const [editaMaterial, setEditaMaterial] = useState(false);
    const [editaActividad, setEditaActividad] = useState(false);
    const [verAreaForos, setVerAreaForos] = useState(false);
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();
    const { idMC, idCl } = useParams();

    const data = {
        'id_usuario': idUsuario,
        'id_curso': clase?.id_curso || loggeduserCurso,
        'id_curso_grupo': loggeduserCursoGrupo,
        'modo': 'buscarClases'
    };

    useEffect(() => {
        
        if (acceder) {
            if ((rol === null)) {
                navigate("/");
            } else {        
                consultarAPI(data);
            }
        } else {
            localStorage.clear();
            navigate('/');
        }                   
    }, [nuevaClase]);

    const consultarAPI = (data) => {
        setVisible(true);
        axios.post(URL_CLASES, data)
        .then(res => {
            setVisible(false);
            if (!res.data.error) { 
                const parse = res.data.sort((a, b) => a.id - b.id);
                let posicion = 0;
                const idClase = Number(idCl); // Convertir idCl a número
                if (!isNaN(idClase)) {
                    const index = parse.findIndex(c => c.id === idClase);
                   //console.log('index:'+index);
                    if (index !== -1) {
                        posicion = index;
                    }else{
                        posicion =0
                    }
                } else if (clase && clase.id) {
                    const index = parse.findIndex(c => c.id === clase.id);
                    if (index !== -1) {
                        posicion = index;
                    }
                }
                setClases(parse);
                if (parse.length > 0) {
                    setClase(parse[posicion]);
                } else {
                    setClase(datoClase);
                }
            //    setClase(parse[0]);
            } else {
                setClases([]);
            }
        })
        .catch(err => {
            console.log(err);
        });
    };

    const handleNUevo =()=>{
        if(!nuevaClase){ 
            setClase(datoClase);
            //console.log("clase: "+clase);
        }else{
            //si no hay clases
            //if(){
                //setClase(datoClase)
            //}else{
                //si hay clases tomo la primera
                //setClase(clases[0]);
            //}
        }
        setNuevaClase(!nuevaClase);
    }

    const eliminarClase = (id) =>{
        const MySwal= withReactContent(Swal); 
        MySwal.fire({
            title: '¿Seguro de eliminar la clase?',
            icon: 'warning', 
            html: '<span class=\"text-muted\">No se podrá dar marcha atrás</span>',
            showCancelButton: true, confirmButtonText: '<i class="fa-solid fa-trash-can"></i> Si, eliminar', cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-danger mx-2 shadow-sm',
                cancelButton: 'btn btn-outline-secondary mx-2',
                popup: 'rounded-4 shadow'
            },
            buttonsStyling: false
        })
        .then(res=>{
            if(res.isConfirmed){
                enviarSolicitud('DELETE',{'id':id})
                setClase(datoClase);
                //consultarAPI(data);
                navigate(`/MC/${idMC}`);
            }
        });
    };

    const enviarSolicitud = async (metodo, parametros) =>{
        await axios({method:metodo, url:URL_CLASES, data:parametros})
        .then(res =>{
		    console.log('respuesta enviar:'+res.data);
            var tipo = res.data[0];
            var msj = res.data[1];
            console.log('mensaje: '+msj+'-'+tipo);
            show_alerta(msj,tipo);            
            setEditarClase(false);
            setNuevaClase(false);
            consultarAPI(data);
        })
        .catch(err=>{
            show_alerta('Error en la solicitud ','error');
            console.log(err);
        })
    }


    const cambiarClase = (direccion) => {
        const indexActual = clases.findIndex(c => c.id === clase.id);
        let nuevoIndex = indexActual + direccion;

        if (nuevoIndex >= 0 && nuevoIndex < clases.length) {
            setClase(clases[nuevoIndex]);
        }
    };
    const volveracurso = (idCurso) =>{ 
        localStorage.removeItem('loggeduserClasesCurso');
        localStorage.removeItem('loggeduserCurso');
        localStorage.removeItem('loggeduserCursoGrupo');
        localStorage.removeItem('loggeduserCursoGrupoO');
        navigate(`/Cursos/${idCurso}`);
    }

    return (    
        <div className="container-principal">
            {((rol >= 0 && rol <= 4) || rol === '0' || rol === '1' || rol === '2' || rol === '3' || rol === '4') && 
            <button className='btn btn-sm btn-secondary mb-2' onClick={() => volveracurso(loggeduserCursoGrupo)}>
                <i className="fa-solid fa-arrow-left"></i> Volver a cursos
            </button>
            }
            <h3>{`${loggeduserCursoGrupoO?`Clase de ${loggeduserCursoGrupoO.nombre} ${loggeduserCursoGrupoO.orden}`:''}`}</h3>
            <div className="row">
                {/* Selector de clases y crear nueva clase */}
                    <ListaClases
                        clases={clases}
                        clase={clase}
                        setClase={setClase} 
                        visible={visible}
                        editarClase={editarClase}
                        nuevaClase={nuevaClase}
                        editaMaterial={editaMaterial}
                        editaActividad={editaActividad}
                        rol={rol} 
                        handleNUevo={handleNUevo}
                        verAreaForos={verAreaForos} 
                    />
            </div>
            <div className='row'>
                    {/* Botonera de acciones */}
                    {(nuevaClase || clase.id==null)?'':
                        ((rol===6 || rol===5 || rol ===9 || rol===11 || rol==="6" || rol==="5" || rol==="9" || rol==="11") && !editaMaterial && !editaActividad) &&
                        <div>
                            { !verAreaForos && (rol != 9 && rol != "9") &&
                            <>
                                <button 
                                type='button' 
                                className={`btn btn-sm ${!editarClase ? 'btn-warning':'btn-secondary'} ${(verAreaForos) ? 'disabled':''} mx-1`} 
                                onClick={()=>setEditarClase(!editarClase)}
                                >
                                    <i className="fa-regular fa-pen-to-square"></i> {!editarClase ? 'Editar clase' : "Cancelar Editar"}
                                </button>
                                <button 
                                type='button' 
                                className={`btn btn-sm btn-danger ${(editarClase || verAreaForos) ? 'disabled':''} mx-1`} 
                                onClick={()=>eliminarClase(clase.id)} 
                                >
                                    <i className="fa-regular fa-trash-can"></i> Elimina Clase
                                </button>
                            </>
                            }
                            <button 
                            type='button' 
                            className={`btn btn-sm btn-success ${editarClase ? 'disabled':''} mx-1`} 
                            onClick={()=>setVerAreaForos(!verAreaForos)}
                            >
                                <i className="fa-regular fa-message me-1"></i> {!verAreaForos ?'Ver área Foros' : 'Cerrar área Foros'}
                            </button>
                        </div>
                    }
                
            </div>
            <div className='row'>
                <div className="col-12">
                    {/* Hoja de contenido clase */}
                    <Clase 
                        rol={rol}
                        clases={clases}
                        clase={clase} 
                        enviarSolicitud={enviarSolicitud}
                        editarClase={editarClase}
                        nuevaClase={nuevaClase}  
                        setEditaMaterial={setEditaMaterial} 
                        editaMaterial={editaMaterial}
                        editaActividad={editaActividad}
                        setEditaActividad={setEditaActividad} 
                        verAreaForos={verAreaForos}
                    />
                </div>
            </div>
            <div className='row'>
                <div className="col-12">
                    {/* Barra de Navegación */}
                    {clases.length > 1 && (
                        <div className="navigation-bar mt-3">
                            <button className="btn btn-secondary me-2" 
                                    onClick={() => cambiarClase(-1)} 
                                    disabled={clases.findIndex(c => c.id === clase.id) === 0}>
                                Anterior
                            </button>
                            <button className="btn btn-secondary" 
                                    onClick={() => cambiarClase(1)} 
                                    disabled={clases.findIndex(c => c.id === clase.id) === clases.length - 1}>
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Clases;
