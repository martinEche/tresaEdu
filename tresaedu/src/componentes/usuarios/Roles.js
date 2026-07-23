import axios from 'axios';
import { useEffect, useState } from 'react';
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config';

const URL = `${CONFIG.API_URL}/operarRoles.php`;

function Roles({ idUsuario, setUsuarios, rol, getUsuarios }) {
    const [roles, setRoles] = useState([]);
    const [rolSeleccionado, setRolSeleccionado] = useState(null); //control de seleccion

    const loggeduserRolId = localStorage.getItem('loggeduserRolId');



    useEffect(() => {
        setRolSeleccionado(null);
        //console.log(idUsuario)
        axios.post(URL, { 'id_usuario': idUsuario, 'modo': 'buscarRoles', 'rol': loggeduserRolId })
            .then(res => {
                if (!res.data.error) {
                    setRoles(res.data);
                } else {
                    setRoles([]);
                }
            })
            .catch(err => {
                console.log(err);
            })
    }, [idUsuario])


    const handleSubmint = (e) => {
        e.preventDefault();

        if (!rolSeleccionado) {
            show_alerta('Seleccione un rol', 'error');
            return;
        }
        //console.log(e.target.flexRadioDefault.value) 
        axios.post(URL, {
            'id_usuario': idUsuario,
            'modo': 'nuevoRol',
            'idRol': e.target.flexRadioDefault.value
        })
            .then(res => {
                var tipo = res.data[0];
                var msj = res.data[1];
                show_alerta(msj, tipo);
                if (tipo === 'success') {
                    setRolSeleccionado(null);
                    document.getElementById('btnCerrar2').click();
                    if (getUsuarios) getUsuarios();
                }
            })
            .catch(err => {
                show_alerta('Error en la acción ', 'error');
                console.log(err);
            })
    }

    return (
        <div>
            <form id='form' onSubmit={handleSubmint}>
                {roles.map((r) => (
                    //controlar que no pueda agregar un rol de numero inferior ni igual al que ya tiene asignado
                    (r.id > rol) && (r.id != 13) && (
                        <div key={r.id} className="form-check ms-2 mb-2">
                            <input
                                className="form-check-input"
                                type="radio"
                                value={r.id}
                                name="flexRadioDefault"
                                id={`chek_${r.id}`}
                                checked={rolSeleccionado === r.id}
                                onChange={() => setRolSeleccionado(r.id)}
                            />
                            <label
                                className="form-check-label"
                                htmlFor={`chek_${r.id}`}
                            >
                                <i className={r.icono}></i> {r.nombre}
                            </label>
                        </div>
                    )
                ))}
                <div className='row pe-3 pt-2'>
                    <button type='submit' className='btn btn-success m-2'>Agregar el rol seleccionado</button>
                </div>

            </form>
        </div>
    );
}

export default Roles;