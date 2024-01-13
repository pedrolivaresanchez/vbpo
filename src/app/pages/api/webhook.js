// pages/api/webhook.js
import axios from 'axios';
import md5 from 'md5';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const orderData = req.body; // Datos del pedido de Shopify
      const dataNacex = transformarDatosPedidoANacex(orderData);

      const user = process.env.NACEX_USER;
      const pass = md5(process.env.NACEX_PASS);

      const responseNacex = await enviarDatosANacex(user, pass, dataNacex);

      if (responseNacexCorrecta(responseNacex)) {
        await actualizarEstadoPedidoShopify(orderData.id);
        res.status(200).json({ message: 'Pedido actualizado y enviado a Nacex correctamente' });
      } else {
        throw new Error('Error en la respuesta de Nacex');
      }
    } catch (error) {
      console.error('Error procesando el webhook:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Método no permitido');
  }
}

function transformarDatosPedidoANacex(orderData) {
  return [
    // Transforma los datos del pedido de Shopify al formato requerido por Nacex
    // Ejemplo: `del_cli=${orderData.deliveryClientCode}`,
    // Añade aquí el resto de las transformaciones necesarias...
  ];
}

async function enviarDatosANacex(user, pass, dataNacex) {
  const response = await axios.post('https://pda.nacex.com/nacex_ws/ws?method=putExpedicion', {
    user,
    pass,
    data: dataNacex.join('|')
  });
  return response.data;
}

function responseNacexCorrecta(response) {
  // Implementa la lógica para verificar si la respuesta de Nacex es correcta
  return true; // Modifica esto según la lógica de respuesta de Nacex
}

// Continuación del código en pages/api/webhook.js

async function actualizarEstadoPedidoShopify(orderId) {
    const url = `https://tu-tienda.myshopify.com/admin/api/2021-04/orders/${orderId}.json`;
    const data = {
      order: {
        id: orderId,
        // Aquí los campos necesarios para actualizar el estado del pedido
        // Por ejemplo, puedes necesitar cambiar el estado del pedido a "en camino"
        // Nota: Asegúrate de utilizar el campo y valor correctos según la API de Shopify
      }
    };
  
    await axios.put(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      },
    });
  }
  