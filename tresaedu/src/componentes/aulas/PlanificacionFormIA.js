import React, { useState } from 'react';
import axios from 'axios';
import CONFIG from '../../config';

function PlanificacionFormIA() {
  const [generalObjective, setGeneralObjective] = useState('');
  const [specificObjectives, setSpecificObjectives] = useState(['']);
  const [capabilities, setCapabilities] = useState(['']);
  const [plan, setPlan] = useState('');
  const [parsedPlan, setParsedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddSpecificObjective = () => {
    setSpecificObjectives([...specificObjectives, '']);
  };

  const handleSpecificObjectiveChange = (index, value) => {
    const newSpecificObjectives = specificObjectives.map((obj, i) => (i === index ? value : obj));
    setSpecificObjectives(newSpecificObjectives);
  };

  const handleAddCapability = () => {
    setCapabilities([...capabilities, '']);
  };

  const handleCapabilityChange = (index, value) => {
    const newCapabilities = capabilities.map((cap, i) => (i === index ? value : cap));
    setCapabilities(newCapabilities);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${CONFIG.API_URL}/generate-plan.php`, {
        generalObjective,
        specificObjectives,
        capabilities
      });
      console.log(response.data);
      //const generatedPlan = response.data.choices[0].text;
      const generatedPlan = response.data && response.data.choices && response.data.choices[0] ? response.data.choices[0].text : 'No se pudo generar el plan.';
      setPlan(generatedPlan);

      const parsed = parseGeneratedPlan(generatedPlan);
      setParsedPlan(parsed);

      // Call a function to save parsed plan to your database
      await savePlanToDatabase(parsed);

    } catch (error) {
      console.error('Error generating plan:', error);
      if (error.response && error.response.data) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Ocurrió un error al generar el plan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const parseGeneratedPlan = (text) => {
    const sections = text.split('###');
    const parsed = {};

    sections.forEach(section => {
      const lines = section.trim().split('\n');
      const title = lines.shift().trim();
      const content = lines.join('\n').trim();
      if (title && content) {
        parsed[title] = content;
      }
    });

    return parsed;
  };

  const savePlanToDatabase = async (plan) => {
    try {
      // Replace with your API endpoint or database save function
      await axios.post('/api/save-plan', plan);
      console.log('Plan saved successfully');
    } catch (error) {
      console.error('Error saving plan to database:', error);
    }
  };

  return (
    <div className='container'>
      <div className='my-2'>
        <div className="form-floating">
          <textarea className="form-control" placeholder="Objetivos" 
            id="floatingTextarea"
            value={generalObjective}
            onChange={(e) => setGeneralObjective(e.target.value)}
          ></textarea>
          <label htmlFor="floatingTextarea">Contenidos Generales</label>
        </div>
      </div>
      <div className='my-2'>
        {specificObjectives.map((obj, index) => (
          <div key={index} className="form-floating">
            <textarea className="form-control" placeholder="Objetivos" 
              id={`floatingTextarea1-${index}`}
              value={obj}
              onChange={(e) => handleSpecificObjectiveChange(index, e.target.value)}
            ></textarea>
            <label htmlFor={`floatingTextarea1-${index}`}>Contenidos Específicos</label>
          </div>
        ))}
        <button className='btn btn-sm btn-secondary my-1' onClick={handleAddSpecificObjective}>Agregar Objetivo Específico</button>
      </div>
      <div className='my-2'>
        {capabilities.map((cap, index) => (
          <div key={index} className="form-floating">
            <textarea className="form-control" placeholder="Capacidades" 
              id={`floatingTextarea2-${index}`}
              value={cap}
              onChange={(e) => handleCapabilityChange(index, e.target.value)}
            ></textarea>
            <label htmlFor={`floatingTextarea2-${index}`}>Capacidades a Lograr</label>
          </div>
        ))}
        <button className='btn btn-sm btn-secondary my-1' onClick={handleAddCapability}>Agregar Capacidad</button>
      </div>
      <div>
        <button className='btn btn-sm btn-success my-1' onClick={handleSubmit} disabled={loading}>
          {loading ? 'Generando Planificación...' : 'Generar Planificación'}
        </button>
      </div>
      {plan && (
        <div>
          <h2>Planificación Generada:</h2>
          <pre>{plan}</pre>
        </div>
      )}
      {parsedPlan && (
        <div>
          <h2>Parsed Plan:</h2>
          <pre>{JSON.stringify(parsedPlan, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default PlanificacionFormIA;

