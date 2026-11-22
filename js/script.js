import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productosRef = collection(db, 'productos');


let carrito = [];
let total = 0;
let productosGlobales = [];
let categoriaSeleccionada = "";


window.mostrarDetalles = function(id){

    const producto = productosGlobales.find(p => p.id === id);

    document.getElementById("modal-categoria").innerText =
    producto.categoria || "";

    document.getElementById("modal-imagen").src = producto.imagen;

    document.getElementById("modal-nombre").innerText = producto.nombre;

    document.getElementById("modal-descripcion").innerText =
        producto.descripcion || "Información no disponible.";

        let imagenPrecios = "";

switch(producto.categoria){

    case "Tortas":
        imagenPrecios = "img/precios-torta.jpg";
        break;

    case "Postres":
        imagenPrecios = "img/precios-postres.jpg";
        break;

    case "Especiales":

        if(producto.nombre.trim() === "Merengones"){

    imagenPrecios = "img/precios-merengones.jpg";

}
        else if(producto.nombre === "Waffles"){

            imagenPrecios = "img/precios-waffles.jpg";
        }
        else if(producto.nombre === "Crepes Dulces"){

            imagenPrecios = "img/precios-crepes dulces.jpg";
        }
        else if(producto.nombre === "Frappes"){

            imagenPrecios = "img/precios-frappes.jpg";
        }
        else{

            imagenPrecios = "img/precios-especiales.jpg";
        }

        break;
}

document.getElementById("modal-precios").src =
    imagenPrecios;

document.getElementById("vista-info").style.display = "block";

document.getElementById("vista-precios").style.display = "none";

    document.getElementById("modal-producto").style.display = "flex";
}

window.cerrarModal = function(){

    document.getElementById("modal-producto")
        .style.display = "none";
}

document
.getElementById("btn-ver-precios")
.addEventListener("click", () => {

    document.getElementById("vista-info").style.display = "none";

    document.getElementById("vista-precios").style.display = "block";

});

document
.getElementById("btn-volver")
.addEventListener("click", () => {

    document.getElementById("vista-info").style.display = "block";

    document.getElementById("vista-precios").style.display = "none";

});

async function renderizarProductos() {
    const contenedor = document.getElementById('contenedor-postres');
    contenedor.innerHTML = '<p style="text-align:center; width:100%; color: #666;">Cargando deliciosos postres...</p>';

    const productosOcultos = JSON.parse(localStorage.getItem('productosOcultos')) || [];
    let productosFinales = [];
    const actualizacionesFijos = {};

    try {
        const querySnapshot = await getDocs(productosRef);
        querySnapshot.forEach((documento) => {
            const prod = documento.data();

            if (prod.tipo === 'fijo_actualizado' && prod.visible !== false) {
                actualizacionesFijos[prod.idFijo] = prod.imagen;
            } else if (prod.visible !== false && !prod.tipo) {
                productosFinales.push({ ...prod, id: documento.id });
            }
        });
    } catch (error) {
        console.error("Error cargando Firebase:", error);
        contenedor.innerHTML = '<p style="text-align:center; color: red;">Error al cargar productos. Revisa la consola (F12).</p>';
        return;
    }

    if (window.productosDefecto) {
        window.productosDefecto.filter(p => !productosOcultos.includes(p.id)).forEach(p => {
            const imagenFinal = actualizacionesFijos[p.id] || p.imagen;
            productosFinales.push({ ...p, imagen: imagenFinal });
        });
    }

    contenedor.innerHTML = '';
    if (productosFinales.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center;">No hay postres disponibles.</p>';
        return;
    }

productosGlobales = productosFinales;

if(categoriaSeleccionada !== "Todos"){

    productosFinales = productosFinales.filter(
        producto =>
        producto.categoria === categoriaSeleccionada
    );

}
    productosFinales.forEach(producto => {
        let botonHTML = '';
        let alertaStock = '';

        {
            botonHTML = `<button class="btn-agregar" onclick="agregarAlCarrito('${producto.id}', '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio})">Agregar al pedido</button>`;

        }

        contenedor.innerHTML += `
    <div class="postre-card">

        <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.src='https://via.placeholder.com/300x220?text=Sin+Imagen'">

        <h3>${producto.nombre}</h3>

        ${alertaStock}  

        <button
    class="btn-detalles"
    onclick="mostrarDetalles('${producto.id}')">
    Ver Detalles
</button>

        ${botonHTML}

    </div>
`;
    });
}

window.agregarAlCarrito = function(id, nombre, precio) {
    carrito.push({ id, nombre, precio });
    total += precio;
    actualizarCarrito();
}

function actualizarCarrito() {
    const carritoFlotante = document.getElementById('carrito-flotante');
    const totalSpan = document.getElementById('total-pedido');
    totalSpan.innerText = total.toLocaleString('es-CO');
    if (carrito.length > 0) {
        carritoFlotante.classList.remove('carrito-oculto');
    } else {
        carritoFlotante.classList.add('carrito-oculto');
    }
}

document.getElementById('btn-enviar-whatsapp').addEventListener('click', () => {
    const telefonoNegocio = "573167363647";
    let mensaje = "¡Hola Sabor Amor! Quiero hacer el siguiente pedido:%0A%0A";
    carrito.forEach(item => {
        mensaje += `- ${item.nombre}: $${item.precio.toLocaleString('es-CO')}%0A`;
    });
    mensaje += `%0A*Total: $${total.toLocaleString('es-CO')}*`;
    window.open(`https://wa.me/${telefonoNegocio}?text=${mensaje}`, '_blank');
    carrito = []; total = 0; actualizarCarrito();
});

document.querySelectorAll('.categoria-btn')
.forEach(btn => {

    btn.addEventListener('click', () => {

        document
            .querySelectorAll('.categoria-btn')
            .forEach(b => b.classList.remove('activa'));

        btn.classList.add('activa');

        categoriaSeleccionada =
            btn.innerText.trim();

        renderizarProductos();

    });

});

renderizarProductos();