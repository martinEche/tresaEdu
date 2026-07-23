import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';


export function show_alerta(mensaje, icono, foco = '') {
    onfocus(foco);
    const MySwal = withReactContent(Swal);

    // Si es un error crítico capaz queremos que la lean bien, le damos más tiempo.
    const tiempo = icono === 'error' ? 5000 : 3000;

    MySwal.fire({
        toast: true,
        position: 'top-end',
        title: mensaje,
        icon: icono,
        showConfirmButton: false,
        timer: tiempo,
        timerProgressBar: true,
        customClass: {
            popup: 'rounded-4 shadow-sm border',
            title: 'fs-6 fw-normal'
        }
    });
}

function onfocus(foco) {
    if (foco !== '') {
        document.getElementById(foco).focus();
    }

}