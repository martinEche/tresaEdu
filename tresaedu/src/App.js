import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import { fetchConfiguracion } from './servicios/configuracionService.js';

//login Petit
import CajaLogin from './componentes/CajaLogin2';

//Login Tresatec Demo
//import CajaLogin from './componentes/CajaLogin';

import HeaderRoles from './componentes/HeaderRoles';
import Sidebar from './componentes/Sidebar';
import RolesSelector from './componentes/RolesSelector';
import Footer from './componentes/Footer';
import Perfil from './componentes/usuarios/Perfil';
import CambiarPass from './componentes/usuarios/CambiarPass.js';
import Principal from './componentes/Principal';
import Mensajes from './componentes/mensajes/Mensajes';
import Mensaje from './componentes/mensajes/Mensaje';
import Usuarios from './componentes/usuarios/Usuarios';
import UsuariosLista from './componentes/usuarios/UsuariosLista';
import FichaUsuario from './componentes/usuarios/FichaUsuario.js';
import Formaciones from './componentes/aulas/formaciones';
import Formacion from './componentes/aulas/formacion';
import Cursos from './componentes/aulas/Cursos';
import Curso from './componentes/aulas/Curso';
import MisCursos from './componentes/aulas/MisCursos';
import MiCurso from './componentes/aulas/MiCurso';
import Planificacion from './componentes/aulas/Planificacion';
import Clases from './componentes/aulas/Clases';
import Estudiantes from './componentes/estudiantes/Estudiantes';
import Laboratorio from './componentes/aulas/Laboratorio';
import Agenda from './componentes/mensajes/Agenda.js';
import ConfiguracionAdmin from './componentes/configuracion/ConfiguracionAdmin.js';
import InscripcionExterna from './componentes/aulas/InscripcionExterna.js';
import CursoIA from './componentes/IA/CursoIA.js';
import ResponderCuestionario from './componentes/actividades/ResponderCuestionario.js';
import Calificaciones from './componentes/estudiantes/Calificaciones.js';
import InscripcionQR from './componentes/aulas/InscripcionQR.js';
import ActividadDetalle from './componentes/actividades/ActividadDetalle.js';
import Notificaciones from './componentes/mensajes/Notificaciones.js';
import Horarios from './componentes/institucion/Horarios.js';
import Cuotas from './componentes/tesoreria/Cuotas.js';
import AdministrarMensajes from './componentes/mensajes/AdministrarMensajes.js';
import PromocionEstudiantes from './componentes/aulas/PromocionEstudiantes.js';
import MensajesGrupo from './componentes/mensajes/MensajesGrupo.js';
import CalificacionesGeneral from './componentes/aulas/CalificacionesGeneral.js';
import ImprimirBoletin from './componentes/aulas/ImprimirBoletin.js';
import Reportes from './componentes/reportes/Reportes.js';

