import axios from 'axios'; 
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import CONFIG from '../../config';

const URL_CALIFICACIONES = `${CONFIG.API_URL}/operarValoraciones.php`;

function InformeValoracion({estudiante, instancia, curso, editar, modal, rol} ) { 
    const [informeValoracion, setInformeValoracion] = useState('');

    useEffect(() => {
        buscaValoracion();
    }, [estudiante, instancia, curso, editar, rol]);

    // Obtener informe guardado
    const buscaValoracion = async () => {
        try {
            setInformeValoracion('');
            const response = await axios.get(
                `${URL_CALIFICACIONES}?id_estudiante=${estudiante}&id_instancia=${instancia}`
            );
            
            if (!response.data.error) {
                setInformeValoracion(response.data.informacion?.observacion || '');
            } else {
                console.log(response.data.mensaje);
            }
        } catch (error) {
            console.error("Error al buscar valoracion:", error);
        }
    }
    
    // Guardar informe
    const handleSubmitInforme = async (e) => {
        e.preventDefault();
        
        try {
            const response = await axios.post(URL_CALIFICACIONES, { 
                modo: 'guardarInformeValoraciones',
                id_estudiante: estudiante,
                id_instancia: instancia,
                id_curso: curso,
                informe: informeValoracion
            });
            console.log(response.data);
            if (!response.data.error) {
                setInformeValoracion('');
                Swal.fire('Éxito', 'Informe guardado correctamente', 'success');
            } else {
                Swal.fire('Error', response.data.mensaje || 'No se pudo guardar', 'error');
            }
        } catch (error) {
            console.error("Error al guardar informe:", error);
            Swal.fire('Error', 'Error al conectar con el servidor', 'error');
        }
    }

    return ( 
        <>
        <h5>Información:</h5>
        {editar || rol === 1 ? (
            <form onSubmit={handleSubmitInforme}>  
                <div className='my-2'>
                    <textarea 
                        className="form-control"
                        value={informeValoracion}
                        onChange={(e) => setInformeValoracion(e.target.value)}
                        rows={5}
                    />
                </div>
                <button type='submit' className='btn btn-sm btn-success' data-bs-dismiss="modal">
                    <i className='fa-solid fa-save mx-1'></i>Guardar
                </button>
            </form>
        ) : (
            <p>
                {informeValoracion === "" ? '-' : informeValoracion}
            </p>
        )}
        </>
     );
}

export default InformeValoracion;
