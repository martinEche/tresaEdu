import { useState, useEffect } from 'react';
import { buscarCursoPorId, buscarEstudiantesPorCurso, buscarDocentesPorCurso } from '../servicios/cursoServicios';

const useCursoData = (id_curso_grupo) => {
    const [curso, setCurso] = useState(null);
    const [docentesCurso, setDocentesCurso] = useState([]);
    const [estudiantesCurso, setEstudiantesCurso] = useState([]);
    const [inscripciones, setInscripciones] = useState(false);
    const fechaActual = new Date();

    const fetchEstudiantesCurso = async () => {
        try {
            const resEstudiantes = await buscarEstudiantesPorCurso(id_curso_grupo);
            if (!resEstudiantes.data.error) {
                setEstudiantesCurso(resEstudiantes.data);
            } else {
                setEstudiantesCurso([]);
            }
        } catch (err) {
            console.log(err);
            setEstudiantesCurso([]);
        }
    };

    const fetchDocentesCurso = async () => {
        try {
            const resDocentes = await buscarDocentesPorCurso(id_curso_grupo);
            if (!resDocentes.data.error) {
                setDocentesCurso(resDocentes.data);
            } else {
                setDocentesCurso([]);
            }
        } catch (err) {
            console.log(err);
            setDocentesCurso([]);
        }
    };

    useEffect(() => {
        const fetchCursoData = async () => {
            try {
                const resCurso = await buscarCursoPorId(id_curso_grupo);
                if (!resCurso.data.error) {
                    const cursoData = resCurso.data;
                    setCurso(cursoData);

                    const fechaInicio = new Date(cursoData.fecha_inicio);
                    const fechaFin = new Date(cursoData.fecha_fin);
                    setInscripciones(fechaInicio <= fechaActual && fechaActual <= fechaFin);

                    const resEstudiantes = await buscarEstudiantesPorCurso(cursoData.id_curso_grupo);
                    if (!resEstudiantes.data.error) {
                        setEstudiantesCurso(resEstudiantes.data);
                    } else {
                        setEstudiantesCurso([]);
                    }

                    const resDocentes = await buscarDocentesPorCurso(cursoData.id_curso_grupo);
                    if (!resDocentes.data.error) {
                        console.log("docentes",resDocentes.data)
                        setDocentesCurso(resDocentes.data);
                    } else {
                        setDocentesCurso([]);
                    }
                } else {
                    setCurso(null);
                }
            } catch (err) {
                console.log(err);
                setCurso(null);
                setEstudiantesCurso([]);
                setDocentesCurso([]);
            }
        };

        fetchCursoData();
    }, [id_curso_grupo]);

    return { curso, docentesCurso, estudiantesCurso, inscripciones, fetchEstudiantesCurso, fetchDocentesCurso  };
};

export default useCursoData;