function App() {
  const loggedUserJSON = localStorage.getItem('loggedNoteAdapter');
  const loggeduserRolId = localStorage.getItem('loggeduserRolId');

  const [logeado, setLogeado] = useState(false);
  const [rol, setRol] = useState(loggeduserRolId);
  const [esInscripcion, setEsInscripcion] = useState(false);
  const [mensajesSinLeer, setMensajesSinLeer] = useState(0);

  const [notificacionesSinVer, setNotificacionesSinVer] = useState(0);

  const [rolesUsuario, setRolesUsuario] = useState([]); // Estado para almacenar los roles del usuario cuando se logea

  const [configuracion, setConfiguracion] = useState({
    id: "1",
    nombre: "Plataforma Educativa",
    sub_titulo: "Tresatec",
    logo_grande: "tresatec-logo-08.png",
    logo_chico: "tresatec-logo-08.png",
    logo_solo: "tresatec-logo-08.png",
    imagen_fondo: "fondo_tresatec.jpg",
    color_principal: "#014751",
    color_secundario: "#0ac694",
    color_terciario: "#ffffff",
    fondo_barra_superior: "#ffffff",
    color_texto_barra_superior: "#000000",
    fondo_barra_lateral: "#D8D8D8",
    color_texto_barra_lateral: "#35567E",
    formato_icono_perfil: "cuadrado"
  });

  useEffect(() => {
    obtenerConfiguracion();
    if (loggedUserJSON) {
      setLogeado(loggedUserJSON);
      if (loggeduserRolId != null) {
        setRol(loggeduserRolId);
      } else {
        setRol(null);
      }
    }

  }, [])



  async function obtenerConfiguracion() {
    try {
      const data = await fetchConfiguracion();
      if (data) {
        setConfiguracion(data);
      }
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
    }
  }

  const acceder = (estado) => {
    setLogeado(estado);
  }

  const rolSelect = (idRol) => {
    setRol(idRol);
  }


  return (
    <BrowserRouter basename="/">
      {logeado ? (
        <>
          <HeaderRoles acceder={acceder} rolSelect={rolSelect} configuracion={configuracion} mensajesSinLeer={mensajesSinLeer} setMensajesSinLeer={setMensajesSinLeer} notificacionesSinVer={notificacionesSinVer} setNotificacionesSinVer={setNotificacionesSinVer} rolesUsuario={rolesUsuario} />

          {((rol != null)) ? <Sidebar acceder={acceder} rolSelect={rolSelect} rol={rol} configuracion={configuracion} /> : ''}

        </>
      ) : (
        !esInscripcion ? <CajaLogin acceder={acceder} /> : ''
      )}
      <Routes>
        <Route path="/Inscripcion/:codigo" element={<InscripcionExterna logeado={logeado} esInscripcion={esInscripcion} setEsInscripcion={setEsInscripcion} configuracion={configuracion} />} />

        <Route path="/" element={logeado && <RolesSelector acceder={acceder} configuracion={configuracion} rol={rol} rolSelect={rolSelect} rolesUsuario={rolesUsuario} setRolesUsuario={setRolesUsuario} />} />
        {logeado && (
          <>
            <Route path="/Principal" element={<Principal acceder={acceder} rol={rol} mensajesSinLeer={mensajesSinLeer} configuracion={configuracion} />} />
            <Route path="/Dashboard" element={<ConfiguracionAdmin acceder={acceder} rol={rol} />} />
            <Route path="/Mensajes" element={<Mensajes acceder={acceder} rol={rol} configuracion={configuracion} />} />
            <Route path="/AdmMensajes" element={<AdministrarMensajes acceder={acceder} rol={rol} configuracion={configuracion} />} />
            <Route path="/Notificaciones" element={<Notificaciones acceder={acceder} rol={rol} />} />
            <Route path="/Chat/:grupoId" element={<MensajesGrupo acceder={acceder} rol={rol} configuracion={configuracion} />} />
            <Route path="/Mensajes/:origen/:mensajeId/:tipo" element={<Mensaje acceder={acceder} rol={rol} configuracion={configuracion} />} />
            <Route path="/Agenda" element={<Agenda acceder={acceder} rol={rol} />} />
            <Route path="/Usuarios" element={<Usuarios acceder={acceder} rol={rol} configuracion={configuracion} />} />
            <Route path="/Usuarios/:userId" element={<UsuariosLista acceder={acceder} rol={rol} rolSelect={rolSelect} />} />
            <Route path="/Usuarios/Cuotas/:userId" element={<UsuariosLista acceder={acceder} rol={rol} rolSelect={rolSelect} />} />
            <Route path="/Ficha/:usuarioId" element={<FichaUsuario configuracion={configuracion} acceder={acceder} rol={rol} vista={'general'} />} />
            <Route path="/Formaciones" element={<Formaciones acceder={acceder} rol={rol} rolSelect={rolSelect} configuracion={configuracion} />} />
            <Route path="/Formaciones/:formacionId" element={<Formacion acceder={acceder} rol={rol} configuracion={configuracion} />} />
            <Route path="/Cursos" element={<Cursos acceder={acceder} rol={rol} rolSelect={rolSelect} />} />
            <Route path="/Cursos/:cursoId" element={<Curso acceder={acceder} configuracion={configuracion} rol={rol} />} />
            <Route path="/MC" element={<MisCursos logeado acceder={acceder} rol={rol} configuracion={configuracion} />} />
            <Route path="/MC/:idMC" element={<MiCurso acceder={acceder} rolSelect={rolSelect} rol={rol} configuracion={configuracion} />} />
            <Route path="/MC/:idMC/p/:idCG" element={<Planificacion acceder={acceder} rol={rol} />} />
            <Route path="/MC/:idMC/c" element={<Clases acceder={acceder} rol={rol} />} />
            <Route path="/MC/:idMC/c/:idCl" element={<Clases acceder={acceder} rol={rol} />} />
            <Route path="/MC/:idMC/a/:idAct" element={<ActividadDetalle acceder={acceder} rol={rol} configuracion={configuracion} />} />
            <Route path="/MC/:idMC/e" element={<Estudiantes acceder={acceder} rol={rol} configuracion={configuracion} />} />
            <Route path="/MC/:idMC/l" element={<Laboratorio acceder={acceder} rol={rol} configuracion={configuracion} />} />
            <Route path="/cuestionario/:formId" element={<ResponderCuestionario />} />
            <Route path="/MC/:idMC/IA/:idCG" element={<CursoIA />} />
            <Route path="/Perfil" element={<Perfil configuracion={configuracion} />} />
            <Route path="/VerPerfil/e/:usuarioId" element={<FichaUsuario configuracion={configuracion} acceder={acceder} rol={rol} vista={'estudiante'} />} />
            <Route path="/Pass" element={<CambiarPass acceder={acceder} />} />
            <Route path="/Calificaciones" element={<Calificaciones acceder={acceder} configuracion={configuracion} />} />
            <Route path="/Recorrido" element={<Calificaciones acceder={acceder} />} />
            <Route path="/inscripcionqr" element={<InscripcionQR />} />
            <Route path="/Horarios" element={<Horarios acceder={acceder} configuracion={configuracion} rol={rol} />} />
            <Route path="/Cuotas" element={<Cuotas acceder={acceder} configuracion={configuracion} rol={rol} />} />
            <Route path="/Promocion" element={<PromocionEstudiantes acceder={acceder} configuracion={configuracion} rol={rol} />} />
            <Route path="/CalificacionesGeneral" element={<CalificacionesGeneral acceder={acceder} rol={rol} />} />
            <Route path="/ImprimirBoletin/:studentId/:cohorteId" element={<ImprimirBoletin acceder={acceder} configuracion={configuracion} />} />
            <Route path="/Reportes" element={<Reportes acceder={acceder} rol={rol} configuracion={configuracion} />} />
            <Route path="/Chat/:tipo/:id" element={<MensajesGrupo acceder={acceder} rol={rol} configuracion={configuracion} />
            }
            />
          </>
        )}
      </Routes>
      {/* Footer siempre visible */}
      <Footer />
    </BrowserRouter>
  );
}

export default App;
