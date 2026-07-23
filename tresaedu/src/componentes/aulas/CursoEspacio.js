import './css/Aulas.css';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { show_alerta } from '../../funciones.js';
import CursoEquipoDocente from './CursoEquipoDocente';
import CONFIG from '../../config';

const URL = `${CONFIG.API_URL}/operarCursos.php`;

function CursoEspacio({ orden, cohorte, id_formacion }) {
    const [cursosEspacios, setCursosEspacios] = useState([]);
    const [gruposCursos, setGruposCursos] = useState([]);
    const [selCurso, setSelCurso] = useState('');
    const [selSeccion, setSelSeccion] = useState('');
    const [selDocente, setSelDocente] = useState('');


    useEffect(() => {
        buscaCursos(orden, cohorte, id_formacion);
        buscaGrupos(orden, cohorte, id_formacion);
    }, []);

    // Función para buscar los cursos/espacios
    const buscaCursos = (orden, cohorte, id_formacion) => {
        let data = { orden, cohorte, id_formacion, modo: 'buscarInfoCurso' };
        axios.post(URL, data)
            .then(res => {
                setCursosEspacios(res.data.error ? [] : res.data);
            })
            .catch(console.error);
    }

    // Función para buscar los grupos para los cursos-espacios
    const buscaGrupos = (orden, cohorte, id_formacion) => {
        let data = { orden, cohorte, id_formacion, modo: 'GruposPorOrden' };
        axios.post(URL, data)
            .then(res => {
                setGruposCursos(res.data.error ? [] : res.data);
            })
            .catch(console.error);
    }

    // Función para enviar solicitud HTTP
    const enviarSolicitud = async (metodo, url, parametros) => {
        try {
            const res = await axios({ method: metodo, url: url, data: parametros });
            var tipo = res.data[0];
            var msj = res.data[1];
            show_alerta(msj, tipo);
        } catch (error) {
            show_alerta('Error en la solicitud', 'error');
            console.error(error);
        }
    }

    return (
        <div>
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 mt-2">
                <div className="table-responsive">
                    <table className='table table-hover align-middle mb-0'>
                        <thead className='table-light text-muted'>
                            <tr>
                                <th className="fw-semibold px-3"></th>
                                <th className="fw-semibold">nombre curso</th>
                                {gruposCursos.map((g) => (
                                    <th key={g.id}>{g.denominacion}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className='small'>
                            {cursosEspacios.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <span className={`text-${c.estado === 'Abierto' ? 'success' : 'warning'}`}>
                                            <i className={`wrap-icon fa-solid fa-lock${c.estado === 'Abierto' ? '-open' : ''} mr-3`}></i>
                                        </span>
                                    </td>
                                    <td className='small'>{`${c.nombre} (${c.espacio})`}</td>
                                    {gruposCursos.map((g, index) => (
                                        <td key={index}>
                                            <CursoEquipoDocente
                                                id_curso={c.id}
                                                seccion={g.seccion} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default CursoEspacio;  
