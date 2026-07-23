import './css/Aulas.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";


import Espacios from './Espacios';
import CONFIG from '../../config';

const URL = `${CONFIG.API_URL}/operarFormacion.php`;

function Formacion({ acceder, rol, configuracion }) {
    const [datosFormacion, setDatosFormacion] = useState('');
    const { formacionId } = useParams();

    const navigate = useNavigate();

    const data = {
        'id': formacionId,
        'modo': 'buscarFormacionID'
    }

    useEffect(() => {
        if (acceder) {
            if ((rol === null) || (rol > 4)) {
                navigate("/");
            } else {
                axios.post(URL, data)
                    .then(res => {
                        //console.log(res.data)
                        if (!res.data.error) {
                            setDatosFormacion(res.data);
                        } else {
                            setDatosFormacion('');
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    })
            }
        } else {
            localStorage.clear();
            navigate('/');
        }
    }, [acceder, rol])



    return (
        <div className='container-principal fuente-formacion'>
            {datosFormacion ?
                <div key={datosFormacion.id}>
                    <div className="d-flex align-items-center mb-4 mt-2 pb-4 border-bottom">
                        <div className="me-4">
                            {datosFormacion.caratula != '' ?
                                <img className='shadow-sm object-fit-cover' style={{ borderRadius: '12px', width: '120px', height: '120px' }} src={`${CONFIG.API_URL}/${datosFormacion.caratula}`} alt="Carátula" />
                                :
                                <img className='shadow-sm object-fit-cover' style={{ borderRadius: '12px', width: '120px', height: '120px' }} src={`${CONFIG.API_URL}/img/${configuracion.imagen_fondo}`} alt="Fondo" />
                            }
                        </div>
                        <div>
                            <h2 className='fw-bold mb-2' style={{ color: configuracion.color_principal || '#333' }}>
                                {datosFormacion.nombre_formacion}
                            </h2>
                            {datosFormacion.resolucion_p && datosFormacion.resolucion_p.trim() !== '' && (
                                <h5 className='text-secondary mb-0 fw-normal'>
                                    Resolución: {datosFormacion.resolucion_p}
                                </h5>
                            )}
                        </div>
                    </div>
                    <Espacios id_formacion={datosFormacion.id} nivel={datosFormacion.nivel} configuracion={configuracion} />
                </div>
                : ''}
        </div>
    );
}

export default Formacion;