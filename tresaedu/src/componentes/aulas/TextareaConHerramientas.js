import { useState } from "react";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import toolbar from "./toolbar";

function TextAreaConHerramientas({value, setValue}) {
    const module ={
        toolbar:toolbar,
    }
    return (    
        <ReactQuill  modules={module} theme="snow" value={value} onChange={setValue} />
     );
}

export default TextAreaConHerramientas;