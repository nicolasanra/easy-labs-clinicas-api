// middleware/resolveTenant.js

import { createClient } from '@supabase/supabase-js';

// Solo usar service_role en backend
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function resolveTenant(req, res, next) {
  try {
    // 1) Datos del webhook Evolution / n8n / API
    const evoApiKey =
      req.headers['x-evo-apikey'] ||
      req.body?.apikey ||
      req.query?.apikey ||
      '';

    // Este es el número de WhatsApp de la clínica
    const clinicSender =
      req.headers['x-clinic-number'] ||
      req.body?.sender ||
      req.body?.senderNumber ||
      '';

    let clinica = null;

    // 2) Buscar clínica por telefono_whatsapp (sender)
    if (clinicSender) {
      const { data, error } = await supabaseAdmin
        .from('clinicas')
        .select('id, nombre, telefono_whatsapp, evo_apikey')
        .eq('telefono_whatsapp', clinicSender)
        .single();

      if (!error && data) clinica = data;
    }

    // 3) Fallback: buscar por apiKey
    if (!clinica && evoApiKey) {
      const { data } = await supabaseAdmin
        .from('clinicas')
        .select('id, nombre, telefono_whatsapp, evo_apikey')
        .eq('evo_apikey', evoApiKey)
        .single();

      if (data) clinica = data;
    }

    // 4) Error si no se encuentra tenant
    if (!clinica) {
      return res.status(401).json({
        error:
          'Tenant no encontrado (sender o apiKey inválidos)'
      });
    }

    // 5) Guardar en la request
    req.clinica = clinica;

    next();
  } catch (err) {
    console.error('Error en resolveTenant:', err);
    return res.status(500).json({
      error: 'Error resolviendo tenant'
    });
  }
}
