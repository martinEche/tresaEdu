import axios from 'axios';
import { useEffect, useState } from 'react';
import CONFIG from '../../config';

const URL = `${CONFIG.API_URL}/operarCursos.php`;

function MostrarEncabezadoInstancias({curso, setColInstancias}) {
    const [instancias, setInstancias] = useState([]);

    useEffect(() => {
        obtenerInstancias(curso);          
    }, [curso]);

    const obtenerInstancias =(curso)=>{
        axios.get(`${URL}?curso=${curso}`)
        .then(res => {
            console.log(res.data.instancias);
            if (!res.data.error) { 
                setInstancias(res.data.instancias);
                setColInstancias(res.data.instancias);
                //console.log("colInstnacia:"+res.data.instancias)
            } else {
                setInstancias([]);
            }
        })
        .catch(err => {
            console.log(err);
        });
    }

    return (  
        <>
        {instancias.length>0 ? instancias.map((i) => (
            <th key={i.id} style={{ width: '10%' }}  className='text-center'> {i.nombre_instancia} </th>
        ))
        :
        ''
        }
        </>
    );
}

export default MostrarEncabezadoInstancias;