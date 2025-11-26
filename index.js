// index.js

import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { resolveTenant } from "./middleware/resolveTenant.js";

// Crear app
const app = express();
app.use(cors());
app.use(express.json());

// Supabase (service_role solo en backend)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// Healthcheck
app.get("/", (req, res) => res.json({ ok: true }));

// 1) Crear clínica (no necesita tenant)
app.post("/clinicas/crear", async (req, res) => {
  const { nombre, telefono_whatsapp, evo_apikey } = req.body;

  const { data, error } = await supabase
    .from("clinicas")
    .insert({ nombre, telefono_whatsapp, evo_apikey })
    .select()
    .single();

  if (error) return res.status(400).json({ error });

  res.json(data);
});

/* 
  ACTIVAMOS MULTI-TENANT PARA TODAS ESTAS RUTAS:
  – /clientes/*
  – /turnos/*
  – /disponibilidad/*
*/
app.use("/clientes", resolveTenant);
app.use("/turnos", resolveTenant);
app.use("/disponibilidad", resolveTenant);

// 2) Registrar / actualizar cliente
app.post("/clientes/registrar", async (req, res) => {
  const clinica_id = req.clinica.id;
  const { nombre, telefono, email } = req.body;

  const { data, error } = await supabase
    .from("clientes")
    .upsert(
      { clinica_id, nombre, telefono, email },
      { onConflict: ["telefono"] }
    )
    .select()
    .single();

  if (error) return res.status(400).json({ error });

  res.json(data);
});

// 3) Consultar disponibilidad
app.get("/disponibilidad", async (req, res) => {
  const clinica_id = req.clinica.id;
  const { fecha } = req.query;

  const { data, error } = await supabase
    .from("disponibilidad")
    .select("*")
    .eq("clinica_id", clinica_id)
    .eq("fecha", fecha)
    .eq("disponible", true)
    .order("hora", { ascending: true });

  if (error) return res.status(400).json({ error });

  res.json(data);
});

// Agregar disponibilidad manualmente
app.post("/disponibilidad", async (req, res) => {
  const clinica_id = req.clinica.id;

  const entries = req.body.map((e) => ({
    ...e,
    clinica_id,
  }));

  const { data, error } = await supabase
    .from("disponibilidad")
    .insert(entries)
    .select();

  if (error) return res.status(400).json({ error });

  res.json(data);
});

// 4) Crear turno
app.post("/turnos/crear", async (req, res) => {
  const clinica_id = req.clinica.id;
  const { nombre, telefono, email, fecha, hora } = req.body;

  // 1) Registrar cliente
  const { data: cliente, error: e1 } = await supabase
    .from("clientes")
    .upsert({ clinica_id, nombre, telefono, email }, { onConflict: ["telefono"] })
    .select()
    .single();

  if (e1) return res.status(400).json({ e1 });

  // 2) Verificar disponibilidad
  const { data: disp } = await supabase
    .from("disponibilidad")
    .select("*")
    .eq("clinica_id", clinica_id)
    .eq("fecha", fecha)
    .eq("hora", hora)
    .single();

  if (disp && !disp.disponible) {
    return res.status(409).json({ error: "Horario no disponible" });
  }

  // 3) Crear turno
  const { data: turno, error: e2 } = await supabase
    .from("turnos")
    .insert({ clinica_id, cliente_id: cliente.id, fecha, hora })
    .select()
    .single();

  if (e2) return res.status(400).json({ e2 });

  // 4) Marcar disponibilidad como ocupada
  await supabase
    .from("disponibilidad")
    .upsert(
      { clinica_id, fecha, hora, disponible: false },
      { onConflict: ["clinica_id", "fecha", "hora"] }
    );

  res.json(turno);
});

// 5) Confirmar turno
app.post("/turnos/confirmar", async (req, res) => {
  const { turno_id } = req.body;

  const { data, error } = await supabase
    .from("turnos")
    .update({ estado: "confirmado" })
    .eq("id", turno_id)
    .select()
    .single();

  if (error) return res.status(400).json({ error });

  res.json(data);
});

// 6) Reagendar
app.post("/turnos/reagendar", async (req, res) => {
  const { turno_id, fecha, hora } = req.body;

  const { data, error } = await supabase
    .from("turnos")
    .update({ fecha, hora, estado: "reagendado" })
    .eq("id", turno_id)
    .select()
    .single();

  if (error) return res.status(400).json({ error });

  res.json(data);
});

// 7) Turnos hoy
app.get("/turnos/hoy", async (req, res) => {
  const clinica_id = req.clinica.id;
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("turnos")
    .select("*, clientes(nombre, telefono)")
    .eq("clinica_id", clinica_id)
    .eq("fecha", today)
    .order("hora", { ascending: true });

  if (error) return res.status(400).json({ error });

  res.json(data);
});

// Start server
app.listen(process.env.PORT || 3000, () =>
  console.log("API Clinicas OK")
);
