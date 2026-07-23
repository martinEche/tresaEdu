import axios from "axios";
import { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import CONFIG from "../../config";

ChartJS.register(ArcElement, Tooltip, Legend);

const URL_API = `${CONFIG.API_URL}/operarAsistencia.php`;

function Asistencia({ id_estudiante, mostrarAsistencia }) {
  const [conteo, setConteo] = useState({ presentes: 0, ausentes: 0, tarde: 0 });
  const [asistencias, setAsistencias] = useState([]);

  useEffect(() => {
    if (id_estudiante) {
        axios.get(`${URL_API}?id_estudiante=${id_estudiante}&anioLectivo=${mostrarAsistencia}`)
        .then((res) => {
            console.log('Asis:'+res.data);
            if (res.data.resultado) {
                console.log('resAsis:'+res.data.asistencia);
                const datos = res.data.asistencia;
                setAsistencias(datos);

                const conteoFinal = datos.reduce(
                (acc, item) => {
                    if (item.asistencia === "Presente") acc.presentes++;
                    else if (item.asistencia === "Ausente") acc.ausentes++;
                    else if (item.asistencia === "Tarde") acc.tarde++;
                    return acc;
                },
                { presentes: 0, ausentes: 0, tarde: 0 }
                );
                console.log('dd:'+conteoFinal);
                setConteo(conteoFinal);
            }
        })
        .catch((err) => console.log(err));
    }
  }, [id_estudiante, mostrarAsistencia]);

  // Datos para el gráfico     

  const data = {
    labels: ["Presente", "Ausente", "Tarde"],
    datasets: [
      {
        data: [conteo.presentes, conteo.ausentes, conteo.tarde],
        backgroundColor: ["#0cb811ff", "#f02e20ff", "#fcb714ff"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        boxWidth: 6,
        padding: 1,
      },
    },
  },
  maintainAspectRatio: false,
};

  return (
    <div className="card shadow border-0 p-3 m-2">
      <h6 className="small mb-3">Asistencia del estudiante</h6>

      {/* Gráfico */}
      <div className="col-12 col-md-6 mx-auto" style={{ height: "9rem" }}>
        <Doughnut data={data} options={options} />
      </div>

      {/* Valores numéricos */}
      <div className="d-flex justify-content-around mt-3">
        <div className="small">
          <strong>Presentes:</strong> {conteo.presentes + conteo.tarde}(T:{conteo.tarde})
        </div>
        <div className="small">
          <strong>Ausentes:</strong> {conteo.ausentes}
        </div>
        <div className="small">
          <strong>Total:</strong> {conteo.presentes + conteo.ausentes + conteo.tarde}
        </div>
      </div>
    </div>
  );
}

export default Asistencia;
