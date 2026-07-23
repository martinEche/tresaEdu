import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import CONFIG from '../../config.js';

const URL_LISTAR = `${CONFIG.API_URL}/listarUsuarios.php`;
const URL_MENSAJES = `${CONFIG.API_URL}/operarMensajes.php`;

function MensajeriaGeneral({acceder, rol}) {
    const navigate = useNavigate();
    const [buscar, setBuscar] = useState("");
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [mensajes, setMensajes] = useState([]);

    useEffect(()=>{
        if(acceder){
            if((rol===null)||((rol>4))){
                navigate("/");
            }
        }else{
            localStorage.clear();
            navigate('/');
        }
    },[ rol])

    
    useEffect( ()=>{
        const data= {
            'id_rol' :  0,
            'modo'  :'buscaUsuariosPorRol'
        }
        axios.post(URL_LISTAR, data)
        .then(res =>{
            if(!res.data.error){ 
                setUsuarios(res.data);
            }else{
                setUsuarios([]);
            }
        })
        .catch(err=>{
            console.log(err);
        })
        resultado= usuarios;
    },[usuarios])

    const handleBuscar = (e) => {
        setBuscar(e.target.value)
       // console.log(e.target.value)
    }

    //metodo de filtrado
    let resultado=[];
    if(!buscar){
        resultado= usuarios;
    }else{
        resultado= usuarios.filter((dato)=>{
            if( (dato.nombre.toLowerCase().includes(buscar.toLocaleLowerCase())) || 
                (dato.apellido.toLowerCase().includes(buscar.toLocaleLowerCase())) ||
                (dato.usuario.toLowerCase().includes(buscar.toLocaleLowerCase())) ||
                (dato.documento.toString().toLowerCase().includes(buscar.toLocaleLowerCase())) ){
                return true;
            }
            return false;
        });
    }

    //constantes para paginacion
    const [paginaActual, setPaginaActual]=useState(1);
    const registrosPorPagina=5;
    const ultimoIndice = paginaActual * registrosPorPagina;
    const primerIndice = ultimoIndice - registrosPorPagina;
    const registros = resultado.slice(primerIndice, ultimoIndice);
    const npaginas =Math.ceil(resultado.length / registrosPorPagina);
    
    //funcion buscar mensajes
    const buscaMensajes = async (id) =>{
        const res = await axios.post(URL_MENSAJES, {id_usuario: id, modo: 'buscarMensajesUsuario'});
        if(!res.data.error){ 
           // console.log('Mensajes obtenidos:', res.data);
            setMensajes(res.data);
        }else{
            setMensajes([]);
        }
    }
    //funcion para formatear fecha
    const formatFecha = (fechaStr) => {
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const fecha = new Date(fechaStr.replace(" ", "T")); 
        // Reemplazo " " por "T" para que Date lo parsee bien en todos los navegadores

        const dia = String(fecha.getDate()).padStart(2, "0");
        const mes = meses[fecha.getMonth()];
        const anio = fecha.getFullYear();

        const horas = String(fecha.getHours()).padStart(2, "0");
        const minutos = String(fecha.getMinutes()).padStart(2, "0");

        return `${dia} ${mes} ${anio} ${horas}:${minutos}`;
    };

    return (    
        <>
        <h6>Mensajeria general  </h6>
        {/* si se selecciono un usuario mostrar el volver */}
        { usuarioSeleccionado && <button className='btn btn-sm btn-outline-secondary mb-2' onClick={()=> setUsuarioSeleccionado(null)}><i className="fa-solid fa-arrow-left"></i> Volver a la lista de usuarios</button>}
        {/* si no hay un usuario seleccionado muestra el buscador */}
        {!usuarioSeleccionado ? <>
            {/* buscador de usuarios */}
            <div className="input-group mb-3 me-2">
                <span className="input-group-text" id="basic-addon1"> 
                <small className='me-2'><i className="fa-solid fa-filter"></i> <b>{registros.length} / {usuarios.length}</b> </small> 
                | <i className="fa-solid fa-magnifying-glass ms-2"></i>Buscar usuario</span>
                <input type="text" className="form-control" id='buscar' name='buscar' defaultValue={buscar} onChange={handleBuscar} placeholder='buscar...' aria-label='buscar' aria-describedby='basic-addon1' />
            </div> 
            <table className='table table-sm table-striped table-hover mt-2 shadow-lg'>
                <thead className='bg-cabecera-tabla small'>
                    <tr>
                        <th>Apellido</th>
                        <th>Nombre</th>
                        <th>Nom. usuario</th>
                        <th>Documento</th>
                        <th>...</th>
                    </tr>
                </thead>
                <tbody className='small'>
                { !!registros && 
                    registros.map(u => (
                    <tr key={u.id}>
                        <td>{u.apellido}</td>
                        <td>{u.nombre}</td>
                        <td>{u.usuario}</td>
                        <td>{u.documento}</td>
                        <td>
                            <button type="button" className='btn btn-sm btn-info' onClick={()=> (setUsuarioSeleccionado(u.id), buscaMensajes(u.id))} ><i className="fa-regular fa-envelope"></i> ver mensajes</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
                <nav>
                    <ul className='pagination'>
                        <li className='page-item'>
                            <a href='#' className='page-link' onClick={prePage}>Prev</a>
                        </li>
                        
                        <li className='page-item'>
                            <a href='#' className='page-link' onClick={nexPage}>Prox </a>
                        </li>
                    </ul>
                </nav>
       </> 
       : 
       <>
            <div>
                <h6>Mensajes con usuario {usuarioSeleccionado}</h6>
                {/* Aquí puedes incluir el componente o la lógica para mostrar los mensajes del usuario seleccionado */}
                <table className="table table-hover table-sm align-middle">
                    <tbody>

                    {mensajes.length === 0 ? (
                    <tr>
                    <td colSpan="6">
                        <div className="alert alert-warning mb-0">
                            No posee mensajes
                        </div>
                    </td>
                    </tr>
                    ) : (

                    mensajes.map((m, index) => (
                    <tr key={index} className="cursor-pointer">

                        {/* estado */}
                        <td className="text-center text-nowrap" style={{width:"40px"}}>
                            <i className={`fa-regular fa-envelope${m.estado==0? '' : '-open text-success'}`}></i>
                        </td>

                        {/* etiquetas */}
                        <td className="text-nowrap" style={{width:"130px"}}>
                            {m.estado==3 && <span className="badge text-bg-danger me-1">eliminado</span>}
                            {m.tipo=='enviado' && <span className="badge text-bg-success me-1">enviado</span>}
                            {m.tipo=='recibido' && <span className="badge text-bg-info me-1">recibido</span>}
                            {m.id_curso!==0 && (
                                <span className="badge text-bg-warning">
                                    <i className="fa-solid fa-people-group"></i>
                                </span>
                            )}
                        </td>

                        {/* usuario */}
                        <td className="text-nowrap small" style={{width:"180px"}}>
                            <strong>{m.apellido}, {m.nombre}</strong>
                        </td>

                        {/* asunto + preview */}
                        <td className="small">

                            <strong className="me-2">{m.asunto}</strong>

                            <span className="text-muted">
                                — {m.mensaje.substring(0,80)}
                            </span>

                        </td>

                        {/* fecha */}
                        <td className="text-end text-nowrap small text-muted" style={{width:"140px"}}>
                            {formatFecha(m.fecha)}
                        </td>

                    </tr>

                    ))

                    )}

                    </tbody>
                    </table>
            </div>
        </>
        }


        </>
     );
     function prePage(){
        if(paginaActual !== 1){
            setPaginaActual(paginaActual - 1);
        }
    }
    function nexPage(){
        if(paginaActual !== npaginas){
            setPaginaActual(paginaActual + 1);
        }    
    }
}

export default MensajeriaGeneral;