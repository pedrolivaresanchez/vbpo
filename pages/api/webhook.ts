// pages/api/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false, // Deshabilitar el análisis automático del cuerpo
  },
};

const getRawBody = (req: NextApiRequest) => {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const rawBody = await getRawBody(req);
      const hmacHeader = req.headers['x-shopify-hmac-sha256'] as string;
      const secret = process.env.SHOPIFY_SECRET;

      if (!secret) {
        console.error('La clave secreta de Shopify no está definida.');
        return res.status(500).send('Error de configuración del servidor.');
      }

      const generatedHmac = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('base64');

      if (hmacHeader !== generatedHmac) {
        console.error('Firma HMAC no válida');
        return res.status(401).send('Acceso denegado.');
      }

      // La firma es válida, procesar el webhook aquí
      console.log("Pedido recibido y verificado:", rawBody.toString());
      res.status(200).json({ message: 'Webhook recibido correctamente' });
    } catch (error) {
      console.error('Error procesando el webhook:', error);
      res.status(500).send('Error interno del servidor');
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).send('Método no permitido');
  }
}
