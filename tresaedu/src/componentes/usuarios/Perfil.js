import './css/Usuarios.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';

import PerfilForm from './PerfilForm';
import PerfilInfo from './PerfilInfo';
import CONFIG from '../../config';

const URL_LISTAR = `${CONFIG.API_URL}/listarUsuarios.php`;
const URL  = `${CONFIG.API_URL}/operarTablaUsuario.php`;

function Perfil({configuracion}) {
    const [perfil, setPerfil] = useState({
        id:null,
        nombre:"",
        apellido:"",
        apodo:"",
        imagen_perfil:"",
        fecnac:"",
        email:"",
        email2:"",
        genero:"",
        telefono:"",
        calle:"",
        numero:"",
        piso:"",
        depto:"",
        ciudad:"",
        provincia:"",
        modo:"actualizar-perfil"
    });
    const loggeduserId =localStorage.getItem('loggedUserId');
    const defaultFilePerfil='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
    const [mostrarEditar, setMostrarEditar] = useState(false);

    const data= {
        'id_usuario' :  loggeduserId,
        'modo': 'buscarPerfilUsuario'
    }

    useEffect(()=>{   
        obtenerDatos();
      },[])
    
    const obtenerDatos=()=>{
        axios.post(URL_LISTAR, data)
        .then(res =>{
            if(!res.data.error){ 
                //Sconsole.log(res.data);
                setPerfil(res.data.datos);
            }else{
                setPerfil(null);
            }
        })
        .catch(err=>{
            console.log(err);
        })
    }

    const actualizarData = (data) =>{
        //console.log("dataaaaa: "+data);
        enviarSolicitud("POST", data);
    };

    const enviarSolicitud = async (metodo, parametros) =>{
        await axios({method:metodo, url:URL, data:parametros})
            .then(res =>{
                var tipo = res.data[0];
                var msj = res.data[1];
                //console.log(res);
                //var sql = res.data[2];
                //console.log(tipo + "-" + msj+'-'+sql);
                setMostrarEditar(false);
                setPerfil(perfil);
                sessionStorage.removeItem('mail_alert_shown');
                obtenerDatos();
                show_alerta(msj,tipo);
            })
            .catch(err=>{
                show_alerta('Error en la solicitud ','error');
                console.log(err);
            })
    }

    const obtenerEdad=(dateString)=> {
        let hoy = new Date()
        let fechaNacimiento = new Date(dateString)
        let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
        let diferenciaMeses = hoy.getMonth() - fechaNacimiento.getMonth()
        if (
          diferenciaMeses < 0 ||
          (diferenciaMeses === 0 && hoy.getDate() < fechaNacimiento.getDate())
        ) {
          edad--
        }
        return edad
    }

    const previewFoto=(e)=>{
        //console.log(e.target.files[0]);
        let img= document.getElementById('imagen');
        if( e.target.files[0] ){
            const reader = new FileReader( );
            reader.onload = function( e ){
                img.src = e.target.result;
            }
            reader.readAsDataURL(e.target.files[0])
        }else{
            img.src = defaultFilePerfil;
        }
    }
    
    return (   
        <div className='container-principal'>
            <div>
                <div className='card-principal' style={{backgroundColor: configuracion.color_terciario, border: `3px solid configuracion.color_principal`}}>
                    <div className='card-superior' style={{backgroundColor: configuracion.color_secundario}}>
                        <h4 className='card-nombre'>{perfil.nombre} {perfil.apellido} </h4>
                        <img id="imagen" className='imagen-circular' src={(perfil.imagen_perfil==='' || perfil.imagen_perfil== null) ? `${defaultFilePerfil}` : `${CONFIG.API_URL}/${perfil.imagen_perfil}`} /> 
                    </div>
                    <div className='card-cuerpo'>
                        <div className='card-btn-editar' onClick={() => setMostrarEditar(!mostrarEditar)}><i className="fa-solid fa-user-pen"></i> {mostrarEditar ? `Ocultar` : `Mostrar`}</div>
                        <div className='card-apodo mt-1'> {perfil.apodo} ({obtenerEdad(perfil.fecnac)})</div>
                        {!mostrarEditar &&
                            <div className='card-info-fija'>
                                <PerfilInfo perfil={perfil} />
                            </div>
                        }
                        {mostrarEditar &&
                            <div className='card-info-edita'>
                                <PerfilForm perfil={perfil} actualizarData={actualizarData} previewFoto={previewFoto}/>
                            </div>
                        }                
                        </div>
                    </div>
            </div>    
        </div>
     );
}

export default Perfil;