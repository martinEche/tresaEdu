import './css/Aulas.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Espera from '../Espera';
import CONFIG from '../../config';
import MisCursosCard from './MisCursosCard';

const URL_CURSOS  = `${CONFIG.API_URL}/operarCursos.php`;

function MisCursos({acceder, rolSelect, rol, configuracion}) {
    const [espera, setEspera] = useState(false);
    const [cursos, setCursos] = useState([]);
    const loggeduserId = localStorage.getItem('loggedUserId');
    const loggeduserDatos = JSON.parse(localStorage.getItem('loggeddatosuser'));
    const navigate = useNavigate();
    
    //const anioActual = new Date().getFullYear();

    useEffect(() => {
        if(acceder){
            if((rol===null) || (rol<5)  || (rol>=8)){
                navigate("/");
            }else{
                //poner en blanco por seguridad los localstore de cursos
                localStorage.removeItem('loggeduserCursoGrupo');
                const data= {
                    'id_usuario' : loggeduserId,
                    'modo': 'buscarCursosUsuario',
                    'llama':rol
                }
                setEspera(true);
                //console.log('data:', data);
                axios.post(URL_CURSOS, data)
                .then(res =>{
                    (!res.data.error)?setCursos(res.data):setCursos([]);
                    console.log('respres.datacursos:', res.data);
                    setEspera(false);
                })
                .catch(err=>{
                    console.log(err);
                })
            }
        }else{
            localStorage.clear();
            navigate('/');
        }        
    }, [acceder, rol, navigate, loggeduserId]);


    // Sepa cursos por año actual y anteriores
    const hoy = new Date();

    const cursosActuales = cursos.filter(c => {
        const inicio = new Date(c.fecha_inicio);
        const cierre = new Date(c.fecha_cierre);

        return hoy >= inicio && hoy <= cierre;
    });

    const cursosAnteriores = cursos.filter(c => {
        const cierre = new Date(c.fecha_cierre);
        return hoy > cierre;
    });
    
    return ( 
        <div className='container-principal'>
            <h4>
                Hola, {loggeduserDatos.apodo===''?loggeduserDatos.nombre:loggeduserDatos.apodo} bienvenida/o.
            </h4>

            {!espera ? 
            <div>  
                <span className='badge bg-primary text-white'>Cursos actuales: {cursosActuales.length}</span> 
                {cursos.length === 0 ?
                    <div className='row row-cols-1 row-cols-md-3 row-cols-xl-4'>
                        <div className='text-center'>No estás en ningún curso</div>
                        <img width={350} src={`${CONFIG.API_URL}/img/2953962.jpg`}  alt="decorativo"/>
                    </div>
                :
                <>
                    <h6 className='ps-3'>Ciclo vigente</h6>
                    <div className='row row-cols-1 row-cols-md-3 row-cols-xl-4 justify-content-center'>
                        {/* Cursos de año lectivo vigente */}
                        {cursosActuales.length > 0 
                        && cursosActuales.map((c, i) => 
                            <div className="col d-flex justify-content-center" key={i}>
                                <MisCursosCard c={c} i={i} configuracion={configuracion} rol={rol} />
                            </div>
                        )}
                    </div>    
                    <div className='row row-cols-1 row-cols-md-3 row-cols-xl-4 justify-content-center'>                    
                    {/* Línea divisoria si hay cursos anteriores */}
                    {cursosActuales.length > 0 && cursosAnteriores.length > 0 && <hr className="my-4 w-100" />}
                    </div>
                    <div className='row row-cols-1 row-cols-md-3 row-cols-xl-4 justify-content-center'>
                    {/* Cursos de años anteriores */}
                    {cursosAnteriores.length > 0 && cursosAnteriores.map((c, i) =>  
                        <div className="col d-flex justify-content-center" key={i}>
                            <MisCursosCard c={c} i={"ant"+i} configuracion={configuracion} />
                        </div>
                    )}
                    </div>
                </>
                }
            </div>
            : <div className='container m-3'><Espera visible={espera} /></div> } 
        </div>
     );
}

export default MisCursos;
