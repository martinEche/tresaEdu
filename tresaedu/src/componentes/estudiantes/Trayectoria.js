

function Trayectoria({curso}) {
    const fecha = new Date();
    const año = fecha.getFullYear();

    const convertirADivisionRomana=(numero)=> {
        const romanos = {
            1: 'I',
            2: 'II',
            3: 'III',
            4: 'IV',
            5: 'V',
            6: 'VI',
            7: 'VII',
            8: 'VIII',
            9: 'IX',
            10: 'X'
        };
        return romanos[numero] || numero; // Devuelve el número original si está fuera del rango        
    }
    return ( 
        <>
            <div className='datos pb-4'>
                <h5>Trayectoria</h5>
                <ul className='cursos'>
                {curso.map((c, i) => (
                    <li key={i}  
                        className={`${c.anio_lectivo===año?'actual':'historico'}`}>
                        <div><strong>{c.anio_lectivo}</strong></div>
                        <div>{c.curso}° {convertirADivisionRomana(c.division)}  {c.turno}</div>
                    </li>
                ))}
                </ul>
                
            </div>
        </>
     );
}

export default Trayectoria;