import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config.js';

const URL_CURSOS = `${CONFIG.API_URL}/operarEstudiantes.php`;
const URL_COHORTES = `${CONFIG.API_URL}/operarCohortes.php`;
const URL_PROMOVER = `${CONFIG.API_URL}/operarPromocionEstudiantes.php`;

function PromocionEstudiante({ acceder, configuracion, rol }) {
    const [cicloSeleccionado, setCicloSeleccionadoo] = useState("");
    
    const [cohorteOrigenSeleccionada, setCohorteOrigenSeleccionada] = useState('');
    const [cohorteDestinoSeleccionada, setCohorteDestinoSeleccionada] = useState('');
    const[cohortes, setCohortes]=useState([]);
    const[cohorteDestino, setCohorteDestino]=useState([]);
    
    const [cursoOrigen, setCursoOrigen] = useState([]);
    const [cursoDestino, setCursoDestino] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [valoraciones, setValoraciones] = useState([]);
    const [cursoSeleccionadoOrigen, setCursoSeleccionadoOrigen] = useState('');
    const [cursoSeleccionadoDestino, setCursoSeleccionadoDestino] = useState('');
    
    const [bloquearDestino, setBloquearDestino] = useState(false); // si no existe proxima cohorte, no permitir promocion
    const [promociones, setPromociones] = useState({});

    const navigate = useNavigate();
    
    useEffect(() => {
        if(acceder){
            if(rol===null){
                navigate("/");
            }
            // Obtener cohortes disponibles
            obtenerCohortes();
            if(cohorteOrigenSeleccionada!==''){
                obtenerCursosOrigen();
            }
            if(cohorteDestinoSeleccionada!==''){
                obtenerCursosDestino();
            }
        }else{
            localStorage.clear();
            navigate('/');
        }
    }, [cursoSeleccionadoOrigen, cohorteOrigenSeleccionada]);

    useEffect(() => {
        if (estudiantes.length === 0 || valoraciones.length === 0) return;

        const inicial = {};
        estudiantes.forEach(est => {
            inicial[est.id] = espaciosPendientes(est.id).length === 0;
        });

        setPromociones(inicial);
    }, [estudiantes, valoraciones]);

    const obtenerCohortes = async () => {
        const res = await axios.get(`${URL_COHORTES}?accion=listar`);
        console.log("cohortes:",res.data);
        if(!res.data.error) {
            setCohortes(res.data.cohortes);
        }else{
            setCohortes([]);
            alert("Error al cargar las cohortes:", res.data.error);
        }
    };

    const obtenerCursosOrigen = async () => {
        //console.log("Cohorte origen:", `${URL_CURSOS}?curso_grupo=${cursoSeleccionadoOrigen}&cohorte=${cohorteOrigenSeleccionada}`);
        const res = await axios.get(`${URL_CURSOS}?curso_grupo=${cursoSeleccionadoOrigen}&cohorte=${cohorteOrigenSeleccionada}&cohorteDestino=${cohorteDestinoSeleccionada}`);
        console.log("cursos:",res.data);
        if(!res.data.error) {
            setCursoOrigen(res.data.cursos);
            if(res.data.estudiantes) {
                setEstudiantes(res.data.estudiantes);
            }
            if(res.data.valoraciones) {
                setValoraciones(res.data.valoraciones);
            }
        }else{
            setCursoOrigen([]);
            //alert("Error al cargar los cursos:", res.data.error);
        }
    };

    const obtenerCursosDestino = async () => {
        //console.log("Cohorte destino:", `${URL_CURSOS}?curso_grupo=${cursoSeleccionadoDestino}&cohorte=${cohorteDestinoSeleccionada}`);
        const res = await axios.get(`${URL_CURSOS}?curso_grupo=${cursoSeleccionadoDestino}&cohorte=${cohorteDestinoSeleccionada}`);
        //console.log("cursos:",res.data);
        if(!res.data.error) {
            setCursoDestino(res.data.cursos);
            if(res.data.estudiantes) {
                setEstudiantes(res.data.estudiantes);
            }
            if(res.data.valoraciones) {
                setValoraciones(res.data.valoraciones);
            }
        }else{
            setCursoDestino([]);
            alert("Error al cargar los horarios:", res.data.error);
        }
    };

    const seleccionarCohorteOrigen = (e) => {
        const idSeleccionado = parseInt(e.target.value);

        setCohorteOrigenSeleccionada(idSeleccionado);

        const cohorteOrigen = cohortes.find(
            c => c.id === idSeleccionado
        );

        if (!cohorteOrigen) {
            setCohorteDestinoSeleccionada(0);
            setBloquearDestino(false);
            return;
        }
        setCicloSeleccionadoo(cohorteOrigen.año);
        const anioDestino = cohorteOrigen.año + 1;

        const cohorteD = cohortes.find(
            c =>
                c.id_formacion === cohorteOrigen.id_formacion &&
                Number(c.año) === Number(anioDestino)
        );

        if (cohorteD) {
            // existe destino → autocompleta y bloquea
            setCohorteDestinoSeleccionada(cohorteD.id);
            setCohorteDestino(cohorteD);
            setBloquearDestino(true);
        } else {
            // NO existe → limpio y habilito
            setCohorteDestinoSeleccionada(0);
            setBloquearDestino(true);
        }
    };
    //agrupar valoraciones por estudiante
    const valoracionesPorUsuario = valoraciones.reduce((acc, v) => {
        if (!acc[v.id_usuario]) {
            acc[v.id_usuario] = [];
        }
        acc[v.id_usuario].push(v);
        return acc;
    }, {});
    
    //detectar espacios no aprobados o null
    const espaciosPendientes = (idUsuario) => {
        const datos = valoracionesPorUsuario[idUsuario] || [];

        return datos.filter(v =>
            v.valor === null || Number(v.valor) < 6
        );
    };

    // obtener cursos unicos sin repetir por orden y seccion
    const getCursosUnicos = (cursos) => {
        const unicos = [];
        const map = new Map();
        for (const item of cursos) {
            const key = `${item.orden}-${item.seccion}`;
            if(!map.has(key)){
                map.set(key, true);
                unicos.push(item);
            }
        }
        return unicos;
    };

    //calcula el promeido de notas
    const calcularPromedio = (idUsuario) => {
        const datos = valoracionesPorUsuario[idUsuario] || [];

        const notas = datos
            .filter(v => v.valor !== null)
            .map(v => Number(v.valor));

        if (notas.length === 0) return null;

        const suma = notas.reduce((acc, n) => acc + n, 0);
        return (suma / notas.length).toFixed(2);
    };

    //promover estudiantes
    const promoverEstudiantes = async () => {
        // estudiantes promovibles (checkbox activos)
        const estudiantesPromovidos = estudiantes
            .filter(e => espaciosPendientes(e.id).length === 0)
            .map(e => e.id);

        if (estudiantesPromovidos.length === 0) {
            show_alerta("No hay estudiantes en condiciones de promoción", "warning");
            return;
        }

        if (!cursoSeleccionadoDestino || cohorteDestinoSeleccionada === 0) {
            show_alerta("Debe seleccionar curso y cohorte destino", "warning");
            return;
        }

        const data = {
            accion: "promover",
            cohorte_origen: cohorteOrigenSeleccionada,
            cohorte_destino: cohorteDestinoSeleccionada,
            curso_origen: cursoSeleccionadoOrigen,
            curso_destino: cursoSeleccionadoDestino,
            estudiantes: estudiantesPromovidos
        };

        try {
            const res = await axios.post(URL_PROMOVER, data);
            console.log("respuesta promoción:", res.data);
            if (!res.data.error) {
                show_alerta("Promoción realizada correctamente", "success");
            } else {
                show_alerta(res.data.mensaje || "Error al promover", "error");
            }

        } catch (error) {
            console.error(error);
            show_alerta("Error de conexión con el servidor", "error");
        }
    };


    return (    
        <div className="container-principal">
            <h2>Promoción de Estudiantes</h2>
            <div className="alert alert-warning">
                Para gestionar la promoción de estudiantes a nuevos cursos o niveles la cohorte correspondiente debe estar creada.
            </div>
            {/* Aquí la lógica y componentes necesarios para la promoción */}  
            {/*ORIGEN PROMOCION ESTUDIANTES*/}
            <div className="input-group mb-3">
                {/* Selector de cohorte ORIGEN */}
                <label className="input-group-text" htmlFor="inputGroupSelectCohorte">
                    <i className="fa-solid fa-magnifying-glass me-1"></i>
                    Seleccionar cohorte
                </label>
                <select
                    id="inputGroupSelectCohorte"
                    className="form-select"
                     value={cohorteOrigenSeleccionada}
                    onChange={(e) => seleccionarCohorteOrigen(e)}
                    required
                >
                    <option value="0">Seleccionar cohorte</option>
                    {cohortes.map((c, index) => (
                        <option key={index} value={c.id}>
                           {c.nombre_formacion}-{c.año}
                        </option>
                    ))}
                </select>
                <label className="input-group-text" htmlFor="inputGroupSelect01Origen">
                    <i className="fa-solid fa-magnifying-glass me-1"></i>
                    Seleccionar curso
                </label>
                <select
                    id="inputGroupSelect01Origen"
                    className="form-select"
                    value={cursoSeleccionadoOrigen}
                    onChange={(e) => setCursoSeleccionadoOrigen(e.target.value)}
                    required
                >
                    <option value="0">Seleccionar curso</option>
                    {getCursosUnicos(cursoOrigen).map((c, index) => (
                        <option key={index} value={`${c.orden}-${c.seccion}`}>
                        {c.orden}-{c.seccion} ({c.denominacion}) 
                        </option>
                    ))}
                </select>
            </div>
            {/*DESTINO PROMOCION ESTUDIANTES*/}
            <div className="input-group mb-3">
                {/* Selector de cohorte DESTINO */}
                <label className="input-group-text" htmlFor="inputGroupSelectCohorteDestino">
                    <i className="fa-solid fa-magnifying-glass me-1"></i>
                    Destino
                </label>
                <select
                    id="inputGroupSelectCohorteDestino"
                    className="form-select"
                    value={cohorteDestinoSeleccionada}
                    disabled={bloquearDestino}
                    onChange={(e) => setCohorteDestinoSeleccionada(e.target.value)}
                >
                    <option value="0">Seleccionar cohorte</option>
                    {cohortes.map((c, index) => (
                        <option key={index} value={c.id}>
                            {c.nombre_formacion}-{c.año}
                        </option>
                    ))}
                </select>
                <label className="input-group-text" htmlFor="inputGroupSelect01Destino">
                    <i className="fa-solid fa-magnifying-glass me-1"></i>
                    Seleccionar curso
                </label>
                <select
                    id="inputGroupSelect01Destino"
                    className="form-select"
                    value={cursoSeleccionadoDestino}
                    onChange={(e) => setCursoSeleccionadoDestino(e.target.value)}
                    required
                >
                    <option value="0">Seleccionar curso</option>
                    {getCursosUnicos(cursoDestino).map((c, index) => (
                        <option key={index} value={`${c.orden}-${c.seccion}`}>
                        {c.orden}-{c.seccion} ({c.denominacion}) 
                        </option>
                    ))}
                </select>
            </div>
            <div>
                {estudiantes.length === 0 ? (
                    <p>No hay estudiantes para mostrar</p>
                ) : (
                    <>
                        <h5>
                           Curso {cursoSeleccionadoOrigen} año {cicloSeleccionado}:
                        </h5>
                        <div className="row">
                            <div className="col-6"><h5>Estudiantes</h5></div>
                            <div className="col-6"><h5>Espacios</h5></div>
                        </div>
                        {estudiantes.map((estudiante, index) => {
                            const pendientes = espaciosPendientes(estudiante.id);
                            console.log("pendientes:",pendientes);
                            return (
                            <>
                                <div key={index} className="row mb-2">
                                    <div className="col-6">
                                        <p className="mb-1">
                                            <span className="pe-3">
                                                {estudiante.nombre} {estudiante.apellido}
                                            </span>
                                            <input
                                                type="checkbox"
                                                className="me-1"
                                                id={`promover-${estudiante.id}`}
                                                checked={promociones[estudiante.id] || false}
                                                onChange={(e) =>
                                                    setPromociones({
                                                        ...promociones,
                                                        [estudiante.id]: e.target.checked
                                                    })
                                                }
                                            />
                                            <label htmlFor={`promover-${estudiante.id}`}>
                                                inscribir en el curso destinoseleccionado
                                            </label>
                                        </p>
                                    </div>
                                    <div className="col-6">
                                        <div>
                                            <small>
                                            Promedio:{" "}
                                            <strong>
                                                {calcularPromedio(estudiante.id) ?? "—"}
                                            </strong>
                                            </small>
                                            {pendientes.length === 0 ? (
                                                        <small className="text-success ms-2">✔ promociona</small>
                                                    ) : (
                                                        <small className="text-warning ms-2">⚠ Tiene pendientes</small>
                                                    )}
                                        </div>

                                        <div>
                                            {pendientes.length > 0 && (
                                            <small>Espacios adeudados: {pendientes.length}
                                                <small className="text-danger ms-3">(
                                                    {pendientes.map(p => p.nombre_espacio).join(", ")}
                                                )
                                                </small>
                                            </small>
                                            )}
                                        
                                        </div>
                                    </div>
                                </div>
                            </>
                            );
                        })}

                        <div className="my-2">
                            <button 
                                className="btn btn-primary"
                                onClick={promoverEstudiantes}
                                disabled={!cursoSeleccionadoDestino || cursoSeleccionadoDestino === "0" || !cohorteDestinoSeleccionada || cohorteDestinoSeleccionada === 0 || cohorteDestinoSeleccionada === "0"}>
                                Promover Estudiantes seleccionados a {cursoSeleccionadoDestino} - {cohorteDestino ? `${cohorteDestino.nombre_formacion}-${cohorteDestino.año}` : ''}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
     );
}

export default PromocionEstudiante;