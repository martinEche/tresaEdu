
function Espera({visible}) {
    return (  
        <>
            {visible ? <img className="img-fluid" src="https://media.tenor.com/On7kvXhzml4AAAAi/loading-gif.gif" /> :''}
        </>
    );
}

export default Espera;