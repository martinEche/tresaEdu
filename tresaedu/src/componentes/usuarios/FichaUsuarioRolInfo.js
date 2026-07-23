import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import CONFIG from '../../config';

const URL  = `${CONFIG.API_URL}/operarRoles.php`;

function FichaUsuarioRolInfo({rol, usuarioId}) {
    const navigate = useNavigate();
    const [infoRol, setInfoRol] = useState([]);
    const [infoRolTutor, setInfoRolTutor] = useState([]);

    useEffect(() => {
        obtenerInfoRol();
    }, [rol, usuarioId]);
    
    const obtenerInfoRol = async () => {
        const data = {
            'id_usuario': usuarioId,
            'rol' : rol,
            'modo': 'buscarInfoRolUsuario'
        };
        
        try {
            const res = await axios.post(URL, data);
            console.log('valor: ' + JSON.stringify(res.data));
            if(!res.data.error){
                setInfoRol(res.data.resultado);
                setInfoRolTutor(res.data.tutores || []);
            } else {
                setInfoRol([]);
            }
        } catch (err) {
            console.error(err);
        } 
    };
    
    const mostrarNombre = (orden) => {
        let nombre = "";
        switch (orden) {
            case "S2":
                nombre = 'Sala 2 años';
                break;
            case "S3":
                nombre = 'Sala 3 años';
                break;
            case "S4":
                nombre = 'Sala 4 años';
                break;
            case "S5":
                nombre = 'Sala 5 años';
                break;
            case "In":
                nombre = 'Espacio Institucional';
                break;
            default:
                nombre = orden + '°';
        }
        return nombre;
    };

    // Agrupa los datos por `cohorte` y `orden` si el `rol` es 7
    const agruparPorCohorteYOrden = (datos) => {
        return datos.reduce((acc, item) => {
            const key = `${item.cohorte}-${item.orden}`;
            if (!acc[key]) {
                acc[key] = { cohorte: item.cohorte, orden: item.orden, denominacion: item.denominacion, estado: item.estado, items: [] };
            }
            acc[key].items.push(item);
            return acc;
        }, {});
    };

    const datosAgrupados = rol === 7 ? Object.values(agruparPorCohorteYOrden(infoRol)) : [];

    return ( 
        <>
        {rol == 0 ? 
        <>
            <img src={`${process.env.PUBLIC_URL}/img/seleccionar_carpeta.png`} width='250px'/>
            <h5 className="text-secondary ms-2">Seleccione una pestaña</h5>
        </>
         : 
         <>
         {infoRol.length === 0 ? "No existen datos"
            : <div className='pt-4 pb-4'>
                {rol === 8 ?
                    <>
                        <h5>El usuario es tutor de:</h5>
                        {infoRol.map((c, index) => (
                            <div key={index}>
                                <b>{c.nombre}, {c.apellido}</b> - DNI: {c.documento} 
                                <button 
                                    type="button" 
                                    className='btn btn-sm btn-info m-1' 
                                    onClick={() => navigate(`/Ficha/${c.estudiante_id}`)}
                                >
                                    <i className="fa-regular fa-id-card"></i>
                                </button>
                            </div>
                        ))}
                    </>
                    : <>
                        {infoRolTutor.length > 0 && <h4>Tutor</h4> && infoRolTutor.map((t, index) => (
                            <div key={index}>{t.nombre} {t.apellido}</div>
                        ))}
                        {rol === 7 && 
                            <>
                                <h5>Estudiante en</h5> 
                                {datosAgrupados.map((grupo, index) => (
                                    <div key={index}>
                                        <h6><i className="fa-solid fa-boxes-stacked text-success"></i> {grupo.cohorte} - {mostrarNombre(grupo.orden)} grupo {grupo.denominacion} (curso {grupo.estado})</h6>
                                        
                                    </div>
                                ))}
                            </>
                        }
                        {(rol === 6 || rol === 5) && 
                            <>
                                <h5>Docente en</h5> 
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>cohorte</th>
                                            <th>año/sala</th>
                                            <th>espacio</th>
                                            <th>Grupo</th>
                                            <th>Estado</th>
                                            <th>Alta</th>
                                            <th>Condicion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {infoRol.map((c, index) => (
                                        <tr key={index}>
                                            <td>{c.cohorte}</td>
                                            <td> {mostrarNombre(c.orden)} </td>
                                            <td> {c.nombre_espacio} </td>
                                            <td> {c.denominacion}</td>
                                            <td> {c.estado}</td>
                                            <td> {c.fecha_alta} </td>
                                            <td>{c.condicion}</td>
                                        </tr>
                                    ))}
                                    </tbody>  
                                </table>
                            </>
                        }
                    </>
                }
            </div>
         }
         </>
        }
        </>
    );
}

export default FichaUsuarioRolInfo;
