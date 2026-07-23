import { useEffect, useState } from 'react';
import { archivosForo } from '../../servicios/forumService';
import CONFIG from '../../config';

function ForoArchivos({id_foro_tema, id_foro_respuesta}) {
    const [archivos, setArchivos] = useState([]);

    useEffect(() => {
        obtenerArchivos(id_foro_tema, id_foro_respuesta);
    }, [id_foro_tema, id_foro_respuesta]);
    
    const obtenerArchivos = async (temaId,respuestaId) => {
        const data = await archivosForo(temaId,respuestaId);
        setArchivos(data);
    };

    const esImagen = (extension) => {
        return extension === "jpg" || extension === "jpeg" || extension === "png" || extension === "gif";
    };
    return (    
        <div className='mb-3'>
            <div className='row mb-2'>
                {archivos && archivos.map((archivo, index) => (
                    esImagen(archivo.extension) && (
                    <div className='col' key={archivo.id}>
                        <div className='d-flex justify-content-center'>
                            archivo_{index + 1}.{archivo.extension}
                        </div>
                        <div className='row'>
                            <img className='foro-archivos-img' src={`${CONFIG.API_URL}/${archivo.file_path}`} width="80px" />
                        </div>
                    </div>
                    )
                ))}
            </div>
            <div className='row' >
                {archivos && archivos.map((archivo, index) => (
                   <div key={archivo.id} className='col-12'><i className="fa-solid fa-paperclip"></i> <a href={`${CONFIG.API_URL}/${archivo.file_path}`}>archivo_{(index+1)}.{archivo.extension} </a> </div>
                ))}
            </div>
        </div>
     );
}

export default ForoArchivos;