import './css/Aulas.css';
import ClaseMaterialesForm from "./ClaseMaterialesForm";
import Espera from '../Espera';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CONFIG from '../../config';

const URL  = `${CONFIG.API_URL}/operarClases.php`;

function ClaseMateriales({enviarSolicitud, id_clase, editaMaterial, setEditaMaterial, materiales}) {
    const [materialClase, setMaterialClase] = useState(materiales || []);
    const [visible, setVisible] = useState(false);
   
    const iconos={
        'pdf':'fa-file-pdf', 
        'docx': 'fa-file-word','doc': 'fa-file-word',
        'xlsx': 'fa-file-excel', 
        'jpg': 'fa-file-imagen', 'jpeg': 'fa-file-imagen',}
    
    useEffect(() => {
        setMaterialClase(materiales || []);
    }, [materiales]);

    const quitarMaterial=(id_material_clase)=>{
        enviarSolicitud('DELETE',{'id':id_material_clase,'tabla':'material_clase'})
        setEditaMaterial(false);
    }

    const getFileDetails = (mcl) => {
        if (mcl.tipo === 'vinculo') {
            return { icon: 'fa-solid fa-link', className: 'res-link', label: 'Vínculo Web' };
        }
        const ext = mcl.extension || '';
        if (ext === 'pdf') return { icon: 'fa-regular fa-file-pdf', className: 'res-pdf', label: 'Archivo PDF' };
        if (['doc', 'docx'].includes(ext)) return { icon: 'fa-regular fa-file-word', className: 'res-doc', label: 'Documento Word' };
        if (['xls', 'xlsx'].includes(ext)) return { icon: 'fa-regular fa-file-excel', className: 'res-xls', label: 'Planilla Excel' };
        return { icon: 'fa-regular fa-file', className: 'res-file', label: 'Archivo' };
    };

    return (    
        <div className='materials-container mt-3'>
            {editaMaterial && <ClaseMaterialesForm  id_clase={id_clase} setEditaMaterial={setEditaMaterial} enviarSolicitud={enviarSolicitud} />}
            {!visible ? 
                materialClase.length !== 0 && (
                    <div className="materials-grid">
                        {materialClase.map((mcl)=>{
                            const details = getFileDetails(mcl);
                            return (
                                <div key={mcl.id} className={`material-card ${details.className}`}>
                                    <div className="material-icon-wrapper">
                                        <i className={details.icon}></i>
                                    </div>
                                    <div className="material-info">
                                        <a 
                                            href={mcl.tipo === 'vinculo' ? mcl.link : `${CONFIG.API_URL}/materialcursos/${mcl.link}`} 
                                            target='_blank' 
                                            rel="noreferrer"
                                            className='material-title'
                                        >
                                            {mcl.nombre}
                                        </a>
                                        <span className="material-subtitle">{details.label}</span>
                                    </div>
                                    {editaMaterial && (
                                        <button 
                                            onClick={() => quitarMaterial(mcl.id)} 
                                            className="btn-delete-material"
                                            title="Eliminar recurso"
                                        >
                                            <i className="fa-regular fa-trash-can"></i>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            : <div className='container m-3'><Espera visible={visible} /></div>
            }                
        </div>
     );
}


export default ClaseMateriales;