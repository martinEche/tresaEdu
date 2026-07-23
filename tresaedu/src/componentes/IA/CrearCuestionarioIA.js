import { useState } from 'react';
import axios from 'axios';
import { useParams } from "react-router-dom";
import './css/ia.css';
import CONFIG from '../../config';

const URL_API_IA=`${CONFIG.API_URL}/generar_cuestionario.php`;

function CrearCuestionarioIA({setVerNuevoCuestionarioIA, buscaCuestionario, idMC}) {
    //const { idMC } = useParams();
    const loggeduserId =localStorage.getItem('loggedUserId');

    const [loading, setLoading] = useState(false);
    const [tituloTema, setTituloTema] = useState('');
    const [contenidoTema, setContenidoTema] = useState('');
    const [cantidadPreguntas, setCantidadPreguntas] = useState(4);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        //console.log('entro');
        
        setLoading(true);
        const data = {
            curso_id:idMC,
            user_id:loggeduserId,
            tituloTema,
            contenidoTema,
            cantidadPreguntas,
        };
        try {
          const response = await axios.post(URL_API_IA, data);
          console.log('respuesta: '+ JSON.stringify(response.data.cuestionario));
          console.log('data: '+ response.data);
          if (response.data.success) {
          //   setCuestionario(response.data.cuestionario);
          } else {
          //  console.error('Error en la generación de la planificación:', response.data.message);
          }
        } catch (error) {
          console.error('Error al obtener la planificación:', error);
        }
        setLoading(false);
    };

    return (    
        <>
            <h3>custionarioIA</h3>
            <form onSubmit={handleSubmit}>

                <div className="form-floating mb-3">
                    <input type="text" className="form-control" 
                    id="floatingInput1" 
                    placeholder="name@example.com" 
                    value={tituloTema}
                    onChange={(e) => setTituloTema(e.target.value)}
                    />
                    <label htmlFor="floatingInput1">Titulo tema</label>
                </div>

                <div className="form-floating mb-3">
                    <textarea className="form-control area_textos"  
                    id="floatingTextarea2"
                    value={contenidoTema}
                    onChange={(e) => setContenidoTema(e.target.value)} ></textarea>
                    <label htmlFor="floatingTextarea2">contenido tema</label>
                </div>

                <div className="form-floating mb-3">
                    <input type="number" className="form-control" 
                    id="floatingInput2" 
                    placeholder="name@example.com" 
                    value={cantidadPreguntas}
                    onChange={(e) => setCantidadPreguntas(e.target.value)}
                    />
                    <label htmlFor="floatingInput2">Cantidad de preguntas</label>
                </div>
                
                <div className='d-flex-1'>
                    <button type="submit" className='btn-laboratorio' disabled={loading}>
                        <i className="fa-solid fa-brain me-1"></i> {loading ? ' Generando...' : ' Generar '}
                    </button>
                    <button type="button" className="btn-laboratorio2 me-2" onClick={()=>setVerNuevoCuestionarioIA(false)}> SALIR</button>
                </div>
            </form>
        </>
     );
}

export default CrearCuestionarioIA;