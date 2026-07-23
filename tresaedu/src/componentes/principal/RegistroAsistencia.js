import { useState, useMemo } from "react";
import './registroAsistencia.css';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

function RegistroAsistencia({ anioRegistro, registroAsistencia, ListadosDeCursos, configuracion, tipo}) {

    const [fechaSeleccionada, setFechaSeleccionada] = useState("");
    const [formacionSeleccionada, setFormacionSeleccionada] = useState("");
    const [mesSeleccionado, setMesSeleccionado] = useState(() => {
        const hoy = new Date();
        return `${hoy.getFullYear()}-${String(
            hoy.getMonth() + 1
        ).padStart(2, "0")}`;
    }); 
    

    // Obtener fechas únicas
    const fechas = useMemo(() => {
        const filtradas = registroAsistencia.filter(reg => {
            if (!mesSeleccionado) return true;
            return reg.fecha.substring(0,7) === mesSeleccionado;
        });
        return [
            ...new Set(
                filtradas.map(r => r.fecha)
            )
        ].sort(
            (a,b) => new Date(b) - new Date(a)
        );
    }, [registroAsistencia, mesSeleccionado]);

    // Obtener formaciones únicas
    const formaciones = useMemo(() => {
        return [...new Map(
            registroAsistencia.map(r => [
                r.id_formacion,
                {
                    id: r.id_formacion,
                    nombre: r.nombre_formacion
                }
            ])
        ).values()];
    }, [registroAsistencia, mesSeleccionado]);

    //registros filtrados por mes para mostrar en el resumen de cursos sin carga o con menos carga
    const registrosMes = useMemo(() => {
        return registroAsistencia.filter(reg => {
            if (!mesSeleccionado) return true;
            return reg.fecha.substring(0,7) === mesSeleccionado;
        });
    }, [registroAsistencia, mesSeleccionado]);

    // Filtrado local
    const registrosFiltrados = useMemo(() => {
        return registroAsistencia.filter(reg => {

            const cumpleFecha =
                !fechaSeleccionada ||
                reg.fecha === fechaSeleccionada;

            const cumpleFormacion =
                !formacionSeleccionada ||
                Number(reg.id_formacion) === Number(formacionSeleccionada);
            
            const cumpleMes =
                !mesSeleccionado ||
                reg.fecha.substring(0,7) === mesSeleccionado;

           return (cumpleMes && cumpleFecha && cumpleFormacion);
        });
    }, [
        registroAsistencia,
        fechaSeleccionada,
        formacionSeleccionada,
        mesSeleccionado
    ]);

    const estadisticasCursos = useMemo(() => {
        return ListadosDeCursos.map(curso => {
            const registrosCurso = registrosMes.filter(
                r => Number(r.id_curso_grupo) === Number(curso.id_curso_grupo)
            );
            return {
                ...curso,
                cantidadRegistros: registrosCurso.length
            };
        }).sort(
            (a, b) => a.cantidadRegistros - b.cantidadRegistros
        );
    }, [ListadosDeCursos, registrosMes]);

    const cursosSinCarga = estadisticasCursos.filter(
        c => c.cantidadRegistros === 0
    );

    const cursosConMenosCarga = estadisticasCursos
        .filter(c => c.cantidadRegistros > 0)
        .slice(0, 10);

    const mesesCiclo = useMemo(() => {
        const hoy = new Date();
        const fechaInicio = new Date(anioRegistro, 2, 1); // marzo
        const fechaActual = new Date(
            hoy.getFullYear(),
            hoy.getMonth(),
            1
        );

        const nombresMeses = [
            "Enero","Febrero","Marzo","Abril",
            "Mayo","Junio","Julio","Agosto",
            "Septiembre","Octubre","Noviembre","Diciembre"
        ];
        const meses = [];
        let fecha = new Date(fechaActual);
        while (fecha >= fechaInicio) {
            meses.push({
                value: `${fecha.getFullYear()}-${String(
                    fecha.getMonth() + 1
                ).padStart(2, "0")}`,

                label: `${nombresMeses[fecha.getMonth()]} ${fecha.getFullYear()}`
            });
            fecha.setMonth(fecha.getMonth() - 1);
        }
        return meses;
    }, [anioRegistro]);

    //mostrar mes en letras en el select del filtro de meses
    const nombreMes = mesesCiclo.find(
        m => m.value === mesSeleccionado
    )?.label;

    const datosGrafico = useMemo(() => {
        console.log("render grafico");
        // MODO MES
        if (mesSeleccionado) {
            const agrupados = {};
            registrosMes.forEach(reg => {
                if (!agrupados[reg.fecha]) {
                    agrupados[reg.fecha] = {
                        presentes: 0,
                        ausentes: 0
                    };
                }
                agrupados[reg.fecha].presentes +=
                    Number(reg.total_presentes);

                agrupados[reg.fecha].ausentes +=
                    Number(reg.ausentes);
            });
            const fechas = Object.keys(agrupados)
                .sort((a,b) => new Date(a)-new Date(b));
            return {
                labels: fechas.map(f =>
                    new Date(f + "T00:00:00")
                        .toLocaleDateString("es-AR")
                ),
                datasets: [
                    {
                        label: "Presentes",
                        data: fechas.map(
                            f => agrupados[f].presentes
                        ),
                        borderColor: "#28a745",
                        backgroundColor: "#28a745",
                        tension: 0.3
                    },
                    {
                        label: "Ausentes",
                        data: fechas.map(
                            f => agrupados[f].ausentes
                        ),
                        borderColor: "#dc3545",
                        backgroundColor: "#dc3545",
                        tension: 0.3
                    }
                ]
            };
        }
        // MODO CICLO COMPLETO
        const agrupadosMes = {};

        registroAsistencia.forEach(reg => {
            const mes = reg.fecha.substring(0,7);
            if (!agrupadosMes[mes]) {
                agrupadosMes[mes] = {
                    presentes: 0,
                    ausentes: 0
                };
            }
            agrupadosMes[mes].presentes +=
                Number(reg.total_presentes);
            agrupadosMes[mes].ausentes +=
                Number(reg.ausentes);
        });
        const meses = Object.keys(agrupadosMes).sort();
            return {
                labels: meses,
                datasets: [
                    {
                        label: "Presentes",
                        data: meses.map(
                            m => agrupadosMes[m].presentes
                        ),
                        borderColor: "#28a745",
                        backgroundColor: "#28a745",
                        tension: 0.3
                    },
                    {
                        label: "Ausentes",
                        data: meses.map(
                            m => agrupadosMes[m].ausentes
                        ),
                        borderColor: "#dc3545",
                        backgroundColor: "#dc3545",
                        tension: 0.3
                    }
                ]
            };
    }, [mesSeleccionado, registrosMes, registroAsistencia]);

    //opciones grafico
    const opcionesGrafico = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top"
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };
    
    return (
        <>
            {tipo==='full' && (
                <h6>Registro de asistencia en plataforma</h6>
            )}  
            <div>                     
                <select
                    className="form-select mb-1"
                    value={mesSeleccionado}
                    onChange={(e) => {
                        setMesSeleccionado(e.target.value);
                        setFechaSeleccionada("");
                    }}
                >
                    <option value="">
                        Todo el ciclo
                    </option>
                    {mesesCiclo.map(mes => (
                        <option
                            key={mes.value}
                            value={mes.value}
                        >
                            {mes.label}
                        </option>
                    ))}
                </select>
            </div>
            {/*Grafico asistencia*/}
            <div className="card shadow-sm mb-3">
                <div className="card-body">
                    <h6>
                        {mesSeleccionado
                            ? `Variación diaria de asistencia - ${nombreMes}`
                            : "Variación mensual de asistencia"}
                    </h6>

                    <div
                        style={{
                            position: "relative",
                            height: `${tipo === "full" ? "250px" : "150px"}`,
                            width: "100%"
                        }}
                    >
                        <Line
                            data={datosGrafico}
                            options={opcionesGrafico}
                        />
                    </div>
                </div>
            </div>

            <div className="container-fluid ">
              <div className="row g-3">    
                {/* mostar los cursos que no cargaron asistenacia en el año actual u ordenarlos de acurdo a los que menos registros tienen cargados para  identificar quien no cargo o quien tien carga incompleta */}
                <div className={`col-12 ${tipo === "full" ? "col-lg-7" : ""}`}>   
                   <div className="alert alert-warning">
                    {cursosSinCarga.length > 0 ? (
                        <>
                            <strong>
                                <i className="fa-solid fa-triangle-exclamation me-2"></i>
                                Cursos sin registros en {nombreMes && ` - ${nombreMes}`}:
                            </strong>

                            <ul className="mb-2 mt-2 control-asistencia-scroll">
                                {cursosSinCarga.map(curso => (
                                    <li className='small' key={curso.id_curso_grupo}>
                                        {curso.nombre_formacion}
                                        {" - "}
                                        {curso.nombre_espacio}
                                        {" "}
                                        {curso.denominacion}#{curso.id_curso_grupo}
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <div className="text-success">
                            <i className="fa-solid fa-circle-check me-2"></i>
                            Todos los cursos poseen al menos una carga de asistencia.
                        </div>
                    )}

                    {cursosConMenosCarga.length > 0 && (
                        <>
                            <hr />
                            <strong>
                                Registros por curso en {nombreMes && ` - ${nombreMes}`}:
                            </strong>
                            <ul className="mb-0 mt-2 control-asistencia-scroll">
                                {cursosConMenosCarga.map(curso => (
                                    <li className='small' key={curso.id_curso_grupo}>
                                        {curso.nombre_espacio.includes("años") ? `Sala ${curso.nombre_espacio}` : curso.nombre_espacio}
                                        {" "}
                                        {curso.denominacion}
                                        {" → "}
                                        <strong>
                                            {curso.cantidadRegistros}
                                        </strong>
                                        {" registros"}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    </div>
                </div>
            
                {tipo === "full" && 
                <div className="col-12 col-lg-5">    
                    <div className="row mb-3 shadow-sm p-1 mx-1">
                        <h6>ver asistencia por curso y por dia</h6>
                        {/* FILTRO FECHA */}
                        <div className="col-md-6 d-flex ">
                            <label className="form-label me-1">
                                Fecha
                            </label>
                            <select
                                className="form-select"
                                value={fechaSeleccionada}
                                onChange={(e) =>
                                    setFechaSeleccionada(e.target.value)
                                }
                            >
                                <option value="">
                                    Todas las fechas
                                </option>

                                {fechas.map(fecha => (
                                    <option key={fecha} value={fecha}>
                                        {new Date(fecha + "T00:00:00").toLocaleDateString("es-AR")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* FILTRO FORMACION */}
                        <div className="col-md-6 d-flex">
                            <label className="form-label me-1">
                                Nivel
                            </label>

                            <select
                                className="form-select"
                                value={formacionSeleccionada}
                                onChange={(e) =>
                                    setFormacionSeleccionada(e.target.value)
                                }
                            >
                                <option value="">
                                    Todas las formaciones
                                </option>

                                {formaciones.map(f => (
                                    <option
                                        key={f.id}
                                        value={f.id}
                                    >
                                        {f.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive">
                    {!(fechaSeleccionada==='' && formacionSeleccionada==='') && 
                    <>  
                        <span className="small">fecha: {fechaSeleccionada}</span> |  
                        <span className="small">formacion: {formacionSeleccionada}</span>
                        <table className="table table-striped table-sm">
                            <thead>
                                <tr>
                                    <th className="small">Curso</th>
                                    <th className="small">P</th>
                                    <th className="small">A</th>
                                    <th className="small">T</th>
                                    <th className="small">Total</th>
                                </tr>
                            </thead>

                            <tbody>
                                {registrosFiltrados.map((reg, index) => (
                                    <tr key={index}>
                                        <td className="small">
                                            {reg.nombre_espacio}
                                            {" "}
                                            {reg.denominacion}
                                        </td>
                                        <td className="small">{reg.presentes}</td>
                                        <td className="small">{reg.ausentes}</td>
                                        <td className="small">{reg.tardes}</td>
                                        <td className="small">{reg.total_presentes+reg.ausentes}</td>
                                    </tr>
                                ))}

                                {registrosFiltrados.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="text-center"
                                        >
                                            No hay registros para los filtros seleccionados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </>
                    }
                    </div>
                </div>
                }
              </div>
            </div>
        </>
    );
}

export default RegistroAsistencia;