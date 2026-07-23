import React, { useEffect, useRef } from "react";
import QrScanner from "qr-scanner";
import { useNavigate } from "react-router-dom";
import './inscripcionQR.css';

const InscripcionQR = () => {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log("QR detectado:", result);
          qrScannerRef.current.stop(); // Detiene la cámara
         // navigate(result.data); // Redirige a la ruta leída del QR
         // navigate(result.data, { replace: true });
          window.location.href = result.data;
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current.start().catch((error) =>
        console.error("No se pudo iniciar el escáner:", error)
      );
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, [navigate]);

  return (
    <div className='container-principal text-center'>
      <h3><i className="fa-solid fa-qrcode"></i> Escaneá código QR de Inscripción</h3>
      <div className="col-12 col-sm-6 marco text-center">
            <video className="camara" ref={videoRef}  />
      </div>
    </div>
  );
};

export default InscripcionQR;

