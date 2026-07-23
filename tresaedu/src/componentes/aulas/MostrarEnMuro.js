import './css/Muro.css';
import axios from "axios";
import { useEffect, useState } from "react";
import CONFIG from '../../config';

const URL_CLASES  = `${CONFIG.API_URL}/operarClases.php`;

function MostrarEnMuro({area,detalle,idElemento}) {
    const [infoMostrar, setInfoMostrar] = useState('');

    const iconos = {
        'pdf':'fa-file-pdf text-danger',
        'doc':'fa-file-word text-primary',
        'docx':'fa-file-word text-primary',
        'xls':'fa-file-excel text-success',
        'xlsx':'fa-file-excel text-success',
        'jpg': 'fa-file-imagen text-secondary', 
        'jpeg': 'fa-file-imagen text-secondary'
    }


    useEffect(() => {
        buscarInfo(area,idElemento);
    }, [area, idElemento]);

    const buscarInfo=(area, idElemento)=>{
        axios.get(`${URL_CLASES}?area=${area}&idElemento=${idElemento}`)
        .then(res =>{
            if(!res.data.error){ 
                setInfoMostrar(res.data.informacion);
            }else{
                setInfoMostrar('Información no disponible');
            }
        })
        .catch(err=>{
            console.log(err);
            setInfoMostrar('Error al obtener la información');
        })
    }
    return ( 
        <>
        {area=='Clase'&& 
            <div className="card preview-clase-card my-2">
                <div className="card-body d-flex align-items-start">
                    {/* Icono */}
                    <div className="preview-icon me-3">
                        <i className="fa-solid fa-chalkboard-user"></i>
                    </div>
                    {/* Contenido */}
                    <div className="flex-grow-1">
                        <div className="small text-muted mb-1">
                            <i className="fa-regular fa-file-lines me-1"></i>
                            {detalle}
                        </div>
                        <h6 className="preview-titulo mb-1">
                            {infoMostrar.titulo_corto}
                        </h6>
                        <p className="preview-tema mb-2">
                            {infoMostrar.tema}
                        </p>
                        <button className="btn btn-sm btn-outline-primary">
                            Ver clase
                        </button>
                    </div>
                </div>
            </div>
        }
        {area === 'Actividad' && (
        <div className="muro-actividad card my-2">
            <div className="card-body d-flex">
                {/* icono */}
                <div className="actividad-icon me-3">
                    <i className="fa-solid fa-clipboard-check"></i>
                </div>
                {/* contenido */}
                <div className="flex-grow-1">
                    <div className="small text-muted mb-1">
                        {detalle}
                    </div>
                    <h6 className="actividad-titulo mb-1">
                        {infoMostrar.titulo}
                    </h6>
                    <p className="actividad-preview">
                        {infoMostrar.desarrollo }
                    </p>
                    <div className="actividad-meta small text-muted">
                        {infoMostrar.fecha_entrega && (
                            <span className="me-3">
                                <i className="fa-regular fa-clock me-1"></i>
                                Entrega: {infoMostrar.fecha_entrega}
                            </span>
                        )}
                        <span className="badge text-bg-primary">
                            {infoMostrar.tipo_trabajo==='individual' ? 'Actividad Individual' : 'Actividad Grupal'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        )}
        {area === 'Cuestionario' && (
        <div className="muro-cuestionario card my-2">
            <div className="card-body d-flex">
                {/* icono */}
                <div className="cuestionario-icon me-3">
                    <i className="fa-solid fa-list"></i>
                </div>
                {/* contenido */}
                <div className="flex-grow-1">
                    <div className="small text-muted mb-1">
                        {detalle}
                    </div>
                    <h6 className="cuestionario-titulo mb-1">
                        {infoMostrar.titulo}
                    </h6>
                    <p className="cuestionario-preview">
                        {infoMostrar.descripcion}
                    </p>
                </div>
            </div>
        </div>
        )}
        {area === 'Material' && (
        <div className="Material-post card my-3">
            <div className="card-body">
                {/* encabezado */}
                <div className="d-flex align-items-center mb-2">
                    <div className="material-avatar me-2">
                        <i className="fa-solid fa-book"></i>
                    </div>
                    <div>
                        <div className="small fw-semibold">
                            {detalle}
                        </div>
                        <div className="text-muted small">
                            Material del curso
                        </div>
                    </div>
                </div>
                {/* tarjeta del archivo */}
                <div className="material-file-card">
                    <div className="material-file-icon">
                        {infoMostrar.tipo === 'vinculo'
                            ? <i className="fa-solid fa-link"></i>
                            : <i className={`fa-regular ${iconos[infoMostrar.extension]}`}></i>
                        }
                    </div>
                    <div className="flex-grow-1">
                        <a
                            href={`${CONFIG.API_URL}/materialcursos/${infoMostrar.enlace}`}
                            target="_blank"
                            className="material-file-name"
                        >
                            {infoMostrar.nombre_archivo}-{infoMostrar.id}.{infoMostrar.extension}
                        </a>
                        <div className="material-file-meta small text-muted">
                            Archivo del material
                        </div>
                    </div>
                </div>
            </div>
        </div>
        )}
        </>
     );
}

export default MostrarEnMuro;