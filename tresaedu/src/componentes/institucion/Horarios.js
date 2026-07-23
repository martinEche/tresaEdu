import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { show_alerta } from '../../funciones.js';
import CONFIG from '../../config.js';

const URL_HORARIOS = `${CONFIG.API_URL}/operaHorarios.php`;

function Horarios({ configuracion, acceder, rol }) {
  const [horarios, setHorarios] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState('-');
  const navigate = useNavigate();
  const cicloActual = new Date().getFullYear();
  const [formData, setFormData] = useState({
    id: null,
    id_espacio: "",
    curso_grupo: "-",
    hora_desde: '08:00:00',
    hora_hasta: '13:00:00',
    dia_semana: "",
    contraturno: 0,
  });

  // Cargar horarios y espacios
  useEffect(() => {
    if (acceder) {
      if (rol === null) {
        navigate("/");
      }
      obtenerHorarios(cursoSeleccionado);
    } else {
      localStorage.clear();
      navigate('/');
    }
  }, [cursoSeleccionado, acceder, rol]);

  useEffect(() => {
    obtenerHorarios(formData.curso_grupo);
  }, [formData]);

  const obtenerHorarios = async (GrupoCurso) => {
    console.log('predata: ', cursoSeleccionado);
    console.log(`?curso_grupo=${cursoSeleccionado}&ciclo=${cicloActual}`);
    const res = await axios.get(`${URL_HORARIOS}?curso_grupo=${GrupoCurso}&ciclo=${cicloActual}`);
    console.log(res.data);
    if (!res.data.error) {
      setHorarios(res.data.horarios);
      setEspacios(res.data.espacios);
      setCursos(res.data.cursos);
    } else {
      setHorarios([]);
      setEspacios([]);
      setCursos([]);
      alert("Error al cargar los horarios:", res.data.error);
    }
  };

  // Abrir modal para nuevo/editar
  const openModal = (horario = null) => {
    if (horario) {
      setFormData(horario);
    } else {
      setFormData({
        id: null,
        id_espacio: "",
        curso_grupo: "-",
        hora_desde: '08:00:00',
        hora_hasta: '13:00:00',
        dia_semana: "",
        contraturno: 0,
      });
    }
    //setIsOpen(true);
  };

  // Guardar datos
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.id) {
      const resU = await axios.put(`${URL_HORARIOS}?accion=update`, formData);
      console.log(resU.data);
      if (resU.data.success) {
        show_alerta('Horario guardado correctamente', 'success');
        obtenerHorarios(cursoSeleccionado);
      } else {
        show_alerta("Error al guardar el horario:", resU.data.error, 'error');
      }
    } else {
      const res = await axios.post(URL_HORARIOS, formData);
      console.log(res.data);
      if (res.data.success) {
        show_alerta('Horario guardado correctamente', 'success');
        obtenerHorarios(cursoSeleccionado);
      } else {
        show_alerta("Error al guardar el horario:", res.data.error, 'error');
      }
    }
  };

  return (
    <div className="container-principal">
      <h3 className="mb-4">Horarios</h3>
      <button type="button"
        className="btn btn-outline-success mb-2"
        data-bs-toggle="modal"
        data-bs-target="#exampleModal"
        onClick={() => openModal(null)}
      >
        <i className="fa-solid fa-circle-plus"></i> nuevo horario
      </button>
      <div>
        <div className="input-group mb-3">
          <label className="input-group-text" htmlFor="inputGroupSelect01">
            <i className="fa-solid fa-magnifying-glass me-1"></i>
            Selecionar curso
          </label>
          <select
            id="inputGroupSelect01"
            className="form-select"
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
            required
          >
            <option value="0">Seleccionar curso</option>
            {cursos.map((c, index) => (
              <option key={index} value={`${c.orden}-${c.seccion}`}>
                {c.orden}-{c.seccion} ({c.denominacion})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 mt-2">
        <div className="table-responsive">
          <table className='table table-hover align-middle mb-0'>
            <thead className='table-light text-muted'>
              <tr>
                <th className="fw-semibold px-3">Día</th>
                <th className="fw-semibold px-3">Espacio</th>
                <th className="fw-semibold px-3">Desde</th>
                <th className="fw-semibold px-3">Hasta</th>
                <th className="fw-semibold px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {horarios.map((h, index) => (
                <tr key={index} className={`${h.contraturno === 'Si' ? 'table-primary' : ''}`}>
                  <td className="px-3">{h.dia_semana}</td>
                  <td className="px-3">{h.nombre_espacio}</td>
                  <td className="px-3">{h.hora_desde}</td>
                  <td className="px-3">{h.hora_hasta}</td>
                  <td className="px-3">
                    <button
                      className="btn btn-sm btn-warning"
                      title="Editar"
                      data-bs-toggle="modal"
                      data-bs-target="#exampleModal"
                      onClick={() => openModal(h)}
                    >
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <div className="modal fade" id="exampleModal" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                {formData.id ? "Editar Horario" : "Nuevo Horario"}
              </h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
                {/* Selector de curso*/}
                <div>
                  <label className="form-label fw-bold mb-1">Curso</label>
                  <select
                    className="form-select"
                    value={formData.curso_grupo}
                    onChange={(e) => setFormData({ ...formData, curso_grupo: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar curso</option>
                    {cursos.map((c, index) => (
                      <option key={index} value={`${c.orden}-${c.seccion}`}>
                        {c.orden}-{c.seccion} ({c.denominacion})
                      </option>
                    ))}
                  </select>
                </div>

                {/*Dia y turno*/}
                <div>
                  <label className="form-label fw-bold mb-1">Día de la Semana</label>
                  <select
                    className="form-select mb-2"
                    value={formData.dia_semana}
                    onChange={(e) => setFormData({ ...formData, dia_semana: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar Día</option>
                    <option value='lunes'>Lunes</option>
                    <option value='martes'>Martes</option>
                    <option value='miércoles'>Miércoles</option>
                    <option value='jueves'>Jueves</option>
                    <option value='viernes'>Viernes</option>
                  </select>

                  <div className="form-check mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="checkContraturno"
                      checked={formData.contraturno === 1}
                      onChange={(e) =>
                        setFormData({ ...formData, contraturno: e.target.checked ? 1 : 0 })
                      }
                    />
                    <label className="form-check-label" htmlFor="checkContraturno">
                      Es a contraturno
                    </label>
                  </div>
                </div>

                {/* Selector de materia*/}
                <div>
                  <label className="form-label fw-bold mb-1">Espacio Curricular</label>
                  <select
                    className="form-select"
                    value={formData.id_espacio}
                    onChange={(e) => setFormData({ ...formData, id_espacio: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar Espacio</option>
                    {espacios.map((esp, index) => (
                      <option key={index} value={esp.id}>
                        {esp.nombre_espacio}
                      </option>
                    ))}
                  </select>
                </div>

                {/*Horario*/}
                <div>
                  <label className="form-label fw-bold mb-1">Rango Horario</label>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="time"
                      className="form-control"
                      value={formData.hora_desde}
                      onChange={(e) => setFormData({ ...formData, hora_desde: e.target.value })}
                      required
                    />
                    <span className="text-muted px-1">hasta</span>
                    <input
                      type="time"
                      className="form-control"
                      value={formData.hora_hasta}
                      onChange={(e) => setFormData({ ...formData, hora_hasta: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-secondary px-4"
                    data-bs-dismiss="modal"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success px-4"
                    data-bs-dismiss="modal"
                  >
                    <i className="fa-regular fa-floppy-disk"></i> Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

export default Horarios;