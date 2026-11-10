
console.log("Página de construcción cargada correctamente");

// CONEXIÓN CON SUPABASE

const URL_SUPABASE = "https://xhphzmtbjtitfypobrbk.supabase.co";
const CLAVE_PUBLICA = "sb_publishable_CkHub_CFtkw7oOl3GPEfvw_vofwPRor";

let clienteSupabase = null;

if (window.supabase && window.supabase.createClient) {
    clienteSupabase = window.supabase.createClient(
        URL_SUPABASE,
        CLAVE_PUBLICA
    );
} else {
    console.error("No se pudo cargar la biblioteca de Supabase.");
}

// ELEMENTOS DEL HTML

let calificacionSeleccionada = 0;

const estrellas = document.querySelectorAll("#estrellas button");
const mensajeEstrellas = document.getElementById("mensajeEstrellas");
const formulario = document.getElementById("formularioCalificacion");
const comentario = document.getElementById("comentario");
const mensajeEnvio = document.getElementById("mensajeEnvio");

// SELECCIONAR ESTRELLAS

estrellas.forEach((estrella) => {
    estrella.addEventListener("click", () => {
        calificacionSeleccionada = Number(estrella.dataset.valor);

        estrellas.forEach((elemento) => {
            elemento.classList.toggle(
                "seleccionada",
                Number(elemento.dataset.valor) <= calificacionSeleccionada
            );
        });

        mensajeEstrellas.textContent =
            `Has seleccionado ${calificacionSeleccionada} de 5 estrellas`;
    });
});

// ENVIAR CALIFICACIÓN

formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (calificacionSeleccionada === 0) {
        mensajeEnvio.textContent = "Por favor selecciona las estrellas.";
        return;
    }

    if (!clienteSupabase) {
        mensajeEnvio.textContent = "No se pudo conectar con el servicio. Intenta nuevamente.";
        return;
    }

    const boton = formulario.querySelector("button[type='submit']");
    boton.disabled = true;
    mensajeEnvio.textContent = "Enviando calificación...";

    try {
        const { error } = await clienteSupabase
            .from("calificaciones")
            .insert([{
                estrellas: calificacionSeleccionada,
                comentario: comentario.value.trim() || null
            }]);

        if (error) throw error;

        mensajeEnvio.textContent =
            "¡Gracias por calificar a RENOVAR & RENACER!";

        formulario.reset();
        calificacionSeleccionada = 0;

        estrellas.forEach((estrella) => {
            estrella.classList.remove("seleccionada");
        });

        mensajeEstrellas.textContent = "Selecciona una calificación";

        await cargarCalificaciones();

    } catch (error) {
        console.error("Error al guardar:", error);
        mensajeEnvio.textContent = "No se pudo enviar la calificación. Revisa la consola.";
    } finally {
        boton.disabled = false;
    }
});

// MOSTRAR CALIFICACIONES

async function cargarCalificaciones() {
    if (!clienteSupabase) return;

    const lista = document.getElementById("listaComentarios");
    const promedio = document.getElementById("promedio");
    const total = document.getElementById("totalCalificaciones");

    try {
        const { data, error } = await clienteSupabase
            .from("calificaciones")
            .select("id, estrellas, comentario, fecha")
            .order("fecha", { ascending: false });

        if (error) throw error;

        lista.replaceChildren();

        if (data.length === 0) {
            promedio.textContent = "0.0";
            total.textContent = "Todavía no hay calificaciones.";
            return;
        }

        const suma = data.reduce(
            (acumulado, item) => acumulado + item.estrellas,
            0
        );

        promedio.textContent = (suma / data.length).toFixed(1);
        total.textContent = `${data.length} calificación(es) recibida(s)`;

        data.forEach((item) => {
            const tarjeta = document.createElement("div");
            tarjeta.className = "comentario-visitante";

            const estrellasTexto = document.createElement("div");
            estrellasTexto.className = "estrellas-comentario";
            estrellasTexto.textContent =
                "★".repeat(item.estrellas) +
                "☆".repeat(5 - item.estrellas);

            const texto = document.createElement("p");
            texto.textContent = item.comentario || "Sin comentario.";

            tarjeta.appendChild(estrellasTexto);
            tarjeta.appendChild(texto);
            lista.appendChild(tarjeta);
        });

    } catch (error) {
        console.error("Error al cargar calificaciones:", error);
    }
}

cargarCalificaciones();
