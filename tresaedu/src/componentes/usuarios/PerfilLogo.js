
import './css/Usuarios.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import CONFIG from '../../config';
import { Link } from 'react-router-dom';

const URL  = `${CONFIG.API_URL}/operarTablaUsuario.php`;

function PerfilLogo({id, usuario, configuracion, version, fecha, habilitarModal=true}) {
    const [datosUsuario, setDatosUsuario] = useState('');
    const [iniciales, setIniciales] = useState('-');
    const [mostrarModal, setMostrarModal] = useState(false);
    
    useEffect(() => {
        //console.log("id_usuario perfil logo: "+id);
        if(typeof id !== "undefined"){
            buscarDatosUsaurio(id); 
        }
        if(typeof usuario !== "undefined"){
            setDatosUsuario(usuario)
            const inic = usuario.nombre.toUpperCase().substr(0,1)+usuario.apellido.toUpperCase().substr(0,1)
            setIniciales(inic)
        }
    }, [id, usuario, version, fecha]);

    const obtenerEdad=(dateString)=> {
        let hoy = new Date()
        let fechaNacimiento = new Date(dateString)
        let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
        let diferenciaMeses = hoy.getMonth() - fechaNacimiento.getMonth()
        
        if (dateString==null){
            edad=null;
        }else{
            if (
                diferenciaMeses < 0 ||
                (diferenciaMeses === 0 && hoy.getDate() < fechaNacimiento.getDate())
              ) {
                edad--
              }      
        }
        return edad
    }

    const buscarDatosUsaurio=(id_usaurio)=>{
        axios.get(`${URL}?id_usuario=${id_usaurio}`)
        .then(res =>{
            if(!res.data.error){ 
                setDatosUsuario(res.data)
                setIniciales(res.data.nombre.toUpperCase().substr(0,1)+res.data.apellido.toUpperCase().substr(0,1))
                //console.log(res.data)
            }else{
                setDatosUsuario('')
            }
        })
        .catch(err=>{
            console.log(err);
        })
    }

    const cambiaFormatoFecha =(dateString) => {
        const date = new Date(dateString);
        const daysOfWeek = [
            'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
        ];
        const months = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
    
        const dayOfWeek = daysOfWeek[date.getUTCDay()];
        const day = date.getUTCDate();
        const month = months[date.getUTCMonth()];
        const year = date.getUTCFullYear();
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    
        return `${dayOfWeek} ${day} de ${month} de ${year} ${hours}:${minutes}:${seconds}`;
    }

    return (    
    <>
        <div className='contenedor-logoPerfil'>
        {version!='muroG'?
        <>
            {(datosUsuario.imagen_perfil === '' || datosUsuario.imagen_perfil == null) ? (
                <div 
                    onClick={(e) => {
                        if (!habilitarModal) return;
                        e.stopPropagation(); // evita interferencias
                       setMostrarModal(true);
                    }}
                    className="text-white iniciales" 
                    style={{
                        backgroundColor: configuracion.color_secundario, 
                        color: configuracion.color_terciario
                    }}
                >
                    {iniciales}
                </div>
            ) : (
                <img 
                   onClick={(e) => {
                        if (!habilitarModal) return;
                        e.stopPropagation(); // evita interferencias
                        setMostrarModal(true);
                    }}
                    className='imgCh' 
                    src={`${CONFIG.API_URL}/${datosUsuario.imagen_perfil}`} 
                    alt="Perfil" 
                />
            )}
            {(version=="logo_solo" || version=="foro" || version=="muro")?'':
            <div className={(version=="extendida")?'nombreApellidox14':'nombreApellido'}>
                <span>{datosUsuario.nombre} </span>
                <span>{datosUsuario.apellido}</span>
                <div className='text-secondary small'>{datosUsuario.documento}</div>
                {version=="extendida" &&
                <div className='apodoEdad'>{datosUsuario.apodo} {obtenerEdad(datosUsuario.fecnac)===null?'':<small>({obtenerEdad(datosUsuario.fecnac)} años)</small>}</div>
                }
            </div>
            }
            {(version=="foro" || version=="muro")&&  
            <div className='nombreApellidox14'>
                <span>{datosUsuario.nombre} </span>
                <span>{datosUsuario.apellido}</span>
                {version=="foro" && <div className='apodoEdad'>{cambiaFormatoFecha(fecha)} </div>}
            </div>
            }
        </>
        :
        <div className='text-center justify-content-center'>
            <h3 className='text-center'>{datosUsuario.nombre} {datosUsuario.apellido}</h3>
            {(datosUsuario.imagen_perfil === '' || datosUsuario.imagen_perfil == null) ? (
                    <div className="text-white inicialesGr" style={{
                                backgroundColor: configuracion.color_secundario, 
                                color: configuracion.color_terciario}}
                            >
                                {iniciales}
                    </div>
            )  : (
                <img id="imagen" className='imgGR' src={`${CONFIG.API_URL}/${datosUsuario.imagen_perfil}`} />
           )} 
        </div>
        }
        </div>

        {/* modal perfil */}
        {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
            <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
                {/* Botón cerrar */}
                <button 
                    className="btn-close float-end" 
                    onClick={() => setMostrarModal(false)}
                ></button>

                {/* Imagen o iniciales */}
                <div className="text-center mt-3">
                    {(datosUsuario.imagen_perfil === '' || datosUsuario.imagen_perfil == null) ? (
                        <div 
                            className="inicialesModal mx-auto"
                            style={{
                                backgroundColor: configuracion.color_secundario,
                                color: configuracion.color_terciario
                            }}
                        >
                            {iniciales}
                        </div>
                    ) : (
                        <img 
                            className="imgModal"
                            src={`${CONFIG.API_URL}/${datosUsuario.imagen_perfil}`} 
                            alt="Perfil"
                        />
                    )}
                </div>

                {/* Datos */}
                <div className="text-center mt-3">
                    <h4>{datosUsuario.nombre} {datosUsuario.apellido}</h4>
                    <div className="text-muted">
                        {datosUsuario.apodo}
                        
                    </div>
                    <div className=" text-secondary">
                        {datosUsuario.documento}
                    </div>
                    <div className="small text-secondary">
                        {obtenerEdad(datosUsuario.fecnac)} años
                    </div>
                </div>

            </div>
        </div>
        )}
    </>
    );
}

export default PerfilLogo;