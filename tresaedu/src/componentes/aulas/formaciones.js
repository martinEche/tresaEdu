import './css/Aulas.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from "react-router-dom";

import FormacionCaja from './FormacionCaja.js';
import FormacionCrudForm from './FormacionCrudForm.js';
import CONFIG from '../../config';

const URL_FORMACION = `${CONFIG.API_URL}/operarFormacion.php`;

function Formaciones({ acceder, rol, rolSelect, configuracion }) {
    const [formaciones, setFormaciones] = useState([]);
    const [verForm, setVerForm] = useState(false);
    const [datosFormacion, setDatosFormacion] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        if (acceder) {
            if ((rol === null) || (rol > 4)) {
                navigate("/");
            } else {
                //consulta las formaciones en la base de datos
                buscarFormaciones();
            }
        } else {
            localStorage.clear();
            navigate('/');
        }
    }, [formaciones]);

    //consulta las formaciones en la base de datos
    const buscarFormaciones = () => {
        axios.get(URL_FORMACION)
            .then(res => {
                if (!res.data.error) {
                    setFormaciones(res.data);
                } else {
                    setFormaciones([]);
                }
            })
            .catch(err => {
                console.log(err)
            })
    }

    const enviarFormData = (data) => {
        enviarSolicitud("POST", data);
    };

    const enviarSolicitud = async (metodo, parametros) => {
        //console.log('parametros: '+parametros)
        await axios({ method: metodo, url: URL_FORMACION, data: parametros })
            .then(res => {
                console.log("res: " + res.data);
                var tipo = res.data[0];
                var msj = res.data[1];
                //console.log(msj+'-'+tipo);
                show_alerta(msj, tipo);
                setVerForm(false);
                setDatosFormacion("");
                setFormaciones([]);
            })
            .catch(err => {
                show_alerta('Error en la solicitud ', 'error');
                console.log(err);
            })
    }

    const eliminarFormacion = (id) => {
        const MySwal = withReactContent(Swal);
        MySwal.fire({
            title: '¿Seguro de eliminar la formación?',
            icon: 'warning',
            html: '<span class=\"text-muted\">No se podrá dar marcha atrás</span>',
            showCancelButton: true, confirmButtonText: '<i class="fa-solid fa-trash-can"></i> Si, eliminar', cancelButtonText: 'Cancelar',
            customClass: {
                confirmButton: 'btn btn-danger mx-2 shadow-sm',
                cancelButton: 'btn btn-outline-secondary mx-2',
                popup: 'rounded-4 shadow'
            },
            buttonsStyling: false
        })
            .then(res => {
                if (res.isConfirmed) {
                    enviarSolicitud('DELETE', { 'id': id })
                    setFormaciones([]);
                }
            });
    };

    return (
        <div className='container-principal'>
            <h3>Formación
                {rol === 1 &&
                    <>
                        {!verForm && <button type="button" className='btn btn-outline-success m-2' onClick={() => setVerForm(true)} ><i className="fa-solid fa-plus"></i> nuevo</button>}
                    </>
                }
            </h3>
            {!verForm ?
                <div className='contenedor-card-estructura pb-3'>

                    {formaciones.map((f) => (
                        <div key={f.id}>
                            <FormacionCaja formacion={f} setVerForm={setVerForm} setDatosFormacion={setDatosFormacion} eliminarFormacion={eliminarFormacion} configuracion={configuracion} />
                        </div>
                    ))}
                </div>
                :
                <div className='contenedor-form'>
                    <FormacionCrudForm enviarFormData={enviarFormData} setVerForm={setVerForm} datosFormacion={datosFormacion} setDatosFormacion={setDatosFormacion} />
                </div>
            }
        </div>
    );
}

export default Formaciones;