import { useState } from 'react';
import './css/estudiantes.css';

function Trayecto({ cursos }) {
    const [abierto, setAbierto] = useState(null);

    const ordenDeseado = [
        "s2","s3","s4","s5",
        "1","2","3","4","5","6",
        "m"
    ];

    const mostrarNombre = (orden) => {
        switch (orden?.toUpperCase()) {
            case "S2": return "Sala 2";
            case "S3": return "Sala 3";
            case "S4": return "Sala 4";
            case "S5": return "Sala 5";
            case "IN": return "Institucional";
            case "M": return "Módulo";
            default: return `${orden}°`;
        }
    };

    // Agrupar por formación
    const formaciones = cursos.reduce((acc, curso) => {

        if (!acc[curso.id_formacion]) {

            acc[curso.id_formacion] = {
                id: curso.id_formacion,
                nombre: curso.nombre_formacion,
                tipo: Number(curso.tipo_formacion),
                cursos: []
            };
        }

        acc[curso.id_formacion].cursos.push(curso);

        return acc;

    }, {});

    return (
        <div>
            <div className='card shadow border-0 bg-secondary-subtle m-1 p-2'>
                <h6>
                    Trayectoria académica
                    <i className="text-success fa-solid fa-person-running ms-2"></i>
                </h6>
            </div>
            {Object.values(formaciones).map(formacion => {
                // =====================================
                // FORMACIÓN PROFESIONAL
                // =====================================
                if (formacion.tipo === 6) {
                    const modulos = [...formacion.cursos]
                        .sort((a, b) =>
                            a.nombre_espacio.localeCompare(b.nombre_espacio)
                        );
                    const logrados = modulos.filter(
                        m => Number(m.aprobado) === 1
                    ).length;
                    const porcentaje =
                        modulos.length > 0
                            ? Math.round(
                                (logrados * 100) / modulos.length
                            )
                            : 0;
                    return (
                      <div className="card shadow-sm mb-2">
                          <div
                              className="card-header"
                              style={{cursor:"pointer"}}
                              onClick={() =>
                                  setAbierto(
                                      abierto === formacion.id
                                          ? null
                                          : formacion.id
                                  )
                              }
                          >
                              <div className="d-flex justify-content-between">
                                  <strong>{formacion.nombre}</strong>
                                  <i
                                      className={`fa-solid ${
                                          abierto === formacion.id
                                              ? "fa-chevron-up"
                                              : "fa-chevron-down"
                                      }`}
                                  />
                              </div>
                              <div className="progress mt-2">
                                  <div
                                      className="progress-bar bg-success"
                                      style={{ width: `${porcentaje}%` }}
                                  >
                                  {porcentaje}%
                                  </div>
                              </div>
                          </div>
                          {abierto === formacion.id && (
                              <div className="card-body">
                                  {modulos.map(modulo => (
                                      <div
                                          key={modulo.id_curso_grupo}
                                          className="border rounded p-2 mb-1 d-flex justify-content-between"
                                      >
                                          <span>
                                              {modulo.estado === "Cerrado" &&
                                                  <i className="fa-solid fa-lock me-2"></i>
                                              }
                                              {modulo.nombre_espacio}
                                          </span>
                                          {Number(modulo.aprobado) === 1
                                              ? <i className="fa-solid fa-circle-check text-success"></i>
                                              : <i className="fa-regular fa-circle"></i>
                                          }
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                    );
                }
                // =====================================
                // INICIAL - PRIMARIA - SECUNDARIA
                // =====================================
                const cursosOrdenados = [...formacion.cursos]
                    .sort((a, b) => {
                        const ia =
                            ordenDeseado.indexOf(
                                a.orden.toLowerCase()
                            );
                        const ib =
                            ordenDeseado.indexOf(
                                b.orden.toLowerCase()
                            );
                        return ia - ib;
                    });
                const gruposUnicos = [];
                cursosOrdenados.forEach(curso => {
                    const clave =
                        `${curso.cohorte}-${curso.orden}-${curso.denominacion}`;
                    if (
                        !gruposUnicos.find(
                            g => g.clave === clave
                        )
                    ) {
                        gruposUnicos.push({
                            clave,
                            cohorte: curso.cohorte,
                            orden: curso.orden,
                            denominacion: curso.denominacion
                        });
                    }
                });
                const color =
                    formacion.tipo === 1
                        ? "warning"
                        : formacion.tipo === 2
                            ? "primary"
                            : "success";
                return (
                    <div
                        key={formacion.id}
                        className={`card shadow-sm border-${color} mb-3`}
                    >
                        <div className={`card-header bg-${color} text-white`}>
                            {formacion.nombre}
                        </div>
                        <div className="card-body">
                            <ul className='cursosTrajectoria m-1'>
                                {gruposUnicos.map((grupo, i) => (
                                    <li key={i}>
                                        <div>
                                            <strong>
                                                {grupo.cohorte}
                                            </strong>
                                        </div>
                                        <div className="small text-muted">
                                            {mostrarNombre(grupo.orden)}
                                            {" "}
                                            "{grupo.denominacion}"
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default Trayecto;