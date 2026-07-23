import { useEffect, useState } from "react";
import axios from "axios";
import CONFIG from "../../config.js";

const URL_HORARIOS = `${CONFIG.API_URL}/operaHorarios.php`;

function EspaciosHoy({ dia }) {
  const [espacios, setEspacios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [diaActual, setDiaActual] = useState(dia); // ahora el día depende de estado

  const id_estudiante = localStorage.getItem("loggedUserId");
  const cicloActual = new Date().getFullYear();

  const diasSemana = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];

  useEffect(() => {
    obtenerEspaciosHoy();
  }, [diaActual]); // se actualiza cuando cambia el día

  const obtenerDiaSemana = () => {
    const hoy = new Date();
    return diasSemana[hoy.getDay()];
  };
  const dia_hoy = obtenerDiaSemana();

  const obtenerEspaciosHoy = async () => {
    try {
      setCargando(true);
      //console.log(`?id_estudiante=${id_estudiante}&ciclo=${cicloActual}&dia_semana=${diaActual}`);
      const response = await axios.get(
        `${URL_HORARIOS}?id_estudiante=${id_estudiante}&ciclo=${cicloActual}&dia_semana=${diaActual}`
      );
      console.log("espacios: ", response.data);
      if (!response.data.error) {
        setEspacios(response.data.espacios);
      } else {
        setEspacios([]);
      }
    } catch (error) {
      console.error("Error al obtener espacios:", error);
      setEspacios([]);
    } finally {
      setCargando(false);
    }
  };

  const obtenerEstadoEspacio = (desde, hasta) => {
    const ahora = new Date();
    const [hD, mD] = desde.split(":").map(Number);
    const [hH, mH] = hasta.split(":").map(Number);

    const horaDesde = new Date();
    horaDesde.setHours(hD, mD, 0, 0);

    const horaHasta = new Date();
    horaHasta.setHours(hH, mH, 0, 0);

    const indiceHoy = diasSemana.indexOf(dia_hoy);
    const indiceActual = diasSemana.indexOf(diaActual);

    if (indiceActual === indiceHoy) {
      // Día de hoy → evaluar horas
      if (ahora >= horaDesde && ahora <= horaHasta) return "en-curso";
      if (ahora < horaDesde) return "proximo";
      return "pasado";
    }

    if (indiceActual > indiceHoy) {
      // Día futuro en la misma semana
      return "proximo";
    }

    if (indiceActual < indiceHoy) {
      // Día pasado
      return "pasado";
    }
  };


  // función para moverse entre días
  const cambiarDia = (direccion) => {
    const indiceActual = diasSemana.indexOf(diaActual);
    let nuevoIndice;
    if (direccion === "derecha") {
      nuevoIndice = (indiceActual + 1) % diasSemana.length;
    } else {
      nuevoIndice = (indiceActual - 1 + diasSemana.length) % diasSemana.length;
    }
    setDiaActual(diasSemana[nuevoIndice]);
  };

  if (cargando) return <div>Cargando espacios de {diaActual}...</div>;

  return (
    <div className="card mt-2 shadow" >
      <div className="card-header bg-primary text-white">
        <div className="d-flex d-wrap justify-content-center align-items-center fs-4">
          <i
            className="fa-solid fa-caret-left me-4 cursor-pointer fs-2"
            onClick={() => cambiarDia("izquierda")}
          ></i>
          {diaActual}
          <i
            className="fa-solid fa-caret-right ms-4 cursor-pointer fs-2"
            onClick={() => cambiarDia("derecha")}
          ></i>
        </div>
      </div>
      <ul className="list-group list-group-flush">
        {espacios && espacios.length > 0 ? (
          espacios.map((espacio, index) => {
            const estado = obtenerEstadoEspacio(
              espacio.hora_desde,
              espacio.hora_hasta,
              diaActual
            );
            let clase = "list-group-item";

            if (estado === "en-curso") clase += " bg-success text-white";
            else if (estado === "proximo") clase += " bg-warning text-dark";

            return (
              <li key={index} className={clase}>
                <strong className="small">{espacio.nombre_espacio}</strong>
                <div className="small">
                  <i className="bi bi-clock mx-2 "></i>
                  {espacio.hora_desde} a {espacio.hora_hasta}{" "}
                  {espacio.contraturno === "SI" ? "(Contraturno)" : ""}
                </div>
              </li>
            );
          })
        ) : (
          <li className="list-group-item">
            No hay espacios programados para {diaActual}.
          </li>
        )}
      </ul>
    </div>
  );
}

export default EspaciosHoy;
