import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CONFIG from '../../config';

const URL = `${CONFIG.API_URL}/operarCursos.php`;

function DocentesCurso({curso}) {
    const [docentes, setDocentes] = useState([]);

    
    useEffect(() => {
        BuscarDocentes(curso);
    }, [curso]);

    const BuscarDocentes =(curso)=>{
        axios.get(`${URL}?curso=${curso}&modo=docentesCurso`)
        .then(res => {
           // console.log('res.dataaaaaa', res.data);
            if (!res.data.error) { 
                setDocentes(res.data.docentes);
            } else {
                setDocentes([]);
            }
        })
        .catch(err => {
            console.log(err);
        });
    }
    return ( 
        <>
        {docentes.length===0?
        <div className='small'>-</div>
        : docentes.map((d,i)=>(
            <div key={i} className='small  text-warning'>
                <i className="fa-solid fa-chalkboard-user me-1"></i>{d.nombre} {d.apellido} {d.funcion?' ('+d.funcion+')': ''}
            </div>
        ))}
        </>
     );
}

export default DocentesCurso;  