import './css/Capacitaciones.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {Link, useSearchParams} from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import Espera from '../Espera';
import CONFIG from '../../config';

const URL  = `${CONFIG.API_URL}/operarCursos.php`;

function Capacitaciones() {
    const navigate = useNavigate();
    const [cursos, setCursos] = useState([]);
    const [año, setAño] = useState('2023');
    const [buscar, setBuscar] = useState('');
    const [visible, setVisible] = useState(false);
    let resultado=[];
    
    useEffect(() => {
        setVisible(true);
        axios.get(URL)
        .then(res =>{
            //console.log(res.data)
            if(!res.data.error){ 
               setCursos(res.data);
            }else{
                setCursos([]);
            }
            setVisible(false);
        })
        .catch(err =>{
            console.log(err)
        }) 
    }, []);

   //metodo de filtrado
   if(!buscar){
        resultado= cursos.filter((dato)=> {
            if(dato.cohorte.toString().toLowerCase().includes(año)){
                return true;
            }
            return false;
        })
   }else{
       resultado= cursos.filter((dato)=>{
           if( (dato.nombre.toLowerCase().includes(buscar.toLocaleLowerCase())) && (dato.cohorte.toString().toLowerCase().includes(año)) ){
               return true;
           }
           return false;
       });
   }
   
   const nuevoCurso=()=>{
        console.log('nuevo')
   }
   return (
        <div className='container-principal'>
            <h3>Cursos {año} ({resultado.length}) <span className='btn btn-primary mx-3' onClick={()=>nuevoCurso()}>nuevo</span> <span className='btn btn-success mx-3' onClick={()=>nuevoCurso()}>crear corte completa</span></h3>
            <div className='row'>
                <div className='col-6'>
                    <div className="input-group mb-3 me-2">
                        <span className="input-group-text" id="basic-addon1"><i className="fa-solid fa-magnifying-glass"></i></span>
                        <input type="text" className="form-control" id='buscar' name='buscar' defaultValue={buscar} onChange={(e)=>setBuscar(e.target.value)} placeholder='buscar...' aria-label='buscar' aria-describedby='basic-addon1' />
                    </div>
                </div>
                <div className='col-6'>
                    <select className='form-select' onChange={(e)=>setAño(e.target.value)}>
                        <option value={'2023'}>2023</option>
                        <option value={'2022'}>2022</option>
                        <option value={'2021'}>2021</option>
                    </select>
                </div>
            </div>
            <div>
            {!visible ? 
            <table className="table table-hover table-sm">
			    <thead>
				    <tr>
					    <th className="small">Est.</th>
                        <th className="small">#</th>
						<th className="small">nombre</th>
						<th className="small">Cohorte</th>
						<th className="small"><i className="fa-regular fa-image"></i></th>
						<th className="small">Grupos</th>
						<th className="small">equipo docente</th>
						<th className="small">acc.</th>
					</tr>
				</thead>
				<tbody className="buscar">
                
                {resultado.map((c)=>(
                    <tr key={c.id}>
                        <td className='small'>{c.estado=='Abierto' ?
                             <span className="text-success"><i className='wrap-icon fa-solid fa-lock-open mr-3'></i></span> 
                             : <span className="text-warning"><i className='wrap-icon fa-solid fa-lock mr-3'></i></span>}</td>
                        <td className='small'>{c.orden}</td>
                        <td className='small'>{c.nombre_espacio}</td>
                        <td className='small'>{c.cohorte}</td>
                        <td className='small'>{c.imagen}</td>
                        <td></td>
                        <td></td>
                        <td><button type='button' className='btn btn-sm btn-secondary' onClick={() => navigate(`/Cursos/${c.id}`)} ><i className="fa-solid fa-gears m-1"></i>Configuracion</button></td>
                    </tr> 
                ))}
                </tbody>
            </table>
            : <div className='container m-3'><Espera visible={visible} /></div> }
            </div>

        </div>
     );
}

export default Capacitaciones;

