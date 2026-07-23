import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function GraficoAsistencia({ asistenciaAnual, id_usuario }) {
  const contarAsistencias = (asistencias_anual, id_usuario) => {
    let presente = 0;
    let ausente = 0;
    let tarde = 0;

    asistencias_anual.forEach(a => {
      if (a.id_usuario === id_usuario) {
        if (a.asistencia === "Presente") presente++;
        else if (a.asistencia === "Ausente") ausente++;
        else if (a.asistencia === "Tarde") tarde++;
      }
    });

    return { presente, ausente, tarde };
  };

  const { presente, ausente, tarde } = contarAsistencias(asistenciaAnual, id_usuario);

  const data = {
    labels: ['Presente', 'Ausente', 'Tarde'],
    datasets: [
      {
        data: [presente, ausente, tarde],
        backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
        borderColor: ['#ffffff'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    cutout: '25%', // Si querés tipo doughnut. Si querés que sea 100% circular, podés quitar esto.
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div style={{ width: '50px', height: '50px'}}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export default GraficoAsistencia;
