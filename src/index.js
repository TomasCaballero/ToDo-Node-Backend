// IMPORTS -------------------------------------
// IMPORTAR MORGAN -> ver resultados de peticiones en la terminal
const morgan = require("morgan");
// IMPORTAR EXPRESS
const express = require("express");
// importar base de datos
const database = require("./database");

// CONFIGURACION INICIAL -----------------------
// CREAR INSTANCIA DE EXPRESS
const app = express();
// ASIGNAR PUERTO
app.set("port", 4000);

// LEVANTAR SERVIDOR EN ESE PUERTO
app.listen(app.get("port"));
console.log(`Escuchando puerto ${app.get("port")}`);

// MIDDLEWARES ---------------------------------
// LEVANTO MORGAN EN LA APP
app.use(express.json());
app.use(morgan("dev"));

// RUTAS ---------------------------------------
// OBTENER TODOS LOS PRODUCTOS
app.get("/api/tareas", async (req, res) => {
  const connection = await database.getConnection();
  const [rows] = await connection.query("SELECT * FROM tareas");
  if (rows.length > 0) {
    res.json(rows);
  } else {
    res.status(404).send("Producto no encontrado");
  }
});

// Obtener tareas del usuario por id
app.get("/api/tareas/:user_id", async (req, res) => {
    const connection = await database.getConnection();
    const [rows] = await connection.query("SELECT * FROM tareas where user_id = ?", [req.params.user_id]);
    if (rows.length > 0) {
      res.json(rows);
    } else {
      res.status(404).send("Producto no encontrado");
    }
  });

// obtener usuario por id
app.get("/api/usuarios/:id", async (req, res) => {
  const connection = await database.getConnection();
  const [rows] = await connection.query("SELECT * FROM usuarios WHERE id = ?", [
    req.params.id,
  ]);
  if (rows.length > 0) {
    res.json(rows[0]);
  } else {
    res.status(404).send("Usuario no encontrado");
  }
});

// obtener todos los usuarios
app.get("/api/usuarios", async (req, res) => {
  const connection = await database.getConnection();
  const [rows] = await connection.query("SELECT * FROM usuarios");
  if (rows.length > 0) {
    res.json(rows);
  } else {
    res.status(404).send("No existen usuarios");
  }
});

//  crear nuevo usuario
app.post("/api/usuarios", async (req, res) => {
    try {
        const connection = await database.getConnection();
        const { email, contrasenia, nombre_usuario } = req.body;

        if (!email || !contrasenia || !nombre_usuario) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // Verificar si el email ya está registrado
        const [existingUser] = await connection.query(
            "SELECT * FROM usuarios WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ error: "El email ya está registrado" });
        }

        // Insertar nuevo usuario
        const [result] = await connection.query(
            "INSERT INTO usuarios (email, contrasenia, nombre_usuario) VALUES (?, ?, ?)",
            [email, contrasenia, nombre_usuario]
        );

        res.status(201).json({ message: "Usuario creado exitosamente", id: result.insertId });

    } catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Crear nueva tarea
app.post("/api/tareas/:user_id", async (req, res)=>{
    const connection = await database.getConnection();
    const { titulo, contenido } = await req.body;
    
    if (!titulo || !contenido) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const [result] = await connection.query(
        "INSERT INTO tareas (titulo, contenido, user_id) VALUES (?, ?, ?)",
        [titulo, contenido, req.params.user_id]
    );

    res.status(201).json({ message: "Tarea creada exitosamente"});
})

// Eliminar una tarea por id
app.delete("/api/tareas/:id", async (req, res) => {
    try {
        const connection = await database.getConnection();
        const tareaId = req.params.id;

        // Verificar si la tarea existe antes de intentar eliminarla
        const [existingTask] = await connection.query(
            "SELECT * FROM tareas WHERE id = ?",
            [tareaId]
        );

        if (existingTask.length === 0) {
            return res.status(404).json({ error: "Tarea no encontrada" });
        }

        // Eliminar la tarea
        await connection.query(
            "DELETE FROM tareas WHERE id = ?",
            [tareaId]
        );

        res.status(200).json({ message: "Tarea eliminada exitosamente" });

    } catch (error) {
        console.error("Error al eliminar tarea:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Modificar una tarea por id
app.put("/api/tareas/:id", async (req, res) => {
    try {
        const connection = await database.getConnection();
        const idTarea = req.params.id;
        const { titulo, contenido } = req.body;

        // Verificar si la tarea existe
        const [existingTask] = await connection.query(
            "SELECT * FROM tareas WHERE id = ?",
            [idTarea]
        );

        if (existingTask.length === 0) {
            return res.status(404).json({ error: "Tarea no encontrada" });
        }

        // Validar que se proporcionen los campos necesarios
        if (!titulo && !contenido) {
            return res.status(400).json({ error: "Se requiere al menos un campo para actualizar (titulo o contenido)" });
        }

        // Construir la consulta SQL dinámicamente
        let updateQuery = "UPDATE tareas SET ";
        const updateValues = [];
        if (titulo) {
            updateQuery += "titulo = ?, ";
            updateValues.push(titulo);
        }
        if (contenido) {
            updateQuery += "contenido = ?, ";
            updateValues.push(contenido);
        }
        // Eliminar la última coma y espacio
        updateQuery = updateQuery.slice(0, -2);
        updateQuery += " WHERE id = ?";
        updateValues.push(idTarea);

        // Ejecutar la consulta de actualización
        await connection.query(updateQuery, updateValues);

        res.status(200).json({ message: "Tarea actualizada exitosamente" });

    } catch (error) {
        console.error("Error al modificar tarea:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});